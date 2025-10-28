@echo off
echo 🚀 Starting NFTSol Server...

cd /d C:\Users\KHK89\NFTSol\apps\backend

echo 📦 Installing dependencies...
call npm install

echo 🔨 Building TypeScript...
call npm run build

echo 🔑 Setting environment variables...
set PLATFORM_SECRET_KEY_BASE58=57gPGZp3tgwnNAPK2GJxYE4kJpeHh75Vg95M4xRDaNswNe37Gv8PwPBX666sfcDgc4sijPRqw4jTyobuNa2ch15L
set SOLANA_RPC_URL=https://api.devnet.solana.com
set NODE_ENV=development

echo 🚀 Starting server...
node dist/index.js

pause
