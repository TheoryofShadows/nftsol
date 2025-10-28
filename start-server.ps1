# 🚀 NFTSol Server Start Script
Write-Host "🚀 Starting NFTSol Server..." -ForegroundColor Green

# Change to backend directory
Set-Location "C:\Users\KHK89\NFTSol\apps\backend"

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install

# Build TypeScript
Write-Host "🔨 Building TypeScript..." -ForegroundColor Yellow
npm run build

# Set environment variables
Write-Host "🔑 Setting environment variables..." -ForegroundColor Yellow
$env:PLATFORM_SECRET_KEY_BASE58 = "57gPGZp3tgwnNAPK2GJxYE4kJpeHh75Vg95M4xRDaNswNe37Gv8PwPBX666sfcDgc4sijPRqw4jTyobuNa2ch15L"
$env:SOLANA_RPC_URL = "https://api.devnet.solana.com"
$env:NODE_ENV = "development"

# Start server
Write-Host "🚀 Starting server..." -ForegroundColor Green
node dist/index.js
