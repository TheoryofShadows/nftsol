# First, get a CSRF token
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$tokenResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/v1/csrf-token" -WebSession $session -UseBasicParsing
$csrfToken = ($tokenResponse.Content | ConvertFrom-Json).csrfToken
Write-Host "CSRF Token: $csrfToken"

# Try to get the admin wallet from the environment
$response = Invoke-WebRequest -Uri "http://localhost:3001/api/v1/env/PLATFORM_PUBLIC_KEY" -WebSession $session -Headers @{"X-CSRF-Token" = $csrfToken} -UseBasicParsing -SkipHttpErrorCheck

if ($response.StatusCode -eq 200) {
    $publicKey = $response.Content | ConvertFrom-Json | Select-Object -ExpandProperty value
    Write-Host "Admin Wallet (from PLATFORM_PUBLIC_KEY): $publicKey"
} else {
    Write-Host "Could not get PLATFORM_PUBLIC_KEY. Trying to get ADMIN_WALLETS..."
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/v1/env/ADMIN_WALLETS" -WebSession $session -Headers @{"X-CSRF-Token" = $csrfToken} -UseBasicParsing -SkipHttpErrorCheck
    
    if ($response.StatusCode -eq 200) {
        $adminWallets = $response.Content | ConvertFrom-Json | Select-Object -ExpandProperty value
        Write-Host "Admin Wallets (from ADMIN_WALLETS): $adminWallets"
    } else {
        Write-Host "Could not get admin wallets from environment variables."
        Write-Host "Please check your .env file for PLATFORM_PUBLIC_KEY or ADMIN_WALLETS."
        Write-Host "The admin wallet is typically derived from PLATFORM_SECRET_KEY_BASE58 in your .env file."
    }
}
