# CLOUT Setup - Correct Commands for WSL and PowerShell

## ⚠️ Important: Two Different Environments

- **WSL (Bash)**: Use for Solana CLI commands (`solana`, `spl-token`)
- **PowerShell (Windows)**: Use for environment variables and verification

---

## Step 1: Create the Keypair (IF IT DOESN'T EXIST)

**In WSL:**
```bash
# Check if temp-keypair.json exists
ls -la /mnt/c/Users/KHK89/NFTSol/temp-keypair.json

# If it doesn't exist, create it:
solana-keygen new --outfile /mnt/c/Users/KHK89/NFTSol/temp-keypair.json

# Get the public key
solana-keygen pubkey /mnt/c/Users/KHK89/NFTSol/temp-keypair.json
```

**Copy that public key - that's your fee-payer address!**

---

## Step 2: Configure Solana CLI in WSL

**In WSL (bash):**
```bash
# Set network and keypair
solana config set --url https://api.mainnet-beta.solana.com
solana config set --keypair /mnt/c/Users/KHK89/NFTSol/temp-keypair.json

# Verify config
solana config get

# Check address and balance
solana address
solana balance
```

---

## Step 3: Fund Your Fee-Payer

**If balance is 0 SOL:**
1. Copy the address from `solana address`
2. Send at least 0.02 SOL to that address from:
   - Phantom wallet
   - Another Solana wallet
   - Exchange

**Then verify in WSL:**
```bash
solana balance  # Should show > 0 SOL
```

---

## Step 4: Create CLOUT Rewards Vault (ATA)

**In WSL (bash):**
```bash
# Set variables
OWNER="3XEs3MJ8PFiqTTqrK6RAkK9vt95jQQ1hKNNKHiE6jJ3o"
MINT="62hWQAgAV4jugHSuZsMqzxZNVXaVLrbRpz3Sw58Z64Mw"

# Create the ATA
spl-token create-account "$MINT" --owner "$OWNER" --url https://api.mainnet-beta.solana.com
```

**The output will look like:**
```
Creating account 2KkNwFZbznAtYX1xjVS6e5BBqQnfaBuTjn42G4zJXAps
```

**COPY THAT ADDRESS** - that's your `REWARDS_VAULT`

---

## Step 5: Set Environment Variables (IN POWERSHELL!)

**Open PowerShell (Windows, NOT WSL):**
```powershell
# Navigate to project
cd C:\Users\KHK89\NFTSol

# Set CLOUT mint
[Environment]::SetEnvironmentVariable("CLOUT_PROGRAM_ID","62hWQAgAV4jugHSuZsMqzxZNVXaVLrbRpz3Sw58Z64Mw","User")

# Set rewards vault (REPLACE WITH YOUR ACTUAL ADDRESS FROM STEP 4)
[Environment]::SetEnvironmentVariable("REWARDS_VAULT","2KkNwFZbznAtYX1xjVS6e5BBqQnfaBuTjn42G4zJXAps","User")

# Verify
[Environment]::GetEnvironmentVariable("CLOUT_PROGRAM_ID", "User")
[Environment]::GetEnvironmentVariable("REWARDS_VAULT", "User")
```

---

## Step 6: Verify Setup

**In PowerShell:**
```powershell
cd C:\Users\KHK89\NFTSol
.\verify-clout-setup.ps1
```

**Or verify manually in WSL:**
```bash
OWNER="3XEs3MJ8PFiqTTqrK6RAkK9vt95jQQ1hKNNKHiE6jJ3o"
spl-token accounts --owner "$OWNER" --url https://api.mainnet-beta.solana.com
```

You should see your CLOUT token account listed.

---

## Step 7: Restart Backend

**In PowerShell (after setting env vars):**
```powershell
# Stop backend if running (Ctrl+C)
# Then restart:
$env:PORT=3001; node apps/backend/dist/index.js
```

---

## ✅ Summary

**WSL Commands:**
- `solana config set`
- `solana address`
- `solana balance`
- `spl-token create-account`

**PowerShell Commands:**
- `[Environment]::SetEnvironmentVariable`
- `.\verify-clout-setup.ps1`
- Backend server commands

**Never mix them!** Run Solana commands in WSL, env vars in PowerShell.

