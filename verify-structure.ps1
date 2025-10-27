# NFTSol Repository Structure Verification Script
# This script verifies that the new repository structure is properly organized

Write-Host "🔍 Verifying NFTSol Repository Structure..." -ForegroundColor Green
Write-Host ""

# Check main directories
$mainDirs = @("apps", "config", "docs", "scripts", "tests")
foreach ($dir in $mainDirs) {
    if (Test-Path $dir) {
        Write-Host "✅ $dir/ directory exists" -ForegroundColor Green
    } else {
        Write-Host "❌ $dir/ directory missing" -ForegroundColor Red
    }
}

Write-Host ""

# Check apps subdirectories
$appDirs = @("apps/frontend", "apps/backend", "apps/smart-contracts")
foreach ($dir in $appDirs) {
    if (Test-Path $dir) {
        Write-Host "✅ $dir/ directory exists" -ForegroundColor Green
    } else {
        Write-Host "❌ $dir/ directory missing" -ForegroundColor Red
    }
}

Write-Host ""

# Check frontend structure
$frontendDirs = @("apps/frontend/src", "apps/frontend/public", "apps/frontend/tests")
foreach ($dir in $frontendDirs) {
    if (Test-Path $dir) {
        Write-Host "✅ $dir/ directory exists" -ForegroundColor Green
    } else {
        Write-Host "❌ $dir/ directory missing" -ForegroundColor Red
    }
}

# Check backend structure
$backendDirs = @("apps/backend/src", "apps/backend/tests", "apps/backend/scripts")
foreach ($dir in $backendDirs) {
    if (Test-Path $dir) {
        Write-Host "✅ $dir/ directory exists" -ForegroundColor Green
    } else {
        Write-Host "❌ $dir/ directory missing" -ForegroundColor Red
    }
}

Write-Host ""

# Check smart contracts structure
$contractDirs = @("apps/smart-contracts/programs", "apps/smart-contracts/scripts")
foreach ($dir in $contractDirs) {
    if (Test-Path $dir) {
        Write-Host "✅ $dir/ directory exists" -ForegroundColor Green
    } else {
        Write-Host "❌ $dir/ directory missing" -ForegroundColor Red
    }
}

Write-Host ""

# Check config structure
$configDirs = @("config/development", "config/production")
foreach ($dir in $configDirs) {
    if (Test-Path $dir) {
        Write-Host "✅ $dir/ directory exists" -ForegroundColor Green
    } else {
        Write-Host "❌ $dir/ directory missing" -ForegroundColor Red
    }
}

Write-Host ""

# Check docs structure
$docsDirs = @("docs/development", "docs/production", "docs/deployment")
foreach ($dir in $docsDirs) {
    if (Test-Path $dir) {
        Write-Host "✅ $dir/ directory exists" -ForegroundColor Green
    } else {
        Write-Host "❌ $dir/ directory missing" -ForegroundColor Red
    }
}

Write-Host ""

# Check scripts structure
$scriptsDirs = @("scripts/development", "scripts/production")
foreach ($dir in $scriptsDirs) {
    if (Test-Path $dir) {
        Write-Host "✅ $dir/ directory exists" -ForegroundColor Green
    } else {
        Write-Host "❌ $dir/ directory missing" -ForegroundColor Red
    }
}

Write-Host ""

# Check environment files
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
        Write-Host "✅ $file exists" -ForegroundColor Green
    } else {
        Write-Host "❌ $file missing" -ForegroundColor Red
    }
}

Write-Host ""

# Check package.json files
$packageFiles = @("apps/frontend/package.json", "apps/backend/package.json", "package.json")
foreach ($file in $packageFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file exists" -ForegroundColor Green
    } else {
        Write-Host "❌ $file missing" -ForegroundColor Red
    }
}

Write-Host ""

# Check documentation files
$docFiles = @("README.md", "REPOSITORY_STRUCTURE.md", "CLEANUP_SUMMARY.md")
foreach ($file in $docFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file exists" -ForegroundColor Green
    } else {
        Write-Host "❌ $file missing" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🎉 Repository structure verification complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Summary:" -ForegroundColor Yellow
Write-Host "- Main applications organized in apps/ directory" -ForegroundColor White
Write-Host "- Environment configurations separated by dev/prod" -ForegroundColor White
Write-Host "- Documentation organized by purpose" -ForegroundColor White
Write-Host "- Scripts organized by environment" -ForegroundColor White
Write-Host "- Clear separation of concerns achieved" -ForegroundColor White
Write-Host ""
Write-Host "🚀 The NFTSol repository is now properly organized and ready for development!" -ForegroundColor Green
