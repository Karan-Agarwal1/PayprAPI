@echo off
cd /d "%~dp0"
echo [Frontend] Starting on port 3000...
call npx next dev -p 3000
pause
