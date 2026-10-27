@echo off
title Apex Sovereign CRM - Standalone Demo Launcher (No Backend)
echo =================================================================
echo   APEX SOVEREIGN CRM - STANDALONE DEMO LAUNCHER (NO BACKEND)
echo =================================================================
echo.
echo Launching React CRM Web Portal on http://localhost:3000 ...
echo Standalone Mock Engine active with complete enterprise demo data.
echo.
cd "%~dp0frontend"
npm run dev -- --port 3000
pause
