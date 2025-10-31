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

# Load environment variables from .env file
Write-Host "🔑 Loading environment variables..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        if ($_ -match "^([^#][^=]+)=(.*)$") {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            if ($key -and $value) {
                [Environment]::SetEnvironmentVariable($key, $value, "Process")
            }
        }
    }
    Write-Host "   ✅ Environment variables loaded from .env" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  .env file not found. Using system environment variables." -ForegroundColor Yellow
    Write-Host "   Please ensure PLATFORM_SECRET_KEY_BASE58 is set in your environment." -ForegroundColor Yellow
}

# Set defaults only if not already set
if (!$env:SOLANA_RPC_URL) {
    $env:SOLANA_RPC_URL = "https://api.devnet.solana.com"
}
if (!$env:NODE_ENV) {
    $env:NODE_ENV = "development"
}

# Start server
Write-Host "🚀 Starting server..." -ForegroundColor Green
node dist/index.js
