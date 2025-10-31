#!/bin/bash
# Find where the SOL is

echo "=== Current Balances ==="
echo ""
echo "3XE wallet (your rewards owner):"
solana balance 3XEs3MJ8PFiqTTqrK6RAkK9vt95jQQ1hKNNKHiE6jJ3o --url https://api.mainnet-beta.solana.com

echo ""
echo "Fee-payer (temp-keypair):"
TEMP_ADDR=$(solana-keygen pubkey /mnt/c/Users/KHK89/NFTSol/temp-keypair.json 2>/dev/null || solana address 2>/dev/null)
if [ -n "$TEMP_ADDR" ]; then
    solana balance "$TEMP_ADDR" --url https://api.mainnet-beta.solana.com
else
    echo "Could not determine fee-payer address"
fi

echo ""
echo "=== If withdrawFromNonce was used ==="
echo "The 0.01 SOL was likely withdrawn from a nonce account."
echo "Check the transaction details on Solscan:"
echo "https://solscan.io/tx/3be8QXozj6K1GUMsYo4SR4AGqSVVtfhR5EXChZQvMS3NzLYNCGfe4cDDJqwofAFdvNEL4K3nG3L8xFMoKVrGDAFi"
echo ""
echo "The destination address will be shown in the transaction details."

