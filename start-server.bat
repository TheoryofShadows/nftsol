@echo off
echo Setting up NFTSol server environment...

REM Load from .env file (DO NOT HARDCODE SECRETS)
REM Create server/.env file with your actual credentials
if exist server\.env (
    echo Loading environment from server\.env...
) else (
    echo WARNING: server\.env not found. Please create it with your credentials.
    echo Example format:
    echo PINATA_API_KEY=your_key_here
    echo HELIUS_API_KEY=your_key_here
    echo JWT_SECRET=your_secret_here
    echo SESSION_SECRET=your_secret_here
)

set NODE_ENV=development

REM Set database URL for development
set DATABASE_URL=postgresql://localhost:5432/nftsol_dev

echo Environment variables configured
echo Starting NFTSol server...

cd server
npm run dev
