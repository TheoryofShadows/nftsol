# NFTSol Environment Setup Script
Write-Host "🔧 Setting up NFTSol environment variables..." -ForegroundColor Green

# Set Pinata API Key
$env:PINATA_API_KEY = "b113360c6243fde9f5b0"
Write-Host "✅ PINATA_API_KEY set" -ForegroundColor Green

# Set Session Secret
$env:SESSION_SECRET = "nftsol-development-secret-key-2024"
Write-Host "✅ SESSION_SECRET set" -ForegroundColor Green

# Set Database URL (optional)
$env:DATABASE_URL = "postgresql://localhost:5432/nftsol_dev"
Write-Host "✅ DATABASE_URL set" -ForegroundColor Green

# Set Redis URL (optional)
$env:REDIS_URL = "redis://localhost:6379"
Write-Host "✅ REDIS_URL set" -ForegroundColor Green

# Set Node Environment
$env:NODE_ENV = "development"
Write-Host "✅ NODE_ENV set to development" -ForegroundColor Green

Write-Host "🎉 Environment variables configured!" -ForegroundColor Cyan
Write-Host "📝 Note: You still need to get your PINATA_SECRET_KEY from pinata.cloud" -ForegroundColor Yellow
Write-Host "🔗 Go to: https://pinata.cloud -> API Keys -> Copy Secret Key" -ForegroundColor Yellow

Write-Host ""
Write-Host "🚀 Ready to start server with: npm run dev:server" -ForegroundColor Green