#!/bin/bash

# NFTSol Health Check Script
# Run this to verify deployment

BASE_URL=${1:-"https://nftsol-dev.onrender.com"}

echo "🔍 NFTSol Health Check"
echo "====================="
echo "Testing: $BASE_URL"

# Test 1: Basic health endpoint
echo "📊 Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s "$BASE_URL/healthz")
if echo "$HEALTH_RESPONSE" | grep -q "healthy"; then
    echo "✅ Health check passed"
else
    echo "❌ Health check failed"
    echo "Response: $HEALTH_RESPONSE"
    exit 1
fi

# Test 2: Programs endpoint
echo "📊 Testing programs endpoint..."
PROGRAMS_RESPONSE=$(curl -s "$BASE_URL/api/programs")
if echo "$PROGRAMS_RESPONSE" | grep -q "CLOUT_PROGRAM_ID"; then
    echo "✅ Programs endpoint working"
else
    echo "❌ Programs endpoint failed"
    echo "Response: $PROGRAMS_RESPONSE"
fi

# Test 3: Withdrawal endpoint (should return auth error, not 404)
echo "📊 Testing withdrawal endpoint..."
WITHDRAWAL_RESPONSE=$(curl -s -X POST "$BASE_URL/api/wallets/withdraw" \
    -H "Content-Type: application/json" \
    -d '{"amount_sol":0.01,"to_address":"11111111111111111111111111111112"}')
if echo "$WITHDRAWAL_RESPONSE" | grep -q "not_authenticated\|missing_params"; then
    echo "✅ Withdrawal endpoint accessible"
else
    echo "❌ Withdrawal endpoint not accessible"
    echo "Response: $WITHDRAWAL_RESPONSE"
fi

echo "🎉 Health check complete!"
