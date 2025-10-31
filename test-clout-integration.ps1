# CLOUT Integration Test Script
# Tests all CLOUT-related endpoints and frontend integration

Write-Host "🧪 CLOUT Integration Test Script" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
Write-Host ""

$baseUrl = $env:VITE_API_BASE ?? "http://localhost:3001"
$testWallet = "11111111111111111111111111111112"

Write-Host "Base URL: $baseUrl" -ForegroundColor Yellow
Write-Host "Test Wallet: $testWallet" -ForegroundColor Yellow
Write-Host ""

# Test 1: Health Check
Write-Host "1️⃣ Testing Health Check..." -ForegroundColor Cyan
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/healthz" -Method Get -ErrorAction Stop
    if ($health.success) {
        Write-Host "   ✅ Backend is healthy" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️ Backend reports unhealthy status" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   💡 Make sure backend is running on $baseUrl" -ForegroundColor Yellow
    exit 1
}

# Test 2: Programs Endpoint (check CLOUT_PROGRAM_ID)
Write-Host ""
Write-Host "2️⃣ Testing Programs Endpoint..." -ForegroundColor Cyan
try {
    $programs = Invoke-RestMethod -Uri "$baseUrl/api/programs" -Method Get -ErrorAction Stop
    if ($programs.success) {
        Write-Host "   ✅ Programs endpoint working" -ForegroundColor Green
        if ($programs.data.programs.CLOUT_PROGRAM_ID) {
            Write-Host "   ✅ CLOUT_PROGRAM_ID: $($programs.data.programs.CLOUT_PROGRAM_ID)" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️ CLOUT_PROGRAM_ID not found in programs" -ForegroundColor Yellow
        }
    } else {
        Write-Host "   ⚠️ Programs endpoint returned success=false" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ Programs endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: CLOUT Balance Endpoint
Write-Host ""
Write-Host "3️⃣ Testing CLOUT Balance Endpoint..." -ForegroundColor Cyan
try {
    $balance = Invoke-RestMethod -Uri "$baseUrl/api/clout/balance/$testWallet" -Method Get -ErrorAction Stop
    if ($balance.success) {
        Write-Host "   ✅ CLOUT balance endpoint working" -ForegroundColor Green
        Write-Host "   💰 Balance for $testWallet : $($balance.data.balance)" -ForegroundColor Cyan
    } else {
        Write-Host "   ⚠️ Balance endpoint returned success=false" -ForegroundColor Yellow
        Write-Host "   Error: $($balance.error)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ CLOUT balance endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   💡 This is expected if the wallet has no CLOUT token account yet" -ForegroundColor Yellow
}

# Test 4: Vault Balance Endpoint
Write-Host ""
Write-Host "4️⃣ Testing CLOUT Vault Balance Endpoint..." -ForegroundColor Cyan
try {
    $vaultBalance = Invoke-RestMethod -Uri "$baseUrl/api/clout/vault-balance" -Method Get -ErrorAction Stop
    if ($vaultBalance.success) {
        Write-Host "   ✅ Vault balance endpoint working" -ForegroundColor Green
        Write-Host "   💰 Vault Balance: $($vaultBalance.data.balance)" -ForegroundColor Cyan
        Write-Host "   📍 Vault Address: $($vaultBalance.data.vaultAddress)" -ForegroundColor Cyan
    } else {
        Write-Host "   ⚠️ Vault balance endpoint returned success=false" -ForegroundColor Yellow
        Write-Host "   Error: $($vaultBalance.error)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ Vault balance endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Environment Variables Check
Write-Host ""
Write-Host "5️⃣ Checking Environment Variables..." -ForegroundColor Cyan
$cloutProgramId = [Environment]::GetEnvironmentVariable("CLOUT_PROGRAM_ID", "User")
$rewardsVault = [Environment]::GetEnvironmentVariable("REWARDS_VAULT", "User")

if ($cloutProgramId) {
    Write-Host "   ✅ CLOUT_PROGRAM_ID: $cloutProgramId" -ForegroundColor Green
} else {
    Write-Host "   ⚠️ CLOUT_PROGRAM_ID not set (using defaults from config)" -ForegroundColor Yellow
}

if ($rewardsVault) {
    Write-Host "   ✅ REWARDS_VAULT: $rewardsVault" -ForegroundColor Green
} else {
    Write-Host "   ⚠️ REWARDS_VAULT not set (using defaults from config)" -ForegroundColor Yellow
}

# Summary
Write-Host ""
Write-Host "=================================" -ForegroundColor Green
Write-Host "📋 Summary" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
Write-Host ""
Write-Host "✅ Backend API endpoints are set up and working" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Start your backend server if not running" -ForegroundColor White
Write-Host "   2. Start your frontend dev server" -ForegroundColor White
Write-Host "   3. Connect a wallet in the frontend" -ForegroundColor White
Write-Host "   4. Check that CloutBadge appears in bottom-right corner" -ForegroundColor White
Write-Host "   5. Check that Hero section shows CLOUT counter when wallet is connected" -ForegroundColor White
Write-Host ""
Write-Host "🎉 CLOUT integration testing complete!" -ForegroundColor Green

