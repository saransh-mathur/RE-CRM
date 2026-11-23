#!/usr/bin/env bash
set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT/frontend"

echo "================================================================="
echo "  APEX SOVEREIGN CRM - STANDALONE DEMO LAUNCHER (NO BACKEND)"
echo "================================================================="
echo ""
echo "Starting Liquid Glass React CRM Portal on http://localhost:3000 ..."
echo "All features (Meta Lead Ingestion, SLA Countdown, Anti-Theft Radar,"
echo "Masked CTI Calling, Export Governance) are pre-loaded with demo data."
echo ""
echo "Press Ctrl+C to stop the demo server."
echo ""

npm run dev -- --host 0.0.0.0 --port 3000
