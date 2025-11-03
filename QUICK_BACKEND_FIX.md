# ⚡ QUICK BACKEND FIX - 2 Minutes

**Your backend is failing. Here's the fastest fix:**

---

## 🎯 THE PROBLEM

Your backend code requires these 8 variables in production:
1. NODE_ENV
2. **PORT** ← Most likely missing!
3. SOLANA_RPC_URL
4. CLOUT_PROGRAM_ID
5. MARKET_PROGRAM_ID
6. LOYALTY_PROGRAM_ID
7. REWARDS_VAULT
8. ALLOWED_ORIGINS (must not be empty)

**Missing ANY one → Backend crashes on startup!**

---

## ✅ THE FIX (2 minutes)

### Step 1: Add PORT (if missing)

1. **Go to:** https://dashboard.render.com
2. **Click:** Your backend service
3. **Click:** "Environment" tab
4. **Click:** "Add Environment Variable"
5. **Add:**
   ```
   Key: PORT
   Value: 3001
   ```
6. **Click:** "Save Changes"

### Step 2: Verify These Exist

In the same Environment tab, verify these are set:

```
✅ NODE_ENV = production
✅ PORT = 3001
✅ SOLANA_RPC_URL = https://mainnet.helius-rpc.com/?api-key=...
✅ CLOUT_PROGRAM_ID = <YOUR_CLOUT_MINT_ADDRESS>
✅ MARKET_PROGRAM_ID = HTs1hErzM8MywaUojfUY7QA1T6gLQD977R3HsCnKj7m7
✅ LOYALTY_PROGRAM_ID = 2TujfT3Czd2ncawJ6ZLmfGeJ2t1Ugb9bqEvxSE2EKoo9
✅ REWARDS_VAULT = <YOUR_REWARDS_VAULT_ADDRESS>
✅ ALLOWED_ORIGINS = https://nftsol.app,https://www.nftsol.app,https://market.nftsol.app,https://nftsolmarket.netlify.app
```

**Any missing?** → Add them!

---

## ⏱️ Wait 3-5 Minutes

Render will automatically redeploy after you save.

---

## ✅ Verify It Works

### Check Status:
- Render Dashboard should show **"Live"** (green)

### Check Logs:
Look for:
```
✅ Port: 3001
✅ Server is listening
```

### Test Health:
```bash
curl https://your-backend.onrender.com/health
```

Should return:
```json
{"status": "healthy", ...}
```

---

## ❌ Still Failing?

**Share the exact error from Render logs:**

1. Render → Your Service → Logs
2. Find the red ERROR message
3. Copy the exact text
4. Share it here

**I'll give you the specific fix!**

---

**Most likely fix: Add PORT=3001 as Environment Variable!** 🚀

