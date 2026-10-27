import json
import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Header, Query, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.core.database import get_db
from app.core.security import verify_meta_webhook_signature
from app.schemas.meta_webhook import MetaWebhookPayload, MetaEntry, MetaChange, MetaLeadValue
from app.services.meta_service import MetaLeadService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/webhooks/meta", tags=["Meta Lead Ads Webhooks"])


@router.get("", response_class=Response)
async def verify_meta_webhook_subscription(
    hub_mode: Optional[str] = Query(None, alias="hub.mode"),
    hub_verify_token: Optional[str] = Query(None, alias="hub.verify_token"),
    hub_challenge: Optional[str] = Query(None, alias="hub.challenge"),
):
    """
    Handles Meta's initial subscription handshake.
    Meta makes a GET request with hub.mode, hub.verify_token, and hub.challenge.
    """
    if hub_mode == "subscribe" and hub_verify_token == settings.META_VERIFY_TOKEN:
        logger.info("Meta webhook subscription verified successfully.")
        return Response(content=hub_challenge or "", media_type="text/plain", status_code=status.HTTP_200_OK)
    
    logger.warning("Meta webhook verification rejected: Invalid verify token.")
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Verification token mismatch")


@router.post("")
async def handle_meta_webhook_event(
    request: Request,
    x_hub_signature_256: Optional[str] = Header(None, alias="X-Hub-Signature-256"),
    db: AsyncSession = Depends(get_db)
):
    """
    Receives signed leadgen event notifications from Meta (Facebook and Instagram Ads).
    Validates HMAC signature and asynchronously processes incoming leads.
    """
    body_bytes = await request.body()

    # Verify cryptographic signature if secret is configured
    if settings.META_APP_SECRET and settings.META_APP_SECRET != "mock_meta_app_secret_replace_in_prod":
        is_valid = verify_meta_webhook_signature(body_bytes, x_hub_signature_256)
        if not is_valid:
            logger.error("Meta webhook signature verification failed.")
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid X-Hub-Signature-256")

    try:
        data = json.loads(body_bytes.decode("utf-8"))
        payload = MetaWebhookPayload(**data)
    except Exception as e:
        logger.error(f"Failed to parse Meta webhook payload: {e}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Malformed JSON payload")

    # Ingest and route leads
    result = await MetaLeadService.process_webhook_payload(payload, db)
    return {"status": "success", "result": result}


@router.post("/simulate-test-lead")
async def simulate_test_meta_lead(
    leadgen_id: Optional[str] = "test_leadgen_1001",
    form_id: Optional[str] = "form_luxury_villas_2026",
    page_id: Optional[str] = "page_real_estate_group",
    db: AsyncSession = Depends(get_db)
):
    """
    Simulates a Meta Lead Ads event for local testing and demonstration.
    """
    simulated_payload = MetaWebhookPayload(
        object="page",
        entry=[
            MetaEntry(
                id=page_id,
                time=1774189000,
                changes=[
                    MetaChange(
                        field="leadgen",
                        value=MetaLeadValue(
                            leadgen_id=leadgen_id,
                            form_id=form_id,
                            created_time=1774189000,
                            page_id=page_id,
                            ad_id="ad_instagram_campaign_01"
                        )
                    )
                ]
            )
        ]
    )
    result = await MetaLeadService.process_webhook_payload(simulated_payload, db)
    return {"status": "simulated", "result": result}
