#!/bin/bash
# Final ATA creation - same address, verify balance and create

OWNER="3XEs3MJ8PFiqTTqrK6RAkK9vt95jQQ1hKNNKHiE6jJ3o"
MINT="62hWQAgAV4jugHSuZsMqzxZNVXaVLrbRpz3Sw58Z64Mw"

echo "=== Current Balance Check ==="
BALANCE_OUTPUT=$(solana balance "$OWNER" --url https://api.mainnet-beta.solana.com 2>&1)
echo "$BALANCE_OUTPUT"
echo ""

# Extract balance number
BALANCE=$(echo "$BALANCE_OUTPUT" | grep -oE '[0-9]+\.[0-9]+' | head -1)

echo "Parsed balance: $BALANCE SOL"
echo ""

# Check if we have enough (need at least 0.00203928 for rent + 0.000005 for fees = ~0.00205)
if [ -n "$BALANCE" ]; then
    echo "Checking if sufficient (need 0.00205+ SOL)..."
    
    # Use awk for comparison (works in bash)
    SUFFICIENT=$(echo "$BALANCE 0.00205" | awk '{if ($1 >= $2) print "yes"; else print "no"}')
    
    if [ "$SUFFICIENT" = "yes" ]; then
        echo "✓ Balance is sufficient! Creating ATA..."
        echo ""
        
        spl-token create-account "$MINT" --owner "$OWNER" \
          --fee-payer /mnt/c/Users/KHK89/NFTSol/temp-keypair.json \
          --url https://api.mainnet-beta.solana.com
        
        if [ $? -eq 0 ]; then
            echo ""
            echo "✓✓✓ SUCCESS! ATA CREATED!"
            echo ""
            echo "Rewards Vault: 2KkNwFZbznAtYX1xjVS6e5BBqQnfaBuTjn42G4zJXAps"
            echo ""
            echo "✓ Environment variables already set!"
            echo "✓ CLOUT setup is COMPLETE!"
            echo ""
            echo "Restart your backend now!"
        else
            echo ""
            echo "✗ Transaction failed. This might be a network/RPC issue."
            echo "Try again in a moment, or check Solana network status."
        fi
    else
        echo "✗ Balance ($BALANCE SOL) is still too low"
        echo "Need at least 0.00205 SOL total"
        echo ""
        echo "Send more SOL to: $OWNER"
        echo "Then run this script again."
    fi
else
    echo "Could not parse balance. Full output:"
    echo "$BALANCE_OUTPUT"
    echo ""
    echo "Trying to create ATA anyway..."
    spl-token create-account "$MINT" --owner "$OWNER" \
      --fee-payer /mnt/c/Users/KHK89/NFTSol/temp-keypair.json \
      --url https://api.mainnet-beta.solana.com
fi

