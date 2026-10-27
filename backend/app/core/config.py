from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Enterprise Real Estate CRM & DLP Engine"
    API_V1_STR: str = "/api/v1"
    
    # Security & Auth
    SECRET_KEY: str = "change-in-production-super-secret-key-32-chars-min"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 12  # 12 hours
    
    # Meta (Facebook / Instagram) Lead Ads Webhooks
    META_APP_SECRET: str = "mock_meta_app_secret_replace_in_prod"
    META_VERIFY_TOKEN: str = "secure_verify_token_crm_2026"
    META_GRAPH_API_VERSION: str = "v20.0"
    META_SYSTEM_USER_TOKEN: str = "EAAG..."

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./crm_advanced.db"  # Defaults to async SQLite; use postgresql+asyncpg in prod
    
    # Redis & Asynchronous Workers
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # DLP & SLA Policies
    SLA_FIRST_RESPONSE_MINUTES: int = 15
    MAX_CONCURRENT_SESSIONS_PER_USER: int = 1
    MAX_IMPOSSIBLE_TRAVEL_SPEED_KMH: float = 850.0  # Commercial flight speed threshold
    GEO_TOLERANCE_METERS: float = 250.0  # Tolerance for property site check-ins
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://app.clientcrm.internal",
    ]

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="ignore")


settings = Settings()
