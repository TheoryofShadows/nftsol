@echo off
echo Starting NFTSol Production Environment...

REM Load production environment variables
set NODE_ENV=production

REM Start production server
cd server
npm run start
