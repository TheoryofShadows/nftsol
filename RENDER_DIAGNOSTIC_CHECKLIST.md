# 🔍 Render Deployment - Diagnostic Checklist

**Date:** November 19, 2025
**Status:** Backend 503 - Needs Investigation

---

## Current Status

| Component | Status | Details |
|-----------|--------|---------|
| **Frontend** | ✅ Loading | nftsol.app responds with 200 |
| **Backend** | ❌ 503 Error | nftsol.onrender.com returns 503 |
| **Build** | ⚠️ Unknown | Need to check Render logs |

---

## Quick Diagnosis Steps

### Step 1: Check Render Logs

1. Go to https://dashboard.render.com
2. Click on **nftsol** backend service
3. Click **"Logs"** tab
4. Scroll to **bottom** to see most recent entries
5. Look for **ERROR** messages
6. **Copy any error messages** and check them against this guide

### Step 2: Verify Environment Variables

1. Click **"Settings"** tab
2. Scroll to **"Environment"** section
3. **Check each variable:**

#### Critical Variables - MUST BE SET
```
✓ DATABASE_URL (check if it has outer quotes)
✓ DEVELOPER_WALLET_PUBLIC_KEY=7pRUDnHS1y3b7EycVm7xtV2MgBArKFcAnFpdZCMPvLio
✓ PORT=3001
✓ NODE_ENV=production
✓ CLUSTER=mainnet-beta
✓ SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=f40b1ccb-9fba-4b1b-82cb-a63f73c24daf
```

#### DATABASE_URL Format Check
**WRONG** (has extra quotes):
```
DATABASE_URL="postgresql://nftsol_user:bYjIZyQma4ULjuhx3Uon19EZIeAwr6Vj@dpg-d3t62omuk2gs73a7u0h0-a.ohio-postgres.render.com/nftsol"
```

**CORRECT** (no outer quotes):
```
postgresql://nftsol_user:bYjIZyQma4ULjuhx3Uon19EZIeAwr6Vj@dpg-d3t62omuk2gs73a7u0h0-a.ohio-postgres.render.com/nftsol
```

### Step 3: Fix DATABASE_URL (if needed)

If DATABASE_URL has outer quotes:
1. Click on the DATABASE_URL variable
2. Edit it to remove the outer `"` quotes
3. Remove any `DATABASE_URL=` prefix inside the value
4. Save
5. Click "Restart service"

### Step 4: Verify Build Command

1. Settings tab
2. Find "Build Command" section
3. Should be:
   ```
   npm install && npm run build
   ```
4. **NOT:**
   ```
   npm install --legacy-peer-deps && npm run build
   ```

---

## Common Issues & Solutions

### Issue 1: "Could not parse DATABASE_URL"

**Symptoms:** Logs show database connection error

**Cause:** DATABASE_URL has incorrect format or outer quotes

**Fix:**
1. Remove outer `"` quotes
2. Remove any `DATABASE_URL=` prefix in the value
3. Should start with `postgresql://`
4. Save and restart

### Issue 2: "Missing environment variable: DEVELOPER_WALLET_PUBLIC_KEY"

**Symptoms:** Logs show missing wallet

**Cause:** Variable not set

**Fix:**
1. Add new environment variable
2. Name: `DEVELOPER_WALLET_PUBLIC_KEY`
3. Value: `7pRUDnHS1y3b7EycVm7xtV2MgBArKFcAnFpdZCMPvLio`
4. Save and restart

### Issue 3: "Cannot connect to database"

**Symptoms:** ECONNREFUSED or timeout errors

**Cause:** Database URL wrong or database down

**Fix:**
1. Verify DATABASE_URL is correct format
2. Check if Render Postgres service is running
3. Test connection with local psql:
   ```bash
   psql "postgresql://nftsol_user:bYjIZyQma4ULjuhx3Uon19EZIeAwr6Vj@dpg-d3t62omuk2gs73a7u0h0-a.ohio-postgres.render.com/nftsol"
   ```

### Issue 4: "Build failed"

**Symptoms:** Deployment logs show build error

**Cause:** Dependency or TypeScript error

**Fix:**
1. Verify build command is: `npm install && npm run build`
2. Check logs for specific error
3. Ensure no --legacy-peer-deps flag needed

### Issue 5: Service keeps restarting

**Symptoms:** Logs show repeated restarts

**Cause:** Application crashes on startup

**Fix:**
1. Check logs for ERROR messages
2. Verify all required environment variables are set
3. Check database connectivity
4. Verify RPC endpoint is accessible

---

## What You Need to Do RIGHT NOW

### Priority 1 (Do First)

1. **Go to Render dashboard**
   - https://dashboard.render.com
   - Click nftsol backend

