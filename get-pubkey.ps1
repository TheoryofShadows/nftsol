# Install required modules if not already installed
if (-not (Get-Module -Name Solana -ListAvailable)) {
    Write-Host "Installing Solana CLI..."
    Invoke-WebRequest -Uri https://release.solana.com/v1.8.0/solana-install-init-x86_64-pc-windows-msvc.exe -OutFile solana-install-init.exe -UseBasicParsing
    .\solana-install-init.exe v1.8.0
    $env:Path += ";$env:LOCALAPPDATA\solana\install\active_release\bin"
}

# Create a temporary keypair file
$tempKeyFile = "$env:TEMP\temp-keypair.json"
$secretKeyBase58 = "44YHwC9nX9Mv2fque7fZdpinbtR3pGqX6xKsj4Tzpp5jx34C3PuCVriPZrbutpocC1wwZFJn53hrDwPuXpc5KWqc"

# Create a keypair file from the base58 secret key
$keypairJson = @{
    "1" = @(
        44, 88, 195, 159, 39, 91, 63, 122, 189, 250, 126, 93, 166, 25, 219, 246, 156, 26, 59, 119, 110, 163, 218, 30, 29, 217, 30, 26, 111, 102, 158, 183, 44, 88, 195, 159, 39, 91, 63, 122, 189, 250, 126, 93, 166, 25, 219, 246, 156, 26, 59, 119, 110, 163, 218, 30, 29, 217, 30, 26, 111, 102, 158, 183
    )
}
$keypairJson | ConvertTo-Json -Depth 10 | Out-File -FilePath $tempKeyFile -Encoding utf8

# Get the public key
$publicKey = solana-keygen pubkey $tempKeyFile
Write-Host "Public Key: $publicKey"

# Clean up
Remove-Item $tempKeyFile -Force
