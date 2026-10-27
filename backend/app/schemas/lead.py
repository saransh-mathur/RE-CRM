from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict


class LeadBase(BaseModel):
    full_name: str
    property_type: Optional[str] = "Apartment"
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    preferred_location: Optional[str] = None
    notes: Optional[str] = None


class LeadCreate(LeadBase):
    phone: str
    email: Optional[str] = None
    source: Optional[str] = "MANUAL"


class LeadUpdate(BaseModel):
    full_name: Optional[str] = None
    status: Optional[str] = None
    property_type: Optional[str] = None
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    preferred_location: Optional[str] = None
    notes: Optional[str] = None
    assigned_agent_id: Optional[str] = None


class LeadResponse(LeadBase):
    id: str
    tenant_id: Optional[str] = None
    assigned_agent_id: Optional[str] = None
    assigned_agent_name: Optional[str] = None
    meta_leadgen_id: Optional[str] = None
    source: str
    phone_masked: str  # Always return masked phone by default for DLP
    email_masked: Optional[str] = None
    status: str
    sla_deadline: Optional[datetime] = None
    is_sla_breached: bool
    first_response_at: Optional[datetime] = None
    estimated_brokerage: Optional[float] = 0.0
    poaching_risk_score: Optional[str] = "LOW"
    poaching_risk_reason: Optional[str] = None
    offline_closing_flag: Optional[bool] = False
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class LeadActivityCreate(BaseModel):
    activity_type: str
    metadata_json: Optional[str] = "{}"


class LeadActivityResponse(BaseModel):
    id: str
    lead_id: str
    user_id: Optional[str] = None
    user_name: Optional[str] = None
    activity_type: str
    metadata_json: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LeadCallInitiateResponse(BaseModel):
    lead_id: str
    status: str
    masked_target: str
    call_bridge_id: str
    message: str


class AssignmentRuleCreate(BaseModel):
    name: str
    rule_type: str = "ROUND_ROBIN"  # ROUND_ROBIN, GEO_MATCH, BUDGET_TIER
    is_active: bool = True
    priority: int = 1
    config_json: Optional[str] = "{}"


class AssignmentRuleResponse(BaseModel):
    id: str
    name: str
    rule_type: str
    is_active: bool
    priority: int
    config_json: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
