# 🔧 Render Environment Variables - Updated for CLOUT Integration

## 📋 Changes Made

### ✅ **Fixed/Updated Variables:**

1. **CLOUT_MINT** 
   - ❌ OLD: `4aHwytKbZnTJY5uNDSX75g2zChfYnC53GdNJHEZtwDPf`
   - ✅ NEW: `62hWQAgAV4jugHSuZsMqzxZNVXaVLrbRpz3Sw58Z64Mw`
   - **Reason:** This is the correct mainnet CLOUT token mint address

2. **CLOUT_PROGRAM_ID** (ADDED)
   - ✅ NEW: `62hWQAgAV4jugHSuZsMqzxZNVXaVLrbRpz3Sw58Z64Mw`
   - **Reason:** Required by backend config - must match CLOUT_MINT

3. **REWARDS_VAULT** (ADDED)
   - ✅ NEW: `2KkNwFZbznAtYX1xjVS6e5BBqQnfaBuTjn42G4zJXAps`
   - **Reason:** Required for CLOUT rewards distribution

4. **PLATFORM_SECRET_KEY_BASE58**
   - ❌ OLD: `REPLACE_WITH_YOUR_PLATFORM_SECRET_KEY_BASE58`
   - ✅ NEW: `3B495YFvfjWzoKwmJDpwycFzksJZPAJcGozq45ycRMiHDnpgdXNEnyNdTG5dd8kpgdHUQdCeCZAWUFvtQk6BwThX`
   - **Reason:** Actual platform key from your setup

5. **DATABASE_URL**
   - ❌ OLD: Had quotes around it
   - ✅ NEW: Removed quotes (Render doesn't need them)

6. **SOLANA_RPC_URL**
   - ❌ OLD: Had quotes around it
   - ✅ NEW: Removed quotes (Render doesn't need them)

---

## 📝 Instructions for Render Dashboard

### **How to Update:**

1. Go to your Render dashboard
2. Navigate to your backend service
3. Go to **Environment** tab
4. **Delete all old variables** (or update individually)
5. **Copy and paste** the complete list from `RENDER-ENV-VARS-COMPLETE.txt`
6. Click **Save Changes**
7. **Redeploy** your service

---

## ⚠️ Important Notes

1. **PLATFORM_SECRET_KEY_BASE58** - This is a **SECRET**. Consider using Render's "Secret" feature instead of regular environment variable for added security.

2. **DATABASE_URL** - No quotes needed in Render

3. **SOLANA_RPC_URL** - No quotes needed in Render

4. **CLOUT_PROGRAM_ID** must match **CLOUT_MINT** - They should be the same value.

5. All CLOUT-related variables are now configured for **mainnet**.

---

## ✅ Verification

After updating, verify these endpoints work:
- `GET /healthz` - Should return healthy
- `GET /api/programs` - Should show correct CLOUT_PROGRAM_ID
- `GET /api/clout/vault-balance` - Should return vault balance

---

**File ready:** `RENDER-ENV-VARS-COMPLETE.txt` - Copy and paste from there!

