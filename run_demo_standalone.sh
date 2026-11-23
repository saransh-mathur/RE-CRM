#!/usr/bin/env bash
set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

echo "================================================================="
echo "  ABSOLUTE ASSETS CRM - STANDALONE LAUNCHER (NO BACKEND NEEDED)"
echo "================================================================="
echo ""

if [ ! -d "$PROJECT_ROOT/node_modules" ] && [ ! -d "$PROJECT_ROOT/frontend/node_modules" ]; then
    echo "[*] Installing frontend dependencies (first-time setup)..."
    npm install
    echo ""
fi

echo "Starting CRM Portal on http://localhost:3000 ..."
echo "Pre-loaded with demo leads, ad sources, agent activity, and properties."
echo ""
echo "Press Ctrl+C to stop the server."
echo ""

npm run dev
