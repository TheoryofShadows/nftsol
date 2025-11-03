#!/bin/bash
# Final solution to create ATA

OWNER="<YOUR_OWNER_ADDRESS>"
MINT="<YOUR_CLOUT_MINT_ADDRESS>"

echo "=== Verifying ATA Status ==="
REWARDS_VAULT="<YOUR_REWARDS_VAULT_ADDRESS>"
CHECK=$(solana account "$REWARDS_VAULT" --url https://api.mainnet-beta.solana.com 2>&1)

if echo "$CHECK" | grep -q "AccountNotFound"; then
    echo "ATA does NOT exist - will create it now"
    echo ""
    
    echo "=== Current Balance ==="
    solana balance "$OWNER" --url https://api.mainnet-beta.solana.com
    echo ""
    
    BAL_NUM=$(solana balance "$OWNER" --url https://api.mainnet-beta.solana.com 2>&1 | grep -oE '[0-9]+\.[0-9]+' | head -1)
    
    if [ -n "$BAL_NUM" ] && (( $(echo "$BAL_NUM >= 0.0025" | bc -l 2>/dev/null || echo 0) )); then
        echo "✓ Sufficient balance ($BAL_NUM SOL). Creating ATA..."
        echo ""
        
        spl-token create-account "$MINT" --owner "$OWNER" \
          --fee-payer /mnt/c/Users/KHK89/NFTSol/temp-keypair.json \
          --url https://api.mainnet-beta.solana.com
        
        if [ $? -eq 0 ]; then
            echo ""
            echo "✓✓✓ SUCCESS! ATA CREATED! ✓✓✓"
            echo "Rewards Vault: $REWARDS_VAULT"
            echo "🎉 SETUP COMPLETE! 🎉"
        else
            echo ""
            echo "✗ Failed. The error 'from must not carry data' suggests:"
            echo "  1. Account issue - try sending 0.003 SOL total to ensure enough for rent"
            echo "  2. Or the wallet account might have data stored"
            echo ""
            echo "Send 0.003 SOL total to: $OWNER"
            echo "Then run this script again."
        fi
    else
        echo "✗ Balance too low: $BAL_NUM SOL"
        echo "Need at least 0.0025 SOL"
        echo ""
        echo "Send 0.002 SOL to: $OWNER"
        echo "Then run this script again."
    fi
else
    echo "✓✓✓ ATA ALREADY EXISTS! ✓✓✓"
    echo ""
    echo "Rewards Vault: $REWARDS_VAULT"
    echo "🎉 Your setup is COMPLETE! 🎉"
    echo ""
    echo "Restart backend: node apps/backend/dist/index.js"
fi

