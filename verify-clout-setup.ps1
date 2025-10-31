# CLOUT Setup Verification Script
# Verifies all components are properly configured

Write-Host "🔍 CLOUT Setup Verification" -ForegroundColor Green
Write-Host "==========================" -ForegroundColor Green
Write-Host ""

# Check environment variables
Write-Host "📋 Checking Environment Variables..." -ForegroundColor Cyan
$cloutProgramId = [Environment]::GetEnvironmentVariable("CLOUT_PROGRAM_ID", "User")
$rewardsVault = [Environment]::GetEnvironmentVariable("REWARDS_VAULT", "User")

$envVarsOk = $true

if ($cloutProgramId) {
    Write-Host "   ✅ CLOUT_PROGRAM_ID: $cloutProgramId" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  CLOUT_PROGRAM_ID not set (will use default from config)" -ForegroundColor Yellow
}

if ($rewardsVault) {
    Write-Host "   ✅ REWARDS_VAULT: $rewardsVault" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  REWARDS_VAULT not set (will use default from config)" -ForegroundColor Yellow
}

# Check backend files
Write-Host ""
Write-Host "📁 Checking Backend Files..." -ForegroundColor Cyan

$files = @(
    "apps/backend/src/routes/clout.ts",
    "apps/backend/src/services/cloutToken.ts",
    "apps/backend/src/utils/clout-vault.ts",
    "client/src/hooks/useCloutBalance.ts",
    "client/src/components/CloutBadge.tsx"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "   ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $file - MISSING!" -ForegroundColor Red
        $envVarsOk = $false
    }
}

# Check if CloutBadge is imported in App.tsx
Write-Host ""
Write-Host "🔗 Checking Integration..." -ForegroundColor Cyan
if (Test-Path "client/src/App.tsx") {
    $appContent = Get-Content "client/src/App.tsx" -Raw
    if ($appContent -match "import CloutBadge") {
        Write-Host "   ✅ CloutBadge imported in App.tsx" -ForegroundColor Green
    } else {
        Write-Host "   ❌ CloutBadge not imported in App.tsx" -ForegroundColor Red
        $envVarsOk = $false
    }
    
    if ($appContent -match "<CloutBadge") {
        Write-Host "   ✅ CloutBadge component added to App.tsx" -ForegroundColor Green
    } else {
        Write-Host "   ❌ CloutBadge component not found in App.tsx" -ForegroundColor Red
        $envVarsOk = $false
    }
} else {
    Write-Host "   ❌ client/src/App.tsx not found" -ForegroundColor Red
    $envVarsOk = $false
}

# Check Hero.tsx integration
if (Test-Path "client/src/components/Hero.tsx") {
    $heroContent = Get-Content "client/src/components/Hero.tsx" -Raw
    if ($heroContent -match "useCloutBalance") {
        Write-Host "   ✅ useCloutBalance hook used in Hero.tsx" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  CLOUT counter not added to Hero.tsx (optional)" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ❌ client/src/components/Hero.tsx not found" -ForegroundColor Red
    $envVarsOk = $false
}

# Summary
Write-Host ""
Write-Host "==========================" -ForegroundColor Green
if ($envVarsOk) {
    Write-Host "✅ All core files are in place!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Some files are missing - check errors above" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Run: .\test-clout-integration.ps1" -ForegroundColor White
Write-Host "   2. Start backend: cd apps/backend; npm run dev" -ForegroundColor White
Write-Host "   3. Start frontend: cd client; npm run dev" -ForegroundColor White
Write-Host "   4. Test in browser by connecting a wallet" -ForegroundColor White
Write-Host ""
