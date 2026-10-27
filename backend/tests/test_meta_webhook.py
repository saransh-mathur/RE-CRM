import pytest
import hmac
import hashlib
import json
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.config import settings


@pytest.mark.asyncio
async def test_meta_webhook_verification_handshake():
    """Tests Meta's initial GET verification handshake."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Valid challenge
        resp = await ac.get(
            "/api/v1/webhooks/meta",
            params={
                "hub.mode": "subscribe",
                "hub.verify_token": settings.META_VERIFY_TOKEN,
                "hub.challenge": "115820120"
            }
        )
        assert resp.status_code == 200
        assert resp.text == "115820120"

        # Invalid token rejected
        invalid_resp = await ac.get(
            "/api/v1/webhooks/meta",
            params={
                "hub.mode": "subscribe",
                "hub.verify_token": "wrong_token",
                "hub.challenge": "115820120"
            }
        )
        assert invalid_resp.status_code == 403


@pytest.mark.asyncio
async def test_simulate_meta_lead_ingestion():
    """Tests end-to-end ingestion of a Meta lead event."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.post(
            "/api/v1/webhooks/meta/simulate-test-lead",
            params={"leadgen_id": "meta_lead_test_9999"}
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "simulated"
        assert data["result"]["processed_count"] == 1
        assert data["result"]["details"][0]["status"] == "created"
        assert "lead_id" in data["result"]["details"][0]
