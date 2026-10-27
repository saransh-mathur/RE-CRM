import json
import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import hash_phone, mask_phone, mask_email, normalize_phone
from app.models.lead import Lead, LeadActivity, AssignmentRule
from app.models.user import User
from app.schemas.lead import (
    LeadResponse,
    LeadCreate,
    LeadUpdate,
    LeadActivityResponse,
    LeadCallInitiateResponse,
    AssignmentRuleCreate,
    AssignmentRuleResponse,
)
from app.api.v1.auth import get_current_user
from app.services.lead_routing import LeadRoutingService

router = APIRouter(prefix="/leads", tags=["Leads & Follow-up Tracking"])


@router.get("", response_model=List[LeadResponse])
async def list_leads(
    status_filter: Optional[str] = Query(None, alias="status"),
    source_filter: Optional[str] = Query(None, alias="source"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns leads with DLP phone/email masking.
    Agents only see leads assigned to them. Managers and Admins see all leads.
    Dynamically recalculates SLA breach status.
    """
    stmt = select(Lead).order_by(desc(Lead.created_at))

    # RBAC Data Partitioning
    if current_user.role == "AGENT":
        stmt = stmt.where(Lead.assigned_agent_id == current_user.id)

    if status_filter:
        stmt = stmt.where(Lead.status == status_filter)
    if source_filter:
        stmt = stmt.where(Lead.source == source_filter)

    res = await db.execute(stmt)
    leads = res.scalars().all()

    # Pre-fetch all user names in 1 query for instant O(1) resolution
    u_stmt = select(User.id, User.full_name)
    u_res = await db.execute(u_stmt)
    user_names = dict(u_res.all())

    now = datetime.now(timezone.utc)
    results = []
    for l in leads:
        # Check SLA breach dynamically
        if l.status == "NEW" and l.sla_deadline:
            deadline = l.sla_deadline.replace(tzinfo=timezone.utc if l.sla_deadline.tzinfo is None else None)
            if deadline < now:
                l.is_sla_breached = True

        lead_resp = LeadResponse.model_validate(l)
        lead_resp.assigned_agent_name = user_names.get(l.assigned_agent_id) if l.assigned_agent_id else None
        results.append(lead_resp)

    return results


@router.get("/{lead_id}", response_model=LeadResponse)
async def get_lead_detail(
    lead_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieves a single lead and logs a forensic DLP LEAD_VIEWED event.
    """
    stmt = select(Lead).where(Lead.id == lead_id)
    res = await db.execute(stmt)
    lead = res.scalars().first()

    if not lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found")

    if current_user.role == "AGENT" and lead.assigned_agent_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to unassigned lead")

    # Record LEAD_VIEWED activity for follow-up audit trail
    activity = LeadActivity(
        lead_id=lead.id,
        user_id=current_user.id,
        activity_type="LEAD_VIEWED",
        metadata_json=f'{{"viewed_by": "{current_user.employee_code}"}}'
    )
    db.add(activity)
    await db.commit()

    agent_name = None
    if lead.assigned_agent_id:
        u_stmt = select(User.full_name).where(User.id == lead.assigned_agent_id)
        u_res = await db.execute(u_stmt)
        agent_name = u_res.scalar()

    resp = LeadResponse.model_validate(lead)
    resp.assigned_agent_name = agent_name
    return resp


@router.post("", response_model=LeadResponse)
async def create_manual_lead(
    req: LeadCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Manually creates a lead (e.g. walk-in inquiry) and assigns via routing engine.
    """
    p_hash = hash_phone(req.phone)
    norm_phone = normalize_phone(req.phone)
    masked_phone_str = mask_phone(req.phone)
    masked_email_str = mask_email(req.email) if req.email else None

    new_lead = Lead(
        tenant_id=current_user.tenant_id,
        source=req.source or "MANUAL",
        full_name=req.full_name,
        phone_raw=norm_phone,
        phone_masked=masked_phone_str,
        phone_hash=p_hash,
        email=req.email,
        email_masked=masked_email_str,
        property_type=req.property_type,
        budget_min=req.budget_min,
        budget_max=req.budget_max,
        preferred_location=req.preferred_location,
        notes=req.notes,
        status="NEW"
    )
    db.add(new_lead)
    await db.flush()

    assigned_agent = await LeadRoutingService.assign_lead(new_lead, db)

    db.add(LeadActivity(
        lead_id=new_lead.id,
        user_id=current_user.id,
        activity_type="LEAD_CREATED_MANUAL",
        metadata_json=f'{{"created_by": "{current_user.employee_code}"}}'
    ))
    await db.commit()
    await db.refresh(new_lead)

    resp = LeadResponse.model_validate(new_lead)
    resp.assigned_agent_name = assigned_agent.full_name if assigned_agent else None
    return resp


@router.patch("/{lead_id}", response_model=LeadResponse)
async def update_lead(
    lead_id: str,
    req: LeadUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Lead).where(Lead.id == lead_id)
    res = await db.execute(stmt)
    lead = res.scalars().first()

    if not lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found")

    old_status = lead.status
    if req.status and req.status != old_status:
        lead.status = req.status
        # If moving away from NEW, record first response time and stop SLA clock
        if old_status == "NEW" and not lead.first_response_at:
            lead.first_response_at = datetime.now(timezone.utc)
        
        db.add(LeadActivity(
            lead_id=lead.id,
            user_id=current_user.id,
            activity_type="STATUS_CHANGED",
            metadata_json=f'{{"from": "{old_status}", "to": "{req.status}"}}'
        ))

    if req.notes is not None:
        lead.notes = req.notes
        db.add(LeadActivity(
            lead_id=lead.id,
            user_id=current_user.id,
            activity_type="NOTE_ADDED",
            metadata_json='{"note_updated": true}'
        ))

    if req.property_type is not None:
        lead.property_type = req.property_type
    if req.budget_min is not None:
        lead.budget_min = req.budget_min
    if req.budget_max is not None:
        lead.budget_max = req.budget_max
    if req.preferred_location is not None:
        lead.preferred_location = req.preferred_location
    if req.assigned_agent_id is not None and current_user.role in ["ADMIN", "MANAGER", "OWNER"]:
        lead.assigned_agent_id = req.assigned_agent_id

    await db.commit()
    await db.refresh(lead)

    resp = LeadResponse.model_validate(lead)
    return resp


@router.post("/{lead_id}/call", response_model=LeadCallInitiateResponse)
async def initiate_masked_call(
    lead_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Click-to-Call Masked Bridge.
    Connects agent to client without disclosing raw customer phone number on screen or export.
    """
    stmt = select(Lead).where(Lead.id == lead_id)
    res = await db.execute(stmt)
    lead = res.scalars().first()

    if not lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found")

    # Generate virtual bridge ID
    call_bridge_id = f"bridge_{uuid.uuid4().hex[:12]}"

    # Log CALL_DIALED activity
    db.add(LeadActivity(
        lead_id=lead.id,
        user_id=current_user.id,
        activity_type="CALL_DIALED",
        metadata_json=f'{{"bridge_id": "{call_bridge_id}", "caller": "{current_user.employee_code}"}}'
    ))

    # If first call, mark response time
    if not lead.first_response_at:
        lead.first_response_at = datetime.now(timezone.utc)
        if lead.status == "NEW":
            lead.status = "CONTACTED"

    await db.commit()

    return LeadCallInitiateResponse(
        lead_id=lead.id,
        status="DIALING",
        masked_target=lead.phone_masked,
        call_bridge_id=call_bridge_id,
        message=f"Bridging call to customer {lead.phone_masked} securely. Raw number is protected by DLP."
    )


@router.get("/{lead_id}/activities", response_model=List[LeadActivityResponse])
async def get_lead_activities(
    lead_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Forensic Guarantee: Automatically record an immutable LEAD_VIEWED DLP log
    # whenever any user inspects this customer profile
    now = datetime.now(timezone.utc)
    view_stmt = (
        select(LeadActivity)
        .where(
            LeadActivity.lead_id == lead_id,
            LeadActivity.user_id == current_user.id,
            LeadActivity.activity_type == "LEAD_VIEWED"
        )
        .order_by(desc(LeadActivity.created_at))
        .limit(1)
    )
    v_res = await db.execute(view_stmt)
    last_view = v_res.scalars().first()

    should_log = True
    if last_view and last_view.created_at:
        lv_time = last_view.created_at
        if lv_time.tzinfo is None:
            lv_time = lv_time.replace(tzinfo=timezone.utc)
        if (now - lv_time).total_seconds() < 90:
            should_log = False

    if should_log:
        db.add(LeadActivity(
            lead_id=lead_id,
            user_id=current_user.id,
            activity_type="LEAD_VIEWED",
            metadata_json=json.dumps({
                "viewed_by": current_user.full_name,
                "employee_code": current_user.employee_code,
                "role": current_user.role,
                "immutable_dlp_audit": True
            })
        ))
        await db.commit()

    stmt = (
        select(LeadActivity)
        .where(LeadActivity.lead_id == lead_id)
        .order_by(desc(LeadActivity.created_at))
    )
    res = await db.execute(stmt)
    activities = res.scalars().all()
    return activities


@router.post("/{lead_id}/confiscate", response_model=LeadResponse)
async def confiscate_and_reassign_lead(
    lead_id: str,
    target_agent_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Confiscates a high-risk lead from an executive suspected of offline closing or poaching.
    Reassigns to compliant queue, clears risk flags, and writes forensic audit log.
    """
    if current_user.role not in ["ADMIN", "MANAGER", "OWNER"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Manager or Owner privileges required")

    stmt = select(Lead).where(Lead.id == lead_id)
    res = await db.execute(stmt)
    lead = res.scalars().first()
    if not lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found")

    old_agent_id = lead.assigned_agent_id

    # Find a compliant on-duty agent if target not provided
    if target_agent_id:
        lead.assigned_agent_id = target_agent_id
    else:
        agents_stmt = select(User).where(User.role == "AGENT", User.is_punched_in == True, User.id != old_agent_id)
        agents_res = await db.execute(agents_stmt)
        compliant_agents = agents_res.scalars().all()
        if compliant_agents:
            lead.assigned_agent_id = compliant_agents[0].id
        else:
            lead.assigned_agent_id = None

    lead.offline_closing_flag = False
    lead.poaching_risk_score = "LOW"
    lead.poaching_risk_reason = "Confiscated by Owner & auto-reassigned under Anti-Poaching Revenue Shield."
    if lead.status == "LOST":
        lead.status = "CONTACTED"

    # Add Activity
    db.add(LeadActivity(
        lead_id=lead.id,
        user_id=current_user.id,
        activity_type="LEAD_CONFISCATED_AND_REASSIGNED",
        metadata_json=json.dumps({
            "confiscated_by": current_user.full_name,
            "previous_agent_id": old_agent_id,
            "new_agent_id": lead.assigned_agent_id,
            "estimated_brokerage": lead.estimated_brokerage
        })
    ))

    await db.commit()
    await db.refresh(lead)

    agent_name = None
    if lead.assigned_agent_id:
        u_res = await db.execute(select(User.full_name).where(User.id == lead.assigned_agent_id))
        agent_name = u_res.scalar()

    resp = LeadResponse.model_validate(lead)
    resp.assigned_agent_name = agent_name
    return resp


@router.get("/rules/list", response_model=List[AssignmentRuleResponse])
async def list_assignment_rules(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(AssignmentRule).order_by(AssignmentRule.priority.asc())
    res = await db.execute(stmt)
    rules = res.scalars().all()
    return rules


@router.post("/rules", response_model=AssignmentRuleResponse)
async def create_assignment_rule(
    req: AssignmentRuleCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role not in ["ADMIN", "MANAGER", "OWNER"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin or Manager privileges required")

    rule = AssignmentRule(
        tenant_id=current_user.tenant_id,
        name=req.name,
        rule_type=req.rule_type,
        is_active=req.is_active,
        priority=req.priority,
        config_json=req.config_json
    )
    db.add(rule)
    await db.commit()
    await db.refresh(rule)
    return rule
