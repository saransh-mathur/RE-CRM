# Absolute Assets CRM - Full-Stack Launcher (Windows PowerShell)
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "  ABSOLUTE ASSETS REAL ESTATE CRM - FULL-STACK LAUNCHER" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host ""

Set-Location $PSScriptRoot

# Ensure Python virtual environment exists
if (-not (Test-Path "backend\.venv\Scripts\python.exe")) {
    Write-Host "[!] Creating Python virtual environment in backend\.venv..." -ForegroundColor Yellow
    python -m venv backend\.venv
    & "backend\.venv\Scripts\pip.exe" install --upgrade pip
    & "backend\.venv\Scripts\pip.exe" install -r backend\requirements.txt
}

# Ensure frontend dependencies exist
if (-not (Test-Path "node_modules") -and -not (Test-Path "frontend\node_modules")) {
    Write-Host "[!] Installing frontend dependencies..." -ForegroundColor Yellow
    npm install
}

# 1. Populate demo data
Write-Host "[1/3] Seeding backend demo dataset..." -ForegroundColor Yellow
$env:PYTHONPATH="backend"
& "backend\.venv\Scripts\python.exe" backend\app\seed_demo_data.py

Write-Host ""
Write-Host "[2/3] Starting FastAPI Backend on http://localhost:8000 ..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; `$env:PYTHONPATH='backend'; backend\.venv\Scripts\uvicorn.exe app.main:app --host 0.0.0.0 --port 8000 --reload"

Write-Host "[3/3] Starting React CRM Portal on http://localhost:3000 ..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; npm run dev"

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
