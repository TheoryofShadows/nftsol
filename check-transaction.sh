#!/bin/bash
# Check where the SOL went

TX_SIG="3be8QXozj6K1GUMsYo4SR4AGqSVVtfhR5EXChZQvMS3NzLYNCGfe4cDDJqwofAFdvNEL4K3nG3L8xFMoKVrGDAFi"

echo "=== Checking Transaction Details ==="
echo "Transaction: $TX_SIG"
echo ""

# Get transaction details
solana confirm "$TX_SIG" --url https://api.mainnet-beta.solana.com 2>&1 | head -20

echo ""
echo "=== Checking Wallet Balance ==="
solana balance 3XEs3MJ8PFiqTTqrK6RAkK9vt95jQQ1hKNNKHiE6jJ3o --url https://api.mainnet-beta.solana.com

echo ""
echo "=== Note ==="
echo "If this was a withdrawFromNonce, the SOL might have gone to:"
echo "1. Your fee-payer wallet"
echo "2. A nonce account that was closed"
echo "3. Another wallet in the transaction"
echo ""
echo "Check the transaction on Solana Explorer:"
echo "https://solscan.io/tx/$TX_SIG"

