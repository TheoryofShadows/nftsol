# 🚀 Netlify Drag & Drop Deployment Guide

**File:** `nftsol-frontend-deploy.zip` (0.21 MB)  
**Location:** Project root directory

---

## Quick Deploy Instructions

### 1. **Get the ZIP File**
- ✅ File is ready: `nftsol-frontend-deploy.zip`
- Location: `C:\Users\KHK89\NFTSol\nftsol-frontend-deploy.zip`

### 2. **Deploy to Netlify**

1. Go to https://app.netlify.com/drop
2. Drag and drop the `nftsol-frontend-deploy.zip` file
3. Wait for the deployment to complete (usually 10-30 seconds)

### 3. **Configure Custom Domain (Optional)**

If you want to use your custom domain:
1. Go to your site settings in Netlify
2. Click "Domain settings"
3. Add your custom domain: `nftsol.app`
4. Follow the DNS configuration instructions

---

## What's Included

The ZIP contains all necessary files for the frontend:

```
📦 nftsol-frontend-deploy.zip
├── index.html (Main HTML file)
├── manifest.json (PWA manifest)
├── mobile-wallet-detection.js (Wallet detection script)
├── masked-icon.svg (Icon)
├── _redirects (Netlify redirect rules)
└── assets/
    ├── index-BnGIT6wL.css (59.04 KB - All styles)
    ├── index-DS7Y9XjD.js (812.82 KB - All functionality)
    ├── nftsol-logo.svg (Main logo)
    └── clout-logo.svg (CLOUT token logo)
```

---

## After Deployment

### 1. **Verify the Site**
- Visit your Netlify URL (e.g., `https://random-word-12345.netlify.app`)
- The site should load with all styling and functionality

### 2. **Test Key Features**
- ✅ Navigation tabs work
- ✅ Wallet connection works
- ✅ All buttons are functional
- ✅ Design loads correctly

### 3. **Set Environment Variables** (If needed)

If you need to override the backend URL:
1. Go to Site settings → Environment variables
2. Add:
   - `VITE_API_BASE` = `https://nftsol-server-prod.onrender.com`
   - `VITE_SOLANA_CLUSTER` = `mainnet-beta`

---

## Troubleshooting

### Issue: Blank page after deployment
**Solution:** Clear browser cache and hard refresh (Ctrl+Shift+R)

### Issue: API calls failing
**Solution:** Check that environment variables are set correctly

### Issue: Assets not loading
**Solution:** Verify the `_redirects` file is included in the ZIP

---

## Re-deploying Updates

To deploy new updates:

1. **Rebuild the app:**
   ```bash
   cd client
   npm run build
   ```

2. **Create a new ZIP:**
   ```bash
   cd ..
   Compress-Archive -Path client/dist/* -DestinationPath nftsol-frontend-deploy.zip -Force
   ```

3. **Drag and drop** the new ZIP file on https://app.netlify.com/drop

---

## Recommended: Use Git Deployment Instead

For automatic deployments:
1. Connect your GitHub repository to Netlify
2. Configure build settings in `netlify.toml`
3. Every push to `main` automatically deploys

Current configuration in `netlify.toml`:
```toml
[build]
  base = "client"
  publish = "dist"
  command = "npm install && npm run build"
```

---

## Status: ✅ Ready to Deploy

Your ZIP file is ready at:
**`C:\Users\KHK89\NFTSol\nftsol-frontend-deploy.zip`**

Just drag and drop it on https://app.netlify.com/drop!
