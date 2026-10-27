import logging
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any
import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.core.security import hash_phone, mask_phone, mask_email, normalize_phone
from app.models.lead import Lead, LeadActivity
from app.schemas.meta_webhook import MetaWebhookPayload, MetaLeadValue
from app.services.lead_routing import LeadRoutingService

logger = logging.getLogger(__name__)


class MetaLeadService:
    @staticmethod
    async def process_webhook_payload(payload: MetaWebhookPayload, db: AsyncSession) -> Dict[str, Any]:
        """
        Processes an incoming Meta webhook event containing one or more leadgen entries.
        """
        results = []
        for entry in payload.entry:
            for change in entry.changes:
                if change.field == "leadgen":
                    lead_val = change.value
                    result = await MetaLeadService.ingest_single_meta_lead(lead_val, db)
                    results.append(result)
        return {"processed_count": len(results), "details": results}

    @staticmethod
    async def fetch_meta_graph_lead_data(leadgen_id: str) -> Dict[str, Any]:
        """
        Fetches full form answers from Meta Graph API using the leadgen_id.
        In test/dev environments without an active Meta access token, provides a fallback parsed object.
        """
        url = f"https://graph.facebook.com/{settings.META_GRAPH_API_VERSION}/{leadgen_id}"
        params = {"access_token": settings.META_SYSTEM_USER_TOKEN}

        # If dummy token, simulate a realistic real estate lead response
        if settings.META_SYSTEM_USER_TOKEN.startswith("EAAG..."):
            return {
                "id": leadgen_id,
                "created_time": datetime.now(timezone.utc).isoformat(),
                "field_data": [
                    {"name": "full_name", "values": ["Arun Kumar"]},
                    {"name": "phone_number", "values": ["+919876543210"]},
                    {"name": "email", "values": ["arun.kumar.investments@example.com"]},
                    {"name": "property_type", "values": ["3 BHK Luxury Apartment"]},
                    {"name": "budget", "values": ["₹1.5 Cr - ₹2.5 Cr"]},
                    {"name": "preferred_location", "values": ["Downtown Skyline"]}
                ]
            }

        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            return resp.json()

    @staticmethod
    async def ingest_single_meta_lead(lead_val: MetaLeadValue, db: AsyncSession) -> Dict[str, Any]:
        """
        Fetches, deduplicates, stores, and assigns a Meta lead.
        """
        # 1. Check if leadgen_id was already processed
        stmt = select(Lead).where(Lead.meta_leadgen_id == lead_val.leadgen_id)
        res = await db.execute(stmt)
        existing_lead = res.scalars().first()
        if existing_lead:
            return {"status": "duplicate_meta_id", "lead_id": existing_lead.id}

        # 2. Fetch data from Meta Graph API
        meta_data = await MetaLeadService.fetch_meta_graph_lead_data(lead_val.leadgen_id)
        
        # 3. Parse customer fields
        field_map: Dict[str, str] = {}
        for item in meta_data.get("field_data", []):
            vals = item.get("values", [])
            field_map[item.get("name")] = vals[0] if vals else ""

        raw_phone = field_map.get("phone_number") or field_map.get("phone") or "+919999999999"
        raw_name = field_map.get("full_name") or field_map.get("name") or "Meta Prospect"
        raw_email = field_map.get("email") or "prospect@example.com"
        prop_type = field_map.get("property_type") or "Apartment"
        location = field_map.get("preferred_location") or "Downtown"

        # 4. Deduplicate by Phone Hash (within last 7 days)
        p_hash = hash_phone(raw_phone)
        seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
        dup_stmt = select(Lead).where(
            Lead.phone_hash == p_hash,
            Lead.created_at >= seven_days_ago
        )
        dup_res = await db.execute(dup_stmt)
        phone_match = dup_res.scalars().first()

        if phone_match:
            # Register multi-touch activity instead of creating a duplicate lead
            activity = LeadActivity(
                lead_id=phone_match.id,
                activity_type="REPEAT_META_TOUCH",
                metadata_json=f'{{"form_id": "{lead_val.form_id}", "ad_id": "{lead_val.ad_id}"}}'
            )
            db.add(activity)
            await db.commit()
            return {"status": "merged_duplicate_phone", "lead_id": phone_match.id}

        # 5. Create new lead with masked PII for UI/DLP safety
        new_lead = Lead(
            meta_leadgen_id=lead_val.leadgen_id,
            meta_page_id=lead_val.page_id,
            meta_form_id=lead_val.form_id,
            meta_ad_id=lead_val.ad_id,
            source="META_LEAD_AD",
            full_name=raw_name,
            phone_raw=normalize_phone(raw_phone),
            phone_masked=mask_phone(raw_phone),
            phone_hash=p_hash,
            email=raw_email,
            email_masked=mask_email(raw_email),
            property_type=prop_type,
            preferred_location=location,
            status="NEW"
        )
        db.add(new_lead)
        await db.flush()

        # 6. Automatic Rule-based Assignment
        assigned_user = await LeadRoutingService.assign_lead(new_lead, db)
        
        # 7. Record initial activity
        init_activity = LeadActivity(
            lead_id=new_lead.id,
            activity_type="LEAD_INGESTED_META",
            metadata_json=f'{{"assigned_agent_id": "{assigned_user.id if assigned_user else None}"}}'
        )
        db.add(init_activity)
        await db.commit()
        await db.refresh(new_lead)

        return {
            "status": "created",
            "lead_id": new_lead.id,
            "assigned_agent": assigned_user.full_name if assigned_user else "Unassigned"
        }
