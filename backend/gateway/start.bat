@echo off
cd /d "%~dp0"
echo [Gateway] Starting on port 8000...
node server.js
pause
