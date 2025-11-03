# NFTSol CLOUT Token Setup Script
# Run this in PowerShell from the project root

Write-Host "=== CLOUT Token Configuration ===" -ForegroundColor Cyan

# 1. CLOUT Token Mint Address (from user)
$CLOUT_MINT = "26iJ37BE3icVtoo2QRkfjtYXFHMudG2sbTHAnhF2D6ab"
Write-Host "✓ CLOUT Token Mint: $CLOUT_MINT" -ForegroundColor Green

# 2. Fee-payer wallet (temp-keypair.json)
$FEE_PAYER = "3XEs3MJ8PFiqTTqrK6RAkK9vt95jQQ1hKNNKHiE6jJ3o"
Write-Host "✓ Fee-payer Wallet: $FEE_PAYER" -ForegroundColor Green

# 3. Check current balances
Write-Host "`n=== Checking Wallet Status ===" -ForegroundColor Cyan
Write-Host "Checking fee-payer balance..."
$balance = solana balance $FEE_PAYER --url https://api.mainnet-beta.solana.com 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "Balance: $balance" -ForegroundColor Yellow
    if ($balance -match "0 SOL") {
        Write-Host "⚠️  WARNING: Fee-payer wallet has 0 SOL!" -ForegroundColor Red
        Write-Host "   You need to fund this wallet with at least 0.02 SOL to create the rewards vault." -ForegroundColor Yellow
        Write-Host "   Send SOL to: $FEE_PAYER" -ForegroundColor Cyan
    }
} else {
    Write-Host "Could not check balance (may need to configure RPC)" -ForegroundColor Yellow
}

# 4. Set Environment Variables (User-level, persistent)
Write-Host "`n=== Setting Environment Variables ===" -ForegroundColor Cyan
[Environment]::SetEnvironmentVariable("CLOUT_PROGRAM_ID", $CLOUT_MINT, "User")
Write-Host "✓ CLOUT_PROGRAM_ID = $CLOUT_MINT" -ForegroundColor Green

# Note: REWARDS_VAULT will be created below, set after creation
Write-Host "⚠️  REWARDS_VAULT will be set after creating the ATA" -ForegroundColor Yellow

# 5. Instructions for creating the rewards vault
Write-Host "`n=== Next Steps ===" -ForegroundColor Cyan
Write-Host @"
1. FUND YOUR FEE-PAYER WALLET:
   Send at least 0.02 SOL to: $FEE_PAYER
   
   You can send from:
   - Phantom wallet
   - Another Solana wallet
   - Exchange withdrawal
   
2. ONCE FUNDED, CREATE THE REWARDS VAULT:
   Run this command:
   
   spl-token create-account $CLOUT_MINT --owner $FEE_PAYER --url https://api.mainnet-beta.solana.com
   
   OR if using keypair file:
   
   spl-token create-account $CLOUT_MINT --url https://api.mainnet-beta.solana.com
   (uses default keypair from solana config)
   
3. COPY THE NEW TOKEN ACCOUNT ADDRESS and set:
   [Environment]::SetEnvironmentVariable("REWARDS_VAULT", "<NEW_ATA_ADDRESS>", "User")
   
4. VERIFY SETUP:
   Run: .\verify-clout-setup.ps1
"@ -ForegroundColor White

Write-Host "`n=== Current Config ===" -ForegroundColor Cyan
Write-Host "CLOUT_PROGRAM_ID: $([Environment]::GetEnvironmentVariable('CLOUT_PROGRAM_ID', 'User'))"
Write-Host "REWARDS_VAULT: $([Environment]::GetEnvironmentVariable('REWARDS_VAULT', 'User') ?? 'NOT SET')"
Write-Host "`n✓ Configuration script complete!" -ForegroundColor Green
Write-Host "   Now fund your wallet and create the ATA." -ForegroundColor Yellow

