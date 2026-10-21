@echo off
title ClientPulse 360 - Unified UAE Agency Operating System
echo ================================================================
echo   CLIENTPULSE 360 - UNIFIED UAE AGENCY OPERATING SYSTEM
echo   Target: 40 Lac PKR (~52,500 AED) for Nafeesa Ali Digital Studio
echo ================================================================
echo.
echo Starting Unified Next.js Server on http://localhost:3001 ...
echo Opening Agency Command Hub at http://localhost:3001/agency-hub ...
echo.

cd /d "C:\Users\HomePC\Desktop\AI Solo-Business Operating System"
start http://localhost:3001/agency-hub
call npx.cmd next dev -p 3001
pause
