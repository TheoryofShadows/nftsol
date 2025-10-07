# Requires PowerShell 7+
param(
    [string]$SolanaVersion = "1.18.18",
    [string]$RustToolchain = "stable"
)

Write-Host "Installing Solana CLI $SolanaVersion..."
Invoke-WebRequest -Uri "https://release.solana.com/v$SolanaVersion/solana-install-init-x86_64-pc-windows-msvc.exe" -OutFile "$env:TEMP\solana-install.exe"
& "$env:TEMP\solana-install.exe" init --no-modify-path v$SolanaVersion

Write-Host "Configuring Rust toolchain ($RustToolchain)..."
rustup default $RustToolchain
rustup component add rustfmt clippy

Write-Host "Installing cargo-build-sbf helper..."
cargo install --git https://github.com/solana-labs/cargo-build-sbf --locked

Write-Host "Verifying anchor prerequisites..."
anchor --version
solana --version
cargo build-sbf --version

Write-Host "Toolchain setup complete."
