#!/bin/bash
# Simple ATA creation - skip nonce account

OWNER="3XEs3MJ8PFiqTTqrK6RAkK9vt95jQQ1hKNNKHiE6jJ3o"
MINT="62hWQAgAV4jugHSuZsMqzxZNVXaVLrbRpz3Sw58Z64Mw"

echo "=== Current Balance ==="
solana balance "$OWNER" --url https://api.mainnet-beta.solana.com
echo ""

echo "=== Creating CLOUT ATA ==="
spl-token create-account "$MINT" --owner "$OWNER" \
  --fee-payer /mnt/c/Users/KHK89/NFTSol/temp-keypair.json \
  --url https://api.mainnet-beta.solana.com

if [ $? -eq 0 ]; then
    echo ""
    echo "✓✓✓ SUCCESS! ✓✓✓"
    echo ""
    echo "Rewards Vault: 2KkNwFZbznAtYX1xjVS6e5BBqQnfaBuTjn42G4zJXAps"
    echo ""
    echo "🎉 CLOUT SETUP COMPLETE! 🎉"
    echo "Restart your backend: node apps/backend/dist/index.js"
else
    echo ""
    echo "✗ Failed - need more SOL"
    echo "Send 0.001 SOL more to: $OWNER"
    echo "Then run this script again."
fi

