# Start All Three Services - PayprAPI Marketplace
# Run this from the project root directory

Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "  PayprAPI Pay-Per-Use AI API Marketplace" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""

$root = $PSScriptRoot

# Start FastAPI AI Services in a new window
Write-Host "[1/3] Starting FastAPI AI Services (port 8001)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\backend\ai-services'; Write-Host 'Starting AI Services...' -ForegroundColor Cyan; python main.py"

Start-Sleep -Seconds 2

# Start Node.js Gateway in a new window
Write-Host "[2/3] Starting Node.js Gateway (port 8000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\backend\gateway'; Write-Host 'Starting Gateway...' -ForegroundColor Cyan; npm run dev"

Start-Sleep -Seconds 2

# Start Next.js Frontend in a new window
Write-Host "[3/3] Starting Next.js Frontend (port 3000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\frontend'; Write-Host 'Starting Frontend...' -ForegroundColor Cyan; npm run dev"

Write-Host ""
Write-Host "All services starting! Please wait ~10 seconds for them to boot..." -ForegroundColor Green
Write-Host ""
Write-Host "  Marketplace:    http://localhost:3000" -ForegroundColor White
Write-Host "  Explore APIs:   http://localhost:3000/explore" -ForegroundColor White
Write-Host "  Dashboard:      http://localhost:3000/dashboard" -ForegroundColor White
Write-Host "  Analytics:      http://localhost:3000/analytics" -ForegroundColor White
Write-Host "  Agent Console:  http://localhost:3000/agent-console" -ForegroundColor White
Write-Host "  Gateway API:    http://localhost:8000" -ForegroundColor White
Write-Host "  AI Services:    http://localhost:8001/docs" -ForegroundColor White
Write-Host ""
Write-Host "Waiting a few seconds for services to boot before opening browser..." -ForegroundColor Gray
Start-Sleep -Seconds 5
Start-Process "http://localhost:3000"
