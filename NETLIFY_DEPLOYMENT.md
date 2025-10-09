# NFTSol Netlify Deployment Guide

This guide will help you deploy your NFTSol platform to Netlify with your custom domain.

## Prerequisites

1. A Netlify account
2. Your custom domain configured in Netlify
3. Your backend server deployed (separate from Netlify)
4. Your Solana programs deployed to mainnet/devnet

## Step 1: Connect Your Repository

1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Click "New site from Git"
3. Connect your GitHub/GitLab repository
4. Select your NFTSol repository

## Step 2: Configure Build Settings

In Netlify, set these build settings:

- **Build command**: `npm run build:netlify`
- **Publish directory**: `dist/public`
- **Node version**: `18`

## Step 3: Set Environment Variables

Go to Site Settings > Environment Variables and add these variables:

### Required Variables
```
NODE_ENV=production
VITE_API_BASE_URL=https://your-backend-domain.com
VITE_WS_URL=wss://your-backend-domain.com
VITE_SOLANA_NETWORK=mainnet-beta
VITE_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
VITE_REWARDS_VAULT_PROGRAM_ID=your-program-id
VITE_STAKING_PROGRAM_ID=your-program-id
VITE_ESCROW_PROGRAM_ID=your-program-id
VITE_LOYALTY_PROGRAM_ID=your-program-id
VITE_CLOUT_TOKEN_MINT=your-token-mint
```

### Optional Variables
```
VITE_HELIUS_API_KEY=your-helius-key
VITE_MORALIS_API_KEY=your-moralis-key
VITE_MAGIC_EDEN_API_KEY=your-magic-eden-key
VITE_SENTRY_DSN=your-sentry-dsn
VITE_GOOGLE_ANALYTICS_ID=your-ga-id
```

## Step 4: Configure Custom Domain

1. In Netlify Dashboard, go to Site Settings > Domain Management
2. Add your custom domain
3. Configure DNS records as instructed by Netlify
4. Enable HTTPS (automatic with Netlify)

## Step 5: Backend Configuration

Since Netlify is for static sites, you'll need to deploy your backend separately:

### Option A: Deploy Backend to Netlify Functions
- Move your server code to `netlify/functions/`
- Update API calls to use relative paths

### Option B: Deploy Backend to Separate Service
- Deploy to Railway, Render, or similar
- Update `VITE_API_BASE_URL` to point to your backend
- Configure CORS on your backend to allow your Netlify domain

## Step 6: Update Redirects

Update `client/public/_redirects` with your actual backend URL:

```
/api/*  https://your-actual-backend-domain.com/api/:splat  200
/*    /index.html   200
```

## Step 7: Deploy

1. Push your changes to your repository
2. Netlify will automatically build and deploy
3. Check the deploy logs for any errors
4. Test your site on your custom domain

## Step 8: Post-Deployment Checklist

- [ ] Site loads correctly on your custom domain
- [ ] All pages route properly (SPA routing works)
- [ ] API calls work (if using separate backend)
- [ ] Solana wallet connections work
- [ ] CLOUT token interactions work
- [ ] All environment variables are set correctly
- [ ] HTTPS is enabled and working
- [ ] Analytics tracking is working (if configured)

## Troubleshooting

### Build Failures
- Check Node.js version (should be 18)
- Verify all dependencies are in package.json
- Check build logs for specific errors

### API Issues
- Verify backend CORS settings
- Check API base URL configuration
- Test API endpoints directly

### Solana Connection Issues
- Verify RPC URL is accessible
- Check program IDs are correct
- Ensure wallet adapter is configured properly

### Domain Issues
- Verify DNS records are correct
- Check SSL certificate status
- Ensure domain is properly configured in Netlify

## Performance Optimization

1. Enable Netlify's CDN
2. Configure caching headers (already set in netlify.toml)
3. Use Netlify's image optimization
4. Enable compression
5. Monitor performance with Netlify Analytics

## Security Considerations

1. Never commit API keys to your repository
2. Use environment variables for all sensitive data
3. Enable security headers (configured in netlify.toml)
4. Regularly update dependencies
5. Monitor for security vulnerabilities

## Support

If you encounter issues:
1. Check Netlify's deployment logs
2. Verify all environment variables are set
3. Test locally with production environment variables
4. Check browser console for client-side errors
5. Verify backend connectivity

Your NFTSol platform should now be live on your custom Netlify domain! 🚀
