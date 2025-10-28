# NFTSol Withdrawal Test Script (PowerShell)
# Test the complete withdrawal flow on devnet

$BASE_URL = "http://localhost:3000"
$DESTINATION_ADDRESS = "11111111111111111111111111111112"  # System Program (safe test address)

Write-Host "🚀 Testing NFTSol Withdrawal System" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green

# Test 1: Create withdrawal request
Write-Host "📝 Test 1: Creating withdrawal request..." -ForegroundColor Yellow
$body = @{
    amount_sol = 0.01
    to_address = $DESTINATION_ADDRESS
    request_token = "test-token-123"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/api/wallets/withdraw" -Method POST -Body $body -ContentType "application/json"
    Write-Host "Response: $($response | ConvertTo-Json -Depth 3)" -ForegroundColor Cyan
    
    $WITHDRAWAL_ID = $response.withdrawal.id
    if (-not $WITHDRAWAL_ID) {
        Write-Host "❌ Failed to create withdrawal request" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Withdrawal created with ID: $WITHDRAWAL_ID" -ForegroundColor Green
} catch {
    Write-Host "❌ Error creating withdrawal: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 2: List user withdrawals
Write-Host ""
Write-Host "📋 Test 2: Listing user withdrawals..." -ForegroundColor Yellow
try {
    $withdrawals = Invoke-RestMethod -Uri "$BASE_URL/api/wallets/withdraw" -Method GET
    Write-Host "Withdrawals: $($withdrawals | ConvertTo-Json -Depth 3)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Error listing withdrawals: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Admin - List pending withdrawals
Write-Host ""
Write-Host "👨‍💼 Test 3: Admin - Listing pending withdrawals..." -ForegroundColor Yellow
try {
    $pending = Invoke-RestMethod -Uri "$BASE_URL/api/admin/withdrawals?status=pending" -Method GET
    Write-Host "Pending withdrawals: $($pending | ConvertTo-Json -Depth 3)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Error listing pending withdrawals: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Admin - Approve withdrawal
Write-Host ""
Write-Host "✅ Test 4: Admin - Approving withdrawal..." -ForegroundColor Yellow
try {
    $approveResponse = Invoke-RestMethod -Uri "$BASE_URL/api/admin/withdrawals/$WITHDRAWAL_ID/approve" -Method POST
    Write-Host "Approve response: $($approveResponse | ConvertTo-Json -Depth 3)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Error approving withdrawal: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Admin - Process withdrawal (sends on-chain)
Write-Host ""
Write-Host "🔄 Test 5: Admin - Processing withdrawal..." -ForegroundColor Yellow
try {
    $processResponse = Invoke-RestMethod -Uri "$BASE_URL/api/admin/withdrawals/$WITHDRAWAL_ID/process" -Method POST
    Write-Host "Process response: $($processResponse | ConvertTo-Json -Depth 3)" -ForegroundColor Cyan
    
    $TX_SIG = $processResponse.txSig
    if ($TX_SIG) {
        Write-Host "✅ Withdrawal processed! Transaction: $TX_SIG" -ForegroundColor Green
        Write-Host "🔍 View on Solana Explorer: https://explorer.solana.com/tx/$TX_SIG?cluster=devnet" -ForegroundColor Blue
    } else {
        Write-Host "❌ Failed to process withdrawal" -ForegroundColor Red
    }
}
} catch {
    Write-Host "❌ Error processing withdrawal: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 6: Check withdrawal status
Write-Host ""
Write-Host "📊 Test 6: Checking withdrawal status..." -ForegroundColor Yellow
try {
    $status = Invoke-RestMethod -Uri "$BASE_URL/api/wallets/withdraw/$WITHDRAWAL_ID" -Method GET
    Write-Host "Withdrawal status: $($status | ConvertTo-Json -Depth 3)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Error checking withdrawal status: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎉 Withdrawal testing complete!" -ForegroundColor Green
Write-Host "Check the Solana Explorer link above to verify the transaction on devnet." -ForegroundColor Blue
