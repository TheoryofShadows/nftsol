# Secret Rotation Script
param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("JWT_SECRET", "SESSION_SECRET", "ALL")]
    [string]$SecretType
)

Write-Host "🔄 Rotating secrets..." -ForegroundColor Green

function Generate-NewSecret {
    param([int]$Length = 64)
    $bytes = New-Object byte[] $Length
    (New-Object Security.Cryptography.RNGCryptoServiceProvider).GetBytes($bytes)
    return [Convert]::ToBase64String($bytes)
}

$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupFile = "secrets_backup_$timestamp.txt"

# Backup current secrets
Write-Host "📋 Backing up current secrets to $backupFile" -ForegroundColor Yellow
"# Secret Backup - $timestamp" | Out-File $backupFile
"JWT_SECRET=$env:JWT_SECRET" | Out-File $backupFile -Append
"SESSION_SECRET=$env:SESSION_SECRET" | Out-File $backupFile -Append

# Generate new secrets
if ($SecretType -eq "JWT_SECRET" -or $SecretType -eq "ALL") {
    $newJwtSecret = Generate-NewSecret 64
    Write-Host "🔄 New JWT_SECRET generated" -ForegroundColor Green
    Write-Host "Set this in your environment: JWT_SECRET=$newJwtSecret" -ForegroundColor White
}

if ($SecretType -eq "SESSION_SECRET" -or $SecretType -eq "ALL") {
    $newSessionSecret = Generate-NewSecret 64
    Write-Host "🔄 New SESSION_SECRET generated" -ForegroundColor Green
    Write-Host "Set this in your environment: SESSION_SECRET=$newSessionSecret" -ForegroundColor White
}

Write-Host "✅ Secret rotation complete" -ForegroundColor Green
Write-Host "⚠️ Remember to update production environment variables!" -ForegroundColor Yellow
