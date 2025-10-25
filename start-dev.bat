@echo off
echo Starting NFTSol development environment...

set PINATA_API_KEY=***REMOVED***
set PINATA_SECRET_KEY=***REMOVED***
set HELIUS_API_KEY=33d5c12f-895d-4192-bc26-a86d5ffa5cbc
set JWT_SECRET=a8f5f167f44f4964e6c998dee827110c
set SESSION_SECRET=b9e6e278g55g5075f7d009eff938221d
set NODE_ENV=development

echo Environment variables set successfully!
echo Starting both server and client...

start "NFTSol Server" cmd /k "npm run dev:server"
timeout /t 3 /nobreak >nul
start "NFTSol Client" cmd /k "cd client && npm run dev"

echo Development environment started!
echo Server: http://localhost:3000
echo Client: http://localhost:5173
pause
