# Kill existing Node processes and start fresh
Write-Host "Stopping any existing Node processes..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

Write-Host "Setting CLOUT environment variables..." -ForegroundColor Cyan
$env:CLOUT_PROGRAM_ID = "62hWQAgAV4jugHSuZsMqzxZNVXaVLrbRpz3Sw58Z64Mw"
$env:REWARDS_VAULT = "2KkNwFZbznAtYX1xjVS6e5BBqQnfaBuTjn42G4zJXAps"
$env:REWARDS_OWNER = "3XEs3MJ8PFiqTTqrK6RAkK9vt95jQQ1hKNNKHiE6jJ3o"
$env:PORT = "3002"
$env:SOLANA_RPC_URL = "https://api.mainnet-beta.solana.com"
$env:PLATFORM_SECRET_KEY_BASE58 = "3B495YFvfjWzoKwmJDpwycFzksJZPAJcGozq45ycRMiHDnpgdXNEnyNdTG5dd8kpgdHUQdCeCZAWUFvtQk6BwThX"

Write-Host "CLOUT_PROGRAM_ID: $env:CLOUT_PROGRAM_ID" -ForegroundColor Green
Write-Host "REWARDS_VAULT: $env:REWARDS_VAULT" -ForegroundColor Green
Write-Host "REWARDS_OWNER: $env:REWARDS_OWNER" -ForegroundColor Green
Write-Host "PORT: $env:PORT" -ForegroundColor Green
Write-Host "Platform Key: Loaded" -ForegroundColor Green
Write-Host ""
Write-Host "Starting server on port $env:PORT..." -ForegroundColor Cyan
Write-Host ""

node dist/index.js

