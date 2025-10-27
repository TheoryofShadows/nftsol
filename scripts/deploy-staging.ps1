# NFTSol Staging Deployment Script (PowerShell)
# This script automates the deployment process for staging environment

$ErrorActionPreference = "Stop"

Write-Host "🚀 NFTSol Staging Deployment Script" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan

# Function to print colored output
function Write-Info {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

# Step 1: Verify prerequisites
Write-Host ""
Write-Host "📋 Step 1: Verifying prerequisites..." -ForegroundColor Cyan

if (-not (Test-Path "package.json")) {
    Write-Error "package.json not found. Are you in the project root?"
    exit 1
}
Write-Info "Project root verified"

# Step 2: Run tests
Write-Host ""
Write-Host "📋 Step 2: Running tests..." -ForegroundColor Cyan

Set-Location apps/backend

try {
    npm run test:unit
    if ($LASTEXITCODE -eq 0) {
        Write-Info "All tests passing"
    } else {
        Write-Error "Tests failed. Please fix issues before deploying."
        exit 1
    }
} catch {
    Write-Error "Error running tests: $_"
    exit 1
}

Set-Location ../..

# Step 3: Build backend
Write-Host ""
Write-Host "📋 Step 3: Building backend..." -ForegroundColor Cyan

Set-Location apps/backend

try {
    npm run build
    if ($LASTEXITCODE -eq 0) {
        Write-Info "Backend build successful"
    } else {
        Write-Error "Backend build failed"
        exit 1
    }
} catch {
    Write-Error "Error building backend: $_"
    exit 1
}

Set-Location ../..

# Step 4: Build frontend
Write-Host ""
Write-Host "📋 Step 4: Building frontend..." -ForegroundColor Cyan

Set-Location apps/frontend

try {
    npm run build
    if ($LASTEXITCODE -eq 0) {
        Write-Info "Frontend build successful"
    } else {
        Write-Error "Frontend build failed"
        exit 1
    }
} catch {
    Write-Error "Error building frontend: $_"
    exit 1
}

Set-Location ../..

# Step 5: Check for environment files
Write-Host ""
Write-Host "📋 Step 5: Checking environment configuration..." -ForegroundColor Cyan

if (-not (Test-Path ".env")) {
    Write-Warning ".env file not found. Make sure to set environment variables in Render."
} else {
    Write-Info "Environment configuration found"
}

# Step 6: Git status check
Write-Host ""
Write-Host "📋 Step 6: Checking git status..." -ForegroundColor Cyan

$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Warning "Uncommitted changes detected. Consider committing before deployment."
    $response = Read-Host "Continue with deployment? (y/n)"
    if ($response -ne "y" -and $response -ne "Y") {
        Write-Info "Deployment cancelled"
        exit 0
    }
} else {
    Write-Info "Working directory clean"
}

# Step 7: Deployment summary
Write-Host ""
Write-Host "📋 Step 7: Deployment Summary" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan
Write-Host "✅ Tests: All passing" -ForegroundColor Green
Write-Host "✅ Backend: Built successfully" -ForegroundColor Green
Write-Host "✅ Frontend: Built successfully" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Ready for deployment to staging!" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Push to develop branch: git push origin develop"
Write-Host "2. Render will auto-deploy if configured"
Write-Host "3. Or deploy manually via Render dashboard"
Write-Host ""

Write-Info "Deployment preparation complete!"
