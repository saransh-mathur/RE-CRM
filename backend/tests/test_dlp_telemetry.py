import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_dlp_watermark_and_shift_punch():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Login as Agent
        login_res = await ac.post("/api/v1/auth/login", json={
            "email": "agent.rahul@apexrealty.com",
            "password": "AgentPass2026!"
        })
        assert login_res.status_code == 200
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 1. Fetch Dynamic Watermark
        wm_res = await ac.get("/api/v1/telemetry/watermark", headers=headers)
        assert wm_res.status_code == 200
        wm_data = wm_res.json()
        assert "EXE-204" in wm_data["watermark_text"]
        assert "Rahul Verma" in wm_data["watermark_text"]
        assert "token" in wm_data

        # 2. Punch Out
        punch_out = await ac.post(
            "/api/v1/telemetry/punch",
            headers=headers,
            json={"action": "PUNCH_OUT", "latitude": 19.0760, "longitude": 72.8777}
        )
        assert punch_out.status_code == 200
        assert punch_out.json()["is_punched_in"] is False

        # 3. Punch In
        punch_in = await ac.post(
            "/api/v1/telemetry/punch",
            headers=headers,
            json={"action": "PUNCH_IN", "latitude": 19.0760, "longitude": 72.8777}
        )
        assert punch_in.status_code == 200
        assert punch_in.json()["is_punched_in"] is True


@pytest.mark.asyncio
async def test_export_governance_four_eyes():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Agent login
        agent_login = await ac.post("/api/v1/auth/login", json={
            "email": "agent.rahul@apexrealty.com",
            "password": "AgentPass2026!"
        })
        agent_token = agent_login.json()["access_token"]
        agent_headers = {"Authorization": f"Bearer {agent_token}"}

        # Admin login
        admin_login = await ac.post("/api/v1/auth/login", json={
            "email": "admin@apexrealty.com",
            "password": "AdminPass2026!"
        })
        admin_token = admin_login.json()["access_token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}

        # Agent submits export request
        req_res = await ac.post(
            "/api/v1/exports/request",
            headers=agent_headers,
            json={"reason": "Audit report for quarterly review", "records_count": 25}
        )
        assert req_res.status_code == 200
        req_data = req_res.json()
        request_id = req_data["id"]
        assert req_data["status"] == "PENDING"

        # Agent tries to self-approve (should fail due to Four-Eyes Policy)
        self_approve_res = await ac.post(
            "/api/v1/exports/review",
            headers=agent_headers,
            json={"request_id": request_id, "approved": True}
        )
        # Agent role not permitted to approve
        assert self_approve_res.status_code == 403

        # Admin reviews and approves
        admin_review_res = await ac.post(
            "/api/v1/exports/review",
            headers=admin_headers,
            json={"request_id": request_id, "approved": True}
        )
        assert admin_review_res.status_code == 200
        assert admin_review_res.json()["status"] == "APPROVED"
