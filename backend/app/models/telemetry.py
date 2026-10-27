import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Float, Text, Integer
from app.core.database import Base


class DeviceFingerprint(Base):
    __tablename__ = "device_fingerprints"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    fingerprint_hash = Column(String(64), index=True, nullable=False)
    device_type = Column(String(30), default="DESKTOP_BROWSER")  # MOBILE_APP, MOBILE_BROWSER, LAPTOP, DESKTOP
    os_name = Column(String(50), nullable=True)
    browser_name = Column(String(50), nullable=True)
    screen_resolution = Column(String(30), nullable=True)
    cpu_cores = Column(Integer, nullable=True)
    is_trusted = Column(Boolean, default=False)
    first_seen_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    last_seen_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class GPSBreadcrumb(Base):
    __tablename__ = "gps_breadcrumbs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    session_id = Column(String(36), ForeignKey("user_sessions.id"), nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    accuracy = Column(Float, nullable=True)
    speed = Column(Float, nullable=True)
    is_within_geofence = Column(Boolean, default=True)
    geofence_tag = Column(String(100), nullable=True)  # e.g., "Branch Office", "Palm Grove Project Site"
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)


class SecurityAuditLog(Base):
    __tablename__ = "security_audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String(36), ForeignKey("tenants.id"), nullable=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    event_type = Column(String(60), nullable=False, index=True)
    # Events: LOGIN_SUCCESS, LOGIN_ANOMALY, IMPOSSIBLE_TRAVEL, CONCURRENT_SESSION_TERMINATED,
    #         WATERMARK_TAMPER_ATTEMPT, EXPORT_REQUESTED, EXPORT_APPROVED, PII_ACCESSED, DEVTOOLS_OPENED
    severity = Column(String(20), default="LOW")  # LOW, MEDIUM, HIGH, CRITICAL
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)
    details_json = Column(Text, default="{}")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)


class ExportRequest(Base):
    __tablename__ = "export_requests"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String(36), ForeignKey("tenants.id"), nullable=True)
    requester_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    approver_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    status = Column(String(20), default="PENDING")  # PENDING, APPROVED, REJECTED, EXPIRED
    reason = Column(Text, nullable=False)
    records_count = Column(Integer, default=0)
    one_time_token_hash = Column(String(64), nullable=True)
    expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
