# Apex Sovereign CRM - One-Click Launcher for Dealer Demo
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "  APEX SOVEREIGN REAL ESTATE CRM - LIQUID GLASS DEALER PROTOTYPE" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Populate enterprise demo data
Write-Host "[1/3] Seeding Enterprise Anti-Brokerage Theft & Lead Dataset..." -ForegroundColor Yellow
$env:PYTHONPATH="backend"
& "backend\.venv\Scripts\python.exe" backend\app\seed_demo_data.py

Write-Host ""
Write-Host "[2/3] Starting FastAPI Backend on http://localhost:8000 ..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; `$env:PYTHONPATH='backend'; backend\.venv\Scripts\uvicorn.exe app.main:app --host 0.0.0.0 --port 8000 --reload"

Write-Host "[3/3] Starting Liquid Glass React CRM Portal on http://localhost:3000 ..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; npm run dev -- --port 3000"

Write-Host ""
Write-Host "=================================================================" -ForegroundColor Green
Write-Host "  PROTOTYPE READY FOR DEALER PRESENTATION!" -ForegroundColor Green
Write-Host "=================================================================" -ForegroundColor Green
Write-Host "Web Portal:  http://localhost:3000" -ForegroundColor White
Write-Host "Swagger API: http://localhost:8000/docs" -ForegroundColor White
Write-Host ""
Write-Host "Separate Demo Credentials:" -ForegroundColor Cyan
Write-Host " 👑 Owner / Dealer Portal:      owner@apexrealty.com       / OwnerPass2026!" -ForegroundColor Yellow
Write-Host "    (Features Anti-Brokerage Theft Radar, Commission Shield, Field GPS Tracker)" -ForegroundColor DarkGray
Write-Host " 💼 Executive / Sales Rep Portal: agent.rahul@apexrealty.com / AgentPass2026!" -ForegroundColor White
Write-Host "    (Clean sales workspace, zero log visibility, masked calling, 20% DLP watermark)" -ForegroundColor DarkGray
Write-Host " 🛡️ Director / Admin Portal:    admin@apexrealty.com       / AdminPass2026!" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to exit this launcher window..." -ForegroundColor DarkGray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
