#!/bin/bash
# Check balance and create ATA if enough funds

OWNER="<YOUR_OWNER_ADDRESS>"
MINT="<YOUR_CLOUT_MINT_ADDRESS>"

echo "=== Checking Balance ==="
BALANCE=$(solana balance "$OWNER" --url https://api.mainnet-beta.solana.com 2>&1 | grep -oP '\d+\.\d+' | head -1)
echo "Current balance: $BALANCE SOL"
echo ""

# Check if balance is sufficient (need at least 0.0025 SOL)
if (( $(echo "$BALANCE >= 0.0025" | bc -l) )); then
    echo "✓ Sufficient funds! Creating ATA..."
    echo ""
    spl-token create-account "$MINT" --owner "$OWNER" \
      --fee-payer /mnt/c/Users/KHK89/NFTSol/temp-keypair.json \
      --url https://api.mainnet-beta.solana.com
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✓ SUCCESS! Rewards Vault created: <YOUR_REWARDS_VAULT_ADDRESS>"
    fi
else
    echo "✗ Insufficient funds. Need at least 0.0025 SOL"
    echo "Current: $BALANCE SOL"
    echo ""
    echo "Send more SOL to: $OWNER"
    echo "Then run this script again."
fi

