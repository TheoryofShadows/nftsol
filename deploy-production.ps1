# 🚀 NFTSol Production Deployment Script
Write-Host "🚀 NFTSol Production Deployment Script" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green

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
$env:PLATFORM_SECRET_KEY_BASE58 = "YOUR_PLATFORM_SECRET_KEY_HERE"
$env:SOLANA_RPC_URL = "https://api.devnet.solana.com"
$env:NODE_ENV = "development"
$env:WITHDRAWALS_ENABLED = "true"
$env:DAILY_WITHDRAWAL_LIMIT_SOL = "10"
$env:MAX_WITHDRAWAL_SOL = "5"
$env:RATE_LIMIT_WINDOW_MINUTES = "15"
$env:RATE_LIMIT_MAX_REQUESTS = "5"

# Run complete test suite
Write-Host "🧪 Running complete test suite..." -ForegroundColor Yellow
node cursor-go-live.js

Write-Host "✅ Production deployment ready!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Deploy to Render with environment variables" -ForegroundColor White
Write-Host "2. Fund platform wallet: 3EgKZgBNotS5tnYTaWuhEuzS9NLyMQww3C4Vaz5RDhM4" -ForegroundColor White
Write-Host "3. Deploy frontend to Netlify" -ForegroundColor White
Write-Host "4. Test complete workflow" -ForegroundColor White
Write-Host "5. Launch your NFT marketplace!" -ForegroundColor White
