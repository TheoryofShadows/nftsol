# Start Backend and Test CLOUT Integration
Write-Host "🚀 Starting Backend and Testing CLOUT Integration" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green
Write-Host ""

# Check if backend is already running
Write-Host "📊 Checking if backend is already running..." -ForegroundColor Cyan
$port = 3001
$portCheck = netstat -ano | findstr ":$port" | findstr "LISTENING"
if ($portCheck) {
    Write-Host "   ✅ Backend appears to be running on port $port" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Backend not detected on port $port" -ForegroundColor Yellow
    Write-Host "   💡 Starting backend in background..." -ForegroundColor Cyan
    
    # Start backend
    $backendPath = "apps\backend"
    if (Test-Path $backendPath) {
        Set-Location $backendPath
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev" -WindowStyle Minimized
        Write-Host "   ✅ Backend start command issued" -ForegroundColor Green
        Set-Location ..
        
        # Wait for backend to start
        Write-Host "   ⏳ Waiting for backend to start (15 seconds)..." -ForegroundColor Yellow
        Start-Sleep -Seconds 15
    } else {
        Write-Host "   ❌ Backend directory not found: $backendPath" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "🧪 Testing Backend Endpoints..." -ForegroundColor Cyan

# Test Health Endpoint
Write-Host "1️⃣ Testing Health Check..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:$port/healthz" -Method Get -TimeoutSec 10 -ErrorAction Stop
    Write-Host "   ✅ Health Check: PASSED" -ForegroundColor Green
    Write-Host "   📊 Status: $($health.status)" -ForegroundColor Cyan
} catch {
    Write-Host "   ❌ Health Check: FAILED" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Backend may not be fully started yet." -ForegroundColor Yellow
    Write-Host "💡 Try running manually: cd apps/backend; npm run dev" -ForegroundColor Yellow
    exit 1
}

# Test Programs Endpoint
Write-Host ""
Write-Host "2️⃣ Testing Programs Endpoint..." -ForegroundColor Yellow
try {
    $programs = Invoke-RestMethod -Uri "http://localhost:$port/api/programs" -Method Get -TimeoutSec 10 -ErrorAction Stop
    if ($programs.success) {
        Write-Host "   ✅ Programs Endpoint: PASSED" -ForegroundColor Green
        if ($programs.data.programs.CLOUT_PROGRAM_ID) {
            Write-Host "   ✅ CLOUT_PROGRAM_ID: $($programs.data.programs.CLOUT_PROGRAM_ID)" -ForegroundColor Green
        }
    } else {
        Write-Host "   ⚠️  Programs Endpoint returned success=false" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ Programs Endpoint: FAILED" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test CLOUT Balance Endpoint
Write-Host ""
Write-Host "3️⃣ Testing CLOUT Balance Endpoint..." -ForegroundColor Yellow
$testWallet = "11111111111111111111111111111112"
try {
    $balance = Invoke-RestMethod -Uri "http://localhost:$port/api/clout/balance/$testWallet" -Method Get -TimeoutSec 10 -ErrorAction Stop
    if ($balance.success) {
        Write-Host "   ✅ CLOUT Balance Endpoint: PASSED" -ForegroundColor Green
        Write-Host "   💰 Balance: $($balance.data.balance)" -ForegroundColor Cyan
    } else {
        Write-Host "   ⚠️  Balance endpoint returned success=false" -ForegroundColor Yellow
        Write-Host "   Error: $($balance.error)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ⚠️  CLOUT Balance Endpoint: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "   💡 This may be normal if wallet has no CLOUT account" -ForegroundColor Cyan
}

# Test Vault Balance Endpoint
Write-Host ""
Write-Host "4️⃣ Testing CLOUT Vault Balance Endpoint..." -ForegroundColor Yellow
try {
    $vault = Invoke-RestMethod -Uri "http://localhost:$port/api/clout/vault-balance" -Method Get -TimeoutSec 10 -ErrorAction Stop
    if ($vault.success) {
        Write-Host "   ✅ Vault Balance Endpoint: PASSED" -ForegroundColor Green
        Write-Host "   💰 Vault Balance: $($vault.data.balance)" -ForegroundColor Cyan
        Write-Host "   📍 Vault Address: $($vault.data.vaultAddress)" -ForegroundColor Cyan
    } else {
        Write-Host "   ⚠️  Vault endpoint returned success=false" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ⚠️  Vault Balance Endpoint: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=================================================" -ForegroundColor Green
Write-Host "✅ Backend Testing Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next: Test Frontend Integration" -ForegroundColor Cyan
Write-Host "   1. Ensure frontend is running (port 5173)" -ForegroundColor White
Write-Host "   2. Open http://localhost:5173 in browser" -ForegroundColor White
Write-Host "   3. Connect a wallet" -ForegroundColor White
Write-Host "   4. Look for CloutBadge in bottom-right corner" -ForegroundColor White
Write-Host "   5. Check Hero section for CLOUT counter" -ForegroundColor White
Write-Host ""

