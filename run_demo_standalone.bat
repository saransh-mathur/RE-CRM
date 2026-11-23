@echo off
title Absolute Assets CRM - Standalone Launcher (No Backend)
echo =================================================================
echo   ABSOLUTE ASSETS CRM - STANDALONE LAUNCHER (NO BACKEND NEEDED)
echo =================================================================
echo.
cd /d "%~dp0"
if not exist "node_modules" if not exist "frontend\node_modules" (
    echo [*] Installing frontend dependencies ^(first-time setup^)...
    call npm install
    echo.
)
echo Launching CRM Web Portal on http://localhost:3000 ...
echo Pre-loaded with demo leads, ad sources, agent activity, and properties.
echo.
call npm run dev
pause
