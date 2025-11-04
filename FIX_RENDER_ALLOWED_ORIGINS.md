# 🚨 FIX: ALLOWED_ORIGINS Error on Render

**Error:** `Error: ALLOWED_ORIGINS must be set in production`

**Location:** Render Backend Deployment

---

## ✅ **Quick Fix (2 Minutes)**

### **Step 1: Go to Render Dashboard**

1. Open: https://dashboard.render.com/
2. Find your backend service: `nftsol` (or similar name)
3. Click on it

### **Step 2: Add Environment Variable**

1. Click **"Environment"** tab in the left sidebar
2. Click **"Add Environment Variable"** button
3. Add the following:

```
Key: ALLOWED_ORIGINS
Value: http://localhost:5173,http://localhost:3000,https://nftsol.app,https://www.nftsol.app,https://market.nftsol.app,https://nftsolmarket.netlify.app
```

**IMPORTANT:** Copy the value EXACTLY as shown above (no spaces, comma-separated)

### **Step 3: Save & Redeploy**

1. Click **"Save Changes"**
2. Render will automatically redeploy
3. Wait ~2-3 minutes for deployment

---

## 📋 **Full Environment Variable**

**Variable Name:**
```
ALLOWED_ORIGINS
```

**Variable Value:**
```
http://localhost:5173,http://localhost:3000,https://nftsol.app,https://www.nftsol.app,https://market.nftsol.app,https://nftsolmarket.netlify.app
```

---

## 🔍 **What This Does**

This environment variable tells your backend which frontend domains are allowed to make API requests (CORS configuration).

**Included Domains:**
- ✅ `http://localhost:5173` - Local development (Vite)
- ✅ `http://localhost:3000` - Local development (alternative)
- ✅ `https://nftsol.app` - Production frontend
- ✅ `https://www.nftsol.app` - Production frontend (www)
- ✅ `https://market.nftsol.app` - Marketplace subdomain
- ✅ `https://nftsolmarket.netlify.app` - Netlify deployment

---

## 🖼️ **Visual Guide**

### **Where to Find It:**

```
Render Dashboard
  └── Your Service (nftsol backend)
      └── Environment (tab on left)
          └── Add Environment Variable
              ├── Key: ALLOWED_ORIGINS
              └── Value: (paste the domains)
```

### **Screenshot Reference:**

1. **Dashboard:**
   - URL: `https://dashboard.render.com/`
   - Look for: Your backend service name

2. **Environment Tab:**
   - Left sidebar: "Environment"
   - Button: "Add Environment Variable"

3. **Add Variable:**
   - Field 1: `ALLOWED_ORIGINS`
   - Field 2: `http://localhost:5173,http://localhost:3000,https://nftsol.app,https://www.nftsol.app,https://market.nftsol.app,https://nftsolmarket.netlify.app`

---

## ⚡ **Alternative: Use PowerShell Script**

If you have Render API key, you can set it via API:

```powershell
# Set your Render API key and service ID
$RENDER_API_KEY = "your-render-api-key"
$SERVICE_ID = "your-service-id"

# Set ALLOWED_ORIGINS
$body = @{
    "envVars" = @(
        @{
            "key" = "ALLOWED_ORIGINS"
            "value" = "http://localhost:5173,http://localhost:3000,https://nftsol.app,https://www.nftsol.app,https://market.nftsol.app,https://nftsolmarket.netlify.app"
        }
    )
} | ConvertTo-Json -Depth 3

Invoke-RestMethod -Uri "https://api.render.com/v1/services/$SERVICE_ID/env-vars" `
    -Method POST `
    -Headers @{ "Authorization" = "Bearer $RENDER_API_KEY"; "Content-Type" = "application/json" } `
    -Body $body
```

---

## 🔧 **Verification**

### **After Adding the Variable:**

1. Wait for Render to redeploy (~2-3 minutes)
2. Check logs for successful startup
3. Test the backend:

```bash
curl https://nftsol.onrender.com/healthz
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "..."
}
```

### **If It Still Fails:**

1. **Check logs** on Render dashboard
2. **Verify** the variable was saved:
   - Go to Environment tab
   - Look for `ALLOWED_ORIGINS` in the list
3. **Trigger manual deploy**:
   - Click "Manual Deploy" → "Deploy latest commit"

---

## 📝 **All Required Render Environment Variables**

Make sure you also have these set:

```
✅ NODE_ENV=production
✅ PORT=3001
✅ ALLOWED_ORIGINS=(see above)
✅ DATABASE_URL=postgresql://...
✅ SOLANA_RPC_URL=https://api.devnet.solana.com
✅ SOLANA_CLUSTER=devnet
✅ CLOUT_MINT=26iJ37BE3icVtoo2QRkfjtYXFHMudG2sbTHAnhF2D6ab
✅ JWT_SECRET=your-jwt-secret
✅ SESSION_SECRET=your-session-secret
✅ HELIUS_API_KEY=33d5c12f-895d-4192-bc26-a86d5ffa5cbc
✅ PINATA_JWT=your-pinata-jwt
✅ PLATFORM_SECRET_KEY_BASE58=your-platform-key
```

---

## 🚨 **Common Mistakes**

### ❌ **Don't Do This:**

1. **Spaces after commas:**
   ```
   http://localhost:5173, http://localhost:3000  ← WRONG!
   ```

2. **Missing protocol:**
   ```
   localhost:5173,nftsol.app  ← WRONG!
   ```

3. **Trailing comma:**
   ```
   http://localhost:5173,https://nftsol.app,  ← WRONG!
   ```

### ✅ **Correct Format:**

```
http://localhost:5173,http://localhost:3000,https://nftsol.app,https://www.nftsol.app,https://market.nftsol.app,https://nftsolmarket.netlify.app
```

---

## 🎯 **Expected Timeline**

1. **Add variable:** 30 seconds
2. **Save changes:** 5 seconds
3. **Render redeploys:** 2-3 minutes
4. **Test backend:** 10 seconds

**Total:** ~3-4 minutes

---

## ✅ **Success Indicators**

After fixing, you should see:

1. ✅ Render logs show no `ALLOWED_ORIGINS` error
2. ✅ Backend health check passes
3. ✅ Frontend can connect to backend
4. ✅ No CORS errors in browser console

---

## 🆘 **Need Help?**

If it still doesn't work:

1. **Check Render Logs:**
   - Dashboard → Your Service → "Logs" tab
   - Look for the startup message

2. **Verify Environment Variables:**
   - Dashboard → Your Service → "Environment" tab
   - Count: Should have 10+ variables

3. **Test Connection:**
   ```bash
   curl -I https://nftsol.onrender.com
   ```

---

## 🎉 **You're Done!**

Once you add `ALLOWED_ORIGINS` and Render redeploys, the error will be gone!

**Next Step:** Test your frontend at https://nftsolmarket.netlify.app

