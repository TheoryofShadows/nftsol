@echo off
echo 🚀 Starting NFTSol Server...

cd /d C:\Users\KHK89\NFTSol\apps\backend

echo 📦 Installing dependencies...
call npm install

echo 🔨 Building TypeScript...
call npm run build

echo 🔑 Loading environment variables...
if exist .env (
    echo    ✅ Loading from .env file...
    for /f "tokens=1,2 delims==" %%a in (.env) do (
        if not "%%a"=="" (
            if not "%%a:~0,1%"=="#" (
                set "%%a=%%b"
            )
        )
    )
) else (
    echo    ⚠️  .env file not found. Using system environment variables.
    echo    Please ensure PLATFORM_SECRET_KEY_BASE58 is set in your environment.
)

REM Set defaults only if not already set
if not defined SOLANA_RPC_URL set SOLANA_RPC_URL=https://api.devnet.solana.com
if not defined NODE_ENV set NODE_ENV=development

echo 🚀 Starting server...
node dist/index.js

pause
