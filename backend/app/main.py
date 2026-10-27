import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select

from app.core.config import settings
from app.core.database import init_db, AsyncSessionLocal
from app.core.security import get_password_hash
from app.models.tenant import Tenant
from app.models.user import User
from app.models.lead import AssignmentRule
from app.models.property import Property
from app.api.v1.auth import router as auth_router
from app.api.v1.webhooks_meta import router as meta_router
from app.api.v1.leads import router as leads_router
from app.api.v1.dlp_telemetry import router as telemetry_router
from app.api.v1.export_governance import router as export_router
from app.api.v1.properties import router as properties_router
from app.seed_demo_data import seed_full_enterprise_data

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("crm_core")


async def seed_initial_demo_data():
    """Seeds rich enterprise dummy data if empty."""
    async with AsyncSessionLocal() as db:
        stmt = select(Property).limit(1)
        res = await db.execute(stmt)
        if not res.scalars().first():
            logger.info("Initializing complete enterprise demo seed...")
            await seed_full_enterprise_data()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up Enterprise Real Estate CRM Core...")
    await init_db()
    await seed_initial_demo_data()
    yield
    logger.info("Shutting down CRM Core...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Secure Real Estate CRM with Meta Lead Ads Webhook Ingestion, SLA Engine, Dynamic Canvas Watermarking & DLP",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    """Injects high-security headers to prevent framing, MIME sniffing, and clickjacking."""
    response = await call_next(request)
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    return response


# Include API Routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(meta_router, prefix=settings.API_V1_STR)
app.include_router(leads_router, prefix=settings.API_V1_STR)
app.include_router(telemetry_router, prefix=settings.API_V1_STR)
app.include_router(export_router, prefix=settings.API_V1_STR)
app.include_router(properties_router, prefix=settings.API_V1_STR)


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "database": "connected",
        "dlp_engine": "active"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
