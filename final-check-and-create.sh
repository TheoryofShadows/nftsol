#!/bin/bash
# Final check and create ATA

OWNER="<YOUR_OWNER_ADDRESS>"
NONCE_ACCOUNT="K23Cgc3Jxp2RQ189Ki5oiQJKq2XMiFDN33aALLY35AW"
MINT="<YOUR_CLOUT_MINT_ADDRESS>"

echo "=== Checking Current Balance ==="
BALANCE=$(solana balance "$OWNER" --url https://api.mainnet-beta.solana.com 2>&1)
echo "$BALANCE"
echo ""

BAL_NUM=$(echo "$BALANCE" | grep -oE '[0-9]+\.[0-9]+' | head -1)

if [ -n "$BAL_NUM" ]; then
    echo "Balance: $BAL_NUM SOL"
    
    # If balance is high enough (0.002+), create ATA directly
    if (( $(echo "$BAL_NUM >= 0.002" | bc -l 2>/dev/null || echo 0) )); then
        echo ""
        echo "✓ Balance sufficient! Creating ATA..."
        echo ""
        spl-token create-account "$MINT" --owner "$OWNER" \
          --fee-payer /mnt/c/Users/KHK89/NFTSol/temp-keypair.json \
          --url https://api.mainnet-beta.solana.com
        
        if [ $? -eq 0 ]; then
            echo ""
            echo "✓✓✓ SUCCESS! ATA CREATED!"
            echo "Rewards Vault: <YOUR_REWARDS_VAULT_ADDRESS>"
            echo "🎉 SETUP COMPLETE! 🎉"
        fi
    
    # If balance is low but has enough for withdrawal fees
    elif (( $(echo "$BAL_NUM >= 0.0005" | bc -l 2>/dev/null || echo 0) )); then
        echo ""
        echo "→ Withdrawing from nonce account first..."
        solana withdraw-from-nonce-account "$NONCE_ACCOUNT" "$OWNER" 0.23 \
          --nonce-authority /mnt/c/Users/KHK89/NFTSol/temp-keypair.json \
          --url https://api.mainnet-beta.solana.com
        
        if [ $? -eq 0 ]; then
            echo ""
            echo "✓ Withdrawn! Waiting 5 seconds..."
            sleep 5
            echo ""
            echo "Creating ATA..."
            spl-token create-account "$MINT" --owner "$OWNER" \
              --fee-payer /mnt/c/Users/KHK89/NFTSol/temp-keypair.json \
              --url https://api.mainnet-beta.solana.com
            
            if [ $? -eq 0 ]; then
                echo ""
                echo "✓✓✓ SUCCESS! ATA CREATED!"
                echo "Rewards Vault: <YOUR_REWARDS_VAULT_ADDRESS>"
                echo "🎉 SETUP COMPLETE! 🎉"
            fi
        fi
    
    else
        echo ""
        echo "✗ Balance too low: $BAL_NUM SOL"
        echo "Send 0.001 SOL from external source, then run this script again."
    fi
else
    echo "Could not parse balance. Full output:"
    echo "$BALANCE"
fi

