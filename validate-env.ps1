# NFTSol Environment Validation Script
Write-Host "🔍 Validating NFTSol Environment..." -ForegroundColor Green

$env = $env:NODE_ENV
Write-Host "Environment: $env" -ForegroundColor Cyan

if ($env -eq "production") {
    Write-Host "🔒 Production Environment Validation:" -ForegroundColor Yellow
    
    $required = @(
        "DATABASE_URL",
        "REDIS_URL", 
        "PINATA_API_KEY",
        "PINATA_SECRET_KEY",
        "HELIUS_API_KEY",
        "JWT_SECRET",
        "SESSION_SECRET"
    )
    
    $missing = @()
    foreach ($var in $required) {
        if (-not (Get-Item "env:$var" -ErrorAction SilentlyContinue)) {
            $missing += $var
        }
    }
    
    if ($missing.Count -gt 0) {
        Write-Host "❌ Missing required production variables:" -ForegroundColor Red
        $missing | ForEach-Object { Write-Host "   - $_" -ForegroundColor Red }
        exit 1
    } else {
        Write-Host "✅ All production variables set" -ForegroundColor Green
    }
} else {
    Write-Host "🔧 Development Environment - Basic validation passed" -ForegroundColor Green
}

Write-Host "✅ Environment validation complete" -ForegroundColor Green
