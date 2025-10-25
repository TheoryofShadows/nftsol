@echo off
echo Setting up NFTSol development environment...

set PINATA_API_KEY=b56eb57bd4e0b503a094
set PINATA_SECRET_KEY=2c8365e293ecff150b8a8288efb178e39d1729f95ebc8f349ae4e013cc166a2b
set HELIUS_API_KEY=33d5c12f-895d-4192-bc26-a86d5ffa5cbc
set JWT_SECRET=a8f5f167f44f4964e6c998dee827110c
set SESSION_SECRET=b9e6e278g55g5075f7d009eff938221d
set NODE_ENV=development

echo Environment variables set successfully!
echo Starting NFTSol development server...

npm run dev:server
