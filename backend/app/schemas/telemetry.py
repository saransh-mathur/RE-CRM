from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict


class DeviceTelemetrySubmit(BaseModel):
    fingerprint_hash: str
    device_type: str = "DESKTOP_BROWSER"  # MOBILE_APP, MOBILE_BROWSER, LAPTOP, DESKTOP
    os_name: Optional[str] = None
    browser_name: Optional[str] = None
    screen_resolution: Optional[str] = None
    cpu_cores: Optional[int] = None
    is_mobile: bool = False


class GPSBreadcrumbCreate(BaseModel):
    latitude: float
    longitude: float
    accuracy: Optional[float] = None
    speed: Optional[float] = None
    geofence_tag: Optional[str] = None


class GPSBreadcrumbResponse(BaseModel):
    id: str
    user_id: str
    latitude: float
    longitude: float
    accuracy: Optional[float] = None
    speed: Optional[float] = None
    is_within_geofence: bool
    geofence_tag: Optional[str] = None
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)


class PunchClockRequest(BaseModel):
    action: str  # PUNCH_IN, PUNCH_OUT
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    device_fingerprint: Optional[str] = None


class PunchClockResponse(BaseModel):
    user_id: str
    is_punched_in: bool
    action: str
    timestamp: datetime
    message: str


class SecurityAlertEvent(BaseModel):
    event_type: str  # WATERMARK_TAMPER_ATTEMPT, DEVTOOLS_OPENED, IMPOSSIBLE_TRAVEL, UNREGISTERED_DEVICE
    severity: str = "HIGH"
    details: Optional[dict] = None


class SecurityAuditLogResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    event_type: str
    severity: str
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    details_json: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class WatermarkPayloadResponse(BaseModel):
    watermark_text: str
    token: str
    rendered_at: str


class ExportRequestCreate(BaseModel):
    reason: str
    records_count: int


class ExportRequestResponse(BaseModel):
    id: str
    requester_id: str
    approver_id: Optional[str] = None
    status: str
    reason: str
    records_count: int
    expires_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ExportApproveRequest(BaseModel):
    request_id: str
    approved: bool
