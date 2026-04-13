@echo off
title PayprAPI Launcher
color 0a

echo.
echo  ========================================
echo    PayprAPI Marketplace Launcher
echo  ========================================
echo.

echo  [1/3] Starting AI Backend...
start "AI-Backend" "%~dp0backend\ai-services\start.bat"
timeout /t 4 /nobreak >nul

echo  [2/3] Starting Gateway...
start "Gateway" "%~dp0backend\gateway\start.bat"
timeout /t 4 /nobreak >nul

echo  [3/3] Starting Frontend...
start "Frontend" "%~dp0frontend\start.bat"

echo.
echo  ========================================
echo   ALL 3 SERVICES ARE STARTING!
echo  ========================================
echo.
echo   Wait 20 seconds, then open your browser:
echo.
echo       http://localhost:3000
echo.
echo   DO NOT close the other 3 windows!
echo  ========================================
echo.
pause



