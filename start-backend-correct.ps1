# Start Backend with Correct CLOUT Configuration
Write-Host "🚀 Starting Backend with Correct CLOUT Settings" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green
Write-Host ""

# Kill any existing process on port 3001
Write-Host "🔍 Checking port 3001..." -ForegroundColor Cyan
$portInfo = netstat -ano | findstr ":3001" | findstr "LISTENING"
if ($portInfo) {
    $pid = ($portInfo -split '\s+')[-1]
    Write-Host "   Killing existing process (PID: $pid)..." -ForegroundColor Yellow
    taskkill /PID $pid /F 2>$null
    Start-Sleep -Seconds 2
    Write-Host "   ✅ Port cleared" -ForegroundColor Green
}

# Set environment variables for THIS session
Write-Host "`n🔧 Setting Environment Variables..." -ForegroundColor Cyan
$env:PORT = "3001"
$env:CLOUT_PROGRAM_ID = "62hWQAgAV4jugHSuZsMqzxZNVXaVLrbRpz3Sw58Z64Mw"
$env:REWARDS_VAULT = "2KkNwFZbznAtYX1xjVS6e5BBqQnfaBuTjn42G4zJXAps"
$env:NODE_ENV = "development"
# ⚠️  SECURITY: Set this from environment or secure storage
# $env:PLATFORM_SECRET_KEY_BASE58 = "<your_secret_key_from_secure_storage>"
# Or read from .env file (which should be in .gitignore)
if (Test-Path "apps\backend\.env") {
    Get-Content "apps\backend\.env" | ForEach-Object {
        if ($_ -match "^PLATFORM_SECRET_KEY_BASE58=(.+)") {
            $env:PLATFORM_SECRET_KEY_BASE58 = $matches[1]
        }
    }
} else {
    Write-Host "⚠️  WARNING: .env file not found. Set PLATFORM_SECRET_KEY_BASE58 manually." -ForegroundColor Yellow
}

Write-Host "   ✅ PORT: $env:PORT" -ForegroundColor Green
Write-Host "   ✅ CLOUT_PROGRAM_ID: $env:CLOUT_PROGRAM_ID" -ForegroundColor Green
Write-Host "   ✅ REWARDS_VAULT: $env:REWARDS_VAULT" -ForegroundColor Green
Write-Host "   ✅ PLATFORM_SECRET_KEY_BASE58: Set (hidden for security)" -ForegroundColor Green
Write-Host "   ✅ NODE_ENV: $env:NODE_ENV" -ForegroundColor Green

# Change to backend directory
Write-Host "`n📁 Changing to backend directory..." -ForegroundColor Cyan
Set-Location "apps\backend"

# Start the server
Write-Host "`n🚀 Starting backend server..." -ForegroundColor Green
Write-Host "   Using CLOUT mint: $env:CLOUT_PROGRAM_ID" -ForegroundColor Cyan
Write-Host "   Using port: $env:PORT" -ForegroundColor Cyan
Write-Host ""

# Start in new window so user can see output
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\KHK89\NFTSol\apps\backend'; `$env:PORT='3001'; `$env:CLOUT_PROGRAM_ID='62hWQAgAV4jugHSuZsMqzxZNVXaVLrbRpz3Sw58Z64Mw'; `$env:REWARDS_VAULT='2KkNwFZbznAtYX1xjVS6e5BBqQnfaBuTjn42G4zJXAps'; `$env:NODE_ENV='development'; Write-Host '🚀 Starting NFTSol Backend...' -ForegroundColor Green; Write-Host 'CLOUT_PROGRAM_ID: ' `$env:CLOUT_PROGRAM_ID -ForegroundColor Cyan; Write-Host 'REWARDS_VAULT: ' `$env:REWARDS_VAULT -ForegroundColor Cyan; npm run dev" -WindowStyle Normal

Write-Host "✅ Backend start command executed!" -ForegroundColor Green
Write-Host "`n⏳ Waiting 20 seconds for server to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 20

# Test the backend
Write-Host "`n🧪 Testing Backend..." -ForegroundColor Cyan
try {
    $health = Invoke-RestMethod -Uri "http://localhost:3001/healthz" -Method Get -TimeoutSec 5
    Write-Host "✅ Backend is running!" -ForegroundColor Green
    Write-Host "   Status: $($health.status)" -ForegroundColor Cyan
    
    # Test CLOUT endpoint
    Write-Host "`n💰 Testing CLOUT endpoints..." -ForegroundColor Cyan
    $progs = Invoke-RestMethod -Uri "http://localhost:3001/api/programs" -Method Get -TimeoutSec 5
    if ($progs.data.programs.CLOUT_PROGRAM_ID) {
        Write-Host "✅ CLOUT_PROGRAM_ID in response: $($progs.data.programs.CLOUT_PROGRAM_ID)" -ForegroundColor Green
        if ($progs.data.programs.CLOUT_PROGRAM_ID -eq "62hWQAgAV4jugHSuZsMqzxZNVXaVLrbRpz3Sw58Z64Mw") {
            Write-Host "✅ CORRECT mint address is being used!" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Different mint address - check environment variables" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "⚠️  Backend not responding yet: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "   Check the backend window for any errors" -ForegroundColor Cyan
}

Write-Host "`n✅ Setup Complete!" -ForegroundColor Green
Set-Location ..\..

