import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Float, Text, Integer
from sqlalchemy.orm import relationship
from app.core.database import Base


class Lead(Base):
    __tablename__ = "leads"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String(36), ForeignKey("tenants.id"), nullable=True)
    assigned_agent_id = Column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    
    # Meta Ad tracking metadata
    meta_leadgen_id = Column(String(64), unique=True, index=True, nullable=True)
    meta_page_id = Column(String(64), nullable=True)
    meta_form_id = Column(String(64), nullable=True)
    meta_ad_id = Column(String(64), nullable=True)
    source = Column(String(50), default="META_LEAD_AD")  # META_FB, META_IG, WEBSITE, MANUAL
    
    # Customer Data
    full_name = Column(String(120), nullable=False)
    phone_masked = Column(String(30), nullable=False)
    phone_raw = Column(String(30), nullable=False)  # Encrypted/secured in DB
    phone_hash = Column(String(64), index=True, nullable=False)  # Used for deduplication
    email = Column(String(120), nullable=True)
    email_masked = Column(String(120), nullable=True)
    
    # Real estate preference fields
    property_type = Column(String(50), nullable=True)  # Apartment, Villa, Commercial, Penthouse
    budget_min = Column(Float, nullable=True)
    budget_max = Column(Float, nullable=True)
    preferred_location = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    
    # Lifecycle & SLA
    status = Column(String(40), default="NEW")  # NEW, CONTACTED, SITE_VISIT_SCHEDULED, WON, LOST
    sla_deadline = Column(DateTime, nullable=True)
    is_sla_breached = Column(Boolean, default=False)
    first_response_at = Column(DateTime, nullable=True)
    
    # Anti-Brokerage Theft & Lead Poaching Detection
    estimated_brokerage = Column(Float, default=0.0)
    poaching_risk_score = Column(String(20), default="LOW")  # LOW, MEDIUM, HIGH, CRITICAL
    poaching_risk_reason = Column(Text, nullable=True)
    offline_closing_flag = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    activities = relationship("LeadActivity", back_populates="lead", cascade="all, delete-orphan")


class LeadActivity(Base):
    __tablename__ = "lead_activities"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    lead_id = Column(String(36), ForeignKey("leads.id"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    activity_type = Column(String(50), nullable=False)  # LEAD_VIEWED, CALL_DIALED, NOTE_ADDED, STAGE_CHANGED, SITE_VISIT_CHECKIN
    metadata_json = Column(Text, nullable=True, default="{}")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    lead = relationship("Lead", back_populates="activities")


class AssignmentRule(Base):
    __tablename__ = "assignment_rules"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String(36), ForeignKey("tenants.id"), nullable=True)
    name = Column(String(100), nullable=False)
    rule_type = Column(String(40), default="ROUND_ROBIN")  # ROUND_ROBIN, GEO_MATCH, BUDGET_TIER
    is_active = Column(Boolean, default=True)
    priority = Column(Integer, default=1)
    config_json = Column(Text, default="{}")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
