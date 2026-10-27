from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict


class PropertyBase(BaseModel):
    title: str
    project_name: str
    property_type: str
    location: str
    price: float
    price_formatted: str
    carpet_area_sqft: int
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    status: str = "AVAILABLE"
    amenities: Optional[str] = "[]"
    image_url: Optional[str] = None
    brochure_url: Optional[str] = None
    featured: bool = False


class PropertyCreate(PropertyBase):
    pass


class PropertyResponse(PropertyBase):
    id: str
    tenant_id: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
