# CLOUT Setup - Exact Steps

## Step 1: Check Your Fee-Payer Balance

```powershell
# Set your fee-payer keypair
solana config set --keypair "C:\Users\KHK89\NFTSol\temp-keypair.json"
solana config set --url https://api.mainnet-beta.solana.com

# Check current address and balance
solana address
solana balance
```

**If balance shows "0 SOL" → You MUST fund this wallet before proceeding!**

---

## Step 2: Fund Your Fee-Payer (IF NEEDED)

**If balance is 0 SOL, send at least 0.02 SOL to the address shown by `solana address`**

Send from:
- Phantom wallet
- Another Solana wallet  
- Exchange withdrawal

**Wait for the transaction to confirm, then verify:**
```powershell
solana balance  # Should show > 0 SOL now
```

---

## Step 3: Create the CLOUT Rewards Vault (ATA)

**Run this command (in PowerShell or WSL):**

```powershell
# Set variables
$OWNER = "3XEs3MJ8PFiqTTqrK6RAkK9vt95jQQ1hKNNKHiE6jJ3o"
$MINT = "62hWQAgAV4jugHSuZsMqzxZNVXaVLrbRpz3Sw58Z64Mw"

# Create the Associated Token Account (ATA) for your rewards owner
spl-token create-account $MINT --owner $OWNER --url https://api.mainnet-beta.solana.com
```

**The command will output something like:**
```
Creating account 2KkNwFZbznAtYX1xjVS6e5BBqQnfaBuTjn42G4zJXAps
```

**COPY THAT ADDRESS** (that's your REWARDS_VAULT)

---

## Step 4: Set Environment Variables

**Run these in PowerShell (replace `<REWARDS_VAULT_ADDRESS>` with the address from Step 3):**

```powershell
# Set CLOUT mint address
[Environment]::SetEnvironmentVariable("CLOUT_PROGRAM_ID","62hWQAgAV4jugHSuZsMqzxZNVXaVLrbRpz3Sw58Z64Mw","User")

# Set rewards vault address (REPLACE WITH YOUR ACTUAL ADDRESS)
[Environment]::SetEnvironmentVariable("REWARDS_VAULT","<REWARDS_VAULT_ADDRESS>","User")
```

**Example:**
```powershell
[Environment]::SetEnvironmentVariable("REWARDS_VAULT","2KkNwFZbznAtYX1xjVS6e5BBqQnfaBuTjn42G4zJXAps","User")
```

---

## Step 5: Verify Setup

**Check that variables are set:**
```powershell
[Environment]::GetEnvironmentVariable("CLOUT_PROGRAM_ID", "User")
[Environment]::GetEnvironmentVariable("REWARDS_VAULT", "User")
```

**Verify the ATA was created:**
```powershell
$OWNER = "3XEs3MJ8PFiqTTqrK6RAkK9vt95jQQ1hKNNKHiE6jJ3o"
spl-token accounts --owner $OWNER --url https://api.mainnet-beta.solana.com
```

You should see your CLOUT token account listed.

---

## Step 6: Restart Your Backend

**Restart your backend server so it picks up the new environment variables:**

```powershell
# Stop your current backend (Ctrl+C if running)
# Then start it again:
$env:PORT=3001; node apps/backend/dist/index.js
```

---

## ✅ Done!

Your CLOUT setup is complete. The app can now:
- Reference the CLOUT token mint
- Send rewards to your rewards vault
- Track CLOUT balances for users

