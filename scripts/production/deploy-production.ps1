# NFTSol Production Deployment Script (PowerShell)
# This script handles the complete deployment process

param(
    [switch]$SkipTests,
    [switch]$SkipLint
)

Write-Host "🚀 Starting NFTSol Production Deployment..." -ForegroundColor Green

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: Not in project root directory" -ForegroundColor Red
    exit 1
}

try {
    # Install dependencies
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm ci
    npm run bootstrap

    # Run linting (optional)
    if (-not $SkipLint) {
        Write-Host "🔍 Running linting..." -ForegroundColor Yellow
        npm run lint --prefix server
    }

    # Build the application
    Write-Host "🏗️  Building application..." -ForegroundColor Yellow
    npm run build

    Write-Host "✅ Build completed successfully!" -ForegroundColor Green

    # Create deployment package
    Write-Host "📦 Creating deployment package..." -ForegroundColor Yellow
    $deploymentDir = "nftsol-deployment"
    New-Item -ItemType Directory -Path $deploymentDir -Force | Out-Null

    # Copy files
    Copy-Item -Path "server/dist" -Destination "$deploymentDir/" -Recurse -Force
    Copy-Item -Path "client/dist" -Destination "$deploymentDir/client-dist" -Recurse -Force
    Copy-Item -Path "server/package.json" -Destination "$deploymentDir/" -Force
    Copy-Item -Path "server/package-lock.json" -Destination "$deploymentDir/" -Force
    Copy-Item -Path "server/ecosystem.config.cjs" -Destination "$deploymentDir/" -Force
    Copy-Item -Path "server/env.example" -Destination "$deploymentDir/.env.example" -Force
    
    if (Test-Path "docker-compose.yml") {
        Copy-Item -Path "docker-compose.yml" -Destination "$deploymentDir/" -Force
    }
    if (Test-Path "render.yaml") {
        Copy-Item -Path "render.yaml" -Destination "$deploymentDir/" -Force
    }

    # Create deployment archive
    Write-Host "🗜️  Creating deployment archive..." -ForegroundColor Yellow
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $archiveName = "nftsol-production-$timestamp.zip"
    
    Compress-Archive -Path "$deploymentDir/*" -DestinationPath $archiveName -Force
    Remove-Item -Path $deploymentDir -Recurse -Force

    Write-Host "✅ Deployment package created successfully!" -ForegroundColor Green
    Write-Host "📁 Archive: $archiveName" -ForegroundColor Cyan

    # Display deployment instructions
    Write-Host ""
    Write-Host "🎯 Deployment Instructions:" -ForegroundColor Cyan
    Write-Host "1. Upload the archive to your server"
    Write-Host "2. Extract the archive"
    Write-Host "3. Install dependencies: npm install"
    Write-Host "4. Set up environment variables: copy .env.example .env"
    Write-Host "5. Start the application: npm start"
    Write-Host ""
    Write-Host "🌐 Your NFTSol platform is ready for production!" -ForegroundColor Green

} catch {
    Write-Host "❌ Deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
