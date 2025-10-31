# 🚀 Next Steps - Testing CLOUT Integration

## ✅ Current Status

- ✅ All code integrated
- ✅ Frontend running on port **5173**
- ⚠️ Backend status: **Need to verify**

---

## 📋 Step-by-Step Testing Guide

### Step 1: Verify/Start Backend Server

**Check if backend is running:**
```powershell
# Check if port 3001 is in use
netstat -ano | findstr ":3001"
```

**If backend is NOT running, start it:**
```powershell
cd apps/backend
npm run dev
```

**Expected output:**
- Server should start on port 3001 (or PORT from env)
- Look for: `[CLOUT] Service initialized with mint: ...`
- Look for: `Server listening on port 3001`

---

### Step 2: Verify Backend Health

**Open a new terminal and test:**
```powershell
# Test health endpoint
Invoke-RestMethod -Uri "http://localhost:3001/healthz"

# Test CLOUT balance endpoint
Invoke-RestMethod -Uri "http://localhost:3001/api/clout/balance/11111111111111111111111111111112"

# Test vault balance endpoint
Invoke-RestMethod -Uri "http://localhost:3001/api/clout/vault-balance"
```

**Expected:**
- Health check should return `{"success": true, ...}`
- Balance endpoint should return balance (may be 0 if wallet has no CLOUT)
- Vault balance should return vault info

---

### Step 3: Test Frontend Integration

**1. Open Browser:**
- Navigate to: `http://localhost:5173`

**2. Connect Wallet:**
- Click "Connect Wallet" button
- Choose Phantom, Solflare, or another Solana wallet
- Approve the connection

**3. Look for CloutBadge:**
- ✅ **Check bottom-right corner** - Should see:
  - ⭐ Icon with yellow/orange gradient
  - "CLOUT Balance" label
  - Balance number (or "Loading...")
  - Wallet address (truncated)

**4. Check Hero Section:**
- ✅ **Scroll to top** - Look for 4th counter:
  - Should show "⭐ CLOUT" counter
  - Displays balance or "—" if 0
  - Only visible when wallet is connected

---

### Step 4: Verify Functionality

**What to check:**

1. **CloutBadge Behavior:**
   - ✅ Appears when wallet connected
   - ✅ Hides when wallet disconnected
   - ✅ Shows loading spinner initially
   - ✅ Updates balance after load
   - ✅ Refreshes every 30 seconds
   - ✅ Hover effect works

2. **Hero Counter:**
   - ✅ Only shows when wallet connected
   - ✅ Displays formatted number
   - ✅ Updates when balance changes

3. **Console Errors:**
   - Open browser DevTools (F12)
   - Check Console tab
   - Should see API calls to `/api/clout/balance/:address`
   - No errors should appear

---

## 🐛 Troubleshooting

### Backend Not Starting

**Issue:** Backend fails to start

**Solutions:**
```powershell
# 1. Check if port 3001 is already in use
netstat -ano | findstr ":3001"

# 2. Kill process if needed (replace PID with actual process ID)
taskkill /PID <PID> /F

# 3. Verify environment variables
[Environment]::GetEnvironmentVariable("CLOUT_PROGRAM_ID", "User")
[Environment]::GetEnvironmentVariable("REWARDS_VAULT", "User")

# 4. Try starting with explicit port
$env:PORT=3001
cd apps/backend
npm run dev
```

### Frontend Can't Connect to Backend

**Issue:** CloutBadge shows "Error" or can't fetch balance

**Solutions:**
1. Check backend is running on correct port
2. Check CORS settings in backend
3. Verify `VITE_API_BASE` in frontend `.env` file
4. Check browser console for network errors

### Balance Shows 0 or Error

**Issue:** Balance always shows 0 or error

**Possible reasons:**
- Wallet has no CLOUT token account (normal for new wallets)
- Wallet has 0 CLOUT balance (normal)
- Backend API error (check backend logs)

**Solutions:**
- This is expected if wallet has no CLOUT tokens
- To test with balance, you'd need to send CLOUT to the wallet first
- Check backend logs for API errors

---

## ✅ Success Criteria

You'll know everything works when:

- ✅ Backend starts without errors
- ✅ Health endpoint returns success
- ✅ CloutBadge appears in bottom-right when wallet connected
- ✅ Hero shows CLOUT counter when wallet connected
- ✅ Balance updates (even if 0)
- ✅ No console errors
- ✅ No network errors in DevTools

---

## 📝 Quick Test Commands

**All-in-one test:**
```powershell
.\test-clout-integration.ps1
```

**Manual verification:**
```powershell
.\verify-clout-setup.ps1
```

---

## 🎯 What Happens Next

Once verified working:

1. **Use in Development**
   - CloutBadge will automatically show balances
   - Hero counter will display CLOUT stats
   - All features work as expected

2. **Production Deployment**
   - Ensure environment variables set in production
   - Update `VITE_API_BASE` for frontend
   - Deploy backend with CLOUT routes enabled

3. **Future Enhancements**
   - Add CLOUT transaction history
   - Add reward distribution UI
   - Add staking features (if implemented)

---

**Ready to test? Start with Step 1!** 🚀

