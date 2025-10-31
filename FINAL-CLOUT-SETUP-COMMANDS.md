# Final CLOUT Setup - Run These Commands

## Run in WSL (bash):

```bash
cd /mnt/c/Users/KHK89/NFTSol
chmod +x complete-clout-setup.sh
./complete-clout-setup.sh
```

This script will:
- Check both wallet balances
- Verify if ATA exists
- Create ATA if needed (if fee-payer has funds)
- Give you exact next steps

---

## After ATA is confirmed to exist, run in PowerShell:

```powershell
[Environment]::SetEnvironmentVariable("REWARDS_VAULT","2KkNwFZbznAtYX1xjVS6e5BBqQnfaBuTjn42G4zJXAps","User")
.\verify-clout-final.ps1
```

---

## Quick Status Check:

**Environment Variables:**
- ✅ CLOUT_PROGRAM_ID: `62hWQAgAV4jugHSuZsMqzxZNVXaVLrbRpz3Sw58Z64Mw` (SET)
- ❌ REWARDS_VAULT: Currently `<YOUR_CLOUT_ATA>` (NEEDS UPDATE to `2KkNwFZbznAtYX1xjVS6e5BBqQnfaBuTjn42G4zJXAps`)

**Next Action:**
1. Run `./complete-clout-setup.sh` in WSL to verify/create ATA
2. Update REWARDS_VAULT env var once ATA exists
3. Restart backend

