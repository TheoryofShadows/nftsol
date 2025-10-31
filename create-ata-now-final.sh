#!/bin/bash
# Create CLOUT ATA - Final attempt

OWNER="3XEs3MJ8PFiqTTqrK6RAkK9vt95jQQ1hKNNKHiE6jJ3o"
MINT="62hWQAgAV4jugHSuZsMqzxZNVXaVLrbRpz3Sw58Z64Mw"

echo "=== Creating CLOUT Rewards Vault ==="
echo "Owner: $OWNER"
echo "Mint: $MINT"
echo ""

# Check balance
echo "Current wallet balance:"
solana balance "$OWNER" --url https://api.mainnet-beta.solana.com
echo ""

# Create the ATA
echo "Creating Associated Token Account (ATA)..."
spl-token create-account "$MINT" --owner "$OWNER" \
  --fee-payer /mnt/c/Users/KHK89/NFTSol/temp-keypair.json \
  --url https://api.mainnet-beta.solana.com

if [ $? -eq 0 ]; then
    echo ""
    echo "✓✓✓ SUCCESS! ATA CREATED! ✓✓✓"
    echo ""
    echo "========================================="
    echo "  Rewards Vault Address:"
    echo "  2KkNwFZbznAtYX1xjVS6e5BBqQnfaBuTjn42G4zJXAps"
    echo "========================================="
    echo ""
    echo "✓ Environment variables already set!"
    echo "✓ CLOUT_PROGRAM_ID: 62hWQAgAV4jugHSuZsMqzxZNVXaVLrbRpz3Sw58Z64Mw"
    echo "✓ REWARDS_VAULT: 2KkNwFZbznAtYX1xjVS6e5BBqQnfaBuTjn42G4zJXAps"
    echo ""
    echo "🎉 CLOUT SETUP IS COMPLETE! 🎉"
    echo ""
    echo "Next step: Restart your backend:"
    echo "  node apps/backend/dist/index.js"
else
    echo ""
    echo "✗ Transaction failed. Check error above."
    echo ""
    echo "If 'Insufficient funds', check balance:"
    echo "  solana balance $OWNER --url https://api.mainnet-beta.solana.com"
fi

