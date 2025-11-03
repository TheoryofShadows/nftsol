# 🌐 Netlify Frontend Configuration

**For:** nftsol.app / nftsolmarket.netlify.app
**Status:** Needs environment variables check

---

## 🎯 Required Environment Variables on Netlify

### Go to Netlify Dashboard:

1. Visit: https://app.netlify.com
2. Select your site (nftsolmarket or nftsol)
3. Go to: **Site settings** → **Environment variables**
4. Add/verify these variables:

---

## ✅ Critical Variables (MUST HAVE)

### 1. VITE_API_BASE
**What:** Your backend API URL

Find your actual backend URL from Render:
- Go to Render Dashboard
- Your service URL is shown at the top
- Format: `https://[your-service-name].onrender.com`

```env
VITE_API_BASE=https://your-backend-name.onrender.com
```

**⚠️ DO NOT include trailing slash!**

### 2. VITE_SOLANA_RPC_URL  
**What:** Solana RPC endpoint (same as backend)

```env
VITE_SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=ea0ed024-cd7c-4338-8b9b-b6be4d004d36
```

### 3. VITE_SOLANA_CLUSTER
**What:** Which Solana network

```env
VITE_SOLANA_CLUSTER=mainnet-beta
```

---

## 🔧 Optional But Recommended

### 4. VITE_HELIUS_API_KEY
**What:** For enhanced Solana features

```env
VITE_HELIUS_API_KEY=ea0ed024-cd7c-4338-8b9b-b6be4d004d36
```

### 5. VITE_GA_TRACKING_ID
**What:** Google Analytics (if you use it)

```env
VITE_GA_TRACKING_ID=G-XXXXXXXXXX
```

---

## 🚀 After Adding Variables

### Trigger New Deploy:

1. Go to **Deploys** tab
2. Click **"Trigger deploy"** button
3. Select **"Deploy site"**
4. Wait 2-3 minutes

### Watch Build Log:

Look for:
```
✅ Building production bundle
✅ Environment variables loaded
✅ Build succeeded
✅ Site is live
```

---

## ✅ Verification

### Test Your Site:

```bash
# Open in browser:
https://nftsol.app
# or
https://nftsolmarket.netlify.app
```

### Check Console:

Open browser DevTools (F12), look for:
```
✅ No CORS errors
✅ No "Failed to fetch" errors
✅ API calls succeeding
✅ Wallet connects successfully
```

### Test Key Features:

- [ ] Homepage loads
- [ ] Marketplace shows NFTs
- [ ] Wallet connection works
- [ ] Dashboard loads
- [ ] No "eternal echoes error"

---

## 🔍 Common Issues

### "Failed to fetch" or CORS Error

**Problem:** Backend URL is wrong or backend is down

**Fix:**
1. Verify `VITE_API_BASE` matches your actual Render URL
2. Check backend is running (test `/health` endpoint)
3. Check ALLOWED_ORIGINS on backend includes your Netlify domain

### "Network Error"

**Problem:** Backend not accessible

**Fix:**
1. Test backend directly: `curl https://your-backend.onrender.com/health`
2. If backend is down, fix backend first (add PORT=3001)

### Build Fails

**Problem:** Missing environment variables during build

**Fix:**
1. Check all VITE_* variables are set in Netlify
2. Look at build log for specific error
3. Common: `VITE_API_BASE is not defined`

---

## 📋 Quick Checklist

**Netlify Environment Variables:**

- [ ] VITE_API_BASE (your backend URL)
- [ ] VITE_SOLANA_RPC_URL (with Helius API key)
- [ ] VITE_SOLANA_CLUSTER (mainnet-beta)
- [ ] VITE_HELIUS_API_KEY (optional)
- [ ] VITE_GA_TRACKING_ID (optional)

**Deployment:**

- [ ] All variables added
- [ ] Triggered new deploy
- [ ] Build succeeded
- [ ] Site is live
- [ ] No console errors

**Testing:**

- [ ] Homepage loads
- [ ] Can connect wallet
- [ ] Marketplace works
- [ ] Dashboard accessible
- [ ] No API errors

---

## 🎯 Your Domains

Based on your backend ALLOWED_ORIGINS:

### Production Domains:
- https://nftsol.app (main site)
- https://www.nftsol.app (www redirect)
- https://market.nftsol.app (marketplace subdomain)

### Netlify Domain:
- https://nftsolmarket.netlify.app

**Make sure your backend is accessible from all these domains!**

---

## 💡 Pro Tips

### Find Your Backend URL:

Your backend is hosted on Render. The URL format is:
```
https://[service-name].onrender.com
```

To find it:
1. Render Dashboard → Your Service
2. Look at top of page
3. Copy the full URL

### Test Backend from Frontend Domain:

```bash
# From your browser console on nftsol.app:
fetch('https://your-backend.onrender.com/health')
  .then(r => r.json())
  .then(console.log)
```

Should return:
```json
{
  "status": "healthy",
  "timestamp": "...",
  "uptime": 123
}
```

### Custom Domain Setup:

If using custom domains (nftsol.app):
1. Add DNS records pointing to Netlify
2. Enable HTTPS in Netlify settings
3. Add domain to backend ALLOWED_ORIGINS (already done ✅)

---

## 🚀 Deploy Order

**IMPORTANT:** Deploy in this order!

1. ✅ **Fix backend first** (add PORT=3001 to Render)
2. ✅ **Wait for backend to be live** (test /health)
3. ✅ **Then configure frontend** (add VITE_API_BASE with correct URL)
4. ✅ **Deploy frontend** (trigger new deploy on Netlify)

**Don't deploy frontend until backend is working!**

---

## 📞 Support

- **Netlify Docs:** https://docs.netlify.com/environment-variables/overview/
- **Vite Env Vars:** https://vitejs.dev/guide/env-and-mode.html
- **Your Frontend Code:** `client/src/`

---

*Created: November 3, 2025*
*For: NFTSol Platform Frontend*

