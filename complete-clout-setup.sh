#!/bin/bash
# Complete CLOUT Setup Verification & Creation Script
# Run this in your WSL terminal where solana CLI is available

set -e

OWNER="3XEs3MJ8PFiqTTqrK6RAkK9vt95jQQ1hKNNKHiE6jJ3o"
MINT="26iJ37BE3icVtoo2QRkfjtYXFHMudG2sbTHAnhF2D6ab"
REWARDS_VAULT="7SBYHw5KQasPKajH6gCDnpWmb5QAh9EBvTi3cUnFAc1v"
TEMP_KEYPAIR="/mnt/c/Users/KHK89/NFTSol/temp-keypair.json"

echo "=== CLOUT Setup Complete Verification ==="
echo ""

# 1. Get temp-keypair address
echo "Step 1: Getting fee-payer address..."
TEMP_ADDR=$(solana-keygen pubkey "$TEMP_KEYPAIR" 2>/dev/null || echo "ERROR")
if [ "$TEMP_ADDR" = "ERROR" ]; then
    echo "⚠️  Could not read temp-keypair.json"
    echo "   Trying alternate method..."
    solana config set --keypair "$TEMP_KEYPAIR" 2>/dev/null || true
    TEMP_ADDR=$(solana address 2>/dev/null || echo "UNKNOWN")
fi
echo "   Fee-payer address: $TEMP_ADDR"
echo ""

# 2. Check balances
echo "Step 2: Checking wallet balances..."
echo "   3XE wallet ($OWNER):"
BAL_3XE=$(solana balance "$OWNER" --url https://api.mainnet-beta.solana.com 2>&1 || echo "ERROR")
echo "   → $BAL_3XE"

if [ "$TEMP_ADDR" != "UNKNOWN" ] && [ "$TEMP_ADDR" != "ERROR" ]; then
    echo "   Fee-payer ($TEMP_ADDR):"
    BAL_TEMP=$(solana balance "$TEMP_ADDR" --url https://api.mainnet-beta.solana.com 2>&1 || echo "ERROR")
    echo "   → $BAL_TEMP"
fi
echo ""

# 3. Check if ATA exists
echo "Step 3: Checking if Rewards Vault ATA exists..."
ATA_CHECK=$(solana account "$REWARDS_VAULT" --url https://api.mainnet-beta.solana.com 2>&1)
if echo "$ATA_CHECK" | grep -q "AccountNotFound\|Error"; then
    echo "   ✗ ATA does NOT exist yet"
    echo ""
    
    # 4. Try to create ATA
    echo "Step 4: Attempting to create ATA..."
    
    # Check which wallet has funds
    if echo "$BAL_3XE" | grep -q "SOL" && ! echo "$BAL_3XE" | grep -q "0 SOL"; then
        echo "   → 3XE wallet has funds!"
        echo "   ⚠️  Need 3XE keypair to use as fee-payer"
        echo "   → Alternative: Fund fee-payer wallet ($TEMP_ADDR) with 0.02 SOL"
    fi
    
    if [ "$TEMP_ADDR" != "UNKNOWN" ] && [ "$TEMP_ADDR" != "ERROR" ]; then
        if echo "$BAL_TEMP" | grep -q "SOL" && ! echo "$BAL_TEMP" | grep -q "0 SOL"; then
            echo "   → Fee-payer has funds! Creating ATA..."
            spl-token create-account "$MINT" --owner "$OWNER" \
              --fee-payer "$TEMP_KEYPAIR" \
              --url https://api.mainnet-beta.solana.com
            
            if [ $? -eq 0 ]; then
                echo ""
                echo "   ✓ ATA created successfully!"
            else
                echo ""
                echo "   ✗ Failed to create ATA"
            fi
        else
            echo "   ⚠️  Fee-payer has insufficient funds"
            echo "   → Send 0.02 SOL to: $TEMP_ADDR"
        fi
    fi
else
    echo "   ✓ ATA already exists!"
fi
echo ""

# 5. Final verification
echo "Step 5: Final verification..."
FINAL_CHECK=$(solana account "$REWARDS_VAULT" --url https://api.mainnet-beta.solana.com 2>&1)
if echo "$FINAL_CHECK" | grep -q "AccountNotFound\|Error"; then
    echo "   ✗ ATA still does not exist"
    echo ""
    echo "=== SETUP INCOMPLETE ==="
    echo "Action needed:"
    echo "1. Fund fee-payer wallet ($TEMP_ADDR) with 0.02 SOL"
    echo "2. Then run this script again"
else
    echo "   ✓ ATA exists and is ready!"
    echo ""
    echo "=== SETUP COMPLETE ==="
    echo ""
    echo "Next steps (run in PowerShell):"
    echo "[Environment]::SetEnvironmentVariable(\"CLOUT_PROGRAM_ID\",\"$MINT\",\"User\")"
    echo "[Environment]::SetEnvironmentVariable(\"REWARDS_VAULT\",\"$REWARDS_VAULT\",\"User\")"
    echo ""
    echo "Or run: .\\set-clout-env.ps1"
fi
echo ""

