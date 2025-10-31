#!/bin/bash
# Check if ATA exists, if not create it with funded wallet

OWNER="3XEs3MJ8PFiqTTqrK6RAkK9vt95jQQ1hKNNKHiE6jJ3o"
MINT="62hWQAgAV4jugHSuZsMqzxZNVXaVLrbRpz3Sw58Z64Mw"
REWARDS_VAULT="2KkNwFZbznAtYX1xjVS6e5BBqQnfaBuTjn42G4zJXAps"

echo "=== Checking if ATA already exists ==="
solana account "$REWARDS_VAULT" --url https://api.mainnet-beta.solana.com 2>&1 | head -5

if [ $? -eq 0 ]; then
    echo ""
    echo "✓ ATA already exists: $REWARDS_VAULT"
    echo ""
    echo "Set this in PowerShell:"
    echo "[Environment]::SetEnvironmentVariable(\"REWARDS_VAULT\",\"$REWARDS_VAULT\",\"User\")"
else
    echo ""
    echo "ATA doesn't exist yet. Checking fee-payer balances..."
    echo ""
    
    # Check temp-keypair balance
    TEMP_ADDR=$(solana-keygen pubkey /mnt/c/Users/KHK89/NFTSol/temp-keypair.json 2>/dev/null || echo "")
    if [ -n "$TEMP_ADDR" ]; then
        echo "temp-keypair.json balance:"
        solana balance "$TEMP_ADDR" --url https://api.mainnet-beta.solana.com
    fi
    
    # Check 3XEs... balance
    echo ""
    echo "3XEs... balance:"
    solana balance "$OWNER" --url https://api.mainnet-beta.solana.com
    
    echo ""
    echo "=== SOLUTION ==="
    echo "Fund ONE of these wallets with 0.02+ SOL, then run:"
    echo ""
    echo "spl-token create-account \"$MINT\" --owner \"$OWNER\" \\"
    echo "  --fee-payer /mnt/c/Users/KHK89/NFTSol/temp-keypair.json \\"
    echo "  --url https://api.mainnet-beta.solana.com"
fi

