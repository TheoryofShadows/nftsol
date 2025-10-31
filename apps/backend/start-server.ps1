# Start NFTSol Backend Server
$env:PORT = 3001
Write-Host "Starting server on port $env:PORT..." -ForegroundColor Cyan
Write-Host ""
node dist/index.js

