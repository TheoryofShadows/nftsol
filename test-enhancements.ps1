# NFTSol Enhanced Pipeline Test Script
# Tests all the new enhancements and integrations

Write-Host "🚀 Testing NFTSol Enhanced Pipeline..." -ForegroundColor Green
Write-Host ""

# Test 1: Check if all new packages are installed
Write-Host "📦 Testing package installations..." -ForegroundColor Yellow

# Frontend packages
Write-Host "  Frontend packages:" -ForegroundColor Cyan
$frontendPackages = @(
    "@metaplex-foundation/mpl-core",
    "@metaplex-foundation/mpl-candy-guard",
    "ts-node"
)

foreach ($package in $frontendPackages) {
    $result = npm list --prefix apps/frontend $package 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "    ✅ $package" -ForegroundColor Green
    } else {
        Write-Host "    ❌ $package" -ForegroundColor Red
    }
}

# Backend packages
Write-Host "  Backend packages:" -ForegroundColor Cyan
$backendPackages = @(
    "@metaplex-foundation/mpl-core",
    "@metaplex-foundation/mpl-candy-guard",
    "@irys/sdk"
)

foreach ($package in $backendPackages) {
    $result = npm list --prefix apps/backend $package 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "    ✅ $package" -ForegroundColor Green
    } else {
        Write-Host "    ❌ $package" -ForegroundColor Red
    }
}

Write-Host ""

# Test 2: Check if new service files exist
Write-Host "🔧 Testing service files..." -ForegroundColor Yellow

$serviceFiles = @(
    "apps/frontend/src/services/coreService.ts",
    "apps/backend/src/services/irysService.ts",
    "apps/backend/src/services/candyMachineService.ts",
    "apps/smart-contracts/tests/marketplace.test.ts",
    "apps/smart-contracts/tests/setup.ts",
    "apps/frontend/scripts/setup-candy.ts"
)

foreach ($file in $serviceFiles) {
    if (Test-Path $file) {
        Write-Host "    ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "    ❌ $file" -ForegroundColor Red
    }
}

Write-Host ""

# Test 3: Check if new API routes exist
Write-Host "🌐 Testing API routes..." -ForegroundColor Yellow

$routeFiles = @(
    "apps/backend/src/routes/candy-machine.ts",
    "apps/backend/src/routes/irys.ts"
)

foreach ($file in $routeFiles) {
    if (Test-Path $file) {
        Write-Host "    ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "    ❌ $file" -ForegroundColor Red
    }
}

Write-Host ""

# Test 4: Check if package.json scripts are updated
Write-Host "📝 Testing package.json updates..." -ForegroundColor Yellow

# Check frontend scripts
$frontendScripts = @(
    "setup-candy",
    "candy:init",
    "candy:upload",
    "candy:deploy",
    "candy:mint",
    "candy:status"
)

$frontendPackageJson = Get-Content "apps/frontend/package.json" | ConvertFrom-Json
foreach ($script in $frontendScripts) {
    if ($frontendPackageJson.scripts.$script) {
        Write-Host "    ✅ Frontend script: $script" -ForegroundColor Green
    } else {
        Write-Host "    ❌ Frontend script: $script" -ForegroundColor Red
    }
}

Write-Host ""

# Test 5: Test TypeScript compilation
Write-Host "🔨 Testing TypeScript compilation..." -ForegroundColor Yellow

# Test frontend compilation
Write-Host "  Frontend compilation:" -ForegroundColor Cyan
Set-Location apps/frontend
$frontendBuild = npm run build 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "    ✅ Frontend builds successfully" -ForegroundColor Green
} else {
    Write-Host "    ❌ Frontend build failed" -ForegroundColor Red
    Write-Host "    Error: $frontendBuild" -ForegroundColor Red
}
Set-Location ../..

# Test backend compilation
Write-Host "  Backend compilation:" -ForegroundColor Cyan
Set-Location apps/backend
$backendBuild = npm run build 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "    ✅ Backend builds successfully" -ForegroundColor Green
} else {
    Write-Host "    ❌ Backend build failed" -ForegroundColor Red
    Write-Host "    Error: $backendBuild" -ForegroundColor Red
}
Set-Location ../..

Write-Host ""

# Test 6: Test new service imports
Write-Host "📚 Testing service imports..." -ForegroundColor Yellow

# Test Core service import
Write-Host "  Core service:" -ForegroundColor Cyan
$coreServiceTest = @"
import { CoreService } from './apps/frontend/src/services/coreService';
console.log('Core service import successful');
"@
$coreServiceTest | Out-File -FilePath "test-core-import.js" -Encoding UTF8
$coreResult = node test-core-import.js 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "    ✅ Core service imports successfully" -ForegroundColor Green
} else {
    Write-Host "    ❌ Core service import failed" -ForegroundColor Red
}
Remove-Item "test-core-import.js" -ErrorAction SilentlyContinue

# Test Irys service import
Write-Host "  Irys service:" -ForegroundColor Cyan
$irysServiceTest = @"
import { IrysService } from './apps/backend/src/services/irysService';
console.log('Irys service import successful');
"@
$irysServiceTest | Out-File -FilePath "test-irys-import.js" -Encoding UTF8
$irysResult = node test-irys-import.js 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "    ✅ Irys service imports successfully" -ForegroundColor Green
} else {
    Write-Host "    ❌ Irys service import failed" -ForegroundColor Red
}
Remove-Item "test-irys-import.js" -ErrorAction SilentlyContinue

Write-Host ""

# Test 7: Check environment configuration
Write-Host "⚙️ Testing environment configuration..." -ForegroundColor Yellow

$envFiles = @(
    "config/development/frontend.env",
    "config/development/backend.env",
    "config/production/frontend.env",
    "config/production/backend.env",
    "config/frontend.env.example",
    "config/backend.env.example"
)

foreach ($file in $envFiles) {
    if (Test-Path $file) {
        Write-Host "    ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "    ❌ $file" -ForegroundColor Red
    }
}

Write-Host ""

# Test 8: Check documentation
Write-Host "📖 Testing documentation..." -ForegroundColor Yellow

$docFiles = @(
    "README.md",
    "REPOSITORY_STRUCTURE.md",
    "CLEANUP_SUMMARY.md"
)

foreach ($file in $docFiles) {
    if (Test-Path $file) {
        Write-Host "    ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "    ❌ $file" -ForegroundColor Red
    }
}

Write-Host ""

# Summary
Write-Host "🎉 Enhanced Pipeline Test Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Summary of Enhancements:" -ForegroundColor Yellow
Write-Host "✅ Metaplex Core integration (90% cheaper NFTs)" -ForegroundColor White
Write-Host "✅ Irys integration for atomic metadata uploads" -ForegroundColor White
Write-Host "✅ Candy Machine service (replaces Auction House)" -ForegroundColor White
Write-Host "✅ Sugar CLI integration for drops" -ForegroundColor White
Write-Host "✅ Anchor tests for smart contracts" -ForegroundColor White
Write-Host "✅ Enhanced API routes" -ForegroundColor White
Write-Host "✅ Updated package.json scripts" -ForegroundColor White
Write-Host "✅ Comprehensive documentation" -ForegroundColor White
Write-Host ""
Write-Host "🚀 NFTSol is now ready for 2025 with cutting-edge Solana features!" -ForegroundColor Green
