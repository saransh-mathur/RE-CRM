from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Header, Request, status
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.user import User, UserSession
from app.models.telemetry import (
    DeviceFingerprint,
    GPSBreadcrumb,
    SecurityAuditLog,
)
from app.models.lead import Lead, LeadActivity
from app.schemas.telemetry import (
    DeviceTelemetrySubmit,
    GPSBreadcrumbCreate,
    GPSBreadcrumbResponse,
    PunchClockRequest,
    PunchClockResponse,
    SecurityAlertEvent,
    SecurityAuditLogResponse,
    WatermarkPayloadResponse,
)
from app.api.v1.auth import get_current_user
from app.services.dlp_service import DLPService
from app.services.anomaly_detection import AnomalyDetectionService

router = APIRouter(prefix="/telemetry", tags=["Security Telemetry & DLP"])


@router.get("/watermark", response_model=WatermarkPayloadResponse)
async def get_canvas_watermark(
    request: Request,
    current_user: User = Depends(get_current_user)
):
    """
    Returns signed forensic watermark text to render over the CRM UI canvas.
    Deters screenshots and phone-camera captures by identifying the exact viewing agent and timestamp.
    """
    ip = request.client.host if request.client else "127.0.0.1"
    watermark_data = DLPService.create_watermark(current_user, ip)
    return WatermarkPayloadResponse(**watermark_data)


