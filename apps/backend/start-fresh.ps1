# Kill existing Node processes and start fresh
Write-Host "Stopping any existing Node processes..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

Write-Host "Loading environment variables from .env..." -ForegroundColor Cyan
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
}

# Set CLOUT defaults only if not already set
if (!$env:CLOUT_PROGRAM_ID) {
    $env:CLOUT_PROGRAM_ID = "62hWQAgAV4jugHSuZsMqzxZNVXaVLrbRpz3Sw58Z64Mw"
}
if (!$env:REWARDS_VAULT) {
    $env:REWARDS_VAULT = "2KkNwFZbznAtYX1xjVS6e5BBqQnfaBuTjn42G4zJXAps"
}
if (!$env:PORT) {
    $env:PORT = "3002"
}
if (!$env:SOLANA_RPC_URL) {
    $env:SOLANA_RPC_URL = "https://api.mainnet-beta.solana.com"
}

if (!$env:PLATFORM_SECRET_KEY_BASE58) {
    Write-Host "   ❌ ERROR: PLATFORM_SECRET_KEY_BASE58 not set!" -ForegroundColor Red
    Write-Host "   Please set it in .env file or environment variables." -ForegroundColor Yellow
    exit 1
}

Write-Host "CLOUT_PROGRAM_ID: $env:CLOUT_PROGRAM_ID" -ForegroundColor Green
Write-Host "REWARDS_VAULT: $env:REWARDS_VAULT" -ForegroundColor Green
Write-Host "REWARDS_OWNER: $env:REWARDS_OWNER" -ForegroundColor Green
Write-Host "PORT: $env:PORT" -ForegroundColor Green
Write-Host "Platform Key: Loaded" -ForegroundColor Green
Write-Host ""
Write-Host "Starting server on port $env:PORT..." -ForegroundColor Cyan
Write-Host ""

node dist/index.js

