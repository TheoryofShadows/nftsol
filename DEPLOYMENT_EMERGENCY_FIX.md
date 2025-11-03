# 🚨 EMERGENCY DEPLOYMENT FIX

## Problem Summary
- **Backend:** Failed (likely missing environment variables or configuration)
- **Frontend:** Eternal deploy echoes (stuck in loop)

---

## 🔥 IMMEDIATE FIXES

### Issue 1: Backend Failure

#### Root Causes:
1. Missing required environment variables on Render
2. Database connection issues
3. Solana configuration errors

#### Required Environment Variables on Render:

```env
# CRITICAL - Backend will fail without these:
NODE_ENV=production
PORT=3001

# Solana Configuration
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_CLUSTER=mainnet-beta

# Program IDs (these have defaults but should be verified)
CLOUT_MINT=62hWQAgAV4jugHSuZsMqzxZNVXaVLrbRpz3Sw58Z64Mw
CLOUT_PROGRAM_ID=62hWQAgAV4jugHSuZsMqzxZNVXaVLrbRpz3Sw58Z64Mw
MARKET_PROGRAM_ID=HTs1hErzM8MywaUojfUY7QA1T6gLQD977R3HsCnKj7m7
LOYALTY_PROGRAM_ID=2TujfT3Czd2ncawJ6ZLmfGeJ2t1Ugb9bqEvxSE2EKoo9
REWARDS_VAULT=2KkNwFZbznAtYX1xjVS6e5BBqQnfaBuTjn42G4zJXAps

# Database (if not already set via Render PostgreSQL addon)
DATABASE_URL=postgresql://user:pass@host:port/dbname

# Optional but highly recommended
PLATFORM_SECRET_KEY_BASE58=[your-platform-wallet-secret-key]
JWT_SECRET=[your-jwt-secret-256-bits]
HELIUS_API_KEY=[your-helius-key]
PINATA_JWT=[your-pinata-jwt]
PINATA_API_KEY=[your-pinata-api-key]
PINATA_SECRET_KEY=[your-pinata-secret]
```

#### Fix Backend NOW:

**Step 1: Go to Render Dashboard**
```
1. Go to dashboard.render.com
2. Select your backend service
3. Go to "Environment" tab
4. Add ALL critical variables above
5. Click "Save Changes"
6. Render will auto-redeploy
```

**Step 2: Check Logs**
```
1. Go to "Logs" tab
2. Look for startup errors
3. Common errors:
   - "Missing required environment variable: PORT" → Add PORT=3001
   - "Missing required environment variable: SOLANA_RPC_URL" → Add RPC URL
   - "Database connection failed" → Check DATABASE_URL
```

---

### Issue 2: Frontend Eternal Deploy Echoes

#### Root Causes:
1. Missing environment variables during build
2. Vite config not optimized for Netlify
3. Build command failing silently

#### Required Environment Variables on Netlify:

```env
# CRITICAL for build to succeed:
VITE_API_BASE=https://your-backend.onrender.com
VITE_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
VITE_SOLANA_CLUSTER=mainnet-beta

# Optional but recommended:
VITE_HELIUS_API_KEY=[your-helius-key]
VITE_GA_TRACKING_ID=[your-google-analytics-id]
```

#### Fix Frontend NOW:

**Step 1: Go to Netlify Dashboard**
```
1. Go to app.netlify.com
2. Select your site
3. Go to "Site settings" → "Environment variables"
4. Add ALL variables above
5. Click "Save"
```

**Step 2: Stop the Deploy Loop**
```
1. Go to "Deploys" tab
2. If a deploy is in progress, click "Cancel deploy"
3. Wait for it to stop
4. Then click "Trigger deploy" → "Clear cache and deploy site"
```

**Step 3: Monitor the Build**
```
1. Watch the deploy log
2. Look for errors:
   - "VITE_API_BASE is not defined" → Add to env vars
   - "Build failed" → Check build log for specific error
   - "Deployment still in progress" → May need to cancel and retry
```

---

## 🔧 Configuration Files to Fix

### 1. Update netlify.toml (Already Correct)

The file is fine, but if issues persist, you can simplify:

