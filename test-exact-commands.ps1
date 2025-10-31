# 🎯 EXACT COMMANDS FROM YOUR REQUEST
# This file shows the exact commands you mentioned, now with a valid wallet address

Write-Host "`n════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Echo API - Exact Commands with Valid Wallet" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan

# ============================================================================
# VALID WALLET ADDRESS
# ============================================================================
Write-Host "`n✅ Using REAL Solana Public Key (from your .env):" -ForegroundColor Green
$WALLET = "6133iAoisDPsgbttQCXEZhz77rxNoG3sfdx8Pop1zC1v"
Write-Host "   $WALLET" -ForegroundColor Yellow
Write-Host "   ↑ This is a valid 44-character base58 Solana address" -ForegroundColor Gray

# ============================================================================
# COMMAND 1: MINT
# ============================================================================
Write-Host "`n════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "[COMMAND 1] Mint Echo NFT" -ForegroundColor White
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan

Write-Host "`nEndpoint: POST http://localhost:3000/api/echo/mint" -ForegroundColor Gray
Write-Host "Purpose:  Prepare data for minting an Echo NFT from Internet Archive" -ForegroundColor Gray

Write-Host "`n▶ Running command..." -ForegroundColor Yellow

try {
    $response1 = Invoke-WebRequest http://localhost:3000/api/echo/mint `
      -Method POST -ContentType application/json `
      -Body (@{ iaId = "apollo11"; walletAddress = $WALLET } | ConvertTo-Json) `
      -UseBasicParsing
    
    Write-Host "✅ SUCCESS!" -ForegroundColor Green
    Write-Host "Status: $($response1.StatusCode)" -ForegroundColor Green
    Write-Host "`nResponse:" -ForegroundColor Cyan
    $response1.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10 | Write-Host
} catch {
    Write-Host "❌ FAILED" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $errorBody = $reader.ReadToEnd()
        Write-Host "`nError Details:" -ForegroundColor Yellow
        Write-Host $errorBody -ForegroundColor Red
    }
}

Start-Sleep -Seconds 2

# ============================================================================
# COMMAND 2: ADD ECHO
# ============================================================================
Write-Host "`n════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "[COMMAND 2] Add Echo to Ledger" -ForegroundColor White
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan

Write-Host "`nEndpoint: POST http://localhost:3000/api/echo/add" -ForegroundColor Gray
Write-Host "Purpose:  Add a new echo entry to a ledger with verification" -ForegroundColor Gray

Write-Host "`n▶ Running command..." -ForegroundColor Yellow

try {
    $response2 = Invoke-WebRequest http://localhost:3000/api/echo/add `
      -Method POST -ContentType application/json `
      -Body (@{ 
        ledgerId = "TEST_LEDGER"
        echoData = "First echo"
        echoType = "Text"
        contributorWallet = $WALLET 
      } | ConvertTo-Json) `
      -UseBasicParsing
    
    Write-Host "✅ SUCCESS!" -ForegroundColor Green
    Write-Host "Status: $($response2.StatusCode)" -ForegroundColor Green
    Write-Host "`nResponse:" -ForegroundColor Cyan
    $response2.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10 | Write-Host
} catch {
    Write-Host "❌ FAILED" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $errorBody = $reader.ReadToEnd()
        Write-Host "`nError Details:" -ForegroundColor Yellow
        Write-Host $errorBody -ForegroundColor Red
    }
}

# ============================================================================
# SUMMARY
# ============================================================================
Write-Host "`n════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Summary" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan

Write-Host "`n📋 What we tested:" -ForegroundColor White
Write-Host "   1. Mint Echo NFT from Internet Archive item 'apollo11'" -ForegroundColor Gray
Write-Host "   2. Add a text echo to TEST_LEDGER" -ForegroundColor Gray

Write-Host "`n🔑 Wallet used:" -ForegroundColor White
Write-Host "   $WALLET" -ForegroundColor Cyan
Write-Host "   (Platform wallet from .env file)" -ForegroundColor Gray

Write-Host "`n💡 Important Notes:" -ForegroundColor Yellow
Write-Host "   • Both commands use the SAME valid Solana public key" -ForegroundColor White
Write-Host "   • The 400 errors you saw before were from using placeholder strings" -ForegroundColor White
Write-Host "   • These commands should work if your server is running on port 3000" -ForegroundColor White

Write-Host "`n📚 To use a different wallet:" -ForegroundColor White
Write-Host "   1. Get your address from Phantom/Backpack/Solflare" -ForegroundColor Gray
Write-Host "   2. Replace the `$WALLET value at the top of this script" -ForegroundColor Gray
Write-Host "   3. Make sure it's 43-44 characters and base58 encoded" -ForegroundColor Gray

Write-Host "`n🎯 Next steps if both commands succeeded:" -ForegroundColor Green
Write-Host "   ✓ Your Echo API is fully functional" -ForegroundColor White
Write-Host "   ✓ Wallet validation is working correctly" -ForegroundColor White
Write-Host "   ✓ You can now integrate with your frontend" -ForegroundColor White
Write-Host "   ✓ See ECHO_TEST_README.md for more examples" -ForegroundColor White

Write-Host "`n🔧 If commands failed:" -ForegroundColor Red
Write-Host "   1. Check if server is running: node apps/backend/dist/index.js" -ForegroundColor White
Write-Host "   2. Verify port 3000 is accessible: http://localhost:3000" -ForegroundColor White
Write-Host "   3. Run .\validate-wallet.ps1 to check your wallet address" -ForegroundColor White
Write-Host "   4. Check server logs for detailed error messages" -ForegroundColor White

Write-Host "`n════════════════════════════════════════════════════════════`n" -ForegroundColor Cyan
