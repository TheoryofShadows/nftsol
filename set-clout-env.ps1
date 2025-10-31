# Set CLOUT environment variables
# Run this AFTER the ATA is created successfully

Write-Host "=== Setting CLOUT Environment Variables ===" -ForegroundColor Cyan

[Environment]::SetEnvironmentVariable("CLOUT_PROGRAM_ID","62hWQAgAV4jugHSuZsMqzxZNVXaVLrbRpz3Sw58Z64Mw","User")
[Environment]::SetEnvironmentVariable("REWARDS_VAULT","2KkNwFZbznAtYX1xjVS6e5BBqQnfaBuTjn42G4zJXAps","User")

Write-Host ""
Write-Host "✓ CLOUT_PROGRAM_ID set" -ForegroundColor Green
Write-Host "✓ REWARDS_VAULT set" -ForegroundColor Green
Write-Host ""
Write-Host "Verifying..." -ForegroundColor Yellow
Write-Host "CLOUT_PROGRAM_ID: $([Environment]::GetEnvironmentVariable('CLOUT_PROGRAM_ID', 'User'))"
Write-Host "REWARDS_VAULT: $([Environment]::GetEnvironmentVariable('REWARDS_VAULT', 'User'))"
Write-Host ""
Write-Host "✅ Done! Restart your backend to pick up these variables." -ForegroundColor Green

