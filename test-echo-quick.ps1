# Quick Echo API Test
# Simple one-liner tests for Echo API

$WALLET = "6133iAoisDPsgbttQCXEZhz77rxNoG3sfdx8Pop1zC1v"

Write-Host "`n=== Testing Mint Endpoint ===" -ForegroundColor Cyan
Invoke-WebRequest http://localhost:3000/api/echo/mint `
  -Method POST -ContentType application/json `
  -Body (@{ iaId = "apollo11"; walletAddress = $WALLET } | ConvertTo-Json)

Write-Host "`n=== Testing Add Echo Endpoint ===" -ForegroundColor Cyan
Invoke-WebRequest http://localhost:3000/api/echo/add `
  -Method POST -ContentType application/json `
  -Body (@{ ledgerId = "TEST_LEDGER"; echoData = "First echo"; echoType = "Text"; contributorWallet = $WALLET } | ConvertTo-Json)
