# 🔧 Deployment Fix Checklist - Critical Issues

**Created:** November 19, 2025
**Status:** IN PROGRESS

---

## Critical Issues Found

### Issue 1: TypeScript Build Error (FIXED ✅)
**Problem:** irys-addresses.ts imports non-existent module path
**Status:** ✅ FIXED - Replaced with internal base58 implementation
**Impact:** Backend would not build for production

### Issue 2: Database Schema Mismatch (CRITICAL)
**Problem:** Code uses camelCase column names but database has snake_case
**Examples:**
- Code: `SELECT "mintAddress"...` → DB: `mint_address`
- Code: `WHERE listed = true` → DB: may not have `listed` column
- Code: `FROM nfts WHERE collection` → DB: may use `collection_id` or `collection_name`

**Status:** ⚠️ NEEDS FIX
**Impact:** Queries fail, marketplace broken

**Files Affected:**
- `apps/backend/src/index.ts` (lines 835, 1194, 1249, etc.)

### Issue 3: Production Deployment (503 Error) (CRITICAL)
**Problem:** Backend returns 503 Service Unavailable
**Status:** ⚠️ INVESTIGATING
**Possible Causes:**
1. `DATABASE_URL` not set in Render environment
2. `PORT` not set (should be 3001)
3. Application crashes on startup
4. Database connection timeout
5. Missing environment variables

**Critical Env Vars for Production:**
- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - Should be 3001
- `SOLANA_RPC_URL` - Helius RPC endpoint
- `CLUSTER` - Should be mainnet-beta
- `JWT_SECRET` - Auth secret
- `PLATFORM_SECRET_KEY_BASE58` - Wallet key
- `DEVELOPER_WALLET_PUBLIC_KEY` - 7pRUDnHS1y3b7EycVm7xtV2MgBArKFcAnFpdZCMPvLio

---

## Fix Strategy

### Phase 1: Fix TypeScript Build Issues ✅
- [x] Fix irys-addresses.ts import (DONE)
- [x] Implement internal base58 conversion
- [ ] Run `npm run build` to verify

### Phase 2: Fix Database Schema Issues
- [ ] Check actual database schema
- [ ] Map code column names to actual DB columns
- [ ] Update all SQL queries
- [ ] Test queries locally

### Phase 3: Fix Production Deployment
- [ ] Verify all env vars in Render dashboard
- [ ] Check logs in Render for errors
- [ ] Restart backend service
- [ ] Test `/healthz` endpoint

### Phase 4: Comprehensive Testing
- [ ] Test locally: `npm run dev`
- [ ] Test production endpoints
- [ ] Test marketplace features
- [ ] Test wallet integration

---

## Database Schema Analysis

The backend expects these columns:

```
nfts table:
- mintAddress (or mint_address)
- name
- description
- image / imageUrl
- owner
- collection / collection_id / collection_name
- price
- status
- listed (boolean for "is listed")
- listedAt / created_at
```

**Action Needed:**
1. Connect to PostgreSQL database
2. Run: `\d nfts` (to see actual schema)
3. Compare with code expectations
4. Create mapping of actual → expected columns
5. Update all queries to use actual column names

---

## Environment Variables Checklist

For production (Render.com):

```bash
# Database
DATABASE_URL="postgresql://user:pass@host:5432/nftsol"

# Server
PORT=3001
NODE_ENV=production

# Solana
SOLANA_RPC_URL="https://api.mainnet-beta.solana.com"
CLUSTER="mainnet-beta"
CLOUT_MINT="26iJ37BE3icVtoo2QRkfjtYXFHMudG2sbTHAnhF2D6ab"
CLOUT_PROGRAM_ID="26iJ37BE3icVtoo2QRkfjtYXFHMudG2sbTHAnhF2D6ab"
REWARDS_OWNER="3XEs3MJ8PFiqTTqrK6RAkK9vt95jQQ1hKNNKHiE6jJ3o"

# Platform
PLATFORM_SECRET_KEY_BASE58="[your_key_here]"
DEVELOPER_WALLET_PUBLIC_KEY="7pRUDnHS1y3b7EycVm7xtV2MgBArKFcAnFpdZCMPvLio"

# Auth
JWT_SECRET="[strong_secret_here]"
SESSION_SECRET="[strong_secret_here]"

# Sentry
SENTRY_DSN="[your_sentry_dsn]"
SENTRY_ENVIRONMENT="production"

# Optional (can be commented out)
# HELIUS_API_KEY="[api_key]"
# PINATA_JWT="[pinata_jwt]"
# GROK_API_KEY="[grok_key]"
```

**Verify each one is set in Render dashboard:**
1. Go to https://dashboard.render.com
2. Select nftsol backend service
3. Settings → Environment
4. Check each variable is present and correct
5. Save and redeploy

---

## How to Diagnose Production Issues

### Step 1: Check Service Logs
```bash
# In Render dashboard:
1. Click on backend service
2. Click "Logs" tab
3. Look for ERROR messages
4. Note the error type
```

### Step 2: Identify the Error
- **Cannot connect to database** → Fix DATABASE_URL
- **Port already in use** → Render assigns PORT automatically, shouldn't be issue
- **Module not found** → TypeScript build issue (FIXED ✅)
- **Missing environment variable** → Add to Render env vars
- **Connection timeout** → Network/firewall issue or slow database

### Step 3: Test Locally First
```bash
cd apps/backend
npm run dev  # Should start on port 3001
curl http://localhost:3001/healthz  # Should return {"status":"healthy"}
```

### Step 4: Deploy to Production
```bash
# If local test passes:
1. Commit changes: git add . && git commit -m "fix: fix deployment issues"
2. Push to GitHub: git push origin main
3. Render auto-deploys on main branch push
4. Monitor logs in Render dashboard
5. Test: curl https://nftsol.onrender.com/healthz
```

---

## Immediate Actions (Next 15 minutes)

1. **Test Build:**
```bash
cd apps/backend
npm run build
```
Should compile without errors now that irys-addresses.ts is fixed.

2. **Check Database Schema:**
Connect to your PostgreSQL and check actual column names in nfts table.

3. **Verify Render Environment:**
- Go to Render dashboard
- Check all environment variables are set
- Especially: DATABASE_URL, PORT, DEVELOPER_WALLET_PUBLIC_KEY

4. **Restart Production Service:**
- Click "Restart service" in Render
- Monitor logs
- Test /healthz endpoint

5. **If Still Failing:**
- Check database connectivity from production
- Verify all required env vars are present
- Look for ERROR lines in logs

---

## Testing Commands

```bash
# Local Development
npm run dev                           # Start backend
npm run build                         # Build for production
npm run type-check                    # Check TypeScript
npm test                              # Run tests

# Remote Testing (once deployed)
curl https://nftsol.onrender.com/healthz
curl https://nftsol.onrender.com/api/nfts
curl https://nftsol.onrender.com/api/public/stats
```

---

## Success Criteria

✅ Backend builds without TypeScript errors
✅ Backend starts on port 3001 locally
✅ Database queries execute without schema errors
✅ `/healthz` endpoint returns 200 OK
✅ Production deployment returns 200 (not 503)
✅ NFT marketplace loads NFTs
✅ Wallet connections work
✅ CLOUT system operational

---

## Rollback Plan

If production breaks:
1. Render dashboard → backend service
2. Click "Revert" to previous deployment
3. Monitor logs to ensure it comes back online
4. Fix issues locally before next deploy

---

**Priority:** 🔴 CRITICAL
**Effort:** 30-60 minutes
**Impact:** Fixes production deployment issues
