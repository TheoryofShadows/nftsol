# Final CLOUT Verification - Run in PowerShell after setup
Write-Host "`n=== Final CLOUT Setup Verification ===" -ForegroundColor Cyan

$CLOUT_MINT = "62hWQAgAV4jugHSuZsMqzxZNVXaVLrbRpz3Sw58Z64Mw"
$REWARDS_VAULT = "2KkNwFZbznAtYX1xjVS6e5BBqQnfaBuTjn42G4zJXAps"

# Check environment variables
Write-Host "`n1. Environment Variables:" -ForegroundColor Yellow
$cloutProgramId = [Environment]::GetEnvironmentVariable("CLOUT_PROGRAM_ID", "User")
$rewardsVault = [Environment]::GetEnvironmentVariable("REWARDS_VAULT", "User")

$allSet = $true

if ($cloutProgramId -eq $CLOUT_MINT) {
    Write-Host "   ✓ CLOUT_PROGRAM_ID = $cloutProgramId" -ForegroundColor Green
} else {
    $display = if ($cloutProgramId) { $cloutProgramId } else { "NOT SET" }
    Write-Host "   ✗ CLOUT_PROGRAM_ID = $display (should be $CLOUT_MINT)" -ForegroundColor Red
    $allSet = $false
}

if ($rewardsVault -eq $REWARDS_VAULT) {
    Write-Host "   ✓ REWARDS_VAULT = $rewardsVault" -ForegroundColor Green
} else {
    $display = if ($rewardsVault) { $rewardsVault } else { "NOT SET" }
    Write-Host "   ✗ REWARDS_VAULT = $display (should be $REWARDS_VAULT)" -ForegroundColor Red
    $allSet = $false
}

# Summary
Write-Host "`n=== Summary ===" -ForegroundColor Cyan
if ($allSet) {
    Write-Host "✓ All environment variables are set correctly!" -ForegroundColor Green
    Write-Host "✓ CLOUT setup is complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next: Restart your backend to pick up these variables:" -ForegroundColor Yellow
    Write-Host "  node apps\backend\dist\index.js" -ForegroundColor White
} else {
    Write-Host "✗ Some variables are missing. Run .\set-clout-env.ps1 to set them." -ForegroundColor Red
}

Write-Host ""

