# 📦 Netlify Manual Deployment Guide

## 🎯 Deployment Package Created

**File:** `netlify-deploy-[timestamp].zip`

This zip file contains your complete production build ready for Netlify.

---

## 📋 Manual Deployment Steps

### **Step 1: Prepare Environment Variables**

Before deploying, set these in Netlify:

1. Go to: **Site settings** → **Environment variables**
2. Add/Update:

```
VITE_API_BASE=https://your-render-backend-url.onrender.com
```

**Example (if your backend is at nftsol-dev.onrender.com):**
```
VITE_API_BASE=https://nftsol-dev.onrender.com
```

### **Step 2: Manual Deploy**

1. Go to: https://app.netlify.com
2. Select your site (or create new site)
3. Navigate to: **Site settings** → **Build & deploy** → **Deploys**
4. Click: **"Deploy site"** dropdown → **"Deploy manually"**
5. **Drag and drop** the zip file: `netlify-deploy-[timestamp].zip`
6. Wait for deployment to complete

---

## 📁 What's Included

The zip contains:
- ✅ All production build files (`dist/` folder contents)
- ✅ `index.html` - Entry point
- ✅ All optimized JavaScript bundles
- ✅ All CSS files
- ✅ `_redirects` file for SPA routing

---

## ⚙️ Netlify Configuration

### **Build Settings (if using automatic deploys)**

If you set up automatic deploys, configure:

- **Base directory:** `client`
- **Build command:** `npm ci && npm run build`
- **Publish directory:** `client/dist`
- **Node version:** `20`

### **Environment Variables**

Required in Netlify dashboard:
- `VITE_API_BASE` - Your backend API URL

---

## 🔍 Verification

After deployment:

1. **Check deployment logs** - Should show successful build
2. **Visit your site** - Should load correctly
3. **Test CLOUT integration:**
   - Connect wallet
   - Verify CloutBadge appears in bottom-right
   - Check Hero section for CLOUT counter
4. **Test API connection:**
   - Check browser console for API calls
   - Verify no CORS errors

---

## 🐛 Troubleshooting

### **Issue: API calls failing**
- Check `VITE_API_BASE` is set correctly
- Verify backend CORS allows your Netlify domain
- Check browser console for errors

### **Issue: CloutBadge not showing**
- Verify wallet is connected
- Check browser console for errors
- Verify API endpoint `/api/clout/balance/:address` works

### **Issue: Build errors**
- Check Node version is 20
- Verify all dependencies install correctly
- Check build logs in Netlify

---

## ✅ What's New in This Build

- ✅ CloutBadge component integrated
- ✅ useCloutBalance hook included
- ✅ CLOUT counter in Hero section
- ✅ All CLOUT integration code included
- ✅ Production optimized build

---

**Deployment package is ready! Just upload to Netlify.** 🚀

