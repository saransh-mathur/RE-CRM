from typing import Optional
from pydantic import BaseModel, ConfigDict


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    role: str
    full_name: str
    employee_code: str
    is_punched_in: bool


class LoginRequest(BaseModel):
    email: str
    password: str
    device_fingerprint: Optional[str] = None
    device_type: Optional[str] = "DESKTOP_BROWSER"
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    employee_code: str
    role: str
    phone: Optional[str] = None
    is_active: bool
    is_punched_in: bool
    assigned_territory: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
