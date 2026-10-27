# Enterprise Real Estate CRM, Meta Lead Engine & DLP Platform

A high-performance, enterprise-grade Real Estate CRM engineered to solve **omnichannel lead ingestion from Meta (Facebook & Instagram)**, **rigorous Data Loss Prevention (DLP)**, **GPS & working hours telemetry**, and **anti-takedown/cyberattack-proof cloud hosting**.

---

## 🚀 One-Click Dealer Demo Launcher

### Option A: Standalone Demo Mode (Zero Backend Required)
Run completely offline with pre-loaded enterprise dummy data, full persona switching, real-time SLA countdown timers, Anti-Brokerage Theft Radar, and simulated Meta lead ingestion:

- **Linux / Mac**:
  ```bash
  ./run_demo_standalone.sh
  ```
- **Windows Batch**: Double-click [`run_demo_standalone.bat`](file:///mnt/data/Downloads/Python/RJ%20CRM/CRM%20with%20Tracking/run_demo_standalone.bat)
- **Direct npm command**:
  ```bash
  cd frontend && npm run dev
  ```
- Open in Browser: `http://localhost:3000`

---

### Option B: Full Stack Mode (FastAPI Backend + React Frontend)
Launch both the Python FastAPI backend and React frontend with pre-loaded enterprise database:

- **Linux / Mac**:
  ```bash
  ./run_demo.sh
  ```
- **Windows Batch**: [`run_demo.bat`](file:///mnt/data/Downloads/Python/RJ%20CRM/CRM%20with%20Tracking/run_demo.bat)
- **PowerShell**:
  ```powershell
  .\run_demo.ps1
  ```

Once launched:
- **CRM Web Portal**: `http://localhost:3000`
- **FastAPI Interactive Docs**: `http://localhost:8000/docs`

---

## 👥 Demo Personas Available in Dropdown

The CRM features a **Demo Persona Switcher** in the top navigation bar so you can instantly switch roles in front of the dealer to demonstrate role-based access control (RBAC):

| Persona | Role | Territory | Device Environment | Login Credentials |
| :--- | :--- | :--- | :--- | :--- |
| **Rahul Verma** | Senior Consultant | Downtown Skyline | 💻 Laptop (Dell XPS 15) | `rahul.verma@apexrealty.com` / `AgentPass2026!` |
| **Ananya Patel** | Luxury Villa Specialist | Palm Grove Estates | 📱 Mobile Phone (iPhone 15 Pro) | `ananya.patel@apexrealty.com` / `AgentPass2026!` |
| **Vikram Malhotra** | Commercial Specialist | Marina Bay Promenade | 📱 Mobile Phone (Galaxy S24) | `vikram.malhotra@apexrealty.com` / `AgentPass2026!` |
| **Priya Sharma** | Sales Manager | All Sectors | 💻 Laptop (ThinkPad X1) | `priya.sharma@apexrealty.com` / `ManagerPass2026!` |
| **Sarah Jenkins** | Sales Director / Admin | Corporate HQ | 💻 Laptop (MacBook Pro M3) | `admin@apexrealty.com` / `AdminPass2026!` |

---

## 🏢 Prime Properties Catalog Pre-Loaded

The inventory includes **8 high-ticket residential and commercial assets**:
1. **The Grand Crest - Sky Villa 401** (4 BHK Sky Villa, ₹4.85 Cr, Downtown Skyline)
2. **Palm Serenade - Signature Villa 12** (5 BHK Independent Villa, ₹7.25 Cr, Palm Grove Estates)
3. **Marina Azure - Sea Facing Residence 18B** (3 BHK Luxury Apartment, ₹3.10 Cr, Marina Bay)
4. **Apex One Corporate Tower - Level 14** (Grade-A Commercial Office, 6,800 sq.ft, ₹8.90 Cr, CBD)
5. **The Lumina Heights - Duplex Penthouse 28** (4 BHK Penthouse, ₹5.60 Cr, Downtown Skyline)
6. **Green Valley Sanctuary - Eco Villa 07** (3 BHK Forest Villa, ₹2.45 Cr, Green Valley Hills - `SOLD`)
7. **The Boulevard Retail Arcade - Unit G-04** (High-Street Retail Store, ₹3.75 Cr, Commercial Hub)
8. **Elysium Grand - Presidential Suite 32A** (4 BHK Ultra-Luxury, ₹6.40 Cr, Marina Bay)

---

## 📋 Pre-Loaded Customer Leads & Scenarios

The CRM is loaded with **18 realistic leads** demonstrating the complete pipeline and DLP controls:

1. **Active 15-Minute SLA Countdown**:
   - *Aditya Singhania* (₹4.5 Cr - ₹5.5 Cr, Facebook Lead Ad) -> Shows active 15-minute countdown clock.
   - *Pooja Hegde* (₹3.0 Cr - ₹3.4 Cr, Instagram Reel) -> Shows countdown amber warning (< 3 mins remaining).
2. **SLA Breach & Management Escalation**:
   - *Kavita Chawla* (₹6.5 Cr - ₹8.0 Cr, Instagram Story) -> Shows flashing **⚠️ SLA BREACHED** badge to showcase automatic escalation when an agent fails to respond in time.
3. **Customer PII Masking & Click-to-Call**:
   - All customer numbers are masked (`+91 98*** **22`).
   - Clicking **"📞 Masked Call"** connects through a virtual CTI bridge (`bridge_xxx`) without exposing the client's private phone number.
4. **Four-Eyes Data Export Governance**:
   - Bulk exports cannot be downloaded without manager approval.
   - Shows 1 Pending Request and 1 Approved Request with a single-use cryptographic token.
5. **Field Agent Fleet & GPS Telemetry**:
   - Displays real-time device type classification (Mobile Phone vs Laptop).
   - Shows live GPS location breadcrumbs (e.g., Ananya Patel conducting a site inspection at Palm Grove Villa 12).
   - Security incident ledger detailing thwarted watermark tampering attempts and impossible travel alerts.

---

## 🧪 Verification

Run the automated test suite anytime:
```bash
backend\.venv\Scripts\pytest backend\tests -v
```
Output:
```
============================= 5 passed in 43.44s =============================
```
