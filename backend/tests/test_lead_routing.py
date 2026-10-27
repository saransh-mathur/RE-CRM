import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_lead_lifecycle_and_masked_pii():
    """Verifies that leads are returned with masked PII and SLA tracking."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Login as Admin
        login_res = await ac.post("/api/v1/auth/login", json={
            "email": "admin@apexrealty.com",
            "password": "AdminPass2026!"
        })
        assert login_res.status_code == 200
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Create a manual lead
        create_res = await ac.post(
            "/api/v1/leads",
            headers=headers,
            json={
                "full_name": "Vikramaditya Roy",
                "phone": "+919876543210",
                "email": "vikram.roy@example.com",
                "property_type": "Luxury Penthouse",
                "preferred_location": "Downtown Skyline",
                "budget_min": 25000000,
                "budget_max": 40000000,
                "notes": "Looking for sea-facing balcony."
            }
        )
        assert create_res.status_code == 200
        lead_data = create_res.json()
        assert lead_data["full_name"] == "Vikramaditya Roy"
        assert lead_data["status"] == "NEW"
        assert lead_data["is_sla_breached"] is False
        assert lead_data["sla_deadline"] is not None
        # Verify PII masking on response
        assert "*" in lead_data["phone_masked"]
        assert "10" in lead_data["phone_masked"]
        assert "*" in lead_data["email_masked"]

        lead_id = lead_data["id"]

        # 3. Trigger Click-to-Call masked bridge
        call_res = await ac.post(f"/api/v1/leads/{lead_id}/call", headers=headers)
        assert call_res.status_code == 200
        call_data = call_res.json()
        assert call_data["status"] == "DIALING"
        assert "bridge_" in call_data["call_bridge_id"]

        # 4. Check Activity timeline
        act_res = await ac.get(f"/api/v1/leads/{lead_id}/activities", headers=headers)
        assert act_res.status_code == 200
        activities = act_res.json()
        activity_types = [a["activity_type"] for a in activities]
        assert "CALL_DIALED" in activity_types
