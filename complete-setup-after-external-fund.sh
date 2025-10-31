#!/bin/bash
# Complete setup after receiving external SOL

OWNER="3XEs3MJ8PFiqTTqrK6RAkK9vt95jQQ1hKNNKHiE6jJ3o"
NONCE_ACCOUNT="K23Cgc3Jxp2RQ189Ki5oiQJKq2XMiFDN33aALLY35AW"
MINT="62hWQAgAV4jugHSuZsMqzxZNVXaVLrbRpz3Sw58Z64Mw"

echo "=== Step 1: Check Balance ==="
BALANCE=$(solana balance "$OWNER" --url https://api.mainnet-beta.solana.com 2>&1)
echo "$BALANCE"
echo ""

# Extract balance number
BAL_NUM=$(echo "$BALANCE" | grep -oE '[0-9]+\.[0-9]+' | head -1)

if [ -z "$BAL_NUM" ] || (( $(echo "$BAL_NUM < 0.0005" | bc -l 2>/dev/null || echo 1) )); then
    echo "✗ Balance still too low. Need at least 0.0005 SOL to pay withdrawal fees."
    echo "Send 0.001 SOL from external source, then run this script again."
    exit 1
fi

echo "✓ Sufficient balance. Proceeding..."
echo ""

echo "=== Step 2: Withdraw from Nonce Account ==="
solana withdraw-from-nonce-account "$NONCE_ACCOUNT" "$OWNER" 0.23 \
  --nonce-authority /mnt/c/Users/KHK89/NFTSol/temp-keypair.json \
  --url https://api.mainnet-beta.solana.com

if [ $? -eq 0 ]; then
    echo ""
    echo "✓ Successfully withdrawn from nonce account!"
    echo ""
    echo "Waiting 5 seconds for transaction to finalize..."
    sleep 5
    
    echo ""
    echo "New balance:"
    solana balance "$OWNER" --url https://api.mainnet-beta.solana.com
    echo ""
    
    echo "=== Step 3: Create CLOUT ATA ==="
    spl-token create-account "$MINT" --owner "$OWNER" \
      --fee-payer /mnt/c/Users/KHK89/NFTSol/temp-keypair.json \
      --url https://api.mainnet-beta.solana.com
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✓✓✓ SUCCESS! ATA CREATED! ✓✓✓"
        echo ""
        echo "Rewards Vault: 2KkNwFZbznAtYX1xjVS6e5BBqQnfaBuTjn42G4zJXAps"
        echo ""
        echo "🎉 CLOUT SETUP COMPLETE! 🎉"
        echo "Restart your backend now!"
    else
        echo ""
        echo "✗ ATA creation failed. Check balance and retry."
    fi
else
    echo ""
    echo "✗ Withdrawal failed. Check if you have enough SOL for fees."
    echo "Current balance: $BAL_NUM SOL"
fi

