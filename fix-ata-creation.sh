#!/bin/bash
# Fix ATA creation - check balances and use correct fee-payer

OWNER="3XEs3MJ8PFiqTTqrK6RAkK9vt95jQQ1hKNNKHiE6jJ3o"
MINT="62hWQAgAV4jugHSuZsMqzxZNVXaVLrbRpz3Sw58Z64Mw"
TEMP_KEYPAIR="/mnt/c/Users/KHK89/NFTSol/temp-keypair.json"

echo "=== Checking All Wallet Balances ==="
echo ""

# Get temp-keypair address
echo "1. Fee-payer (temp-keypair) address:"
TEMP_ADDR=$(solana-keygen pubkey "$TEMP_KEYPAIR" 2>/dev/null)
if [ -z "$TEMP_ADDR" ]; then
    solana config set --keypair "$TEMP_KEYPAIR" 2>/dev/null
    TEMP_ADDR=$(solana address 2>/dev/null)
fi
echo "   $TEMP_ADDR"
echo "   Balance:"
TEMP_BAL=$(solana balance "$TEMP_ADDR" --url https://api.mainnet-beta.solana.com 2>&1)
echo "   $TEMP_BAL"
echo ""

echo "2. Owner wallet (3XE) address:"
echo "   $OWNER"
echo "   Balance:"
OWNER_BAL=$(solana balance "$OWNER" --url https://api.mainnet-beta.solana.com 2>&1)
echo "   $OWNER_BAL"
echo ""

# Determine which wallet to use
if echo "$TEMP_BAL" | grep -qE "[1-9]" && ! echo "$TEMP_BAL" | grep -q "0 SOL"; then
    echo "✓ Using temp-keypair as fee-payer..."
    FEE_PAYER="$TEMP_KEYPAIR"
    FEE_ADDR="$TEMP_ADDR"
elif echo "$OWNER_BAL" | grep -qE "[1-9]" && ! echo "$OWNER_BAL" | grep -q "0 SOL"; then
    echo "⚠️  Temp-keypair has low balance, but 3XE has funds"
    echo "   Option 1: Send 0.003 SOL from 3XE to fee-payer ($TEMP_ADDR)"
    echo "   Option 2: Create 3XE keypair file and use it as fee-payer"
    echo ""
    echo "   For now, trying with temp-keypair anyway..."
    FEE_PAYER="$TEMP_KEYPAIR"
    FEE_ADDR="$TEMP_ADDR"
else
    echo "✗ Both wallets need funding!"
    exit 1
fi

echo ""
echo "=== Creating ATA ==="
echo "Using fee-payer: $FEE_ADDR"
echo ""

spl-token create-account "$MINT" --owner "$OWNER" \
  --fee-payer "$FEE_PAYER" \
  --url https://api.mainnet-beta.solana.com

if [ $? -eq 0 ]; then
    echo ""
    echo "✓✓✓ SUCCESS! Rewards Vault created!"
    echo "Address: 2KkNwFZbznAtYX1xjVS6e5BBqQnfaBuTjn42G4zJXAps"
    echo ""
    echo "✓ Setup complete! Restart your backend."
else
    echo ""
    echo "✗ Still failed. Quick fix:"
    echo "Send 0.003 SOL from 3XE wallet to fee-payer: $FEE_ADDR"
    echo "Then run this script again."
fi

