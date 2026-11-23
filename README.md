# Absolute Assets — Real Estate CRM, Ad Lead Tracker & DLP Platform

A clean, easy-to-use Real Estate CRM designed for brokerages and sales teams to manage property leads, track incoming advertisement leads across **Meta / Facebook, WhatsApp, Instagram, LinkedIn, Google Ads, and Website**, monitor **every agent activity**, and protect client contact data with built-in **Data Loss Prevention (DLP)**.

---

## Key Features

- **Dashboard Analytics**: Interactive **Lead Status Breakdown** pie chart, **Ad Leads** graph (`By Platform` and `Last 7 Days`), **Lead Summary** tiles, **Call Details** (`Today`, `Yesterday`, `Weekly`, `All`), and a live **Recent Agent Activity** feed.
- **Manage Leads & Lead Preview Drawer**: Table-first lead view (with a 1-click **Cards** toggle), quick status tabs (`All Leads`, `My Leads`, `Follow-Up`, `Site Visit Done`, `Call Not Pick`, `Booked`), search and ad-source filters, manual **`+ Add Lead`** modal, and a right-side **Lead Preview** slide-over drawer (`Overview`, `Activity`, `Notes`, masked click-to-call, inline status & agent updates).
- **Multi-Channel Ad Tracking**: Dedicated **Ad Sources** view with lead counts, conversion rates, campaign attribution, and 1-click simulated lead ingestion for **Meta, WhatsApp, Instagram, LinkedIn, and Google Ads**.
- **Agent Activity Tracking**: Per-agent performance scorecards, clickable per-agent activity timelines, call logs, attendance/punch-in tracking, and follow-up/inactivity alerts with direct lead reassignment.
- **Properties & Streamlined Settings**: Curated Gurugram & Delhi NCR property catalog plus a simplified 3-card **Settings** screen covering Ad Platforms, Team Access, and Lead Protection.
- **Built-in DLP & Security Controls**: Masked customer phone numbers, virtual CTI click-to-call logging, export approval governance, and watermark/copy protection for agent sessions.

---

## Prerequisites

