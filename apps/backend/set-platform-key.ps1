# Set Platform Keypair from temp-keypair.json
# This converts the keypair to base58 format for easy env var setting

$keypairPath = "C:\Users\KHK89\NFTSol\temp-keypair.json"

if (-not (Test-Path $keypairPath)) {
    Write-Host "Error: $keypairPath not found" -ForegroundColor Red
    exit 1
}

Write-Host "Reading keypair from: $keypairPath" -ForegroundColor Cyan

# Read the keypair JSON
$keypairJson = Get-Content $keypairPath | ConvertFrom-Json

# Convert to base58 using Node.js (since we have bs58 in the project)
$script = @"
const fs = require('fs');
const bs58 = require('bs58');
const keypair = JSON.parse(fs.readFileSync('$keypairPath', 'utf8'));
const secretKey = Uint8Array.from(keypair);
const base58 = bs58.encode(secretKey);
console.log(base58);
"@

$script | Out-File -FilePath "$env:TEMP\get-base58.js" -Encoding utf8

Write-Host ""
Write-Host "Converting to base58..." -ForegroundColor Yellow

try {
    $base58 = node "$env:TEMP\get-base58.js"
    $base58 = $base58.Trim()
    
    Write-Host ""
    Write-Host "✓ Platform keypair converted to base58" -ForegroundColor Green
    Write-Host ""
    Write-Host "Set this environment variable:" -ForegroundColor Cyan
    Write-Host '  $env:PLATFORM_SECRET_KEY_BASE58 = "' + $base58 + '"' -ForegroundColor White
    Write-Host ""
    Write-Host "Or add to your .env file:" -ForegroundColor Cyan
    Write-Host '  PLATFORM_SECRET_KEY_BASE58=' + $base58 -ForegroundColor White
    Write-Host ""
    
} catch {
    Write-Host "Error converting keypair: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Alternative: Use JSON format instead:" -ForegroundColor Yellow
    $jsonArray = $keypairJson -join ','
    Write-Host '  $env:PLATFORM_SECRET_KEY_JSON = "[' + $jsonArray + ']"' -ForegroundColor White
}

