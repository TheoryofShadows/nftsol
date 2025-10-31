#!/bin/bash
# Create CLOUT Rewards Vault ATA - Run this now!

OWNER="3XEs3MJ8PFiqTTqrK6RAkK9vt95jQQ1hKNNKHiE6jJ3o"
MINT="62hWQAgAV4jugHSuZsMqzxZNVXaVLrbRpz3Sw58Z64Mw"

echo "=== Creating CLOUT Rewards Vault ==="
echo "Owner: $OWNER"
echo "Mint: $MINT"
echo ""

# Verify balance first
echo "Checking balance..."
solana balance "$OWNER" --url https://api.mainnet-beta.solana.com
echo ""

# Create the ATA
echo "Creating Associated Token Account..."
spl-token create-account "$MINT" --owner "$OWNER" \
  --fee-payer /mnt/c/Users/KHK89/NFTSol/temp-keypair.json \
  --url https://api.mainnet-beta.solana.com

if [ $? -eq 0 ]; then
    echo ""
    echo "✓ SUCCESS! ATA created!"
    echo ""
    echo "Rewards Vault Address: 2KkNwFZbznAtYX1xjVS6e5BBqQnfaBuTjn42G4zJXAps"
    echo ""
    echo "✓ Environment variables are already set!"
    echo "✓ You're ready to restart your backend!"
else
    echo ""
    echo "✗ Failed to create ATA. Check error above."
fi

