# Simple CLOUT Environment Check
$clout = [Environment]::GetEnvironmentVariable("CLOUT_PROGRAM_ID", "User")
$vault = [Environment]::GetEnvironmentVariable("REWARDS_VAULT", "User")

Write-Host ""
Write-Host "CLOUT_PROGRAM_ID: $clout"
Write-Host "REWARDS_VAULT: $vault"
Write-Host ""

if ($clout -eq "<YOUR_CLOUT_MINT_ADDRESS>" -and $vault -eq "<YOUR_REWARDS_VAULT_ADDRESS>") {
    Write-Host "OK: All variables are set correctly!" -ForegroundColor Green
} else {
    Write-Host "ERROR: Some variables need updating" -ForegroundColor Red
}

