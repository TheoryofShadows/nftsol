# Pre-commit script to verify no secrets are being committed
# Usage: .\scripts\verify-no-secrets.ps1

Write-Host "🔍 Checking for secrets in staged files..." -ForegroundColor Cyan

$secretPatterns = @(
    "PLATFORM_SECRET_KEY_BASE58=.*[A-Za-z0-9]{20,}",
    "PLATFORM_SECRET_KEY_JSON=.*\[.*\]",
    "JWT_SECRET=.*[A-Za-z0-9]{20,}",
    "SESSION_SECRET=.*[A-Za-z0-9]{20,}",
    "DATABASE_URL=.*password.*",
    "HELIUS_API_KEY=.*[A-Za-z0-9]{20,}",
    "XAI_API_KEY=.*xai-.*",
    "PINATA_JWT=.*[A-Za-z0-9]{50,}"
)

$foundSecrets = $false

# Get staged files
$stagedFiles = git diff --cached --name-only --diff-filter=ACM

foreach ($file in $stagedFiles) {
    # Skip .gitignore and this script
    if ($file -eq ".gitignore" -or $file -match "verify-no-secrets") {
        continue
    }
    
    # Check for keypair/wallet files
    if ($file -match "keypair\.json|wallet\.json|\.env$") {
        Write-Host "❌ SECURITY WARNING: Sensitive file being committed: $file" -ForegroundColor Red
        $foundSecrets = $true
        continue
    }
    
    # Check each pattern in staged diff
    $fileDiff = git diff --cached $file
    foreach ($pattern in $secretPatterns) {
        if ($fileDiff -match $pattern) {
            Write-Host "❌ SECURITY WARNING: Potential secret found in $file" -ForegroundColor Red
            Write-Host "   Pattern: $pattern" -ForegroundColor Yellow
            $foundSecrets = $true
        }
    }
}

if ($foundSecrets) {
    Write-Host ""
    Write-Host "⚠️  SECURITY ALERT: Secrets detected in staged files!" -ForegroundColor Red
    Write-Host "   Please review and remove secrets before committing." -ForegroundColor Yellow
    Write-Host "   Use environment variables instead." -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "✅ No secrets detected in staged files." -ForegroundColor Green
}

