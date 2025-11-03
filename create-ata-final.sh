#!/bin/bash
# Final ATA Creation - Corrected URL

OWNER="<YOUR_OWNER_ADDRESS>"
MINT="<YOUR_CLOUT_MINT_ADDRESS>"

echo "=== Creating CLOUT Rewards Vault ==="
echo "Owner: $OWNER"
echo "Mint: $MINT"
echo ""

# Check balance first
echo "Checking balance..."
BALANCE=$(solana balance "$OWNER" --url https://api.mainnet-beta.solana.com 2>&1 | grep -oP '\d+\.\d+' | head -1)
echo "Balance: $BALANCE SOL"
echo ""

if (( $(echo "$BALANCE >= 0.0025" | bc -l 2>/dev/null || echo "0") )); then
    echo "✓ Sufficient funds! Creating ATA..."
    echo ""
    
    # Create the ATA - NO TRAILING PERIOD in URL!
    spl-token create-account "$MINT" --owner "$OWNER" \
      --fee-payer /mnt/c/Users/KHK89/NFTSol/temp-keypair.json \
      --url https://api.mainnet-beta.solana.com
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✓✓✓ SUCCESS! Rewards Vault created!" 
        echo ""
        echo "Address: <YOUR_REWARDS_VAULT_ADDRESS>"
        echo ""
        echo "✓ Environment variables are already set!"
        echo "✓ Your CLOUT setup is COMPLETE!"
        echo ""
        echo "Next: Restart your backend!"
    else
        echo ""
        echo "✗ Transaction failed. Check balance and retry."
    fi
else
    echo "✗ Insufficient funds. Need 0.0025+ SOL"
    echo "Current: $BALANCE SOL"
fi

