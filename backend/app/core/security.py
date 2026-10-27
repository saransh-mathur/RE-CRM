import hashlib
import hmac
import re
from datetime import datetime, timedelta, timezone
from typing import Any, Optional, Union
from jose import jwt
from passlib.context import CryptContext
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(subject: Union[str, Any], expires_delta: Optional[timedelta] = None, claims: dict = None) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {"exp": expire, "sub": str(subject)}
    if claims:
        to_encode.update(claims)
        
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except Exception:
        return None


def verify_meta_webhook_signature(payload_bytes: bytes, signature_header: Optional[str]) -> bool:
    """
    Verifies that incoming POST requests from Meta (Facebook/Instagram)
    match the X-Hub-Signature-256 header using HMAC-SHA256 with the app secret.
    """
    if not signature_header:
        return False
    
    parts = signature_header.split("=")
    if len(parts) != 2 or parts[0] != "sha256":
        return False
    
    expected_hash = parts[1]
    computed_hmac = hmac.new(
        settings.META_APP_SECRET.encode("utf-8"),
        msg=payload_bytes,
        digestmod=hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(computed_hmac, expected_hash)


def normalize_phone(phone: str) -> str:
    """Normalize phone to standard E.164-like digits only with leading plus."""
    digits = re.sub(r"[^\d]", "", phone)
    return f"+{digits}" if digits else ""


def hash_phone(phone: str) -> str:
    """Hashes normalized phone with SHA-256 for secure deduplication without storing raw PII."""
    normalized = normalize_phone(phone)
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()


def mask_phone(phone: str) -> str:
    """
    Masks phone numbers to protect against screen-scraping and unauthorized harvesting.
    E.g., '+919876543210' -> '+91 98*** ***10'
    """
    cleaned = re.sub(r"[^\d+]", "", phone)
    if len(cleaned) <= 6:
        return cleaned[:2] + "****"
    
    prefix = cleaned[:4]
    suffix = cleaned[-2:]
    masked_middle = "*" * (len(cleaned) - 6)
    return f"{prefix}{masked_middle}{suffix}"


def mask_email(email: str) -> str:
    """
    Masks email addresses.
    E.g., 'vikram.singh@gmail.com' -> 'v***h@gmail.com'
    """
    if not email or "@" not in email:
        return email
    
    user_part, domain_part = email.split("@", 1)
    if len(user_part) <= 2:
        masked_user = user_part[0] + "*"
    else:
        masked_user = user_part[0] + ("*" * (len(user_part) - 2)) + user_part[-1]
    
    return f"{masked_user}@{domain_part}"


def generate_watermark_payload(agent_name: str, employee_id: str, ip_address: str) -> str:
    """
    Formats the forensic watermark text rendered over the CRM UI canvas.
    """
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    return f"{agent_name} | ID:{employee_id} | IP:{ip_address} | {timestamp}"
