# Start server with CLOUT configuration
Write-Host "Setting CLOUT environment variables..." -ForegroundColor Cyan

$env:CLOUT_PROGRAM_ID = "<YOUR_CLOUT_MINT_ADDRESS>"
$env:REWARDS_VAULT = "<YOUR_REWARDS_VAULT_ADDRESS>"
$env:PORT = "3002"
$env:SOLANA_RPC_URL = "https://api.mainnet-beta.solana.com"

Write-Host "CLOUT_PROGRAM_ID: $env:CLOUT_PROGRAM_ID" -ForegroundColor Green
Write-Host "REWARDS_VAULT: $env:REWARDS_VAULT" -ForegroundColor Green
Write-Host "PORT: $env:PORT" -ForegroundColor Green
Write-Host ""
Write-Host "Starting server..." -ForegroundColor Cyan
Write-Host ""

node dist/index.js

