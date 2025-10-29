# NFTSol Platform Key Setup Script (PowerShell)
# This script helps you set up new platform keys securely

Write-Host "🔐 NFTSol Platform Key Setup" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Please run this script from the project root directory" -ForegroundColor Red
    exit 1
}

Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
Set-Location apps/backend
npm install

Write-Host ""
Write-Host "🔑 Generating new platform keys..." -ForegroundColor Yellow
Set-Location ../..
node scripts/generate-platform-keys.js

Write-Host ""
Write-Host "🔒 Setting up .gitignore..." -ForegroundColor Yellow

# Ensure .gitignore includes sensitive files
$gitignoreContent = Get-Content .gitignore -ErrorAction SilentlyContinue
$requiredEntries = @(".env", ".env.local", ".env.production", "platform-keys-backup.json", "*.key")

foreach ($entry in $requiredEntries) {
    if ($gitignoreContent -notcontains $entry) {
        Add-Content .gitignore $entry
        Write-Host "Added $entry to .gitignore" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "✅ Key generation complete!" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 NEXT STEPS:" -ForegroundColor Cyan
Write-Host "==============" -ForegroundColor Cyan
Write-Host "1. Review the generated .env file"
Write-Host "2. Fund the platform wallet with SOL:"
Write-Host "   solana transfer <PUBLIC_KEY> 1.0 --from <your-wallet> --url devnet"
Write-Host "3. Test the platform:"
Write-Host "   cd apps/backend && npm run dev"
Write-Host "4. Update your deployment configuration"
Write-Host "5. Deploy to production"
Write-Host ""
Write-Host "⚠️  SECURITY:" -ForegroundColor Red
Write-Host "============" -ForegroundColor Red
Write-Host "• Never commit .env files to version control"
Write-Host "• Store backup keys securely offline"
Write-Host "• Use environment variables in production"
Write-Host "• Monitor for unauthorized access"