- **Standalone Frontend (Recommended / Fastest)**: [Node.js 18+](https://nodejs.org/) (includes `npm`)
- **Full-Stack Mode (Optional Backend)**: [Python 3.11+](https://www.python.org/downloads/)
- **Docker Mode (Optional)**: [Docker & Docker Compose](https://docs.docker.com/get-docker/)

---

## Quick Start (Standalone Mode — Zero Backend Required)

The frontend includes a built-in standalone mock API engine pre-loaded with demo leads, ad campaigns, call logs, agent activities, and properties.

### 1. Clone and Run (Any OS)

```bash
git clone <your-repo-url>
cd <repo-folder>
npm install
npm run dev
```

Open **`http://localhost:3000`** in your browser.

### 2. Or Use the One-Click Launcher Script

First-time setup installs dependencies automatically if `node_modules` is not present:

- **macOS / Linux**:
  ```bash
  chmod +x run_demo_standalone.sh
  ./run_demo_standalone.sh
  ```
- **Windows**: Double-click `run_demo_standalone.bat` (or run `run_demo_standalone.bat` in Command Prompt).

---

## Full-Stack Setup (FastAPI Backend + React Frontend)

Use this option when developing or testing against the FastAPI backend, SQLite/PostgreSQL database, and Meta Lead Ads webhook endpoints.

### Option 1: One-Click Full-Stack Script

- **macOS / Linux**:
  ```bash
  chmod +x run_demo.sh
  ./run_demo.sh
  ```
- **Windows (PowerShell)**:
  ```powershell
  .\run_demo.ps1
  ```
- **Windows (Batch)**: Double-click `run_demo.bat`

Services started:
- **Web Portal**: `http://localhost:3000`
- **FastAPI Interactive Docs (Swagger)**: `http://localhost:8000/docs`

### Option 2: Manual Full-Stack Setup

1. **Configure environment variables** (optional — defaults to local async SQLite `crm_advanced.db`):
   ```bash
   cp .env.example .env
   ```

2. **Set up and start the FastAPI backend**:
   ```bash
   python3 -m venv backend/.venv
   # macOS / Linux:
   source backend/.venv/bin/activate
   # Windows PowerShell:
   # .\backend\.venv\Scripts\Activate.ps1

   pip install -r backend/requirements.txt
   PYTHONPATH=backend python backend/app/seed_demo_data.py
   PYTHONPATH=backend uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

3. **In a second terminal, start the React frontend**:
   ```bash
   npm install
   npm run dev
   ```

### Option 3: Docker Compose (PostgreSQL + Redis + FastAPI + Nginx Frontend)

```bash
cp .env.example .env
docker compose up --build
```

- **Web Portal**: `http://localhost:3000`
- **FastAPI Docs**: `http://localhost:8000/docs`

Stop and remove containers with:
```bash
docker compose down
```

---

## Environment Variables

Copy `.env.example` to `.env` if you are running the backend or Docker Compose with custom credentials:

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | Async SQLAlchemy DB URI (SQLite for local dev, PostgreSQL for Docker/prod) | `sqlite+aiosqlite:///./crm_advanced.db` |
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379/0` |
| `SECRET_KEY` | JWT signing key (min 32 chars in production) | `change-in-production-...` |
| `META_APP_SECRET` | Meta App Secret for webhook HMAC verification | `replace_with_meta_app_secret` |
| `META_VERIFY_TOKEN` | Meta webhook verification challenge token | `replace_with_meta_verify_token` |
| `META_SYSTEM_USER_TOKEN` | Meta Graph API system user token | `replace_with_meta_system_user_token` |
| `SLA_FIRST_RESPONSE_MINUTES` | First-response SLA threshold in minutes | `15` |

> **Note:** Never commit `.env` with real secrets. `.env` is already listed in `.gitignore`.

---

## Demo Accounts

### Standalone Frontend (Default Mode)

You can switch accounts in 1 click from the top-right account menu or sign in on the login screen:

| Name | Role | Territory | Email | Password |
| :--- | :--- | :--- | :--- | :--- |
| **Vikramaditya Singhania** | Owner / Admin | All Gurugram & Delhi NCR | `owner@absoluteassets.in` | `OwnerPass2026!` |
| **Dhruv Chaudhary** | Sales Agent | Dwarka Expressway & Plots | `dhruv@absoluteassets.in` | `AgentPass2026!` |
| **Ananya Patel** | Sales Agent | Golf Course Extension & SPR | `ananya@absoluteassets.in` | `AgentPass2026!` |
| **Vikram Malhotra** | Sales Agent | Sector 57 & Commercial Retail | `vikram@absoluteassets.in` | `AgentPass2026!` |
| **Karan Mehta** | Sales Agent | DLF Privana & Sohna Road | `karan@absoluteassets.in` | `AgentPass2026!` |

### Backend Database Seed Accounts (`backend/app/seed_demo_data.py`)

When querying FastAPI directly (`/api/v1/auth/login` or Swagger docs):

| Role | Email | Password |
| :--- | :--- | :--- |
| **Owner** | `owner@apexrealty.com` | `OwnerPass2026!` |
| **Admin** | `admin@apexrealty.com` | `AdminPass2026!` |
| **Manager** | `manager@apexrealty.com` | `ManagerPass2026!` |
| **Agent** | `agent.rahul@apexrealty.com` | `AgentPass2026!` |

---

## Repository Structure

```text
.
├── frontend/                   # React + TypeScript + Vite web application
│   ├── src/
│   │   ├── components/
│   │   │   ├── analytics/      # Pie Chart, Ad Leads Graph, Ad Sources view
│   │   │   ├── auth/           # Login & Profile modals
│   │   │   ├── dashboards/     # Owner/Admin & Sales Agent workspaces
│   │   │   ├── dlp/            # Watermark, Anti-Copy, Export Approval modals
│   │   │   ├── layout/         # Collapsible Sidebar & Slim Header
│   │   │   ├── leads/          # Manage Leads table, Lead Preview Drawer, Add Lead Modal
│   │   │   ├── properties/     # Property inventory catalog
│   │   │   ├── settings/       # Simplified 3-card Settings view
│   │   │   └── telemetry/      # Agent Activity Hub & Call/Device telemetry
│   │   ├── lib/                # Standalone mock API, analytics helpers, theme, unit tests
│   │   └── pages/              # Root Dashboard shell
│   └── Dockerfile
├── backend/                    # FastAPI + SQLAlchemy async backend
│   ├── app/
│   │   ├── api/v1/             # Auth, Leads, Properties, DLP, Export Governance, Meta Webhooks
│   │   ├── core/               # Config, async DB setup, JWT & PII masking security
│   │   ├── models/             # SQLAlchemy models
│   │   ├── schemas/            # Pydantic request/response schemas
│   │   ├── services/           # Lead routing, anomaly detection, DLP, Meta service
│   │   └── seed_demo_data.py   # Demo dataset seeder
│   ├── tests/                  # Pytest backend test suite
│   └── Dockerfile
├── infra/cloudflare/           # Sample Nginx origin-cloaking & Cloudflare WAF configs
├── docker-compose.yml          # Full-stack Docker setup (Postgres, Redis, FastAPI, Frontend)
├── .env.example                # Environment variable template
├── package.json                # Root npm workspace scripts (dev, build, lint, test)
├── run_demo_standalone.sh/.bat # One-click standalone launchers (no backend needed)
└── run_demo.sh/.ps1/.bat       # One-click full-stack launchers
```

---

## Scripts, Tests & Production Build

From the repository root:

```bash
# Start development server (http://localhost:3000)
npm run dev

# Run frontend unit tests (lead analytics & API logic)
npm test

# Type-check with TypeScript
npm run lint

# Build production bundle (outputs to frontend/dist)
npm run build
```

Run backend tests (after activating the Python virtual environment):

```bash
pytest backend/tests -v
```

---

## Troubleshooting

- **Port `3000` or `8000` already in use**: Stop any existing Vite/Uvicorn process or pass a different port (e.g., `npm run dev -- --port 3001`).
- **`npm` command not found**: Install Node.js 18+ from [nodejs.org](https://nodejs.org/) and restart your terminal.
- **Permission denied when running `./run_demo_standalone.sh` on macOS/Linux**: Run `chmod +x run_demo_standalone.sh run_demo.sh` once, then re-run the script.
- **Backend `ModuleNotFoundError: No module named 'app'`**: Ensure you run backend commands from the repository root with `PYTHONPATH=backend` set.
