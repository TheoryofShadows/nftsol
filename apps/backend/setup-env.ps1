# NFTSol Server Environment Setup Script for PowerShell
# This script sets all required environment variables for the NFTSol server

Write-Host "🚀 Setting up NFTSol Server Environment Variables..." -ForegroundColor Green

# =============================================================================
# APPLICATION CONFIGURATION
# =============================================================================
$env:NODE_ENV = "development"
$env:PORT = "3000"
$env:LOG_LEVEL = "info"

# =============================================================================
# SECURITY CONFIGURATION
# =============================================================================
# Generate random secrets if not already set
if (-not $env:SESSION_SECRET) {
    $env:SESSION_SECRET = "dev-session-secret-minimum-32-characters-long-production-ready-key"
}
if (-not $env:JWT_SECRET) {
    $env:JWT_SECRET = "dev-jwt-secret-minimum-32-characters-long-production-ready-key"
}

# =============================================================================
# DATABASE CONFIGURATION (Optional - leave empty for now)
# =============================================================================
$env:DATABASE_URL = ""
$env:REDIS_URL = ""

# =============================================================================
# PINATA IPFS CONFIGURATION (Optional)
# =============================================================================
$env:PINATA_API_KEY = ""
$env:PINATA_SECRET_KEY = ""
$env:PINATA_JWT = ""

# =============================================================================
# HELIUS SOLANA CONFIGURATION (Optional)
# =============================================================================
$env:HELIUS_API_KEY = ""
$env:HELIUS_RPC_URL = "https://api.mainnet-beta.solana.com"
$env:HELIUS_REST_URL = "https://api.helius.xyz/v0"

# =============================================================================
# SOLANA CONFIGURATION
# =============================================================================
$env:SOLANA_CLUSTER = "mainnet-beta"
$env:SOLANA_RPC_URL = "https://api.mainnet-beta.solana.com"

# =============================================================================
# CORS CONFIGURATION
# =============================================================================
$env:DEV_ALLOWED_ORIGINS = "http://localhost:3000,http://localhost:5173,http://localhost:5174"
$env:ALLOWED_ORIGINS = "https://nftsol.app,https://www.nftsol.app,https://nftsol-server-prod.onrender.com"

# =============================================================================
# RATE LIMITING
# =============================================================================
$env:RATE_LIMIT_WINDOW_MS = "900000"
$env:RATE_LIMIT_MAX_REQUESTS = "100"

# =============================================================================
# AWS S3 CONFIGURATION (Optional)
# =============================================================================
$env:AWS_ACCESS_KEY_ID = ""
$env:AWS_SECRET_ACCESS_KEY = ""
$env:S3_BACKUP_BUCKET = ""
$env:S3_BACKUP_REGION = "us-east-1"

# =============================================================================
# OPENAI CONFIGURATION (Optional)
# =============================================================================
$env:OPENAI_API_KEY = ""

# =============================================================================
# ADMIN CONFIGURATION
# =============================================================================
$env:ADMIN_IPS = "127.0.0.1,::1"

# =============================================================================
# CLOUT TOKEN CONFIGURATION (Optional)
# =============================================================================
$env:CLOUT_MINT = ""
$env:CLOUT_TREASURY = ""
$env:CLOUT_FEE_COLLECTOR = ""
$env:CLOUT_DEVELOPER = ""

# =============================================================================
# SECURITY HEADERS
# =============================================================================
$env:HELMET_CSP_ENABLED = "true"
$env:TRUST_PROXY = "1"

Write-Host "✅ Environment variables set!" -ForegroundColor Green
Write-Host "📋 Summary:" -ForegroundColor Cyan
Write-Host "   NODE_ENV: $env:NODE_ENV"
Write-Host "   PORT: $env:PORT"
Write-Host "   SESSION_SECRET: [SET]"
Write-Host "   JWT_SECRET: [SET]"
Write-Host "   DATABASE_URL: [EMPTY - Using in-memory]"
Write-Host "   REDIS_URL: [EMPTY - Using in-memory sessions]"
Write-Host ""
Write-Host "🚀 You can now run: npm start" -ForegroundColor Yellow
