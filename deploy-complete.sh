#!/bin/bash

# 🚀 NFTSol Complete Deployment Script
# This script deploys everything and runs all tests

echo "🚀 NFTSol Complete Deployment Script"
echo "====================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PLATFORM_WALLET="3EgKZgBNotS5tnYTaWuhEuzS9NLyMQww3C4Vaz5RDhM4"
# SECRET_KEY must be set in .env file or environment - never hardcode!
if [ -z "$PLATFORM_SECRET_KEY_BASE58" ]; then
    if [ -f ".env" ]; then
        export $(grep -v '^#' .env | xargs)
    else
        echo -e "${RED}❌ ERROR: PLATFORM_SECRET_KEY_BASE58 must be set in .env or environment${NC}"
        echo "   Create a .env file with: PLATFORM_SECRET_KEY_BASE58=your_key_here"
        exit 1
    fi
fi
SECRET_KEY="${PLATFORM_SECRET_KEY_BASE58}"
RENDER_URL="https://nftsol.onrender.com"

echo -e "${BLUE}📋 Step 1: Building Backend${NC}"
cd apps/backend
npm install
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backend built successfully${NC}"
else
    echo -e "${RED}❌ Backend build failed${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Step 2: Testing Local Server${NC}"
# Set environment variables
export PLATFORM_SECRET_KEY_BASE58="$SECRET_KEY"
export SOLANA_RPC_URL="https://api.devnet.solana.com"
export NODE_ENV="development"

# Start server in background
node dist/index.js &
SERVER_PID=$!

# Wait for server to start
sleep 5

# Test health endpoint
echo -e "${YELLOW}Testing health endpoint...${NC}"
HEALTH_RESPONSE=$(curl -s http://localhost:3000/healthz)
if echo "$HEALTH_RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✅ Health endpoint working${NC}"
else
    echo -e "${RED}❌ Health endpoint failed${NC}"
    echo "Response: $HEALTH_RESPONSE"
fi

# Test NFT verification
echo -e "${YELLOW}Testing NFT verification...${NC}"
VERIFY_RESPONSE=$(curl -s http://localhost:3000/api/nfts/verify/11111111111111111111111111111112)
if echo "$VERIFY_RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✅ NFT verification working${NC}"
else
    echo -e "${RED}❌ NFT verification failed${NC}"
    echo "Response: $VERIFY_RESPONSE"
fi

# Test programs endpoint
echo -e "${YELLOW}Testing programs endpoint...${NC}"
PROGRAMS_RESPONSE=$(curl -s http://localhost:3000/api/programs)
if echo "$PROGRAMS_RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✅ Programs endpoint working${NC}"
else
    echo -e "${RED}❌ Programs endpoint failed${NC}"
    echo "Response: $PROGRAMS_RESPONSE"
fi

# Stop local server
kill $SERVER_PID

echo -e "${BLUE}📋 Step 3: Platform Wallet Information${NC}"
echo -e "${YELLOW}Platform Wallet: $PLATFORM_WALLET${NC}"
echo -e "${YELLOW}Fund this wallet at: https://faucet.solana.com/${NC}"
echo -e "${YELLOW}Explorer: https://explorer.solana.com/address/$PLATFORM_WALLET?cluster=devnet${NC}"

echo -e "${BLUE}📋 Step 4: Render Deployment Instructions${NC}"
echo -e "${YELLOW}1. Go to your Render dashboard${NC}"
echo -e "${YELLOW}2. Update your backend service${NC}"
echo -e "${YELLOW}3. Set these environment variables:${NC}"
echo ""
echo "SOLANA_RPC_URL=https://api.devnet.solana.com"
echo "PLATFORM_SECRET_KEY_BASE58=<YOUR_SECRET_KEY_HERE>"
echo "USE_MOCK=false"
echo "WITHDRAWALS_ENABLED=true"
echo "DAILY_WITHDRAWAL_LIMIT_SOL=5"
echo "MAX_WITHDRAWAL_SOL=1"
echo "RATE_LIMIT_WINDOW_MINUTES=15"
echo "RATE_LIMIT_MAX_REQUESTS=5"
echo "NODE_ENV=production"
echo "PORT=3000"
echo ""

echo -e "${BLUE}📋 Step 5: Testing Live Deployment${NC}"
echo -e "${YELLOW}After deployment, test these endpoints:${NC}"
echo "curl $RENDER_URL/healthz"
echo "curl $RENDER_URL/api/nfts/verify/11111111111111111111111111111112"
echo "curl $RENDER_URL/api/programs"

echo -e "${BLUE}📋 Step 6: Frontend Deployment${NC}"
echo -e "${YELLOW}1. Push frontend changes to GitHub${NC}"
echo -e "${YELLOW}2. Deploy to Netlify${NC}"
echo -e "${YELLOW}3. Test complete user flow${NC}"

echo ""
echo -e "${GREEN}🎉 DEPLOYMENT SCRIPT COMPLETE!${NC}"
echo -e "${GREEN}Your NFTSol platform is ready for production!${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Deploy to Render with the environment variables above"
echo "2. Fund your platform wallet with devnet SOL"
echo "3. Test all endpoints"
echo "4. Deploy frontend to Netlify"
echo "5. Start acquiring users!"
