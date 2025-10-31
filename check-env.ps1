# Simple CLOUT Environment Check
$clout = [Environment]::GetEnvironmentVariable("CLOUT_PROGRAM_ID", "User")
$vault = [Environment]::GetEnvironmentVariable("REWARDS_VAULT", "User")

Write-Host ""
Write-Host "CLOUT_PROGRAM_ID: $clout"
Write-Host "REWARDS_VAULT: $vault"
Write-Host ""

if ($clout -eq "62hWQAgAV4jugHSuZsMqzxZNVXaVLrbRpz3Sw58Z64Mw" -and $vault -eq "2KkNwFZbznAtYX1xjVS6e5BBqQnfaBuTjn42G4zJXAps") {
    Write-Host "OK: All variables are set correctly!" -ForegroundColor Green
} else {
    Write-Host "ERROR: Some variables need updating" -ForegroundColor Red
}

