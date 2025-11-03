#!/bin/bash
# CLOUT Setup Script - Run in WSL/bash

echo "=== CLOUT Setup - WSL Commands ===" 

# 1. Configure Solana CLI
echo ""
echo "Step 1: Configuring Solana CLI..."
solana config set --url https://api.mainnet-beta.solana.com
solana config set --keypair /mnt/c/Users/KHK89/NFTSol/temp-keypair.json

echo ""
echo "Current config:"
solana config get

echo ""
echo "Fee-payer address:"
solana address

echo ""
echo "Fee-payer balance:"
solana balance

# 2. Create CLOUT Rewards Vault
echo ""
echo "=== Step 2: Creating CLOUT Rewards Vault ==="
OWNER="<YOUR_OWNER_ADDRESS>"
MINT="<YOUR_CLOUT_MINT_ADDRESS>"

echo "Creating ATA for owner: $OWNER"
echo "Mint: $MINT"
echo ""

# Create the ATA
REWARDS_VAULT=$(spl-token create-account "$MINT" --owner "$OWNER" --url https://api.mainnet-beta.solana.com 2>&1 | grep -i "Creating account" | awk '{print $3}')

if [ -n "$REWARDS_VAULT" ]; then
    echo ""
    echo "✓ Rewards Vault Created!"
    echo "REWARDS_VAULT=$REWARDS_VAULT"
    echo ""
    echo "Next step: Copy this address and run this in PowerShell:"
    echo "[Environment]::SetEnvironmentVariable(\"REWARDS_VAULT\",\"$REWARDS_VAULT\",\"User\")"
else
    echo ""
    echo "✗ Failed to create ATA. Check the error above."
    echo "Common issues:"
    echo "  - Fee-payer has 0 SOL (need at least 0.02 SOL)"
    echo "  - Network issues"
fi

# 3. Verify the ATA was created
if [ -n "$REWARDS_VAULT" ]; then
    echo ""
    echo "=== Step 3: Verifying ATA ==="
    echo "Checking token accounts for owner $OWNER:"
    spl-token accounts --owner "$OWNER" --url https://api.mainnet-beta.solana.com
fi

