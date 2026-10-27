from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.property import Property
from app.models.user import User
from app.schemas.property import PropertyResponse, PropertyCreate
from app.api.v1.auth import get_current_user

router = APIRouter(prefix="/properties", tags=["Property Inventory & Catalog"])


@router.get("", response_model=List[PropertyResponse])
async def list_properties(
    status_filter: Optional[str] = Query(None, alias="status"),
    featured_only: Optional[bool] = Query(None, alias="featured"),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Property).order_by(desc(Property.featured), desc(Property.created_at))
    if status_filter:
        stmt = stmt.where(Property.status == status_filter)
    if featured_only is not None:
        stmt = stmt.where(Property.featured == featured_only)

    res = await db.execute(stmt)
    return res.scalars().all()


@router.get("/{property_id}", response_model=PropertyResponse)
async def get_property_detail(
    property_id: str,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Property).where(Property.id == property_id)
    res = await db.execute(stmt)
    prop = res.scalars().first()
    if not prop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")
    return prop


@router.post("", response_model=PropertyResponse)
async def create_property(
    req: PropertyCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role not in ["ADMIN", "MANAGER", "OWNER"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin or Manager privileges required")

    prop = Property(
        tenant_id=current_user.tenant_id,
        title=req.title,
        project_name=req.project_name,
        property_type=req.property_type,
        location=req.location,
        price=req.price,
        price_formatted=req.price_formatted,
        carpet_area_sqft=req.carpet_area_sqft,
        bedrooms=req.bedrooms,
        bathrooms=req.bathrooms,
        status=req.status,
        amenities=req.amenities,
        image_url=req.image_url,
        brochure_url=req.brochure_url,
        featured=req.featured
    )
    db.add(prop)
    await db.commit()
    await db.refresh(prop)
    return prop
