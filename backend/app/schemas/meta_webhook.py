from typing import List, Optional
from pydantic import BaseModel, Field


class MetaLeadValue(BaseModel):
    ad_id: Optional[str] = None
    form_id: Optional[str] = None
    leadgen_id: str
    created_time: int
    page_id: str
    adgroup_id: Optional[str] = None


class MetaChange(BaseModel):
    field: str
    value: MetaLeadValue


class MetaEntry(BaseModel):
    id: str
    time: int
    changes: List[MetaChange]


class MetaWebhookPayload(BaseModel):
    object: str = "page"
    entry: List[MetaEntry]


class LeadFieldData(BaseModel):
    name: str
    values: List[str]


class MetaGraphLeadResponse(BaseModel):
    id: str
    created_time: str
    ad_id: Optional[str] = None
    form_id: Optional[str] = None
    field_data: List[LeadFieldData] = Field(default_factory=list)
