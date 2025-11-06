# 🚀 Netlify Deployment Settings

## ✅ Correct Settings for Netlify Dashboard

### Repository Settings
- **Branch to deploy**: `main` (NOT develop)
- **Base directory**: `client` (NOT empty)
- **Build command**: `npm install --include=dev && npm run build`
- **Publish directory**: `dist` (NOT client/dist)

### Why This Matters
- Netlify runs the build command FROM the base directory
- So if base directory is `client`, the build runs in `client/`
- The publish directory is relative to the base directory
- So `dist` in base directory `client` = `client/dist` absolute

---

## 📋 Step-by-Step Netlify Setup

### 1. Connect GitHub Repository
- Repository: `TheoryofShadows/nftsol`
- Branch: `main`

### 2. Build Settings
```
Base directory: client
Build command: npm install --include=dev && npm run build
Publish directory: dist
```

### 3. Environment Variables
Add these in Netlify Dashboard → Site Settings → Environment Variables:

```
VITE_API_BASE=https://nftsol.onrender.com
NODE_ENV=production
```

### 4. Deploy Settings
- **Functions directory**: Leave empty (no Netlify Functions)
- **Node version**: 20 (auto-detected from netlify.toml)

---

## ⚠️ Common Issues & Fixes

### Issue: Design Not Loading
**Cause**: Wrong base directory or publish directory
**Fix**: 
- Base directory: `client`
- Publish directory: `dist`

### Issue: CSS Not Loading
**Cause**: Assets not being built correctly
**Fix**: Ensure build command runs `npm run build` in client directory

### Issue: 404 on Routes
**Fix**: netlify.toml already has SPA redirect configured

---

## ✅ Verification

After deployment:
1. Check build logs - should show `vite build` output
2. Check dist folder contains:
   - `index.html`
   - `assets/` folder with CSS and JS
3. Verify CSS files are in assets folder
4. Test site loads with design

---

## 🎯 Quick Copy-Paste Settings

**Branch**: `main`
**Base directory**: `client`
**Build command**: `npm install --include=dev && npm run build`
**Publish directory**: `dist`