```toml
[build]
  base = "client"
  publish = "dist"
  command = "npm ci && npm run build"

[build.environment]
  NODE_VERSION = "20"
  CI = "false"
  NPM_CONFIG_PRODUCTION = "false"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### 2. Create Netlify-Specific Build Script

This helps with environment variable issues:

```bash
# In client/package.json, update build script:
"build": "vite build --mode production"
```

---

## 📊 Debugging Steps

### For Backend:

1. **Check Render Logs:**
   ```
   Render Dashboard → Your Service → Logs
   ```

2. **Look for these errors:**
   ```
   ❌ "Missing required environment variable"
   ❌ "Database connection failed"
   ❌ "Failed to connect to PostgreSQL"
   ❌ "ECONNREFUSED"
   ❌ "Port already in use"
   ```

3. **Common Fixes:**
   - Missing PORT → Add `PORT=3001`
   - Missing SOLANA_RPC_URL → Add RPC URL
   - Database error → Check if PostgreSQL addon is linked
   - Connection refused → Check if DATABASE_URL is correct

### For Frontend:

1. **Check Netlify Deploy Log:**
   ```
   Netlify Dashboard → Deploys → (Click latest deploy)
   ```

2. **Look for these errors:**
   ```
   ❌ "Build failed"
   ❌ "npm ERR!"
   ❌ "vite build failed"
   ❌ "Module not found"
   ❌ "Cannot read properties of undefined"
   ```

3. **Common Fixes:**
   - Build timeout → Clear cache and redeploy
   - Missing env vars → Add VITE_* variables
   - Module errors → Clear node_modules cache
   - Stuck in loop → Cancel deploy, wait 5 mins, trigger new deploy

---

## 🎯 Quick Checklist

### Backend (Render):
- [ ] PORT=3001 is set
- [ ] NODE_ENV=production is set  
- [ ] SOLANA_RPC_URL is set
- [ ] DATABASE_URL is set (or PostgreSQL addon linked)
- [ ] CLOUT_PROGRAM_ID is set
- [ ] MARKET_PROGRAM_ID is set
- [ ] LOYALTY_PROGRAM_ID is set
- [ ] REWARDS_VAULT is set
- [ ] Service has redeployed after adding env vars
- [ ] Logs show "Server running on port 3001"

### Frontend (Netlify):
- [ ] VITE_API_BASE is set (points to Render backend URL)
- [ ] VITE_SOLANA_RPC_URL is set
- [ ] VITE_SOLANA_CLUSTER=mainnet-beta is set
- [ ] Cancelled any stuck deploys
- [ ] Cleared cache
- [ ] Triggered fresh deploy
- [ ] Build log shows "build complete"
- [ ] Site is accessible

---

## 🚀 Step-by-Step Recovery Process

### Step 1: Fix Backend First (5 minutes)

```bash
# 1. Go to Render.com → Your Service → Environment
# 2. Add these CRITICAL vars:

PORT=3001
NODE_ENV=production
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_CLUSTER=mainnet-beta
CLOUT_PROGRAM_ID=62hWQAgAV4jugHSuZsMqzxZNVXaVLrbRpz3Sw58Z64Mw
MARKET_PROGRAM_ID=HTs1hErzM8MywaUojfUY7QA1T6gLQD977R3HsCnKj7m7
LOYALTY_PROGRAM_ID=2TujfT3Czd2ncawJ6ZLmfGeJ2t1Ugb9bqEvxSE2EKoo9
REWARDS_VAULT=2KkNwFZbznAtYX1xjVS6e5BBqQnfaBuTjn42G4zJXAps

# 3. If using database, verify DATABASE_URL is set
# 4. Click "Save Changes"
# 5. Wait for redeploy (2-3 minutes)
# 6. Check logs for "Server running on port 3001"
```

### Step 2: Fix Frontend (5 minutes)

```bash
# 1. Go to Netlify → Site settings → Environment variables
# 2. Add these CRITICAL vars:

VITE_API_BASE=https://your-service-name.onrender.com
VITE_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
VITE_SOLANA_CLUSTER=mainnet-beta

