# Secure Environment Setup Script
param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("development", "production")]
    [string]$Environment
)

Write-Host "🔒 Setting up secure $Environment environment..." -ForegroundColor Green

# Function to generate secure random string
function Generate-SecureSecret {
    param([int]$Length = 64)
    $bytes = New-Object byte[] $Length
    (New-Object Security.Cryptography.RNGCryptoServiceProvider).GetBytes($bytes)
    return [Convert]::ToBase64String($bytes)
}

# Check for existing environment variables
$requiredVars = @("PINATA_API_KEY", "PINATA_SECRET_KEY", "HELIUS_API_KEY")
$missingVars = @()

foreach ($var in $requiredVars) {
    if (-not (Get-Item "env:$var" -ErrorAction SilentlyContinue)) {
        $missingVars += $var
    }
}

if ($missingVars.Count -gt 0) {
    Write-Host "❌ SECURITY ERROR: Missing required environment variables:" -ForegroundColor Red
    foreach ($var in $missingVars) {
        Write-Host "   - $var" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "🔐 Set these in your system environment variables:" -ForegroundColor Yellow
    Write-Host "   Windows: setx $var 'your_value_here'" -ForegroundColor White
    Write-Host "   PowerShell: `$env:$var = 'your_value_here'" -ForegroundColor White
    exit 1
}

# Set environment-specific variables
$env:NODE_ENV = $Environment

if ($Environment -eq "development") {
    $env:DATABASE_URL = "postgresql://localhost:5432/nftsol_dev"
    $env:REDIS_URL = "redis://localhost:6379"
} else {
    # Production - require all variables to be set
    $prodRequired = @("DATABASE_URL", "REDIS_URL", "JWT_SECRET", "SESSION_SECRET")
    foreach ($var in $prodRequired) {
        if (-not (Get-Item "env:$var" -ErrorAction SilentlyContinue)) {
            Write-Host "❌ SECURITY ERROR: Missing production variable: $var" -ForegroundColor Red
            exit 1
        }
    }
}

# Generate strong secrets if not set
if (-not $env:JWT_SECRET) {
    $env:JWT_SECRET = Generate-SecureSecret 64
    Write-Host "✅ Generated secure JWT_SECRET" -ForegroundColor Green
}

if (-not $env:SESSION_SECRET) {
    $env:SESSION_SECRET = Generate-SecureSecret 64
    Write-Host "✅ Generated secure SESSION_SECRET" -ForegroundColor Green
}

Write-Host "✅ Secure environment setup complete" -ForegroundColor Green
