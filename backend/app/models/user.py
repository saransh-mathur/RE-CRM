import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Integer
from sqlalchemy.orm import relationship
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String(36), ForeignKey("tenants.id"), nullable=True)
    email = Column(String(120), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    employee_code = Column(String(50), unique=True, nullable=False)
    role = Column(String(20), default="AGENT")  # ADMIN, MANAGER, AGENT
    phone = Column(String(30), nullable=True)
    is_active = Column(Boolean, default=True)
    
    # Live shift status
    is_punched_in = Column(Boolean, default=False)
    last_punch_time = Column(DateTime, nullable=True)
    max_active_leads = Column(Integer, default=50)
    current_active_leads_count = Column(Integer, default=0)
    assigned_territory = Column(String(100), nullable=True)  # e.g., "North District", "Downtown Luxury"

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    sessions = relationship("UserSession", back_populates="user", cascade="all, delete-orphan")


class UserSession(Base):
    __tablename__ = "user_sessions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    session_token_hash = Column(String(64), unique=True, index=True, nullable=False)
    device_fingerprint_hash = Column(String(64), nullable=True)
    device_type = Column(String(30), default="DESKTOP_BROWSER")  # MOBILE_APP, MOBILE_BROWSER, LAPTOP, DESKTOP
    ip_address = Column(String(45), nullable=False)
    user_agent = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)
    
    punched_in_at = Column(DateTime, nullable=True)
    punched_out_at = Column(DateTime, nullable=True)
    last_heartbeat = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="sessions")
