# NFTSol Complete Cursor Testing Script
Write-Host "NFTSol Complete Cursor Testing Script" -ForegroundColor Green

$wallet = "11111111111111111111111111111112"
$platformWallet = "3EgKZgBNotS5tnYTaWuhEuzS9NLyMQww3C4Vaz5RDhM4"
$baseUrl = "http://localhost:3000"

Write-Host "Test Wallet: $wallet" -ForegroundColor Yellow
Write-Host "Platform Wallet: $platformWallet" -ForegroundColor Yellow

# Test Health Check
Write-Host "Testing Health Check..." -ForegroundColor Cyan
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/healthz" -Method Get
    Write-Host "Health Status: $($health.success)" -ForegroundColor Green
} catch {
    Write-Host "Health Check Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test Programs
Write-Host "Testing Programs..." -ForegroundColor Cyan
try {
    $programs = Invoke-RestMethod -Uri "$baseUrl/api/programs" -Method Get
    Write-Host "Programs Status: $($programs.success)" -ForegroundColor Green
} catch {
    Write-Host "Programs Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test Wallet Verification
Write-Host "Testing Wallet Verification..." -ForegroundColor Cyan
try {
    $verify = Invoke-RestMethod -Uri "$baseUrl/api/nfts/verify/$wallet" -Method Get
    Write-Host "Wallet Verification: $($verify.success)" -ForegroundColor Green
} catch {
    Write-Host "Wallet Verification Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test Platform Wallet Balance
Write-Host "Testing Platform Wallet Balance..." -ForegroundColor Cyan
try {
    $balance = Invoke-RestMethod -Uri "$baseUrl/api/nfts/balance/$platformWallet" -Method Get
    Write-Host "Platform Balance: $($balance.data.solBalance)" -ForegroundColor Green
} catch {
    Write-Host "Balance Check Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "Testing Complete!" -ForegroundColor Green
