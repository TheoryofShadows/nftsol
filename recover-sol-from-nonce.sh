#!/bin/bash
# Recover SOL from nonce account

NONCE_ACCOUNT="K23Cgc3Jxp2RQ189Ki5oiQJKq2XMiFDN33aALLY35AW"
WALLET="<YOUR_OWNER_ADDRESS>"

echo "=== Checking Nonce Account ==="
echo "Nonce account: $NONCE_ACCOUNT"
echo ""

# Check nonce account balance
echo "Nonce account balance:"
solana balance "$NONCE_ACCOUNT" --url https://api.mainnet-beta.solana.com

echo ""
echo "=== Withdrawing SOL from Nonce Account ==="
echo "This will withdraw all SOL from the nonce account to your wallet"
echo ""

# Withdraw from nonce account (withdraw all but leave enough for rent)
# Nonce accounts need ~0.0015 SOL for rent, so withdraw the rest
echo "Withdrawing SOL to: $WALLET"
solana withdraw-from-nonce-account "$NONCE_ACCOUNT" "$WALLET" ALL \
  --nonce-authority /mnt/c/Users/KHK89/NFTSol/temp-keypair.json \
  --url https://api.mainnet-beta.solana.com

if [ $? -eq 0 ]; then
    echo ""
    echo "✓ SOL withdrawn successfully!"
    echo ""
    echo "Checking your wallet balance..."
    sleep 2
    solana balance "$WALLET" --url https://api.mainnet-beta.solana.com
    echo ""
    echo "Now you can create the ATA!"
else
    echo ""
    echo "✗ Failed to withdraw. The nonce account might:"
    echo "  - Already be closed/withdrawn"
    echo "  - Require different authority"
    echo "  - Be owned by a different wallet"
    echo ""
    echo "Check the nonce account manually:"
    echo "solana nonce-account $NONCE_ACCOUNT --url https://api.mainnet-beta.solana.com"
fi

