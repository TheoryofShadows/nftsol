# 🚀 Netlify Environment Variables - Quick Copy & Paste

## Copy These Exact Values Into Netlify

Go to: **Netlify Dashboard → Site settings → Environment variables**

---

### 1️⃣ VITE_API_BASE (REQUIRED)
```
https://your-backend.onrender.com
```
**⚠️ REPLACE THIS** with your actual Render backend URL  
Find it at: Render Dashboard → Your Service → Settings → URL

---

### 2️⃣ VITE_SOLANA_RPC_URL (REQUIRED)
```
https://mainnet.helius-rpc.com/?api-key=ea0ed024-cd7c-4338-8b9b-b6be4d004d36
```
**✅ Copy as-is** - This is your Helius RPC endpoint

---

### 3️⃣ VITE_SOLANA_CLUSTER (REQUIRED)
```
mainnet-beta
```
**✅ Copy as-is** - Solana mainnet

---

### 4️⃣ VITE_HELIUS_API_KEY (REQUIRED)
```
ea0ed024-cd7c-4338-8b9b-b6be4d004d36
```
**✅ Copy as-is** - Your Helius API key

---

### 5️⃣ VITE_IMG_PROXY_BASE (OPTIONAL)
```
https://your-backend.onrender.com
```
**⚠️ REPLACE THIS** with your actual Render backend URL (same as #1)

---

### 6️⃣ VITE_GA_TRACKING_ID (OPTIONAL)
```
G-XXXXXXXXXX
```
**⚠️ REPLACE THIS** with your Google Analytics tracking ID (if you have one)  
Leave empty if you don't use Google Analytics

---

## 📋 Summary Table

| Variable Name | Value | Notes |
|--------------|-------|-------|
| `VITE_API_BASE` | `https://your-backend.onrender.com` | ⚠️ Replace with your Render URL |
| `VITE_SOLANA_RPC_URL` | `https://mainnet.helius-rpc.com/?api-key=ea0ed024-cd7c-4338-8b9b-b6be4d004d36` | ✅ Use as-is |
| `VITE_SOLANA_CLUSTER` | `mainnet-beta` | ✅ Use as-is |
| `VITE_HELIUS_API_KEY` | `ea0ed024-cd7c-4338-8b9b-b6be4d004d36` | ✅ Use as-is |
| `VITE_IMG_PROXY_BASE` | `https://your-backend.onrender.com` | ⚠️ Same as VITE_API_BASE |
| `VITE_GA_TRACKING_ID` | `G-XXXXXXXXXX` | ⚠️ Optional - your GA4 ID |

---

## ⚡ Quick Steps

1. Go to your Netlify site dashboard
2. Click **Site settings** in the left menu
3. Click **Environment variables** under "Build & deploy"
4. Click **Add a variable** button
5. For each variable above:
   - Enter the **Variable Name** (e.g., `VITE_API_BASE`)
   - Enter the **Value** (e.g., your backend URL)
   - Click **Create variable**
6. After adding all variables, go to **Deploys** tab
7. Click **Trigger deploy** → **Deploy site**

---

## 🎯 Finding Your Render Backend URL

1. Go to https://dashboard.render.com
2. Click on your backend service
3. Look for the **URL** at the top (e.g., `https://nftsol-abc123.onrender.com`)
4. Copy this URL and use it for:
   - `VITE_API_BASE`
   - `VITE_IMG_PROXY_BASE`

---

## ✅ Verification

After deploying, check your browser console (F12):
- You should see API calls to your Render URL
- Wallet connection should work
- No CORS errors

If you see errors:
1. Check variable names are exactly as shown (including `VITE_` prefix)
2. Verify backend URL has no trailing slash
3. Ensure backend CORS allows your Netlify URL

---

## 🔐 Your Actual Values

Based on your configuration:

**Helius RPC URL:**
```
https://mainnet.helius-rpc.com/?api-key=ea0ed024-cd7c-4338-8b9b-b6be4d004d36
```

**Helius API Key:**
```
ea0ed024-cd7c-4338-8b9b-b6be4d004d36
```

**Solana Cluster:**
```
mainnet-beta
```

**CLOUT Token Mint (optional, for reference):**
```
62hWQAgAV4jugHSuZsMqzxZNVXaVLrbRpz3Sw58Z64Mw
```

**Rewards Vault (optional, for reference):**
```
2KkNwFZbznAtYX1xjVS6e5BBqQnfaBuTjn42G4zJXAps
```

---

## 🚨 Important Notes

- All `VITE_*` variables are **public** and will be in your frontend bundle
- This is safe for RPC URLs and API keys (they're rate-limited)
- Never put backend secrets (JWT_SECRET, private keys) in `VITE_*` variables
- After adding variables, you **must redeploy** for changes to take effect

---

**That's it! Your frontend is now configured to connect to your backend.**

