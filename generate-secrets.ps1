# Secret Generation Script
Write-Host "🔐 Generating cryptographically secure secrets..." -ForegroundColor Green

function Generate-Secret {
    param([int]$Length = 64)
    $bytes = New-Object byte[] $Length
    (New-Object Security.Cryptography.RNGCryptoServiceProvider).GetBytes($bytes)
    return [Convert]::ToBase64String($bytes)
}

Write-Host "JWT_SECRET (64 chars):" -ForegroundColor Cyan
Write-Host (Generate-Secret 64) -ForegroundColor White

Write-Host "`nSESSION_SECRET (64 chars):" -ForegroundColor Cyan
Write-Host (Generate-Secret 64) -ForegroundColor White

Write-Host "`nAPI_SECRET (32 chars):" -ForegroundColor Cyan
Write-Host (Generate-Secret 32) -ForegroundColor White

Write-Host "`n✅ Secrets generated - store these securely!" -ForegroundColor Green
