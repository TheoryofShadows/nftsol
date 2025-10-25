# NFTSol Environment Setup Script
# This script sets up all required environment variables for development

Write-Host "🔧 Setting up NFTSol environment variables..." -ForegroundColor Green

# Set Pinata API Key (you already have this)
$env:PINATA_API_KEY = "b113360c6243fde9f5b0"
Write-Host "✅ PINATA_API_KEY set" -ForegroundColor Green

# Set Session Secret
$env:SESSION_SECRET = "nftsol-development-secret-key-2024"
Write-Host "✅ SESSION_SECRET set" -ForegroundColor Green

# Set Database URL (development)
$env:DATABASE_URL = "postgresql://localhost:5432/nftsol_dev"
Write-Host "✅ DATABASE_URL set" -ForegroundColor Green

# Set Redis URL (development)
$env:REDIS_URL = "redis://localhost:6379"
Write-Host "✅ REDIS_URL set" -ForegroundColor Green

# Set Node Environment
$env:NODE_ENV = "development"
Write-Host "✅ NODE_ENV set to development" -ForegroundColor Green

# Set Helius API Key (optional - get from helius.xyz)
$env:HELIUS_API_KEY = "your-helius-api-key-here"
Write-Host "⚠️ HELIUS_API_KEY set to placeholder" -ForegroundColor Yellow

# Set OpenAI API Key (optional)
$env:OPENAI_API_KEY = "your-openai-api-key-here"
Write-Host "⚠️ OPENAI_API_KEY set to placeholder" -ForegroundColor Yellow

Write-Host ""
Write-Host "🎉 Environment variables configured!" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 IMPORTANT: You still need to get these API keys:" -ForegroundColor Yellow
Write-Host "1. PINATA_SECRET_KEY: https://pinata.cloud -> API Keys" -ForegroundColor White
Write-Host "2. HELIUS_API_KEY: https://helius.xyz -> Get API Key" -ForegroundColor White
Write-Host "3. OPENAI_API_KEY: https://platform.openai.com -> API Keys" -ForegroundColor White
Write-Host ""
Write-Host "💡 To set them, run:" -ForegroundColor Cyan
Write-Host '   $env:PINATA_SECRET_KEY = "your_secret_key_here"' -ForegroundColor White
Write-Host '   $env:HELIUS_API_KEY = "your_helius_key_here"' -ForegroundColor White
Write-Host '   $env:OPENAI_API_KEY = "your_openai_key_here"' -ForegroundColor White
Write-Host ""
Write-Host "🚀 Ready to start server with: npm run dev:server" -ForegroundColor Green
