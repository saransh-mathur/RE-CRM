import math
import logging
from datetime import datetime, timezone
from typing import Optional, Tuple, Dict, Any
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.models.telemetry import GPSBreadcrumb, SecurityAuditLog, DeviceFingerprint
from app.models.user import UserSession

logger = logging.getLogger(__name__)


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates the great-circle distance between two points in kilometers."""
    r = 6371.0  # Earth's radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return r * c


class AnomalyDetectionService:
    @staticmethod
    def classify_device(user_agent: str, client_is_mobile: bool = False) -> str:
        """
        Classifies incoming connection as MOBILE_APP, MOBILE_BROWSER, LAPTOP, or DESKTOP.
        """
        ua = user_agent.lower()
        if "expo" in ua or "crm-mobile" in ua:
            return "MOBILE_APP"
        if client_is_mobile or "android" in ua or "iphone" in ua or "mobile" in ua:
            return "MOBILE_BROWSER"
        if "macintosh" in ua or "windows" in ua or "linux" in ua:
            return "LAPTOP"  # Standard workstation / portable
        return "DESKTOP"

    @staticmethod
    async def evaluate_gps_movement(
        user_id: str,
        current_lat: float,
        current_lon: float,
        current_time: datetime,
        db: AsyncSession,
        ip_address: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Evaluates GPS coordinates against the user's last recorded breadcrumb.
        Detects impossible travel speed or geofence breaches.
        """
        # Fetch the most recent breadcrumb
        stmt = (
            select(GPSBreadcrumb)
            .where(GPSBreadcrumb.user_id == user_id)
            .order_by(GPSBreadcrumb.timestamp.desc())
            .limit(1)
        )
        res = await db.execute(stmt)
        last_crumb = res.scalars().first()

        if not last_crumb:
            return None

        time_delta_seconds = (current_time - last_crumb.timestamp.replace(tzinfo=timezone.utc if last_crumb.timestamp.tzinfo is None else None)).total_seconds()
        if time_delta_seconds <= 10:
            return None  # Too close in time to measure meaningful speed

        distance_km = haversine_distance_km(last_crumb.latitude, last_crumb.longitude, current_lat, current_lon)
        hours = time_delta_seconds / 3600.0
        calculated_speed_kmh = distance_km / hours if hours > 0 else 0.0

        if calculated_speed_kmh > settings.MAX_IMPOSSIBLE_TRAVEL_SPEED_KMH:
            # Trigger Critical Impossible Travel Alert
            anomaly_payload = {
                "reason": "Speed exceeds realistic human travel threshold",
                "calculated_speed_kmh": round(calculated_speed_kmh, 2),
                "distance_km": round(distance_km, 2),
                "elapsed_seconds": int(time_delta_seconds),
                "previous_coords": [last_crumb.latitude, last_crumb.longitude],
                "current_coords": [current_lat, current_lon]
            }
            audit_log = SecurityAuditLog(
                user_id=user_id,
                event_type="IMPOSSIBLE_TRAVEL",
                severity="CRITICAL",
                ip_address=ip_address,
                details_json=str(anomaly_payload)
            )
            db.add(audit_log)
            await db.commit()
            return anomaly_payload

        return None

    @staticmethod
    async def enforce_single_active_session(
        user_id: str,
        new_session_id: str,
        db: AsyncSession,
        ip_address: Optional[str] = None
    ) -> int:
        """
        Ensures strict 1-session policy.
        Terminates previous active sessions and logs a security audit event.
        """
        stmt = (
            select(UserSession)
            .where(
                UserSession.user_id == user_id,
                UserSession.id != new_session_id,
                UserSession.is_active == True
            )
        )
        res = await db.execute(stmt)
        prior_sessions = res.scalars().all()
        terminated_count = len(prior_sessions)

        if terminated_count > 0:
            for s in prior_sessions:
                s.is_active = False

            audit = SecurityAuditLog(
                user_id=user_id,
                event_type="CONCURRENT_SESSION_TERMINATED",
                severity="MEDIUM",
                ip_address=ip_address,
                details_json=f'{{"terminated_sessions_count": {terminated_count}, "new_session_id": "{new_session_id}"}}'
            )
            db.add(audit)
            await db.commit()

        return terminated_count
