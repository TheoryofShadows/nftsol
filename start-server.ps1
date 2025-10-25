# NFTSol Server Startup Script
Write-Host "🔧 Setting up NFTSol server environment..." -ForegroundColor Green

# Set environment variables
$env:PINATA_API_KEY="***REMOVED***"
$env:PINATA_SECRET_KEY="***REMOVED***"
$env:HELIUS_API_KEY="33d5c12f-895d-4192-bc26-a86d5ffa5cbc"
$env:JWT_SECRET="a8f5f167f44f4964e6c998dee827110c"
$env:SESSION_SECRET="b9e6e278g55g5075f7d009eff938221d"
$env:NODE_ENV="development"

Write-Host "✅ Environment variables set" -ForegroundColor Green
Write-Host "🚀 Starting NFTSol server..." -ForegroundColor Cyan

# Navigate to server directory and start
cd server
npm run dev