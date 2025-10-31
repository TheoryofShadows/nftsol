# Echo API Test Script
# This script tests the Echo API endpoints with a valid Solana wallet address

# Color output functions
function Write-Success { param($msg) Write-Host $msg -ForegroundColor Green }
function Write-Error { param($msg) Write-Host $msg -ForegroundColor Red }
function Write-Info { param($msg) Write-Host $msg -ForegroundColor Cyan }
function Write-Warning { param($msg) Write-Host $msg -ForegroundColor Yellow }

# Configuration
$API_BASE = "http://localhost:3000/api/echo"

# Use the platform wallet from .env (this is a valid Solana public key)
$WALLET = "6133iAoisDPsgbttQCXEZhz77rxNoG3sfdx8Pop1zC1v"

Write-Info "`n========================================="
Write-Info "Echo API Test Suite"
Write-Info "========================================="
Write-Info "Using Wallet: $WALLET"
Write-Info "API Base URL: $API_BASE"
Write-Info "========================================="

# Test 1: Mint Echo NFT
Write-Info "`n[TEST 1] Minting Echo NFT..."
Write-Info "Endpoint: POST $API_BASE/mint"

try {
    $mintBody = @{
        iaId = "apollo11"
        walletAddress = $WALLET
    } | ConvertTo-Json

    Write-Info "Request Body:"
    Write-Host $mintBody -ForegroundColor Yellow

    $mintResponse = Invoke-WebRequest `
        -Uri "$API_BASE/mint" `
        -Method POST `
        -ContentType "application/json" `
        -Body $mintBody `
        -UseBasicParsing

    Write-Success "✓ Mint successful!"
    Write-Info "Status Code: $($mintResponse.StatusCode)"
    Write-Info "Response:"
    $mintResponse.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10 | Write-Host -ForegroundColor Green
} catch {
    Write-Error "✗ Mint failed!"
    Write-Error "Error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Info "Response Body:"
        Write-Host $responseBody -ForegroundColor Red
    }
}

# Wait a moment between requests
Start-Sleep -Seconds 2

# Test 2: Add Echo
Write-Info "`n[TEST 2] Adding Echo to Ledger..."
Write-Info "Endpoint: POST $API_BASE/add"

try {
    $addBody = @{
        ledgerId = "TEST_LEDGER_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
        echoData = "First echo from PowerShell test - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
        echoType = "Text"
        contributorWallet = $WALLET
    } | ConvertTo-Json

    Write-Info "Request Body:"
    Write-Host $addBody -ForegroundColor Yellow

    $addResponse = Invoke-WebRequest `
        -Uri "$API_BASE/add" `
        -Method POST `
        -ContentType "application/json" `
        -Body $addBody `
        -UseBasicParsing

    Write-Success "✓ Add echo successful!"
    Write-Info "Status Code: $($addResponse.StatusCode)"
    Write-Info "Response:"
    $addResponse.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10 | Write-Host -ForegroundColor Green
} catch {
    Write-Error "✗ Add echo failed!"
    Write-Error "Error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Info "Response Body:"
        Write-Host $responseBody -ForegroundColor Red
    }
}

# Wait a moment between requests
Start-Sleep -Seconds 2

# Test 3: Add Echo with Custom Data
Write-Info "`n[TEST 3] Adding Echo with Custom Metadata..."
Write-Info "Endpoint: POST $API_BASE/add"

try {
    $customBody = @{
        ledgerId = "APOLLO_MISSION"
        echoData = @{
            message = "Houston, Tranquility Base here. The Eagle has landed."
            timestamp = "1969-07-20T20:17:40Z"
            location = "Mare Tranquillitatis"
            speaker = "Neil Armstrong"
        } | ConvertTo-Json
        echoType = "JSON"
        contributorWallet = $WALLET
    } | ConvertTo-Json

    Write-Info "Request Body:"
    Write-Host $customBody -ForegroundColor Yellow

    $customResponse = Invoke-WebRequest `
        -Uri "$API_BASE/add" `
        -Method POST `
        -ContentType "application/json" `
        -Body $customBody `
        -UseBasicParsing

    Write-Success "✓ Add custom echo successful!"
    Write-Info "Status Code: $($customResponse.StatusCode)"
    Write-Info "Response:"
    $customResponse.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10 | Write-Host -ForegroundColor Green
} catch {
    Write-Error "✗ Add custom echo failed!"
    Write-Error "Error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Info "Response Body:"
        Write-Host $responseBody -ForegroundColor Red
    }
}

# Summary
Write-Info "`n========================================="
Write-Info "Test Suite Complete!"
Write-Info "========================================="
Write-Info ""
Write-Warning "Next Steps:"
Write-Host "  1. Check the responses above for any errors" -ForegroundColor White
Write-Host "  2. If you see 400 errors about 'Invalid wallet address', the validation is still rejecting valid keys" -ForegroundColor White
Write-Host "  3. To use a different wallet, edit this script and change the `$WALLET variable" -ForegroundColor White
Write-Host "  4. To get your own wallet address:" -ForegroundColor White
Write-Host "     - Phantom: Open extension → Settings → Copy Address" -ForegroundColor White
Write-Host "     - Backpack: Open extension → Profile → Copy Address" -ForegroundColor White
Write-Info ""
