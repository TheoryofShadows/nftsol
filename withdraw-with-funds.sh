#!/bin/bash
# Withdraw from nonce account - need fee-payer to have SOL first

NONCE_ACCOUNT="K23Cgc3Jxp2RQ189Ki5oiQJKq2XMiFDN33aALLY35AW"
WALLET="<YOUR_OWNER_ADDRESS>"
FEE_PAYER="/mnt/c/Users/KHK89/NFTSol/temp-keypair.json"

echo "=== Current Situation ==="
echo "Nonce account has: 0.24 SOL"
echo "Fee-payer balance:"
solana balance "$WALLET" --url https://api.mainnet-beta.solana.com
echo ""

FEE_BAL=$(solana balance "$WALLET" --url https://api.mainnet-beta.solana.com 2>&1 | grep -oE '[0-9]+\.[0-9]+' | head -1)

echo ""
echo "=== SOLUTION ==="
echo ""
echo "The fee-payer needs a tiny amount of SOL (0.0001) to pay transaction fees."
echo ""

# Check if fee-payer has any SOL
if [ -n "$FEE_BAL" ] && (( $(echo "$FEE_BAL >= 0.0001" | bc -l 2>/dev/null || echo 0) )); then
    echo "✓ Fee-payer has sufficient funds. Withdrawing now..."
    echo ""
    
    # Try withdrawing a smaller amount first to leave some in nonce for potential fees
    solana withdraw-from-nonce-account "$NONCE_ACCOUNT" "$WALLET" 0.23 \
      --nonce-authority "$FEE_PAYER" \
      --url https://api.mainnet-beta.solana.com
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✓✓✓ Successfully withdrawn 0.23 SOL!"
        echo ""
        echo "Your wallet balance:"
        sleep 2
        solana balance "$WALLET" --url https://api.mainnet-beta.solana.com
    else
        echo ""
        echo "✗ Withdrawal failed. Fee-payer needs more SOL."
        echo ""
        echo "ACTION: Send 0.0001 SOL to your wallet ($WALLET) from another source"
        echo "Then run this script again."
    fi
else
    echo "✗ Fee-payer has insufficient funds: $FEE_BAL SOL"
    echo ""
    echo "ACTION REQUIRED:"
    echo "Send 0.0001 SOL to: $WALLET"
    echo "You can send from:"
    echo "  - Phantom wallet"
    echo "  - Another Solana wallet"
    echo "  - Exchange"
    echo ""
    echo "Then run this script again to withdraw the 0.24 SOL from nonce account."
fi

