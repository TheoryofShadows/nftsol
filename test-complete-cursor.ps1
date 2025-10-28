# 🧪 NFTSol Complete Cursor Testing Script
# Tests all endpoints with real Solana devnet integration

Write-Host "🚀 NFTSol Complete Cursor Testing Script" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green

# Configuration
$wallet = "11111111111111111111111111111112"  # System program address for testing
$platformWallet = "3EgKZgBNotS5tnYTaWuhEuzS9NLyMQww3C4Vaz5RDhM4"
$baseUrl = "http://localhost:3000"

Write-Host "`n🔧 Testing Configuration:" -ForegroundColor Yellow
Write-Host "   Test Wallet: $wallet"
Write-Host "   Platform Wallet: $platformWallet"
Write-Host "   Base URL: $baseUrl"

# Test function
function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Method = "GET",
        [string]$Uri,
        [object]$Body = $null
    )
    
    Write-Host "`n🧪 Testing $Name..." -ForegroundColor Cyan
    
    try {
        if ($Method -eq "GET") {
            $response = Invoke-RestMethod -Uri $Uri -Method Get
        } else {
            $jsonBody = if ($Body) { $Body | ConvertTo-Json } else { $null }
            $response = Invoke-RestMethod -Uri $Uri -Method $Method -Body $jsonBody -ContentType "application/json"
        }
        
        Write-Host "   ✅ Status: Success" -ForegroundColor Green
        Write-Host "   📊 Response: $($response | ConvertTo-Json -Depth 3)" -ForegroundColor White
        return $response
    }
    catch {
        Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# 1. Health Check
Test-Endpoint -Name "Health Check" -Uri "$baseUrl/healthz"

# 2. Programs
Test-Endpoint -Name "Programs" -Uri "$baseUrl/api/programs"

# 3. Wallet Verification
Test-Endpoint -Name "Wallet Verification" -Uri "$baseUrl/api/nfts/verify/$wallet"

# 4. Platform Wallet Balance
Test-Endpoint -Name "Platform Wallet Balance" -Uri "$baseUrl/api/nfts/balance/$platformWallet"

# 5. Test Wallet Balance
Test-Endpoint -Name "Test Wallet Balance" -Uri "$baseUrl/api/nfts/balance/$wallet"

# 6. NFT Minting
$mintPayload = @{
    toAddress = $wallet
    metadataUri = "https://example.com/nft-metadata.json"
    name = "Cursor Test NFT"
    description = "Test NFT minted via Cursor"
}
Test-Endpoint -Name "NFT Minting" -Method "POST" -Uri "$baseUrl/api/nfts/mint" -Body $mintPayload

# 7. Create Withdrawal
$withdrawPayload = @{
    userId = "cursorUser123"
    toAddress = $wallet
    amountSol = 0.01
}
Test-Endpoint -Name "Create Withdrawal" -Method "POST" -Uri "$baseUrl/api/wallets/withdraw" -Body $withdrawPayload

# 8. List Withdrawals
Test-Endpoint -Name "List Withdrawals" -Uri "$baseUrl/api/wallets/withdraw"

# 9. Admin Endpoints (should require auth)
Test-Endpoint -Name "Admin Withdrawals" -Uri "$baseUrl/api/admin/withdrawals"

Write-Host "`n🎉 Complete Testing Finished!" -ForegroundColor Green
Write-Host "`n📋 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Fund platform wallet: https://faucet.solana.com/"
Write-Host "2. Deploy to Render with environment variables"
Write-Host "3. Test real NFT minting and SOL withdrawals"
Write-Host "4. Check transactions on Solana Explorer"
