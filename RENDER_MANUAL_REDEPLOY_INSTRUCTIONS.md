# 🔄 Render Manual Redeploy Instructions

**Status:** Backend needs manual redeploy trigger
**Reason:** Render may not have auto-detected the GitHub webhook

---

## ⚠️ Issue

The SSL fix was committed to GitHub (commit 0fc48d3), but Render may not have automatically redeployed. We need to manually trigger a redeploy.

---

## 🔧 Solution: Manual Redeploy via Render Dashboard

### Step 1: Go to Render Dashboard
1. Visit: https://dashboard.render.com
2. Log in with your account
3. Click: **nftsol-api** service (backend)

### Step 2: Check Deployment Status
1. Look at the service overview
2. Check if it shows "Deploying" or "Deployed"
3. Click: **Logs** tab to see recent activity

### Step 3: Manual Redeploy (If Needed)
If the service is stuck or not deploying:

1. Click the **three dots menu** (⋯) on the service
2. Select: **Manual Deploy** or **Trigger Deploy**
3. Or look for: **"Deploy latest"** or **"Redeploy"** button
4. Choose: **Deploy from main branch**
5. Confirm: Click **Deploy**

### Step 4: Wait for Build
- Build will start (you'll see "Deploying" status)
- Monitor the **Logs** tab
- Wait for: "Deployed" status with green checkmark

### Step 5: Test After Deployment
```bash
# Once deployed, test the health endpoint
curl https://nftsol.onrender.com/healthz
```

**Expected response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "database": {
      "status": "healthy",
      "responseTime": "XXms"
    }
  }
}
```

---

## 📋 What Gets Deployed

When Render redeploys, it will pick up:

✅ **SSL Fix** (apps/backend/src/config/index.ts)
- Auto-enables SSL for Neon URLs
- Fixes 503 Service Unavailable errors

✅ **RPC Proxy** (apps/backend/src/routes/rpc-proxy.ts)
- Handles JSON-RPC requests
- Prevents CORS/rate limiting issues

✅ **Archive Routes** (apps/backend/src/index.ts)
- Archive search endpoints registered
- Fixed route mounting

✅ **TypeScript Definition** (apps/backend/src/lib/db.ts)
- ExtendedPoolClient properly configured
- Zero type errors

✅ **Environment Variables**
- DATABASE_URL with pooler endpoint
- All required configs

---

## 🎯 Expected Timeline (After Redeploy)

```
Manual Deploy Triggered
  ↓ (30 seconds)
Build starts
  ↓ (3-5 minutes)
Build completes
  ↓ (automatic)
Backend deploys
  ↓ (30-60 seconds)
Cold start (first request takes 10-30 sec)
  ↓
✅ WORKING: Backend responding with healthy status
```

---

## ✅ Success Criteria

Backend is working when:

✅ Health endpoint returns JSON with status
✅ No "503 Service Unavailable" errors
✅ No "Connection refused" errors
✅ Database connection shows "healthy"
✅ Frontend can reach backend
✅ Archive search returns results
✅ Wallet balance loads

---

## 📞 Troubleshooting

### If Manual Deploy Button Not Visible
- Go to service settings
- Look for "Manual Deploy" or "Redeploy" button
- Or in the three-dots menu (⋯)

### If Deploy Fails with Errors
1. Check Logs tab for error message
2. Common errors:
   - Database connection: Check DATABASE_URL env var
   - Missing dependencies: Check npm install
   - Build error: Usually from uncommitted changes

### If Deploy Succeeds but Backend Still Down
- Wait 1-2 minutes for cold start
- Check health endpoint again
- If 503 persists, check Render logs for database errors

---

## 🚀 Quick Status Check

Before manual deploy, verify:

```bash
# Check that commits are on GitHub
git log --oneline -3

# Should show:
# 4fe2736 docs: Add test results summary
# cec0577 docs: Add comprehensive codebase test report
# 0fc48d3 fix: Enable SSL for Neon database connections

# Check git is synced
git status

# Should show:
# On branch main
# Your branch is up to date with 'origin/main'.
```

---

## 📝 Summary

**What's Wrong:**
- Backend returning 503 (database connection failed)
- Cause: SSL was disabled in development

**What's Fixed:**
- SSL auto-enabled for Neon URLs
- Commit 0fc48d3 pushed to GitHub

**What's Needed:**
- Manual redeploy trigger on Render dashboard
- Takes 5-10 minutes total

**After Deploy:**
- Backend will connect to database with SSL
- All errors should disappear
- App will be fully functional

---

**Instructions:** Follow the steps above to trigger a manual redeploy on Render.
**Estimated Time:** 5-10 minutes to full working state
**Result:** Fully functional NFTSol application ready for use

