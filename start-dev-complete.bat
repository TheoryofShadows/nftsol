@echo off
echo Setting up NFTSol development environment...

REM Set environment variables
set PINATA_API_KEY=***REMOVED***
set PINATA_SECRET_KEY=***REMOVED***
set HELIUS_API_KEY=33d5c12f-895d-4192-bc26-a86d5ffa5cbc
set JWT_SECRET=a8f5f167f44f4964e6c998dee827110c
set SESSION_SECRET=b9e6e278g55g5075f7d009eff938221d
set NODE_ENV=development

REM Set database URL for development
set DATABASE_URL=postgresql://localhost:5432/nftsol_dev

echo Environment variables set
echo Starting NFTSol server...

REM Start server in background
start "NFTSol Server" cmd /c "cd server && npm run dev"

REM Wait for server to start
timeout /t 5 /nobreak > nul

echo Starting NFTSol client...

REM Start client
cd client
npm run dev
