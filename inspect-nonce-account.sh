#!/bin/bash
# Inspect the nonce account to see what it actually is

NONCE_ACCOUNT="K23Cgc3Jxp2RQ189Ki5oiQJKq2XMiFDN33aALLY35AW"

echo "=== Inspecting Account ==="
echo "Account: $NONCE_ACCOUNT"
echo ""

echo "1. Account Info:"
solana account "$NONCE_ACCOUNT" --url https://api.mainnet-beta.solana.com 2>&1 | head -20
echo ""

echo "2. Nonce Account Details (if it is a nonce account):"
solana nonce-account "$NONCE_ACCOUNT" --url https://api.mainnet-beta.solana.com 2>&1
echo ""

echo "3. Balance:"
solana balance "$NONCE_ACCOUNT" --url https://api.mainnet-beta.solana.com
echo ""

echo "=== Analysis ==="
echo "If 'nonce-account' command fails, this might not be a nonce account."
echo "It might be a regular account or have a different structure."

