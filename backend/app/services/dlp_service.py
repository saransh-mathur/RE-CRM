import uuid
import secrets
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.security import generate_watermark_payload, create_access_token
from app.models.telemetry import SecurityAuditLog, ExportRequest
from app.models.user import User


class DLPService:
    @staticmethod
    def create_watermark(user: User, ip_address: str) -> Dict[str, str]:
        """
        Creates the watermark payload and sign-off token for the UI.
        """
        text = generate_watermark_payload(
            agent_name=user.full_name,
            employee_id=user.employee_code,
            ip_address=ip_address
        )
        token = create_access_token(
            subject=user.id,
            expires_delta=timedelta(hours=4),
            claims={"type": "watermark_auth", "emp": user.employee_code}
        )
        return {
            "watermark_text": text,
            "token": token,
            "rendered_at": datetime.now(timezone.utc).isoformat()
        }

    @staticmethod
    async def log_security_event(
        user_id: Optional[str],
        event_type: str,
        severity: str,
        ip_address: Optional[str],
        details: Optional[Dict[str, Any]],
        db: AsyncSession
    ) -> SecurityAuditLog:
        """
        Persists a security or DLP violation event to the immutable audit store.
        """
        log_entry = SecurityAuditLog(
            user_id=user_id,
            event_type=event_type,
            severity=severity,
            ip_address=ip_address,
            details_json=str(details or {})
        )
        db.add(log_entry)
        await db.commit()
        await db.refresh(log_entry)
        return log_entry

    @staticmethod
    async def request_export(
        requester: User,
        reason: str,
        records_count: int,
        db: AsyncSession
    ) -> ExportRequest:
        """
        Creates a pending export request requiring manager approval (Four-Eyes Principle).
        """
        export_req = ExportRequest(
            requester_id=requester.id,
            tenant_id=requester.tenant_id,
            status="PENDING",
            reason=reason,
            records_count=records_count,
            expires_at=datetime.now(timezone.utc) + timedelta(hours=24)
        )
        db.add(export_req)
        await db.commit()
        await db.refresh(export_req)

        # Audit log creation
        await DLPService.log_security_event(
            user_id=requester.id,
            event_type="EXPORT_REQUESTED",
            severity="MEDIUM",
            ip_address=None,
            details={"export_id": export_req.id, "reason": reason, "records": records_count},
            db=db
        )
        return export_req

    @staticmethod
    async def review_export(
        request_id: str,
        approver: User,
        approved: bool,
        db: AsyncSession
    ) -> Optional[ExportRequest]:
        """
        Manager reviews an export request. If approved, generates a single-use export token.
        """
        stmt = select(ExportRequest).where(ExportRequest.id == request_id)
        res = await db.execute(stmt)
        req = res.scalars().first()
        if not req or req.status != "PENDING":
            return None

        # Four-eyes constraint: Requester cannot self-approve
        if req.requester_id == approver.id:
            raise ValueError("Four-Eyes Policy: Cannot approve your own data export request.")

        req.approver_id = approver.id
        req.status = "APPROVED" if approved else "REJECTED"

        if approved:
            req.one_time_token_hash = secrets.token_urlsafe(32)

        await db.commit()
        await db.refresh(req)

        await DLPService.log_security_event(
            user_id=approver.id,
            event_type="EXPORT_APPROVED" if approved else "EXPORT_REJECTED",
            severity="HIGH" if approved else "LOW",
            ip_address=None,
            details={"request_id": req.id, "approved": approved, "requester": req.requester_id},
            db=db
        )
        return req
