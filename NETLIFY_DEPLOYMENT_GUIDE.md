# Netlify Deployment Guide for NFTSol

## Required Netlify Environment Variables

Add these in Netlify Dashboard → Site Settings → Environment Variables:

```bash
NODE_ENV=production
VITE_API_BASE=https://nftsol-server-prod.onrender.com
VITE_IMG_PROXY_BASE=https://nftsol-server-prod.onrender.com
VITE_SOLANA_CLUSTER=mainnet-beta
```

## Build Configuration

### Build Settings (in Netlify.toml)
- **Base directory:** `client`
- **Publish directory:** `dist`
- **Build command:** `npm install && npm run build`
- **Node version:** 18

### Netlify.toml Location
The `netlify.toml` file is at the repository root and automatically configures:
- Build directory (client/)
- Publish directory (dist/)
- Build command with npm install
- API redirects to Render backend
- SPA routing (/* to /index.html)

## Deployment Steps

1. **Set Environment Variables**
   - Go to Netlify Dashboard
   - Site Settings → Environment Variables
   - Add all 4 variables listed above

2. **Connect Repository**
   - Already connected to GitHub
   - Auto-deploys on push to main

3. **Trigger Build**
   - Push to main branch
   - Or manually trigger in Netlify Dashboard

## Troubleshooting

### Build Fails with "Cannot find module"
**Problem:** Missing dependencies
**Solution:** The build command now includes `npm install`

### Blank Page After Deployment
**Problem:** Missing environment variables
**Solution:** Set all 4 environment variables in Netlify

### 404 on Refresh
**Problem:** SPA routing not configured
**Solution:** netlify.toml includes /* redirect

### API Calls Failing
**Problem:** Wrong API base URL
**Solution:** Set VITE_API_BASE=https://nftsol-server-prod.onrender.com

### Submodule Error
**Problem:** Git submodule reference
**Solution:** Already fixed - removed solana-worker submodule

## Verification

After deployment, check:
1. ✅ Site loads at https://nftsol.app
2. ✅ NFTs display in marketplace
3. ✅ Wallet connection works
4. ✅ API calls go to Render backend
5. ✅ No console errors

## Support

If issues persist:
1. Check Netlify build logs
2. Verify environment variables
3. Check browser console for errors
4. Verify Render backend is running
