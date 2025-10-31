# Echo API Wallet Validator
# This script helps you validate Solana wallet addresses before testing

function Test-SolanaAddress {
    param([string]$Address)
    
    Write-Host "`nValidating address: $Address" -ForegroundColor Cyan
    
    # Basic checks
    $length = $Address.Length
    Write-Host "  Length: $length characters" -ForegroundColor $(if ($length -ge 43 -and $length -le 44) { "Green" } else { "Red" })
    
    # Base58 character check
    $base58Pattern = '^[1-9A-HJ-NP-Za-km-z]+$'
    $isBase58 = $Address -match $base58Pattern
    Write-Host "  Base58: $isBase58" -ForegroundColor $(if ($isBase58) { "Green" } else { "Red" })
    
    # Common invalid patterns
    $isPlaceholder = $Address -match '(111+|EEE+|xxx+|your|wallet|address|pubkey|test123)'
    Write-Host "  Not a placeholder: $(-not $isPlaceholder)" -ForegroundColor $(if (-not $isPlaceholder) { "Green" } else { "Red" })
    
    $isValid = ($length -ge 43 -and $length -le 44) -and $isBase58 -and (-not $isPlaceholder)
    
    if ($isValid) {
        Write-Host "`n✅ Address appears VALID" -ForegroundColor Green
        Write-Host "   This address should work with the Echo API" -ForegroundColor Green
    } else {
        Write-Host "`n❌ Address appears INVALID" -ForegroundColor Red
        Write-Host "   This address will likely fail API validation" -ForegroundColor Red
        
        if ($length -lt 43) {
            Write-Host "   → Too short (need 43-44 characters)" -ForegroundColor Yellow
        } elseif ($length -gt 44) {
            Write-Host "   → Too long (need 43-44 characters)" -ForegroundColor Yellow
        }
        
        if (-not $isBase58) {
            Write-Host "   → Contains invalid Base58 characters" -ForegroundColor Yellow
            Write-Host "   → Valid: 1-9, A-H, J-N, P-Z, a-k, m-z (no 0, O, I, l)" -ForegroundColor Yellow
        }
        
        if ($isPlaceholder) {
            Write-Host "   → Looks like a placeholder value" -ForegroundColor Yellow
            Write-Host "   → Use a real wallet address from Phantom/Backpack" -ForegroundColor Yellow
        }
    }
    
    return $isValid
}

Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "    Echo API - Solana Wallet Address Validator" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan

Write-Host "`n📋 Testing addresses from your configuration..." -ForegroundColor White

# Test the platform wallet from .env
Write-Host "`n[1] Platform Wallet (from .env):" -ForegroundColor Yellow
$platformWallet = "6133iAoisDPsgbttQCXEZhz77rxNoG3sfdx8Pop1zC1v"
$result1 = Test-SolanaAddress $platformWallet

# Examples of INVALID addresses (for comparison)
Write-Host "`n`n[2] Example INVALID addresses (for comparison):" -ForegroundColor Yellow

Write-Host "`n--- Placeholder values ---" -ForegroundColor Gray
Test-SolanaAddress "111...EEE" | Out-Null
Test-SolanaAddress "<YOUR_SOLANA_PUBKEY>" | Out-Null
Test-SolanaAddress "test123" | Out-Null

Write-Host "`n--- Too short ---" -ForegroundColor Gray
Test-SolanaAddress "1234567890" | Out-Null

Write-Host "`n--- Invalid characters (contains 0, O, I, or l) ---" -ForegroundColor Gray
Test-SolanaAddress "0OIl000000000000000000000000000000000000000" | Out-Null

# Allow user to test their own address
Write-Host "`n`n[3] Test your own wallet address:" -ForegroundColor Yellow
Write-Host "Paste your Solana wallet address (or press Enter to skip):" -ForegroundColor White
$userWallet = Read-Host

if ($userWallet -and $userWallet.Trim()) {
    $userWallet = $userWallet.Trim()
    $result3 = Test-SolanaAddress $userWallet
    
    if ($result3) {
        Write-Host "`n✨ Great! You can use this address in the tests:" -ForegroundColor Green
        Write-Host "`n`$WALLET = `"$userWallet`"`n" -ForegroundColor Cyan
    }
}

# Summary
Write-Host "`n═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   Summary" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan

if ($result1) {
    Write-Host "`n✅ Your platform wallet is VALID and ready to use!" -ForegroundColor Green
    Write-Host "`nRecommended wallet for testing:" -ForegroundColor White
    Write-Host "`$WALLET = `"$platformWallet`"`n" -ForegroundColor Cyan
    
    Write-Host "Run tests with:" -ForegroundColor White
    Write-Host "  .\test-echo-api.ps1" -ForegroundColor Cyan
    Write-Host "  .\test-echo-quick.ps1" -ForegroundColor Cyan
} else {
    Write-Host "`n⚠️ Platform wallet validation issue detected" -ForegroundColor Yellow
    Write-Host "Please check your .env file or use a different wallet address" -ForegroundColor Yellow
}

Write-Host "`n📚 For more info, see: ECHO_API_TESTING_GUIDE.md" -ForegroundColor Gray
Write-Host ""
