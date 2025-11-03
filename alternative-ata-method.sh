#!/bin/bash
# Alternative method - check account type and try different approach

OWNER="<YOUR_OWNER_ADDRESS>"
MINT="<YOUR_CLOUT_MINT_ADDRESS>"

echo "=== Checking Account Type ==="
echo "Inspecting account: $OWNER"
solana account "$OWNER" --url https://api.mainnet-beta.solana.com | head -20
echo ""

echo "=== Trying Alternative: Create ATA using owner as fee-payer (no --fee-payer flag) ==="
echo "This uses the default keypair which should be your wallet"
echo ""

# Set the owner wallet as the default
solana config set --keypair /mnt/c/Users/KHK89/NFTSol/temp-keypair.json
solana config set --url https://api.mainnet-beta.solana.com

echo "Current config:"
solana config get
echo ""

echo "Attempting ATA creation with default keypair..."
spl-token create-account "$MINT" --url https://api.mainnet-beta.solana.com

if [ $? -eq 0 ]; then
    echo ""
    echo "✓✓✓ SUCCESS! ✓✓✓"
    echo "Rewards Vault: <YOUR_REWARDS_VAULT_ADDRESS>"
    echo "🎉 SETUP COMPLETE! 🎉"
else
    echo ""
    echo "✗ Still failed. Trying one more method..."
    echo ""
    echo "=== Method 2: Create account without specifying owner (uses default) ==="
    spl-token create-account "$MINT" --owner "$OWNER" --url https://api.mainnet-beta.solana.com
fi

