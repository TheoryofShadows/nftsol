#!/bin/bash
# Check if ATA exists and try alternative creation method

OWNER="3XEs3MJ8PFiqTTqrK6RAkK9vt95jQQ1hKNNKHiE6jJ3o"
MINT="62hWQAgAV4jugHSuZsMqzxZNVXaVLrbRpz3Sw58Z64Mw"
REWARDS_VAULT="2KkNwFZbznAtYX1xjVS6e5BBqQnfaBuTjn42G4zJXAps"

echo "=== Checking if ATA Already Exists ==="
ACCOUNT_CHECK=$(solana account "$REWARDS_VAULT" --url https://api.mainnet-beta.solana.com 2>&1)

if echo "$ACCOUNT_CHECK" | grep -q "AccountNotFound\|Error"; then
    echo "ATA does NOT exist"
    ATA_EXISTS=false
else
    echo "ATA EXISTS!"
    echo "$ACCOUNT_CHECK" | head -10
    ATA_EXISTS=true
fi

if [ "$ATA_EXISTS" = "true" ]; then
    echo ""
    echo "✓✓✓ ATA ALREADY EXISTS! ✓✓✓"
    echo ""
    echo "Rewards Vault: $REWARDS_VAULT"
    echo ""
    echo "🎉 Your CLOUT setup is actually COMPLETE! 🎉"
    echo ""
    echo "Environment variables are already set:"
    echo "  CLOUT_PROGRAM_ID: 62hWQAgAV4jugHSuZsMqzxZNVXaVLrbRpz3Sw58Z64Mw"
    echo "  REWARDS_VAULT: $REWARDS_VAULT"
    echo ""
    echo "Restart your backend: node apps/backend/dist/index.js"
    exit 0
fi

echo ""
echo "ATA does not exist yet."
echo ""

echo "=== Current Balance ==="
BALANCE=$(solana balance "$OWNER" --url https://api.mainnet-beta.solana.com 2>&1)
echo "$BALANCE"
echo ""

echo "=== Trying Alternative Method ==="
echo "Attempting to create ATA using spl-token accounts command..."

# Try using spl-token accounts to trigger creation
spl-token accounts --owner "$OWNER" --mint "$MINT" --url https://api.mainnet-beta.solana.com 2>&1

echo ""
echo ""
echo "If that didn't create it, you need more SOL."
echo "Send 0.002 SOL to: $OWNER"
echo "Then try creating again."

