import asyncio
import json
import random
import uuid
from datetime import datetime, timezone, timedelta
from sqlalchemy import select, delete
from app.core.database import AsyncSessionLocal, engine, Base
from app.core.security import get_password_hash, hash_phone, mask_phone, mask_email, normalize_phone
from app.models.tenant import Tenant
from app.models.user import User, UserSession
from app.models.lead import Lead, LeadActivity, AssignmentRule
from app.models.property import Property
from app.models.telemetry import (
    DeviceFingerprint,
    GPSBreadcrumb,
    SecurityAuditLog,
    ExportRequest
)


async def seed_full_enterprise_data():
    print("[*] Initializing complete real estate enterprise demo dataset...")

    # Drop and recreate all tables for a clean slate
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        # 1. Enterprise Real Estate Tenant
        tenant = Tenant(
            name="Apex Sovereign Real Estate & Capital Group",
            domain="apexsovereign.com",
            security_policies=json.dumps({
                "watermark_canvas_enabled": True,
                "four_eyes_export": True,
                "anti_poaching_ai_enabled": True,
                "sla_minutes": 15
            })
        )
        db.add(tenant)
        await db.flush()

        # 2. Users (Owner, Director, and Field Executives)
        now = datetime.now(timezone.utc)
        users_data = [
            # The Owner / Dealer (Top-Level Authority)
            {
                "email": "owner@apexrealty.com",
                "full_name": "Vikramaditya Singhania",
                "employee_code": "OWNER-01",
                "role": "OWNER",
                "phone": "+919800011111",
                "assigned_territory": "All Strategic Markets",
                "is_punched_in": True,
                "password": "OwnerPass2026!"
            },
            # Sales Director
            {
                "email": "admin@apexrealty.com",
                "full_name": "Sarah Jenkins",
                "employee_code": "DIR-100",
                "role": "ADMIN",
                "phone": "+919811100000",
                "assigned_territory": "Headquarters Operations",
                "is_punched_in": True,
                "password": "AdminPass2026!"
            },
            # Sales Manager
            {
                "email": "manager@apexrealty.com",
                "full_name": "Priya Sharma",
                "employee_code": "MGR-102",
                "role": "MANAGER",
                "phone": "+919811122334",
                "assigned_territory": "Central Metropolitan Hub",
                "is_punched_in": True,
                "password": "ManagerPass2026!"
            },
            # Executive 1 (Downtown Luxury)
            {
                "email": "agent.rahul@apexrealty.com",
                "full_name": "Rahul Verma",
                "employee_code": "EXE-204",
                "role": "AGENT",
                "phone": "+919822200000",
                "assigned_territory": "Downtown Skyline",
                "is_punched_in": True,
                "password": "AgentPass2026!"
            },
            # Executive 2 (Palm Grove Luxury Villas - Suspected of offline closing!)
            {
                "email": "agent.ananya@apexrealty.com",
                "full_name": "Ananya Patel",
                "employee_code": "EXE-208",
                "role": "AGENT",
                "phone": "+919833344455",
                "assigned_territory": "Palm Grove Estates",
                "is_punched_in": True,
                "password": "AgentPass2026!"
            },
            # Executive 3 (Marina Bay & Commercial)
            {
                "email": "agent.vikram@apexrealty.com",
                "full_name": "Vikram Malhotra",
                "employee_code": "EXE-215",
                "role": "AGENT",
                "phone": "+919844455566",
                "assigned_territory": "Marina Bay Promenade",
                "is_punched_in": True,
                "password": "AgentPass2026!"
            },
            # Executive 4 (Ultra-Luxury Penthouse Consultant - Bandra West & Worli)
            {
                "email": "agent.karan@apexrealty.com",
                "full_name": "Karan Mehta",
                "employee_code": "EXE-210",
                "role": "AGENT",
                "phone": "+919822277889",
                "assigned_territory": "Bandra West & Worli Promenade",
                "is_punched_in": True,
                "password": "AgentPass2026!"
            },
            # Executive 5 (Junior Executive / Shift Ended)
            {
                "email": "agent.rohit@apexrealty.com",
                "full_name": "Rohit Sen",
                "employee_code": "EXE-220",
                "role": "AGENT",
                "phone": "+919855566677",
                "assigned_territory": "Green Valley Hills",
                "is_punched_in": False,  # Off duty
                "password": "AgentPass2026!"
            }
        ]

        user_objects = {}
        for ud in users_data:
            u = User(
                tenant_id=tenant.id,
                email=ud["email"],
                hashed_password=get_password_hash(ud["password"]),
                full_name=ud["full_name"],
                employee_code=ud["employee_code"],
                role=ud["role"],
                phone=ud["phone"],
                assigned_territory=ud["assigned_territory"],
                is_active=True,
                is_punched_in=ud["is_punched_in"],
                last_punch_time=now - timedelta(hours=4) if ud["is_punched_in"] else now - timedelta(hours=14)
            )
            db.add(u)
            user_objects[ud["email"]] = u

        await db.flush()

        # 3. Active Sessions & Device Environment Tracking (Laptop vs Mobile Phone)
        sessions_data = [
            ("owner@apexrealty.com", "LAPTOP", "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/537.36", "14.139.10.1", "MacBook Pro 16 M3 Max"),
            ("admin@apexrealty.com", "LAPTOP", "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4) AppleWebKit/537.36", "14.139.12.8", "MacBook Air 15 M2"),
            ("manager@apexrealty.com", "LAPTOP", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0", "14.139.12.15", "Lenovo ThinkPad X1 Carbon"),
            ("agent.rahul@apexrealty.com", "LAPTOP", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/125.0", "103.21.144.10", "Dell XPS 15 (Windows 11)"),
            ("agent.ananya@apexrealty.com", "MOBILE_PHONE", "Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X) Mobile CRM/2.1", "157.34.192.44", "Apple iPhone 15 Pro"),
            ("agent.vikram@apexrealty.com", "MOBILE_PHONE", "Mozilla/5.0 (Linux; Android 14; SM-S928B) Mobile CRM/2.1", "157.34.192.89", "Samsung Galaxy S24 Ultra"),
            ("agent.karan@apexrealty.com", "LAPTOP", "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_6) AppleWebKit/537.36", "103.21.144.55", "MacBook Pro 14 M3"),
            ("agent.rohit@apexrealty.com", "MOBILE_PHONE", "Mozilla/5.0 (Linux; Android 14) Mobile CRM/2.1", "157.34.192.12", "OnePlus 12 (Shift Concluded)")
        ]

        for email, dev_type, ua, ip, model in sessions_data:
            usr = user_objects[email]
            sess = UserSession(
                user_id=usr.id,
                session_token_hash=f"hash_{uuid.uuid4().hex[:20]}",
                device_type=dev_type,
                ip_address=ip,
                user_agent=ua,
                is_active=True,
                punched_in_at=now - timedelta(hours=4) if usr.is_punched_in else now - timedelta(hours=14),
                last_heartbeat=now - timedelta(minutes=1)
            )
            db.add(sess)

            dfp = DeviceFingerprint(
                user_id=usr.id,
                fingerprint_hash=f"fp_{uuid.uuid4().hex[:16]}",
                device_type=dev_type,
                os_name="iOS" if "iPhone" in ua else ("Android" if "Android" in ua else ("macOS" if "Macintosh" in ua else "Windows 11")),
                browser_name="Mobile Safari" if "iPhone" in ua else ("Mobile Chrome" if "Android" in ua else "Chrome Enterprise"),
                screen_resolution="1179x2556" if "iPhone" in ua else ("1440x3120" if "Android" in ua else "1920x1080"),
                cpu_cores=8 if "LAPTOP" in dev_type else 6,
                is_trusted=True
            )
            db.add(dfp)

        # 4. GPS Breadcrumbs (Field Location Verification & Unlogged Site Inspection Tracking)
        gps_points = [
            # Ananya: Unlogged Visits Evidence (Key Pain Point for Owner!)
            ("agent.ananya@apexrealty.com", 19.1136, 72.8697, "Palm Grove Signature Villa 12 - Site Inspection (UNLOGGED IN CRM!)", now - timedelta(minutes=18)),
            ("agent.ananya@apexrealty.com", 19.1136, 72.8697, "Palm Grove Signature Villa 12 - Afternoon Meet (UNLOGGED IN CRM!)", now - timedelta(hours=2, minutes=45)),
            ("agent.ananya@apexrealty.com", 19.1142, 72.8710, "Palm Grove Estates Clubhouse Coffee Lounge", now - timedelta(hours=4, minutes=10)),
            ("agent.ananya@apexrealty.com", 19.1136, 72.8697, "Palm Grove Signature Villa 12 - Morning Inspection (UNLOGGED IN CRM!)", now - timedelta(hours=6, minutes=30)),
            # Vikram: Compliant Commercial Site Inspections
            ("agent.vikram@apexrealty.com", 18.9220, 72.8347, "Marina Azure Corporate Lounge - Client Meeting", now - timedelta(minutes=25)),
            ("agent.vikram@apexrealty.com", 18.9288, 72.8320, "CBD Commercial Tower Level 14 Site Inspection", now - timedelta(hours=3, minutes=10)),
            # Rahul: Downtown Skyline Office & Show Flat
            ("agent.rahul@apexrealty.com", 19.0760, 72.8777, "Downtown Skyline Branch Office", now - timedelta(minutes=12)),
            ("agent.rahul@apexrealty.com", 19.0782, 72.8791, "The Grand Crest Sky Villa 401 Show Flat", now - timedelta(hours=2, minutes=20)),
            # Karan Mehta: Bandra West Sea Face & Worli High-End Advisory
            ("agent.karan@apexrealty.com", 19.0544, 72.8266, "Bandra West Sea Face Office - High-Net-Worth Advisory", now - timedelta(minutes=30)),
            ("agent.karan@apexrealty.com", 19.0178, 72.8182, "Worli Penthouse Site Presentation", now - timedelta(hours=3, minutes=40)),
            # Rohit Sen: Shift Ended, Off-Duty
            ("agent.rohit@apexrealty.com", 19.1670, 72.9340, "Green Valley Hills - Home Base (Shift Ended)", now - timedelta(hours=5))
        ]

        for email, lat, lon, tag, ts in gps_points:
            usr = user_objects[email]
            db.add(GPSBreadcrumb(
                user_id=usr.id,
                latitude=lat,
                longitude=lon,
                accuracy=5.5,
                speed=0.0,
                is_within_geofence=True,
                geofence_tag=tag,
                timestamp=ts
            ))

        # 5. Property Catalog (8 Prime Real Estate Assets)
        properties_list = [
            {
                "title": "The Grand Crest - Sky Villa 401",
                "project_name": "The Grand Crest",
                "property_type": "4 BHK Sky Villa",
                "location": "Downtown Skyline, Sector 42",
                "price": 48500000.0,
                "price_formatted": "₹4.85 Cr",
                "carpet_area_sqft": 3850,
                "bedrooms": 4,
                "bathrooms": 5,
                "status": "AVAILABLE",
                "amenities": json.dumps(["Private Plunge Pool", "Panoramic City Views", "3 Dedicated Parking", "Concierge Service", "Smart Home Automation"]),
                "image_url": "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
                "featured": True
            },
            {
                "title": "Palm Serenade - Signature Villa 12",
                "project_name": "Palm Serenade Enclave",
                "property_type": "5 BHK Independent Villa",
                "location": "Palm Grove Estates",
                "price": 72500000.0,
                "price_formatted": "₹7.25 Cr",
                "carpet_area_sqft": 5400,
                "bedrooms": 5,
                "bathrooms": 6,
                "status": "AVAILABLE",
                "amenities": json.dumps(["Private Landscaped Garden", "Italian Statuario Marble", "Private Home Cinema", "Golf Course Access", "Solar Microgrid"]),
                "image_url": "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80",
                "featured": True
            },
            {
                "title": "Marina Azure - Sea Facing Residence 18B",
                "project_name": "Marina Azure Towers",
                "property_type": "3 BHK Luxury Apartment",
                "location": "Marina Bay Promenade",
                "price": 31000000.0,
                "price_formatted": "₹3.10 Cr",
                "carpet_area_sqft": 2150,
                "bedrooms": 3,
                "bathrooms": 3,
                "status": "UNDER_OFFER",
                "amenities": json.dumps(["Unobstructed Sea Views", "Olympic Infinity Pool", "Private Yacht Mooring Club", "Sky Spa"]),
                "image_url": "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80",
                "featured": True
            },
            {
                "title": "Apex One Corporate Tower - Level 14",
                "project_name": "Apex One Financial Center",
                "property_type": "Grade-A Commercial Office",
                "location": "Central Business District (CBD)",
                "price": 89000000.0,
                "price_formatted": "₹8.90 Cr",
                "carpet_area_sqft": 6800,
                "bedrooms": 0,
                "bathrooms": 4,
                "status": "AVAILABLE",
                "amenities": json.dumps(["LEED Platinum Rated", "Dual 10G Fiber", "100% DG Power Backup", "Dedicated Executive Elevator", "24/7 Security"]),
                "image_url": "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80",
                "featured": True
            },
            {
                "title": "The Lumina Heights - Duplex Penthouse 28",
                "project_name": "The Lumina Heights",
                "property_type": "4 BHK Duplex Penthouse",
                "location": "Downtown Skyline",
                "price": 56000000.0,
                "price_formatted": "₹5.60 Cr",
                "carpet_area_sqft": 4200,
                "bedrooms": 4,
                "bathrooms": 5,
                "status": "AVAILABLE",
                "amenities": json.dumps(["Double Height Living Room", "Terrace Jacuzzi", "Private Elevator Access", "Designer Poggenpohl Kitchen"]),
                "image_url": "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80",
                "featured": False
            },
            {
                "title": "Green Valley Sanctuary - Eco Villa 07",
                "project_name": "Green Valley Sanctuary",
                "property_type": "3 BHK Forest Villa",
                "location": "Green Valley Hills",
                "price": 24500000.0,
                "price_formatted": "₹2.45 Cr",
                "carpet_area_sqft": 2600,
                "bedrooms": 3,
                "bathrooms": 3,
                "status": "SOLD",
                "amenities": json.dumps(["Forest Canopy View", "Organic Farm Allotment", "Rainwater Harvesting", "Nature Trail Access"]),
                "image_url": "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80",
                "featured": False
            },
            {
                "title": "The Boulevard Retail Arcade - Unit G-04",
                "project_name": "The Boulevard Promenade",
                "property_type": "High-Street Retail Store",
                "location": "Downtown Skyline Commercial Hub",
                "price": 37500000.0,
                "price_formatted": "₹3.75 Cr",
                "carpet_area_sqft": 1450,
                "bedrooms": 0,
                "bathrooms": 2,
                "status": "AVAILABLE",
                "amenities": json.dumps(["Triple Height Glass Façade", "Heavy Footfall Plaza", "Dedicated F&B Kitchen Exhaust Shaft", "Direct Valet Drop-off"]),
                "image_url": "https://images.unsplash.com/photo-1555636222-cae831e670b3?w=800&q=80",
                "featured": False
            },
            {
                "title": "Elysium Grand - Presidential Suite 32A",
                "project_name": "Elysium Grand",
                "property_type": "4 BHK Ultra-Luxury Apartment",
                "location": "Marina Bay Promenade",
                "price": 64000000.0,
                "price_formatted": "₹6.40 Cr",
                "carpet_area_sqft": 4100,
                "bedrooms": 4,
                "bathrooms": 5,
                "status": "AVAILABLE",
                "amenities": json.dumps(["Private Elevator Foyer", "Master Suite Walk-in Wardrobe", "24/7 White Glove Butler", "Helipad Access"]),
                "image_url": "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80",
                "featured": True
            }
        ]

        for p_data in properties_list:
            prop = Property(
                tenant_id=tenant.id,
                title=p_data["title"],
                project_name=p_data["project_name"],
                property_type=p_data["property_type"],
                location=p_data["location"],
                price=p_data["price"],
                price_formatted=p_data["price_formatted"],
                carpet_area_sqft=p_data["carpet_area_sqft"],
                bedrooms=p_data["bedrooms"],
                bathrooms=p_data["bathrooms"],
                status=p_data["status"],
                amenities=p_data["amenities"],
                image_url=p_data["image_url"],
                featured=p_data["featured"]
            )
            db.add(prop)

        # 6. Customer Leads with Explicit Anti-Brokerage Theft Data & Scenarios
        leads_data = [
            # SCENARIO 1: SUSPECTED OFFLINE CLOSING / BROKERAGE THEFT (High-Ticket Villa)
            {
                "full_name": "Kavita Chawla",
                "phone": "+919819003311",
                "email": "kavita.chawla@zenithcorp.org",
                "property_type": "5 BHK Independent Villa",
                "location": "Palm Grove Estates",
                "budget_min": 70000000.0,
                "budget_max": 75000000.0,
                "source": "META_IG_STORY",
                "status": "LOST",  # Agent marked it LOST, but visited site 3 times!
                "created_delta_mins": 2880,
                "assigned_email": "agent.ananya@apexrealty.com",
                "is_sla_breached": True,
                "meta_leadgen_id": "meta_lead_1002",
                "notes": "Agent marked 'Lost - Client not responding'. CRITICAL: Geofence logs prove agent met client 3 times at Palm Grove Villa 12!",
                "estimated_brokerage": 1450000.0,  # 2% of ₹7.25 Cr = ₹14.5 Lakhs
                "poaching_risk_score": "CRITICAL",
                "poaching_risk_reason": "Marked 'LOST' by agent Ananya, but agent GPS breadcrumbs prove 3 unlogged site visits. Suspected offline closing to steal ₹14.5 Lakhs brokerage!",
                "offline_closing_flag": True
            },
            # SCENARIO 2: HOARDING & OFFLINE CALLING VIA PERSONAL PHONE
            {
                "full_name": "Aditya Singhania",
                "phone": "+919820114422",
                "email": "aditya.singhania@indocap.com",
                "property_type": "4 BHK Sky Villa",
                "location": "Downtown Skyline",
                "budget_min": 45000000.0,
                "budget_max": 50000000.0,
                "source": "META_FB_AD",
                "status": "NEW",
                "created_delta_mins": 14,
                "assigned_email": "agent.rahul@apexrealty.com",
                "is_sla_breached": False,
                "meta_leadgen_id": "meta_lead_1001",
                "notes": "High-intent lead. Agent viewed phone details 6 times in 2 hours, but has 0 seconds talk-time on CRM bridge.",
                "estimated_brokerage": 970000.0,  # 2% = ₹9.7 Lakhs
                "poaching_risk_score": "HIGH",
                "poaching_risk_reason": "Customer contact viewed 6 times without using CRM Masked Call bridge. Suspected direct personal calling.",
                "offline_closing_flag": False
            },
            # SCENARIO 3: HIGH-VALUE COMMERCIAL DEAL IN ACTIVE HEALTHY NEGOTIATION
            {
                "full_name": "Rajesh Agarwal",
                "phone": "+919920448811",
                "email": "rajesh.agarwal@agarwallogistics.com",
                "property_type": "Grade-A Commercial Office",
                "location": "Central Business District (CBD)",
                "budget_min": 85000000.0,
                "budget_max": 95000000.0,
                "source": "META_FB_AD",
                "status": "NEGOTIATION",
                "created_delta_mins": 1440,
                "assigned_email": "agent.vikram@apexrealty.com",
                "is_sla_breached": False,
                "meta_leadgen_id": "meta_lead_1013",
                "notes": "Term sheet issued for Level 14 Apex One. Legal team reviewing indemnity covenants.",
                "estimated_brokerage": 1780000.0,  # 2% of ₹8.9 Cr = ₹17.8 Lakhs
                "poaching_risk_score": "LOW",
                "poaching_risk_reason": "Fully compliant CRM bridge calls logged (22 mins talk time).",
                "offline_closing_flag": False
            },
            # SCENARIO 4: SLA BREACH INCOMING META LEAD (ESCALATION)
            {
                "full_name": "Pooja Hegde",
                "phone": "+919880112244",
                "email": "pooja.hegde@creativestudio.in",
                "property_type": "3 BHK Luxury Apartment",
                "location": "Marina Bay Promenade",
                "budget_min": 30000000.0,
                "budget_max": 34000000.0,
                "source": "META_IG_REEL",
                "status": "NEW",
                "created_delta_mins": 22,
                "assigned_email": "agent.vikram@apexrealty.com",
                "is_sla_breached": True,
                "meta_leadgen_id": "meta_lead_1004",
                "notes": "SLA EXPIRED! 22 minutes elapsed without agent first contact. System alert triggered to Sales Director.",
                "estimated_brokerage": 620000.0,
                "poaching_risk_score": "MEDIUM",
                "poaching_risk_reason": "SLA breached. Lead subject to auto-reassignment.",
                "offline_closing_flag": False
            },
            # SCENARIO 5: WON DEAL CLOSED WITH COMPANY BROKERAGE SECURED
            {
                "full_name": "Sunita Kapoor",
                "phone": "+919811229944",
                "email": "sunita.kapoor@kapoorcapital.com",
                "property_type": "4 BHK Duplex Penthouse",
                "location": "Downtown Skyline",
                "budget_min": 55000000.0,
                "budget_max": 60000000.0,
                "source": "META_IG_REEL",
                "status": "WON",
                "created_delta_mins": 2880,
                "assigned_email": "agent.rahul@apexrealty.com",
                "is_sla_breached": False,
                "meta_leadgen_id": "meta_lead_1015",
                "notes": "DEAL CLOSED! ₹5.60 Cr Lumina Heights Penthouse 28. Agency commission of ₹11.2 Lakhs successfully deposited.",
                "estimated_brokerage": 1120000.0,
                "poaching_risk_score": "LOW",
                "poaching_risk_reason": "Commission verified and credited to agency account.",
                "offline_closing_flag": False
            },
            # SCENARIO 6: WON DEAL
            {
                "full_name": "Tarun Oberoi",
                "phone": "+919920113355",
                "email": "tarun.oberoi@oberoifoods.com",
                "property_type": "4 BHK Duplex Penthouse",
                "location": "Downtown Skyline",
                "budget_min": 50000000.0,
                "budget_max": 58000000.0,
                "source": "WEBSITE_DIRECT",
                "status": "WON",
                "created_delta_mins": 3600,
                "assigned_email": "agent.rahul@apexrealty.com",
                "is_sla_breached": False,
                "notes": "Deal closed. Loan disbursed by HDFC. Brokerage ₹10 Lakhs paid.",
                "estimated_brokerage": 1000000.0,
                "poaching_risk_score": "LOW",
                "poaching_risk_reason": "Compliant deal execution.",
                "offline_closing_flag": False
            },
            # SCENARIO 7: NRI HIGH NET WORTH CLIENT
            {
                "full_name": "Naveen Mittal (Dubai NRI)",
                "phone": "+971501234567",
                "email": "naveen.mittal@emiratesinvest.ae",
                "property_type": "5 BHK Independent Villa",
                "location": "Palm Grove Estates",
                "budget_min": 70000000.0,
                "budget_max": 85000000.0,
                "source": "META_IG_CAROUSEL",
                "status": "CONTACTED",
                "created_delta_mins": 240,
                "assigned_email": "agent.ananya@apexrealty.com",
                "is_sla_breached": False,
                "meta_leadgen_id": "meta_lead_1006",
                "notes": "NRI client arriving Mumbai on 28th. Watch closely: High commission potential (₹15 Lakhs).",
                "estimated_brokerage": 1500000.0,
                "poaching_risk_score": "HIGH",
                "poaching_risk_reason": "Executive requested unmasked phone; monitor for personal side-channel contact.",
                "offline_closing_flag": False
            },
            # SCENARIO 8: SITE VISIT SCHEDULED
            {
                "full_name": "Meera Nambiar",
                "phone": "+919744118833",
                "email": "meera.nambiar@globaltech.com",
                "property_type": "3 BHK Luxury Apartment",
                "location": "Downtown Skyline",
                "budget_min": 24000000.0,
                "budget_max": 30000000.0,
                "source": "WEBSITE_DIRECT",
                "status": "SITE_VISIT_SCHEDULED",
                "created_delta_mins": 720,
                "assigned_email": "agent.rahul@apexrealty.com",
                "is_sla_breached": False,
                "notes": "Site visit scheduled for Saturday 3:30 PM with escort.",
                "estimated_brokerage": 550000.0,
                "poaching_risk_score": "LOW",
                "poaching_risk_reason": "Pre-booked appointment with client confirmation.",
                "offline_closing_flag": False
            },
            # SCENARIO 9: HIGH-STREET RETAIL NEGOTIATION
            {
                "full_name": "Zubair Khan",
                "phone": "+919820771122",
                "email": "zubair.khan@khanenterprises.ae",
                "property_type": "High-Street Retail Store",
                "location": "Downtown Skyline Commercial Hub",
                "budget_min": 35000000.0,
                "budget_max": 40000000.0,
                "source": "WEBSITE_DIRECT",
                "status": "NEGOTIATION",
                "created_delta_mins": 1800,
                "assigned_email": "agent.vikram@apexrealty.com",
                "is_sla_breached": False,
                "notes": "Retail unit G-04 lease guarantee in progress.",
                "estimated_brokerage": 750000.0,
                "poaching_risk_score": "LOW",
                "poaching_risk_reason": "Direct builder tie-up.",
                "offline_closing_flag": False
            },
            # SCENARIO 10: FRESH INGESTED LEAD
            {
                "full_name": "Harish Bhatt",
                "phone": "+919870119933",
                "email": "harish.bhatt@bhattconsulting.com",
                "property_type": "4 BHK Ultra-Luxury Apartment",
                "location": "Marina Bay Promenade",
                "budget_min": 60000000.0,
                "budget_max": 70000000.0,
                "source": "META_FB_AD",
                "status": "NEW",
                "created_delta_mins": 4,
                "assigned_email": "agent.vikram@apexrealty.com",
                "is_sla_breached": False,
                "meta_leadgen_id": "meta_lead_1003",
                "notes": "Lead arrived via Facebook Ad. SLA timer active: 11 mins remaining.",
                "estimated_brokerage": 1280000.0,
                "poaching_risk_score": "LOW",
                "poaching_risk_reason": "Fresh inquiry.",
                "offline_closing_flag": False
            },
            # SCENARIO 11: SITE VISIT
            {
                "full_name": "Amitabh Roy",
                "phone": "+919830007788",
                "email": "amitabh.roy@royholdings.in",
                "property_type": "5 BHK Independent Villa",
                "location": "Palm Grove Estates",
                "budget_min": 75000000.0,
                "budget_max": 85000000.0,
                "source": "META_IG_STORY",
                "status": "SITE_VISIT_SCHEDULED",
                "created_delta_mins": 900,
                "assigned_email": "agent.ananya@apexrealty.com",
                "is_sla_breached": False,
                "meta_leadgen_id": "meta_lead_1011",
                "notes": "Site inspection confirmed for Friday 11 AM.",
                "estimated_brokerage": 1600000.0,
                "poaching_risk_score": "MEDIUM",
                "poaching_risk_reason": "High-ticket villa; assign dual-executive escort to prevent off-the-books closing.",
                "offline_closing_flag": False
            },
            # SCENARIO 12: CONTACTED
            {
                "full_name": "Dr. Farhan Merchant",
                "phone": "+919833557799",
                "email": "dr.farhan.merchant@apolloheart.org",
                "property_type": "3 BHK Luxury Apartment",
                "location": "Marina Bay Promenade",
                "budget_min": 30000000.0,
                "budget_max": 35000000.0,
                "source": "META_FB_AD",
                "status": "CONTACTED",
                "created_delta_mins": 180,
                "assigned_email": "agent.vikram@apexrealty.com",
                "is_sla_breached": False,
                "meta_leadgen_id": "meta_lead_1005",
                "notes": "Call bridge dialed. Customer requested floor plans for tower B.",
                "estimated_brokerage": 620000.0,
                "poaching_risk_score": "LOW",
                "poaching_risk_reason": "Clean interaction on CRM bridge.",
                "offline_closing_flag": False
            },
            # SCENARIO 13: ULTRA LUXURY PENTHOUSE (Assigned to Karan Mehta)
            {
                "full_name": "Devendra Singhania",
                "phone": "+919820088112",
                "email": "devendra.singhania@singhaniainvest.com",
                "property_type": "4 BHK Duplex Penthouse",
                "location": "Bandra West & Worli Promenade",
                "budget_min": 65000000.0,
                "budget_max": 75000000.0,
                "source": "META_IG_STORY",
                "status": "NEGOTIATION",
                "created_delta_mins": 420,
                "assigned_email": "agent.karan@apexrealty.com",
                "is_sla_breached": False,
                "meta_leadgen_id": "meta_lead_1020",
                "notes": "High-ticket penthouse negotiation. Customer meeting at Bandra Sea Face Office completed.",
                "estimated_brokerage": 1400000.0,  # ₹14 Lakhs brokerage
                "poaching_risk_score": "LOW",
                "poaching_risk_reason": "Executive followed full compliance protocol with masked call logs.",
                "offline_closing_flag": False
            },
            # SCENARIO 14: WORLI SEA FACE DUPLEX (Assigned to Karan Mehta)
            {
                "full_name": "Alok Piramal",
                "phone": "+919819977221",
                "email": "alok.piramal@piramalholdings.com",
                "property_type": "5 BHK Independent Villa",
                "location": "Bandra West & Worli Promenade",
                "budget_min": 80000000.0,
                "budget_max": 90000000.0,
                "source": "META_FB_AD",
                "status": "SITE_VISIT_SCHEDULED",
                "created_delta_mins": 120,
                "assigned_email": "agent.karan@apexrealty.com",
                "is_sla_breached": False,
                "meta_leadgen_id": "meta_lead_1021",
                "notes": "Site inspection booked for Worli Sky Villa. Masked call recorded.",
                "estimated_brokerage": 1700000.0,  # ₹17 Lakhs brokerage
                "poaching_risk_score": "LOW",
                "poaching_risk_reason": "Pre-booked site visit with buyer confirmation.",
                "offline_closing_flag": False
            },
            # SCENARIO 15: GREEN VALLEY ENCLAVE (Assigned to Rohit Sen)
            {
                "full_name": "Gaurav Malhotra",
                "phone": "+919821155443",
                "email": "gaurav.malhotra@techzen.io",
                "property_type": "3 BHK Luxury Apartment",
                "location": "Green Valley Hills",
                "budget_min": 20000000.0,
                "budget_max": 25000000.0,
                "source": "WEBSITE_DIRECT",
                "status": "NEW",
                "created_delta_mins": 360,
                "assigned_email": "agent.rohit@apexrealty.com",
                "is_sla_breached": False,
                "notes": "Assigned before shift concluded. Follow-up queued for tomorrow 9 AM.",
                "estimated_brokerage": 450000.0,
                "poaching_risk_score": "LOW",
                "poaching_risk_reason": "Shift ended. Routing paused safely.",
                "offline_closing_flag": False
            }
        ]

        # Procedurally generate 985 additional leads to reach exactly 1,000 cases
        random.seed(101)  # deterministic seed

        first_names = [
            "Aarav", "Rohan", "Priya", "Vikram", "Ananya", "Rajesh", "Sunita", "Kabir", "Meera", "Arjun",
            "Pooja", "Aditya", "Sneha", "Neha", "Siddharth", "Deepak", "Alok", "Sanjay", "Kavita", "Tarun",
            "Suresh", "Harish", "Divya", "Manoj", "Ritu", "Sameer", "Amit", "Varun", "Gaurav", "Kunal",
            "Naveen", "Ishaan", "Rhea", "Tanvi", "Akash", "Bhavna", "Nikhil", "Simran", "Rakesh", "Preeti",
            "Manish", "Shweta", "Anil", "Geeta", "Sunil", "Payal", "Vivek", "Pallavi", "Mohit", "Anjali",
            "Kiran", "Ashok", "Shalini", "Kartik", "Shilpa", "Pradeep", "Rashmi", "Vijay", "Asha", "Hemant"
        ]
        last_names = [
            "Sharma", "Singhania", "Patel", "Malhotra", "Mehta", "Verma", "Kapoor", "Bhatt", "Agarwal", "Gupta",
            "Sen", "Nair", "Nambiar", "Reddy", "Joshi", "Deshmukh", "Rao", "Kulkarni", "Choudhury", "Mukherjee",
            "Roy", "Chawla", "Bansal", "Piramal", "Goenka", "Mittal", "Khanna", "Bhasin", "Trivedi", "Iyer",
            "Chatterjee", "Bose", "Menon", "Pillai", "Shetty", "Pujari", "Gokhale", "Bhide", "Kapadia", "Zaveri"
        ]
        property_tiers = [
            ("2 BHK Luxury Residence", 14000000.0, 19000000.0, "Green Valley Hills"),
            ("3 BHK Luxury Apartment", 24000000.0, 36000000.0, "Downtown Skyline"),
            ("3 BHK Premium Sea-View", 32000000.0, 45000000.0, "Marina Bay Promenade"),
            ("4 BHK Sky Villa", 48000000.0, 68000000.0, "Downtown Skyline"),
            ("4 BHK Duplex Penthouse", 65000000.0, 95000000.0, "Bandra West & Worli Promenade"),
            ("5 BHK Independent Villa", 75000000.0, 140000000.0, "Palm Grove Estates"),
            ("Grade-A Commercial Office", 85000000.0, 190000000.0, "Central Business District (CBD)"),
            ("Sea-Facing Penthouse Suite", 120000000.0, 260000000.0, "Bandra West & Worli Promenade")
        ]
        sources_list = [
            ("META_FB_AD", 40),
            ("META_IG_STORY", 25),
            ("META_IG_REEL", 15),
            ("META_IG_CAROUSEL", 10),
            ("WEBSITE_DIRECT", 10)
        ]
        source_pool = [s[0] for s in sources_list for _ in range(s[1])]

        exec_pool = [
            "agent.rahul@apexrealty.com",
            "agent.ananya@apexrealty.com",
            "agent.vikram@apexrealty.com",
            "agent.karan@apexrealty.com",
            "agent.rohit@apexrealty.com",
            None
        ]
        exec_weights = [22, 22, 22, 20, 8, 6]

        statuses_pool = ["NEW", "CONTACTED", "SITE_VISIT_SCHEDULED", "NEGOTIATION", "WON", "LOST"]
        status_weights = [25, 30, 20, 15, 6, 4]

        theft_reasons_critical = [
            "Marked as 'LOST' by executive, but GPS logs confirm 3 unlogged physical visits to project villa.",
            "Agent visited property site 4 times off-the-books without logging CRM showing appointment.",
            "Lead marked inactive; builder security register recorded agent escorting client privately.",
            "Marked unreachable, but agent device GPS was within 10 meters of client address for 45 mins.",
            "Attempted offline closing to bypass agency agreement and pocket brokerage."
        ]

        theft_reasons_high = [
            "Customer masked phone viewed 7 times in 2 hours with 0 bridge calls logged. Suspected direct personal calling.",
            "Executive requested unmasked PII export right before marking lead stale. Suspected side-channel deal.",
            "Direct personal phone dialing suspected; agent device disconnected from company CRM bridge.",
            "Lead contact viewed repeatedly outside working hours from personal IP."
        ]

        for i in range(16, 1001):
            fname = random.choice(first_names)
            lname = random.choice(last_names)
            full_name = f"{fname} {lname}"
            p_prop, p_min, p_max, p_loc = random.choice(property_tiers)
            source = random.choice(source_pool)
            status = random.choices(statuses_pool, weights=status_weights)[0]
            assigned_email = random.choices(exec_pool, weights=exec_weights)[0]
            delta_mins = random.randint(10, 1440 * 14)  # within past 14 days
            
            # Theft cases distribution: ~32 critical, ~38 high, ~75 medium
            is_critical_theft = (i % 31 == 0) and assigned_email is not None
            is_high_risk = (not is_critical_theft) and (i % 26 == 0) and assigned_email is not None
            is_medium_risk = (not is_critical_theft) and (not is_high_risk) and (i % 13 == 0)

            if is_critical_theft:
                poaching_risk_score = "CRITICAL"
                poaching_risk_reason = random.choice(theft_reasons_critical)
                offline_closing_flag = True
                status = "LOST"
            elif is_high_risk:
                poaching_risk_score = "HIGH"
                poaching_risk_reason = random.choice(theft_reasons_high)
                offline_closing_flag = False
            elif is_medium_risk:
                poaching_risk_score = "MEDIUM"
                poaching_risk_reason = "SLA response time exceeded standard 15-minute window."
                offline_closing_flag = False
            else:
                poaching_risk_score = "LOW"
                poaching_risk_reason = None
                offline_closing_flag = False

            brokerage = round(p_max * 0.02)
            phone_num = f"+9198{random.randint(10000000, 99999999)}"
            email_addr = f"{fname.lower()}.{lname.lower()}{random.randint(1, 99)}@example.com"
            sla_breached = (delta_mins > 15 and status == "NEW")

            leads_data.append({
                "full_name": full_name,
                "phone": phone_num,
                "email": email_addr,
                "property_type": p_prop,
                "location": p_loc,
                "budget_min": p_min,
                "budget_max": p_max,
                "source": source,
                "status": status,
                "created_delta_mins": delta_mins,
                "assigned_email": assigned_email,
                "is_sla_breached": sla_breached,
                "meta_leadgen_id": f"meta_lead_{2000 + i}" if "META" in source else None,
                "notes": f"High-intent inquiry for {p_prop} in {p_loc}.",
                "estimated_brokerage": brokerage,
                "poaching_risk_score": poaching_risk_score,
                "poaching_risk_reason": poaching_risk_reason,
                "offline_closing_flag": offline_closing_flag
            })

        lead_objects = []
        for ld in leads_data:
            assigned_u = user_objects.get(ld["assigned_email"])
            created_time = now - timedelta(minutes=ld["created_delta_mins"])
            sla_time = created_time + timedelta(minutes=15)
            
            p_hash = hash_phone(ld["phone"])
            masked_p = mask_phone(ld["phone"])
            masked_e = mask_email(ld["email"])

            lead = Lead(
                tenant_id=tenant.id,
                assigned_agent_id=assigned_u.id if assigned_u else None,
                meta_leadgen_id=ld.get("meta_leadgen_id"),
                source=ld["source"],
                full_name=ld["full_name"],
                phone_raw=normalize_phone(ld["phone"]),
                phone_masked=masked_p,
                phone_hash=p_hash,
                email=ld["email"],
                email_masked=masked_e,
                property_type=ld["property_type"],
                budget_min=ld["budget_min"],
                budget_max=ld["budget_max"],
                preferred_location=ld["location"],
                status=ld["status"],
                sla_deadline=sla_time,
                is_sla_breached=ld["is_sla_breached"],
                first_response_at=created_time + timedelta(minutes=6) if ld["status"] != "NEW" else None,
                notes=ld["notes"],
                estimated_brokerage=ld["estimated_brokerage"],
                poaching_risk_score=ld["poaching_risk_score"],
                poaching_risk_reason=ld["poaching_risk_reason"],
                offline_closing_flag=ld["offline_closing_flag"],
                created_at=created_time,
                updated_at=now
            )
            db.add(lead)
            lead_objects.append((lead, assigned_u, created_time, ld["status"]))

        await db.flush()

        # 7. Activities Timeline per Lead
        for lead, agent, created_time, status_val in lead_objects:
            db.add(LeadActivity(
                lead_id=lead.id,
                user_id=agent.id if agent else None,
                activity_type="LEAD_INGESTED_META" if "META" in lead.source else "LEAD_INGESTED_WEB",
                metadata_json=json.dumps({"source": lead.source, "assigned_to": agent.full_name if agent else "Unassigned"}),
                created_at=created_time
            ))

            db.add(LeadActivity(
                lead_id=lead.id,
                user_id=agent.id if agent else None,
                activity_type="LEAD_VIEWED",
                metadata_json=json.dumps({"employee_code": agent.employee_code if agent else "SYS", "watermark_rendered": True}),
                created_at=created_time + timedelta(minutes=2)
            ))

            if status_val in ["CONTACTED", "SITE_VISIT_SCHEDULED", "NEGOTIATION", "WON"]:
                db.add(LeadActivity(
                    lead_id=lead.id,
                    user_id=agent.id if agent else None,
                    activity_type="CALL_DIALED",
                    metadata_json=json.dumps({"bridge_id": f"bridge_{uuid.uuid4().hex[:10]}", "duration_sec": 380, "outcome": "ENGAGED"}),
                    created_at=created_time + timedelta(minutes=8)
                ))

            if status_val in ["SITE_VISIT_SCHEDULED", "NEGOTIATION", "WON"]:
                db.add(LeadActivity(
                    lead_id=lead.id,
                    user_id=agent.id if agent else None,
                    activity_type="SITE_VISIT_CHECKIN",
                    metadata_json=json.dumps({"geofence_verified": True, "location": lead.preferred_location, "escort": agent.full_name if agent else ""}),
                    created_at=created_time + timedelta(hours=24)
                ))

        # 8. Security Audit Logs (Anti-Theft Forensic Ledger for Owner)
        audit_events = [
            (
                "agent.ananya@apexrealty.com",
                "OFFLINE_CLOSING_ALERT",
                "CRITICAL",
                "157.34.192.44",
                {"alert": "Executive Ananya marked lead Kavita Chawla as LOST, but GPS logs confirm 3 unlogged visits to Palm Grove Villa 12 with client!", "brokerage_at_risk": "₹14,50,000", "action": "ESCALATED_TO_OWNER"}
            ),
            (
                "agent.ananya@apexrealty.com",
                "UNLOGGED_SITE_VISIT",
                "CRITICAL",
                "157.34.192.44",
                {"agent": "Ananya Patel (EXE-208)", "location": "Palm Grove Villa 12", "coords": [19.1136, 72.8697], "crm_appointment": "NONE_LOGGED"}
            ),
            (
                "agent.rahul@apexrealty.com",
                "SUSPICIOUS_PII_HARVESTING",
                "HIGH",
                "103.21.144.10",
                {"agent": "Rahul Verma (EXE-204)", "lead": "Aditya Singhania (₹5 Cr)", "views_in_3h": 6, "crm_bridge_calls": 0, "risk": "Suspected direct personal phone dialing"}
            ),
            (
                "agent.ananya@apexrealty.com",
                "WATERMARK_TAMPER_ATTEMPT",
                "CRITICAL",
                "157.34.192.44",
                {"detector": "ShadowDOM_MutationObserver", "target_canvas": "#dlp-watermark-canvas", "action_taken": "DOM_ELEMENT_RESTORED_IMMEDIATELY", "offender_employee": "EXE-208"}
            ),
            (
                "agent.ananya@apexrealty.com",
                "IMPOSSIBLE_TRAVEL",
                "CRITICAL",
                "185.220.101.5",
                {"detected_speed_kmh": 892.4, "city_a": "Mumbai (IN)", "city_b": "Frankfurt (DE)", "elapsed_minutes": 14, "action_taken": "SESSION_CHALLENGED_2FA"}
            ),
            (
                "agent.rahul@apexrealty.com",
                "CLIPBOARD_COPY_BLOCKED",
                "MEDIUM",
                "103.21.144.10",
                {"key": "Ctrl+C", "target_element": "td.phone_masked", "blocked": True}
            ),
            (
                "agent.ananya@apexrealty.com",
                "PRINT_ATTEMPTED",
                "HIGH",
                "14.139.12.8",
                {"key": "Ctrl+P", "blocked": True, "print_stylesheet_enforced": True}
            )
        ]

        for u_email, ev_type, sev, ip, details in audit_events:
            usr = user_objects.get(u_email)
            db.add(SecurityAuditLog(
                tenant_id=tenant.id,
                user_id=usr.id if usr else None,
                event_type=ev_type,
                severity=sev,
                ip_address=ip,
                details_json=json.dumps(details),
                created_at=now - timedelta(hours=1)
            ))

        # 9. Four-Eyes Export Governance Requests
        db.add(ExportRequest(
            tenant_id=tenant.id,
            requester_id=user_objects["agent.rahul@apexrealty.com"].id,
            status="PENDING",
            reason="Lead list export requested for offline direct calling.",
            records_count=25,
            expires_at=now + timedelta(hours=24),
            created_at=now - timedelta(hours=1)
        ))

        db.add(ExportRequest(
            tenant_id=tenant.id,
            requester_id=user_objects["agent.ananya@apexrealty.com"].id,
            approver_id=user_objects["owner@apexrealty.com"].id,
            status="APPROVED",
            reason="Authorized audit filing for RERA compliance on Palm Grove Signature Villas.",
            records_count=18,
            one_time_token_hash="tok_sec_rera_audit_2026_one_time_valid",
            expires_at=now + timedelta(hours=12),
            created_at=now - timedelta(hours=3)
        ))

        # 10. Assignment Rules
        rule_rr = AssignmentRule(
            tenant_id=tenant.id,
            name="Meta Ads 15-Minute SLA Auto-Reassignment",
            rule_type="ROUND_ROBIN",
            is_active=True,
            priority=1,
            config_json=json.dumps({"sla_minutes": 15, "require_active_punch": True, "auto_confiscate_on_sla_breach": True})
        )
        db.add(rule_rr)

        await db.commit()
        print("[SUCCESS] Complete enterprise demo dataset successfully populated!")
        print("Summary:")
        print(f"   - Tenant: {tenant.name}")
        print(f"   - Users: {len(users_data)} (Owner, Director, Manager, 5 Executives)")
        print(f"   - Properties: {len(properties_list)} (Penthouses, Villas, Commercial)")
        print(f"   - Leads: {len(leads_data)} (Loaded with Anti-Theft & Poaching indicators)")
        print(f"   - Telemetry: 6 Sessions, 4 GPS Breadcrumbs, 7 Security & Poaching Incidents")
        print(f"   - DLP Exports: 1 Pending, 1 Approved (Four-Eyes Principle)")


if __name__ == "__main__":
    asyncio.run(seed_full_enterprise_data())