# 3. Go to Deploys tab
# 4. Cancel any in-progress deploy
# 5. Wait 2 minutes
# 6. Click "Trigger deploy" → "Clear cache and deploy site"
# 7. Watch build log
# 8. Build should complete in 2-5 minutes
```

### Step 3: Verify (2 minutes)

```bash
# Test backend:
curl https://your-service.onrender.com/api/health

# Expected: {"status":"healthy","timestamp":"..."}

# Test frontend:
# Visit your Netlify URL in browser
# Should load without errors
```

---

## 🆘 If Still Failing

### Backend Still Down:

1. **Check Render Service Status**
   - Is the service "Running"?
   - Check "Events" tab for errors
   - Look at "Metrics" to see if it's crashing

2. **Manual Redeploy**
   ```
   Render Dashboard → Your Service → Manual Deploy → Deploy latest commit
   ```

3. **Check Database**
   ```
   - Is PostgreSQL addon connected?
   - Is DATABASE_URL environment variable set?
   - Check database connection in logs
   ```

### Frontend Still Looping:

1. **Nuclear Option - Clear Everything**
   ```
   Netlify → Deploys → Options → Clear build cache
   Netlify → Deploys → Trigger deploy → Clear cache and deploy site
   ```

2. **Check Build Command**
   ```
   Site settings → Build & deploy → Edit settings
   Build command should be: npm install --include=dev && npm run build
   Publish directory should be: dist
   ```

3. **Check for Lock Files**
   ```
   The eternal loop can be caused by package-lock.json conflicts
   Try: Delete client/.netlify folder from repo if it exists
   ```

---

## 📝 Environment Variables Reference

### Complete Backend .env Template:

```env
# Server
NODE_ENV=production
PORT=3001

# Solana
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_CLUSTER=mainnet-beta

# Program IDs
CLOUT_MINT=62hWQAgAV4jugHSuZsMqzxZNVXaVLrbRpz3Sw58Z64Mw
CLOUT_PROGRAM_ID=62hWQAgAV4jugHSuZsMqzxZNVXaVLrbRpz3Sw58Z64Mw
MARKET_PROGRAM_ID=HTs1hErzM8MywaUojfUY7QA1T6gLQD977R3HsCnKj7m7
LOYALTY_PROGRAM_ID=2TujfT3Czd2ncawJ6ZLmfGeJ2t1Ugb9bqEvxSE2EKoo9
REWARDS_VAULT=2KkNwFZbznAtYX1xjVS6e5BBqQnfaBuTjn42G4zJXAps

# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Optional but Recommended
PLATFORM_SECRET_KEY_BASE58=your_base58_key_here
JWT_SECRET=your_jwt_secret_minimum_256_bits
HELIUS_API_KEY=your_helius_api_key
PINATA_JWT=your_pinata_jwt
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_KEY=your_pinata_secret_key

# CORS (optional - has defaults)
ALLOWED_ORIGINS=https://your-site.netlify.app,https://your-domain.com
```

### Complete Frontend .env Template:

```env
# API
VITE_API_BASE=https://your-backend.onrender.com

# Solana
VITE_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
VITE_SOLANA_CLUSTER=mainnet-beta

# Optional
VITE_HELIUS_API_KEY=your_helius_key
VITE_GA_TRACKING_ID=G-XXXXXXXXXX
```

---

## ✅ Success Criteria

You know it's fixed when:

### Backend:
- ✅ Render dashboard shows service as "Running"
- ✅ Logs show "Server running on port 3001"
- ✅ Health check endpoint responds: `curl https://your-service.onrender.com/api/health`
- ✅ No errors in logs

### Frontend:
- ✅ Netlify deploy completes successfully
- ✅ Build log shows "build complete"
- ✅ Site is accessible at your Netlify URL
- ✅ Console shows no CORS or API connection errors
- ✅ Wallet connection works

---

## 🎉 Post-Fix Verification

Once both are running:

1. **Test Full Flow:**
   ```
   1. Visit frontend URL
   2. Connect wallet
   3. Check dashboard loads
   4. Try browsing marketplace
   5. Verify CLOUT balance appears
   ```

2. **Monitor for 24 Hours:**
   - Check Render logs for errors
   - Check Netlify deploy history
   - Monitor uptime

---

*Last Updated: Emergency fix for deployment failures*
*Priority: CRITICAL - Follow this guide step-by-step*

