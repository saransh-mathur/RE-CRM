import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, ForeignKey, Text
from app.core.database import Base


class Property(Base):
    __tablename__ = "properties"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String(36), ForeignKey("tenants.id"), nullable=True)
    title = Column(String(150), nullable=False)
    project_name = Column(String(100), nullable=False)
    property_type = Column(String(50), nullable=False)  # 3 BHK Apartment, 4 BHK Villa, Sky Penthouse, Commercial Office
    location = Column(String(120), nullable=False)
    price = Column(Float, nullable=False)
    price_formatted = Column(String(50), nullable=False)  # e.g., "₹3.85 Cr" / "$460,000"
    carpet_area_sqft = Column(Integer, nullable=False)
    bedrooms = Column(Integer, nullable=True)
    bathrooms = Column(Integer, nullable=True)
    status = Column(String(30), default="AVAILABLE")  # AVAILABLE, UNDER_OFFER, SOLD
    amenities = Column(Text, default="[]")  # JSON string array
    image_url = Column(String(500), nullable=True)
    brochure_url = Column(String(500), nullable=True)
    featured = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
