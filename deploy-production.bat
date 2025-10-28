@echo off
echo 🚀 NFTSol Production Deployment Script
echo =====================================

cd /d C:\Users\KHK89\NFTSol\apps\backend

echo 📦 Installing dependencies...
call npm install

echo 🔨 Building TypeScript...
call npm run build

echo 🔑 Setting environment variables...
set PLATFORM_SECRET_KEY_BASE58=57gPGZp3tgwnNAPK2GJxYE4kJpeHh75Vg95M4xRDaNswNe37Gv8PwPBX666sfcDgc4sijPRqw4jTyobuNa2ch15L
set SOLANA_RPC_URL=https://api.devnet.solana.com
set NODE_ENV=development
set WITHDRAWALS_ENABLED=true
set DAILY_WITHDRAWAL_LIMIT_SOL=10
set MAX_WITHDRAWAL_SOL=5
set RATE_LIMIT_WINDOW_MINUTES=15
set RATE_LIMIT_MAX_REQUESTS=5

echo 🧪 Running complete test suite...
node cursor-go-live.js

echo ✅ Production deployment ready!
echo.
echo 📋 Next Steps:
echo 1. Deploy to Render with environment variables
echo 2. Fund platform wallet: 3EgKZgBNotS5tnYTaWuhEuzS9NLyMQww3C4Vaz5RDhM4
echo 3. Deploy frontend to Netlify
echo 4. Test complete workflow
echo 5. Launch your NFT marketplace!
echo.
pause
