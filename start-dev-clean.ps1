# NFTSol Clean Development Startup
# This script kills existing processes and starts fresh

Write-Host "🧹 Cleaning up existing processes..." -ForegroundColor Yellow

# Kill any existing Node processes
Get-Process | Where-Object {$_.ProcessName -like "*node*"} | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host "✅ Cleaned up existing processes" -ForegroundColor Green

# Set environment variables
Write-Host "🔧 Setting up environment variables..." -ForegroundColor Cyan

$env:PINATA_API_KEY = "b56eb57bd4e0b503a094"
$env:PINATA_SECRET_KEY = "2c8365e293ecff150b8a8288efb178e39d1729f95ebc8f349ae4e013cc166a2b"
$env:HELIUS_API_KEY = "33d5c12f-895d-4192-bc26-a86d5ffa5cbc"
$env:JWT_SECRET = "a8f5f167f44f4964e6c998dee827110c"
$env:SESSION_SECRET = "b9e6e278g55g5075f7d009eff938221d"
$env:NODE_ENV = "development"
$env:DATABASE_URL = "postgresql://localhost:5432/nftsol_dev"
$env:REDIS_URL = "redis://localhost:6379"

Write-Host "✅ Environment variables set" -ForegroundColor Green

# Start server in background
Write-Host "🚀 Starting NFTSol server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-Command", "cd '$PWD\server'; `$env:PINATA_API_KEY='b56eb57bd4e0b503a094'; `$env:PINATA_SECRET_KEY='2c8365e293ecff150b8a8288efb178e39d1729f95ebc8f349ae4e013cc166a2b'; `$env:HELIUS_API_KEY='33d5c12f-895d-4192-bc26-a86d5ffa5cbc'; `$env:JWT_SECRET='a8f5f167f44f4964e6c998dee827110c'; `$env:SESSION_SECRET='b9e6e278g55g5075f7d009eff938221d'; `$env:NODE_ENV='development'; npm run dev" -WindowStyle Normal

# Wait a moment for server to start
Start-Sleep 3

# Start client in background
Write-Host "🎨 Starting NFTSol client..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-Command", "cd '$PWD\client'; npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "🎉 NFTSol development environment started!" -ForegroundColor Green
Write-Host "📡 Server: http://localhost:3000" -ForegroundColor White
Write-Host "🎨 Client: http://localhost:5173" -ForegroundColor White
Write-Host "🔍 Health: http://localhost:3000/health" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to continue..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
