#!/bin/bash
# Create CLOUT Rewards Vault ATA - Run this now!

OWNER="<YOUR_OWNER_ADDRESS>"
MINT="<YOUR_CLOUT_MINT_ADDRESS>"

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
    echo "Rewards Vault Address: <YOUR_REWARDS_VAULT_ADDRESS>"
    echo ""
    echo "✓ Environment variables are already set!"
    echo "✓ You're ready to restart your backend!"
else
    echo ""
    echo "✗ Failed to create ATA. Check error above."
fi