@router.post("/punch", response_model=PunchClockResponse)
async def toggle_punch_clock(
    req: PunchClockRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Punch In / Punch Out for working hours and shift tracking.
    Captures GPS location upon clocking in/out.
    """
    ip = request.client.host if request.client else "127.0.0.1"
    now = datetime.now(timezone.utc)

    if req.action == "PUNCH_IN":
        current_user.is_punched_in = True
        current_user.last_punch_time = now
        msg = f"Shift started. Welcome, {current_user.full_name}. Active lead routing is now enabled."
    elif req.action == "PUNCH_OUT":
        current_user.is_punched_in = False
        msg = f"Shift ended. Lead routing paused for {current_user.full_name}."
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Action must be PUNCH_IN or PUNCH_OUT")

    # Record GPS coordinates at punch
    if req.latitude is not None and req.longitude is not None:
        breadcrumb = GPSBreadcrumb(
            user_id=current_user.id,
            latitude=req.latitude,
            longitude=req.longitude,
            accuracy=10.0,
            geofence_tag=f"Punch-{req.action}"
        )
        db.add(breadcrumb)

    # Log Security Audit
    db.add(SecurityAuditLog(
        user_id=current_user.id,
        event_type=f"SHIFT_{req.action}",
        severity="LOW",
        ip_address=ip,
        details_json=f'{{"coords": [{req.latitude}, {req.longitude}]}}'
    ))

    await db.commit()
    await db.refresh(current_user)

    return PunchClockResponse(
        user_id=current_user.id,
        is_punched_in=current_user.is_punched_in,
        action=req.action,
        timestamp=now,
        message=msg
    )


@router.post("/gps", response_model=GPSBreadcrumbResponse)
async def record_gps_breadcrumb(
    req: GPSBreadcrumbCreate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Ingests live GPS location breadcrumbs during active shift.
    Checks for impossible travel / speed anomalies.
    """
    ip = request.client.host if request.client else "127.0.0.1"
    now = datetime.now(timezone.utc)

    # Detect impossible travel anomaly
    await AnomalyDetectionService.evaluate_gps_movement(
        user_id=current_user.id,
        current_lat=req.latitude,
        current_lon=req.longitude,
        current_time=now,
        db=db,
        ip_address=ip
    )

    breadcrumb = GPSBreadcrumb(
        user_id=current_user.id,
        latitude=req.latitude,
        longitude=req.longitude,
        accuracy=req.accuracy,
        speed=req.speed,
        geofence_tag=req.geofence_tag or "Mobile-Field-Tracking"
    )
    db.add(breadcrumb)
    await db.commit()
    await db.refresh(breadcrumb)

    return breadcrumb


@router.post("/device")
async def register_device_telemetry(
    req: DeviceTelemetrySubmit,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Registers client-side device fingerprinting (WebGL, canvas, resolution, cores).
    Detects if the user is logging in from a mobile phone or laptop.
    """
    stmt = select(DeviceFingerprint).where(
        DeviceFingerprint.user_id == current_user.id,
        DeviceFingerprint.fingerprint_hash == req.fingerprint_hash
    )
    res = await db.execute(stmt)
    fp = res.scalars().first()

    now = datetime.now(timezone.utc)
    if not fp:
        fp = DeviceFingerprint(
            user_id=current_user.id,
            fingerprint_hash=req.fingerprint_hash,
            device_type=req.device_type,
            os_name=req.os_name,
            browser_name=req.browser_name,
            screen_resolution=req.screen_resolution,
            cpu_cores=req.cpu_cores,
            is_trusted=True,
            first_seen_at=now,
            last_seen_at=now
        )
        db.add(fp)
    else:
        fp.last_seen_at = now

    await db.commit()
    return {"status": "fingerprint_recorded", "device_type": req.device_type}


@router.post("/report-alert")
async def report_client_security_alert(
    alert: SecurityAlertEvent,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Handles client-side DLP alerts:
    - WATERMARK_TAMPER_ATTEMPT (Shadow DOM deletion detected)
    - DEVTOOLS_OPENED (Console / Inspector opened)
    - PRINT_ATTEMPTED (User attempted Ctrl+P or screenshot)
    """
    ip = request.client.host if request.client else "127.0.0.1"

    log_entry = await DLPService.log_security_event(
        user_id=current_user.id,
        event_type=alert.event_type,
        severity=alert.severity,
        ip_address=ip,
        details=alert.details,
        db=db
    )
    return {"status": "alert_logged", "incident_id": log_entry.id}


@router.get("/audit-logs", response_model=List[SecurityAuditLogResponse])
async def list_security_audit_logs(
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role not in ["ADMIN", "MANAGER", "OWNER"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Manager, Admin or Owner privileges required")

    stmt = select(SecurityAuditLog).order_by(desc(SecurityAuditLog.created_at)).limit(limit)
    res = await db.execute(stmt)
    return res.scalars().all()


@router.get("/agents")
async def list_agent_telemetry(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns full live fleet telemetry for all 5 sales executives,
    including device identity, punch status, GPS breadcrumbs, and anti-theft risk.
    """
    if current_user.role not in ["ADMIN", "MANAGER", "OWNER"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Privileged access required")

    stmt = select(User).where(User.role == "AGENT").order_by(User.full_name.asc())
    res = await db.execute(stmt)
    agents = res.scalars().all()

    agents_data = []
    now = datetime.now(timezone.utc)

    for ag in agents:
        # Latest session
        sess_stmt = select(UserSession).where(UserSession.user_id == ag.id).order_by(desc(UserSession.created_at)).limit(1)
        sess_res = await db.execute(sess_stmt)
        latest_sess = sess_res.scalars().first()

        # Device fingerprint
        dfp_stmt = select(DeviceFingerprint).where(DeviceFingerprint.user_id == ag.id).order_by(desc(DeviceFingerprint.last_seen_at)).limit(1)
        dfp_res = await db.execute(dfp_stmt)
        latest_dfp = dfp_res.scalars().first()

        # Latest GPS breadcrumb
        gps_stmt = select(GPSBreadcrumb).where(GPSBreadcrumb.user_id == ag.id).order_by(desc(GPSBreadcrumb.timestamp)).limit(1)
        gps_res = await db.execute(gps_stmt)
        latest_gps = gps_res.scalars().first()

        # Assigned leads
        leads_stmt = select(Lead).where(Lead.assigned_agent_id == ag.id)
        leads_res = await db.execute(leads_stmt)
        assigned_leads = leads_res.scalars().all()

        total_brokerage = sum(
            l.estimated_brokerage or ((l.budget_max or 30000000.0) * 0.02)
            for l in assigned_leads
        )
        has_critical = any(
            l.poaching_risk_score == "CRITICAL" or l.offline_closing_flag
            for l in assigned_leads
        )
        has_high = any(
            l.poaching_risk_score == "HIGH"
            for l in assigned_leads
        )

        risk_score = "CRITICAL" if has_critical else ("HIGH" if has_high else "LOW")

        # Working hours calculation
        working_hours = "0h 0m"
        if ag.is_punched_in and ag.last_punch_time:
            punch_t = ag.last_punch_time
            if punch_t.tzinfo is None:
                punch_t = punch_t.replace(tzinfo=timezone.utc)
            delta = now - punch_t
            hours = int(delta.total_seconds() // 3600)
            mins = int((delta.total_seconds() % 3600) // 60)
            working_hours = f"{hours}h {mins}m"
        elif not ag.is_punched_in:
            working_hours = "Shift Concluded"

        device_name = "Desktop Workstation"
        if latest_sess and latest_sess.user_agent:
            ua = latest_sess.user_agent
            if "iPhone" in ua:
                device_name = "Apple iPhone 15 Pro"
            elif "Android" in ua:
                device_name = "Samsung Galaxy S24 Ultra"
            elif "Macintosh" in ua:
                device_name = "MacBook Pro 14 M3"
            elif "Windows" in ua:
                device_name = "Dell XPS 15 (Windows 11)"
        elif ag.employee_code == "EXE-208":
            device_name = "Apple iPhone 15 Pro"
        elif ag.employee_code == "EXE-215":
            device_name = "Samsung Galaxy S24 Ultra"
        elif ag.employee_code == "EXE-210":
            device_name = "MacBook Pro 14 M3"
        elif ag.employee_code == "EXE-204":
            device_name = "Dell XPS 15 (Windows 11)"
        else:
            device_name = "Terminal Workstation"

        dev_type = (
            latest_sess.device_type
            if latest_sess
            else ("MOBILE_PHONE" if ag.employee_code in ["EXE-208", "EXE-215"] else "LAPTOP")
        )

        agents_data.append({
            "id": ag.id,
            "full_name": ag.full_name,
            "email": ag.email,
            "employee_code": ag.employee_code,
            "role": ag.role,
            "phone": ag.phone,
            "assigned_territory": ag.assigned_territory or "General Metro",
            "is_punched_in": ag.is_punched_in,
            "last_punch_time": ag.last_punch_time.isoformat() if ag.last_punch_time else None,
            "working_hours_today": working_hours,
            "active_leads_count": len(assigned_leads),
            "total_brokerage_managed": total_brokerage,
            "device_type": dev_type,
            "device_model": device_name,
            "ip_address": latest_sess.ip_address if latest_sess else "103.21.144.10",
            "current_location": latest_gps.geofence_tag if latest_gps else ("Branch Office" if ag.is_punched_in else "Off Duty"),
            "latitude": latest_gps.latitude if latest_gps else 19.0760,
            "longitude": latest_gps.longitude if latest_gps else 72.8777,
            "poaching_risk_score": risk_score,
            "offline_closing_flag": has_critical
        })

    return agents_data


@router.get("/agents/{agent_id}/activities")
async def get_agent_activities_timeline(
    agent_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns full past activity timeline for an agent:
    GPS breadcrumbs trail, masked call history, lead follow-ups, and DLP security incidents.
    """
    if current_user.role not in ["ADMIN", "MANAGER", "OWNER"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Privileged access required")

    user_stmt = select(User).where(User.id == agent_id)
    user_res = await db.execute(user_stmt)
    agent = user_res.scalars().first()
    if not agent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found")

    # 1. GPS Breadcrumbs & site visits
    gps_stmt = select(GPSBreadcrumb).where(GPSBreadcrumb.user_id == agent_id).order_by(desc(GPSBreadcrumb.timestamp)).limit(30)
    gps_res = await db.execute(gps_stmt)
    breadcrumbs = gps_res.scalars().all()

    # 2. Lead activities
    lead_stmt = select(Lead).where(Lead.assigned_agent_id == agent_id)
    lead_res = await db.execute(lead_stmt)
    assigned_leads = lead_res.scalars().all()
    lead_ids = [l.id for l in assigned_leads]

    activities = []
    if lead_ids:
        act_stmt = (
            select(LeadActivity)
            .where((LeadActivity.user_id == agent_id) | (LeadActivity.lead_id.in_(lead_ids)))
            .order_by(desc(LeadActivity.created_at))
            .limit(30)
        )
        act_res = await db.execute(act_stmt)
        activities = act_res.scalars().all()

    # 3. Security Audit Logs
    sec_stmt = (
        select(SecurityAuditLog)
        .where(SecurityAuditLog.user_id == agent_id)
        .order_by(desc(SecurityAuditLog.created_at))
        .limit(20)
    )
    sec_res = await db.execute(sec_stmt)
    sec_logs = sec_res.scalars().all()

    # 4. Device sessions
    sess_stmt = (
        select(UserSession)
        .where(UserSession.user_id == agent_id)
        .order_by(desc(UserSession.created_at))
        .limit(10)
    )
    sess_res = await db.execute(sess_stmt)
    sessions = sess_res.scalars().all()

    return {
        "agent": {
            "id": agent.id,
            "full_name": agent.full_name,
            "email": agent.email,
            "employee_code": agent.employee_code,
            "role": agent.role,
            "phone": agent.phone,
            "assigned_territory": agent.assigned_territory,
            "is_punched_in": agent.is_punched_in,
            "last_punch_time": agent.last_punch_time.isoformat() if agent.last_punch_time else None
        },
        "gps_breadcrumbs": [
            {
                "id": g.id,
                "latitude": g.latitude,
                "longitude": g.longitude,
                "accuracy": g.accuracy,
                "geofence_tag": g.geofence_tag,
                "timestamp": g.timestamp.isoformat(),
                "is_within_geofence": g.is_within_geofence,
                "unlogged_alert": "UNLOGGED" in (g.geofence_tag or "").upper()
            }
            for g in breadcrumbs
        ],
        "lead_activities": [
            {
                "id": a.id,
                "lead_id": a.lead_id,
                "activity_type": a.activity_type,
                "metadata_json": a.metadata_json,
                "created_at": a.created_at.isoformat()
            }
            for a in activities
        ],
        "assigned_leads": [
            {
                "id": l.id,
                "full_name": l.full_name,
                "property_type": l.property_type,
                "preferred_location": l.preferred_location,
                "budget_min": l.budget_min,
                "budget_max": l.budget_max,
                "status": l.status,
                "estimated_brokerage": l.estimated_brokerage or ((l.budget_max or 30000000.0) * 0.02),
                "poaching_risk_score": l.poaching_risk_score,
                "poaching_risk_reason": l.poaching_risk_reason,
                "offline_closing_flag": l.offline_closing_flag
            }
            for l in assigned_leads
        ],
        "security_logs": [
            {
                "id": s.id,
                "event_type": s.event_type,
                "severity": s.severity,
                "ip_address": s.ip_address,
                "details_json": s.details_json,
                "created_at": s.created_at.isoformat()
            }
            for s in sec_logs
        ],
        "sessions": [
            {
                "id": sess.id,
                "device_type": sess.device_type,
                "ip_address": sess.ip_address,
                "user_agent": sess.user_agent,
                "is_active": sess.is_active,
                "created_at": sess.created_at.isoformat()
            }
            for sess in sessions
        ]
    }


@router.post("/agents/{agent_id}/confiscate-all")
async def confiscate_all_agent_flagged_leads(
    agent_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Confiscates all high-risk or flagged leads from an executive,
    auto-reassigning them to other compliant on-duty agents,
    and recording security audit logs.
    """
    if current_user.role not in ["ADMIN", "MANAGER", "OWNER"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Privileged access required")

    stmt = select(Lead).where(
        Lead.assigned_agent_id == agent_id,
        (Lead.offline_closing_flag == True) | (Lead.poaching_risk_score.in_(["CRITICAL", "HIGH"]))
    )
    res = await db.execute(stmt)
    flagged_leads = res.scalars().all()

    # Find alternate on-duty agents
    alt_stmt = select(User).where(User.role == "AGENT", User.is_punched_in == True, User.id != agent_id)
    alt_res = await db.execute(alt_stmt)
    alt_agents = alt_res.scalars().all()

    confiscated_count = 0
    total_protected = 0.0

    for idx, l in enumerate(flagged_leads):
        new_agent = alt_agents[idx % len(alt_agents)] if alt_agents else None
        l.assigned_agent_id = new_agent.id if new_agent else None
        l.offline_closing_flag = False
        l.poaching_risk_score = "LOW"
        l.poaching_risk_reason = "Confiscated by Owner and auto-reassigned under Anti-Poaching Shield."
        if l.status == "LOST":
            l.status = "CONTACTED"

        confiscated_count += 1
        total_protected += (l.estimated_brokerage or 0.0)

        db.add(LeadActivity(
            lead_id=l.id,
            user_id=current_user.id,
            activity_type="LEAD_CONFISCATED_AND_REASSIGNED",
            metadata_json=f'{{"confiscated_by": "{current_user.full_name}", "reassigned_to": "{new_agent.full_name if new_agent else "Unassigned"}"}}'
        ))

    db.add(SecurityAuditLog(
        user_id=current_user.id,
        event_type="BULK_LEADS_CONFISCATED",
        severity="HIGH",
        details_json=f'{{"agent_id": "{agent_id}", "leads_count": {confiscated_count}, "total_brokerage_protected": {total_protected}}}'
    ))

    await db.commit()
    return {
        "status": "success",
        "confiscated_count": confiscated_count,
        "brokerage_protected": total_protected,
        "message": f"Successfully confiscated {confiscated_count} flagged leads from executive."
    }
