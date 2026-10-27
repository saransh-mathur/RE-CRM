import io
import csv
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Response, Query, status
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.lead import Lead
from app.models.telemetry import ExportRequest
from app.models.user import User
from app.schemas.telemetry import (
    ExportRequestCreate,
    ExportRequestResponse,
    ExportApproveRequest,
)
from app.api.v1.auth import get_current_user
from app.services.dlp_service import DLPService

router = APIRouter(prefix="/exports", tags=["DLP Export Governance"])


@router.post("/request", response_model=ExportRequestResponse)
async def request_lead_export(
    req: ExportRequestCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Submits an export request requiring manager Four-Eyes approval.
    Direct bulk downloads without approval are blocked by DLP.
    """
    export_req = await DLPService.request_export(
        requester=current_user,
        reason=req.reason,
        records_count=req.records_count,
        db=db
    )
    return export_req


@router.get("", response_model=List[ExportRequestResponse])
async def list_export_requests(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(ExportRequest).order_by(desc(ExportRequest.created_at))
    if current_user.role == "AGENT":
        stmt = stmt.where(ExportRequest.requester_id == current_user.id)
    
    res = await db.execute(stmt)
    return res.scalars().all()


@router.post("/review", response_model=ExportRequestResponse)
async def review_export_request(
    review: ExportApproveRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Manager or Admin approves or rejects an export request.
    Enforces the Four-Eyes principle: Requesters cannot approve their own requests.
    """
    if current_user.role not in ["ADMIN", "MANAGER", "OWNER"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Managerial approval required")

    try:
        updated_req = await DLPService.review_export(
            request_id=review.request_id,
            approver=current_user,
            approved=review.approved,
            db=db
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    if not updated_req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Export request not found or not pending")

    return updated_req


@router.get("/{request_id}/download")
async def download_approved_export(
    request_id: str,
    token: str = Query(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Downloads the approved dataset using the one-time token.
    Token is invalidated upon successful consumption.
    """
    stmt = select(ExportRequest).where(ExportRequest.id == request_id)
    res = await db.execute(stmt)
    req = res.scalars().first()

    if not req or req.status != "APPROVED":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Export not approved")

    if req.one_time_token_hash != token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired export token")

    # Invalidate token (single-use)
    req.one_time_token_hash = None
    req.status = "COMPLETED"

    # Fetch leads
    lead_stmt = select(Lead).order_by(desc(Lead.created_at)).limit(req.records_count)
    lead_res = await db.execute(lead_stmt)
    leads = lead_res.scalars().all()

    # Generate CSV in-memory with forensic watermark header
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([f"# FORENSIC EXPORT: Authorized by {req.approver_id} to {req.requester_id} at {datetime.now(timezone.utc).isoformat()}"])
    writer.writerow(["ID", "Full Name", "Masked Phone", "Source", "Status", "Preferred Location", "Property Type", "Created At"])
    for l in leads:
        writer.writerow([
            l.id,
            l.full_name,
            l.phone_masked,
            l.source,
            l.status,
            l.preferred_location,
            l.property_type,
            l.created_at.isoformat() if l.created_at else ""
        ])

    await db.commit()

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=leads_export_{request_id[:8]}.csv"}
    )
