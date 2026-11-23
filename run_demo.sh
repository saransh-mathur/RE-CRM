#!/usr/bin/env bash
set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

echo "================================================================="
echo "  APEX SOVEREIGN REAL ESTATE CRM - LINUX LAUNCHER"
echo "================================================================="
echo ""

# Ensure Linux virtual environment exists
if [ ! -d "$PROJECT_ROOT/backend/.venv_linux" ]; then
    echo "[!] Creating Python virtual environment in backend/.venv_linux..."
    python3 -m venv "$PROJECT_ROOT/backend/.venv_linux"
    "$PROJECT_ROOT/backend/.venv_linux/bin/pip" install --upgrade pip
    "$PROJECT_ROOT/backend/.venv_linux/bin/pip" install -r "$PROJECT_ROOT/backend/requirements.txt"
fi

# 1. Populate enterprise demo data
echo "[1/3] Seeding Enterprise Anti-Brokerage Theft & Lead Dataset..."
export PYTHONPATH="$PROJECT_ROOT/backend"
"$PROJECT_ROOT/backend/.venv_linux/bin/python" "$PROJECT_ROOT/backend/app/seed_demo_data.py"

echo ""
echo "[2/3] Starting FastAPI Backend on http://localhost:8000 ..."
"$PROJECT_ROOT/backend/.venv_linux/bin/uvicorn" app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

echo "[3/3] Starting React CRM Portal on http://localhost:3000 ..."
cd "$PROJECT_ROOT/frontend"
npm run dev -- --host 0.0.0.0 --port 3000 &
FRONTEND_PID=$!

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT INT TERM

echo ""
echo "================================================================="
echo "  PROTOTYPE READY FOR PRESENTATION!"
echo "================================================================="
echo "Web Portal:  http://localhost:3000"
echo "Swagger API: http://localhost:8000/docs"
echo ""
echo "Demo Personas available via dropdown switcher in the navigation bar."
echo "Press Ctrl+C to stop both servers."

wait
