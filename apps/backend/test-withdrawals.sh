#!/bin/bash

# NFTSol Withdrawal Test Script
# Test the complete withdrawal flow on devnet

BASE_URL="http://localhost:3000"
DESTINATION_ADDRESS="11111111111111111111111111111112"  # System Program (safe test address)

echo "🚀 Testing NFTSol Withdrawal System"
echo "=================================="

# Test 1: Create withdrawal request
echo "📝 Test 1: Creating withdrawal request..."
RESPONSE=$(curl -s -X POST "$BASE_URL/api/wallets/withdraw" \
  -H "Content-Type: application/json" \
  -d '{
    "amount_sol": 0.01,
    "to_address": "'$DESTINATION_ADDRESS'",
    "request_token": "test-token-123"
  }')

echo "Response: $RESPONSE"
WITHDRAWAL_ID=$(echo $RESPONSE | jq -r '.data.withdrawal.id // empty')

if [ -z "$WITHDRAWAL_ID" ]; then
  echo "❌ Failed to create withdrawal request"
  exit 1
fi

echo "✅ Withdrawal created with ID: $WITHDRAWAL_ID"

# Test 2: List user withdrawals
echo ""
echo "📋 Test 2: Listing user withdrawals..."
curl -s -X GET "$BASE_URL/api/wallets/withdraw" | jq '.'

# Test 3: Admin - List pending withdrawals
echo ""
echo "👨‍💼 Test 3: Admin - Listing pending withdrawals..."
curl -s -X GET "$BASE_URL/api/admin/withdrawals?status=pending" | jq '.'

# Test 4: Admin - Approve withdrawal
echo ""
echo "✅ Test 4: Admin - Approving withdrawal..."
curl -s -X POST "$BASE_URL/api/admin/withdrawals/$WITHDRAWAL_ID/approve" | jq '.'

# Test 5: Admin - Process withdrawal (sends on-chain)
echo ""
echo "🔄 Test 5: Admin - Processing withdrawal..."
PROCESS_RESPONSE=$(curl -s -X POST "$BASE_URL/api/admin/withdrawals/$WITHDRAWAL_ID/process")
echo "Response: $PROCESS_RESPONSE"

TX_SIG=$(echo $PROCESS_RESPONSE | jq -r '.data.transactionSignature // empty')
if [ -n "$TX_SIG" ]; then
  echo "✅ Withdrawal processed! Transaction: $TX_SIG"
  echo "🔍 View on Solana Explorer: https://explorer.solana.com/tx/$TX_SIG?cluster=devnet"
else
  echo "❌ Failed to process withdrawal"
fi

# Test 6: Check withdrawal status
echo ""
echo "📊 Test 6: Checking withdrawal status..."
curl -s -X GET "$BASE_URL/api/wallets/withdraw/$WITHDRAWAL_ID" | jq '.'

# Test 7: Admin stats
echo ""
echo "📈 Test 7: Admin - Withdrawal statistics..."
curl -s -X GET "$BASE_URL/api/admin/withdrawals/stats" | jq '.'

echo ""
echo "🎉 Withdrawal testing complete!"
echo "Check the Solana Explorer link above to verify the transaction on devnet."