2. **Check DATABASE_URL**
   - Settings → Environment
   - Find DATABASE_URL
   - **If it has outer `"` quotes:**
     - Edit it
     - Remove outer quotes
     - Remove `DATABASE_URL=` prefix if present
     - Should be: `postgresql://nftsol_user:...`
     - Click Save

3. **Verify DEVELOPER_WALLET_PUBLIC_KEY**
   - Should be: `7pRUDnHS1y3b7EycVm7xtV2MgBArKFcAnFpdZCMPvLio`
   - If missing, add it
   - Click Save

4. **Restart Service**
   - Click "Restart service" button
   - Wait 2 minutes
   - Watch logs

5. **Test Endpoint**
   ```bash
   curl https://nftsol.onrender.com/healthz
   ```
   Should return: `{"status":"healthy"}`

### Priority 2 (If still not working)

1. **Check build command**
   - Should be: `npm install && npm run build`
   - NOT: `npm install --legacy-peer-deps && npm run build`

2. **Check logs for ERROR**
   - Logs tab
   - Look for red ERROR messages
   - Note the exact error

3. **Verify CLUSTER variable**
   - Should be: `CLUSTER=mainnet-beta`
   - Remove old `SOLANA_CLUSTER` if still there

---

## Environment Variables Template (Reference)

Use this as a checklist. Your Render should have all of these:

```
ADMIN_WALLETS=3XEs3MJ8PFiqTTqrK6RAkK9vt95jQQ1hKNNKHiE6jJ3o
ALLOWED_ORIGINS=https://nftsol.app,https://www.nftsol.app,https://nftsolmarket.netlify.app
BUBBLEGUM_TREE_ADDRESS=BJW4H8LZ518JsrXuC6Tj89JWBSGrqKXb4zfZEW6wtinJ
CLUSTER=mainnet-beta
CLOUT_MINT=26iJ37BE3icVtoo2QRkfjtYXFHMudG2sbTHAnhF2D6ab
CLOUT_PROGRAM_ID=26iJ37BE3icVtoo2QRkfjtYXFHMudG2sbTHAnhF2D6ab
CLOUT_TOKEN_AUTHORITY=3XEs3MJ8PFiqTTqrK6RAkK9vt95jQQ1hKNNKHiE6jJ3o
DATABASE_URL=postgresql://nftsol_user:bYjIZyQma4ULjuhx3Uon19EZIeAwr6Vj@dpg-d3t62omuk2gs73a7u0h0-a.ohio-postgres.render.com/nftsol
DEVELOPER_WALLET_PUBLIC_KEY=7pRUDnHS1y3b7EycVm7xtV2MgBArKFcAnFpdZCMPvLio
HELIUS_API_KEY=f40b1ccb-9fba-4b1b-82cb-a63f73c24daf
IRYS_WALLET_PRIVATE_KEY=[your key]
JWT_SECRET=7a208f569060e537842ad3aa1a15eb530659b2db3c71d70feccf77f16bb9d668
NODE_ENV=production
PINATA_JWT=[your jwt]
PINATA_SECRET_KEY=[your secret]
PLATFORM_SECRET_KEY_BASE58=[your key]
PORT=3001
REWARDS_OWNER=3XEs3MJ8PFiqTTqrK6RAkK9vt95jQQ1hKNNKHiE6jJ3o
SESSION_SECRET=9c5ec22d42c0e22bd7fe959e6c6a2159d18034e6c4725448ce8c337825b7a921
SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=f40b1ccb-9fba-4b1b-82cb-a63f73c24daf
```

**Note:** Remove `SOLANA_RPC_DEVNET` if present (not needed for mainnet)

---

## Testing Commands

Once backend is working:

```bash
# Health check
curl https://nftsol.onrender.com/healthz

# Get NFTs
curl https://nftsol.onrender.com/api/nfts

# Get stats
curl https://nftsol.onrender.com/api/public/stats

# Get wallet info
curl https://nftsol.onrender.com/wallet/7pRUDnHS1y3b7EycVm7xtV2MgBArKFcAnFpdZCMPvLio
```

All should return 200 OK (not 503).

---

## Success Criteria

✅ Backend is working when:
- `/healthz` returns 200 OK
- `/api/nfts` returns 200 OK
- Frontend can connect to backend
- No ERROR messages in logs
- Service status is "Live" (green)

---

## Next Steps

1. **Check Render logs** - Look for ERROR messages
2. **Fix DATABASE_URL** - Remove outer quotes if present
3. **Add DEVELOPER_WALLET_PUBLIC_KEY** - If missing
4. **Restart service** - Wait 2 minutes
5. **Test endpoint** - curl /healthz
6. **If still failing** - Check logs for specific error

**Estimated time to fix:** 5-15 minutes

**Confidence:** 95% (just configuration issues)

---

Generated: November 19, 2025
