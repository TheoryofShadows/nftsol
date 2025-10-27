# NFTSol Environment Setup Script
# This script sets up all required environment variables for development
# SECURITY: No hardcoded secrets - all values must be set in environment

Write-Host "🔧 Setting up NFTSol environment variables..." -ForegroundColor Green

# Validate required environment variables
$requiredVars = @(
    "PINATA_API_KEY",
    "PINATA_SECRET_KEY", 
    "HELIUS_API_KEY"
)

$missingVars = @()
foreach ($var in $requiredVars) {
    if (-not (Get-Item "env:$var" -ErrorAction SilentlyContinue)) {
        $missingVars += $var
    }
}

if ($missingVars.Count -gt 0) {
    Write-Host "❌ Missing required environment variables:" -ForegroundColor Red
    foreach ($var in $missingVars) {
        Write-Host "   - $var" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "🔐 SECURITY: Set these in your environment before running this script:" -ForegroundColor Yellow
    Write-Host "   Windows: setx PINATA_API_KEY 'your_key_here'" -ForegroundColor White
    Write-Host "   PowerShell: `$env:PINATA_API_KEY = 'your_key_here'" -ForegroundColor White
    Write-Host ""
    Write-Host "📝 Get your API keys from:" -ForegroundColor Cyan
    Write-Host "   - PINATA: https://pinata.cloud -> API Keys" -ForegroundColor White
    Write-Host "   - HELIUS: https://helius.xyz -> Get API Key" -ForegroundColor White
    exit 1
}

# Set development environment variables
$env:NODE_ENV = "development"
Write-Host "✅ NODE_ENV set to development" -ForegroundColor Green

# Set Session Secret (generate secure random if not set)
if (-not $env:SESSION_SECRET) {
    $env:SESSION_SECRET = [System.Web.Security.Membership]::GeneratePassword(64, 10)
    Write-Host "✅ SESSION_SECRET generated (secure random)" -ForegroundColor Green
} else {
    Write-Host "✅ SESSION_SECRET already set" -ForegroundColor Green
}

# Set Database URL (development)
$env:DATABASE_URL = "postgresql://localhost:5432/nftsol_dev"
Write-Host "✅ DATABASE_URL set" -ForegroundColor Green

# Set Redis URL (development)
$env:REDIS_URL = "redis://localhost:6379"
Write-Host "✅ REDIS_URL set" -ForegroundColor Green

# Validate API keys are set
Write-Host "✅ PINATA_API_KEY validated" -ForegroundColor Green
Write-Host "✅ PINATA_SECRET_KEY validated" -ForegroundColor Green
Write-Host "✅ HELIUS_API_KEY validated" -ForegroundColor Green

# Optional API keys
if ($env:OPENAI_API_KEY) {
    Write-Host "✅ OPENAI_API_KEY set" -ForegroundColor Green
} else {
    Write-Host "⚠️ OPENAI_API_KEY not set (optional)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Environment variables configured securely!" -ForegroundColor Cyan
Write-Host "🔒 All secrets loaded from environment (no hardcoded values)" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Ready to start development:" -ForegroundColor Green
Write-Host "   Server: npm run dev:server" -ForegroundColor White
Write-Host "   Client: npm run dev:client" -ForegroundColor White
Write-Host "   Both:   npm run dev" -ForegroundColor White
