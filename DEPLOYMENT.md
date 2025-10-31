# NFTSol Deployment Guide

**Version 1.0**  
**Last Updated:** October 2025

---

## Table of Contents

1. [Overview](#overview)
2. [Backend Deployment (Render)](#backend-deployment-render)
3. [Frontend Deployment (Netlify)](#frontend-deployment-netlify)
4. [Environment Variables](#environment-variables)
5. [Post-Deployment Verification](#post-deployment-verification)
6. [Troubleshooting](#troubleshooting)

---

## Overview

NFTSol is deployed as a two-tier application:
- **Backend**: Render (Node.js/Express API)
- **Frontend**: Netlify (React/Vite static site)

### Production URLs
- **Frontend**: https://nftsolmarket.netlify.app
- **Backend**: https://nftsol.onrender.com

---

## Backend Deployment (Render)

### Prerequisites
- Render account
- PostgreSQL database (Render managed or external)
- Solana wallet keys (keep secure!)

### Step 1: Create Render Service

1. Log in to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Select the repository: `TheoryofShadows/nftsol`

### Step 2: Configure Service Settings

**Name**: `nftsol-backend`  
**Region**: Choose closest to your users  
**Branch**: `develop` (or `main` for production)  
**Root Directory**: `apps/backend`

**Build Command**:
```bash
npm install && npm run build
```

**Start Command**:
```bash
npm start
```

### Step 3: Set Environment Variables

In Render dashboard → Environment tab, add these variables:

#### Required Variables
```bash
NODE_ENV=production
PORT=3000

# Solana Configuration
SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_HELIUS_KEY
SOLANA_CLUSTER=mainnet-beta

# CLOUT Token
CLOUT_PROGRAM_ID=62hWQAgAV4jugHSuZsMqzxZNVXaVLrbRpz3Sw58Z64Mw
REWARDS_VAULT=2KkNwFZbznAtYX1xjVS6e5BBqQnfaBuTjn42G4zJXAps

# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Security (Use Render Secrets)
PLATFORM_SECRET_KEY_BASE58=<your_base58_private_key>
JWT_SECRET=<generate_random_64_char_string>
SESSION_SECRET=<generate_random_64_char_string>
```

#### Optional Variables
```bash
HELIUS_API_KEY=your_helius_api_key
PINATA_JWT=your_pinata_jwt
ALLOWED_ORIGINS=https://nftsol.app,https://www.nftsol.app
LOG_LEVEL=info
```

**⚠️ Security Note**: Use Render's "Secrets" feature for sensitive values like `PLATFORM_SECRET_KEY_BASE58`, `JWT_SECRET`, and `SESSION_SECRET`. Do NOT use regular environment variables for these.

### Step 4: Deploy

1. Click "Create Web Service"
2. Render will automatically build and deploy
3. Wait for deployment to complete (5-10 minutes)
4. Note your service URL (e.g., `https://nftsol.onrender.com`)

### Step 5: Set Up PostgreSQL (if not already)

1. In Render dashboard, click "New +" → "PostgreSQL"
2. Configure database
3. Copy the `DATABASE_URL` connection string
4. Add it to your web service environment variables

---

## Frontend Deployment (Netlify)

### Prerequisites
- Netlify account
- Production backend URL

### Option A: Manual Deployment (Recommended for First Time)

#### Step 1: Build Frontend Locally

```bash
cd client

# Install dependencies
npm install

# Build for production
npm run build
```

This creates a `dist/` directory with production-ready files.

#### Step 2: Create Deployment Package

```bash
# Zip the dist folder
cd dist
zip -r ../netlify-deploy-$(date +%Y%m%d-%H%M%S).zip .
cd ..
```

#### Step 3: Upload to Netlify

1. Log in to [Netlify Dashboard](https://app.netlify.com)
2. Click "Add new site" → "Deploy manually"
3. Drag and drop your zip file
4. Wait for deployment to complete

#### Step 4: Configure Environment Variables

1. Go to Site settings → Environment variables
2. Add these variables:

```bash
VITE_API_BASE=https://nftsol.onrender.com
VITE_SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_HELIUS_KEY
VITE_SOLANA_CLUSTER=mainnet-beta
VITE_IMG_PROXY_BASE=https://nftsol.onrender.com
NODE_ENV=production
```

3. Trigger a new deployment after adding variables

### Option B: Continuous Deployment (Git-based)

#### Step 1: Connect Repository

1. In Netlify dashboard, click "Add new site" → "Import an existing project"
2. Connect to GitHub
3. Select repository: `TheoryofShadows/nftsol`

#### Step 2: Configure Build Settings

**Base directory**: `client`  
**Build command**: `npm run build`  
**Publish directory**: `client/dist`

#### Step 3: Set Environment Variables

Same as Option A, Step 4.

#### Step 4: Deploy

Netlify will automatically deploy on every push to the selected branch.

---

## Environment Variables

### Backend (Render) - Complete List

```bash
# Server Configuration
NODE_ENV=production
PORT=3000
TZ=UTC

# Solana Configuration
SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
SOLANA_CLUSTER=mainnet-beta

# CLOUT Token Configuration
CLOUT_PROGRAM_ID=62hWQAgAV4jugHSuZsMqzxZNVXaVLrbRpz3Sw58Z64Mw
REWARDS_VAULT=2KkNwFZbznAtYX1xjVS6e5BBqQnfaBuTjn42G4zJXAps
CLOUT_MINT=62hWQAgAV4jugHSuZsMqzxZNVXaVLrbRpz3Sw58Z64Mw

# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Security (USE RENDER SECRETS - NEVER EXPOSE THESE!)
PLATFORM_SECRET_KEY_BASE58=<your_base58_key>
JWT_SECRET=<random_64_char_string>
SESSION_SECRET=<random_64_char_string>

# Optional Services
HELIUS_API_KEY=your_helius_key
PINATA_JWT=your_pinata_jwt
PINATA_SECRET_KEY=your_pinata_secret

# CORS & Security
ALLOWED_ORIGINS=https://nftsol.app,https://www.nftsol.app

# Features
WS_ENABLED=true
SENDER_ENABLED=true
TIPS_ENABLED=true
ENABLE_MONITORING=true

# Logging
LOG_LEVEL=info
LOG_REQUESTS=true
```

### Frontend (Netlify) - Complete List

```bash
VITE_API_BASE=https://nftsol.onrender.com
VITE_SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
VITE_SOLANA_CLUSTER=mainnet-beta
VITE_IMG_PROXY_BASE=https://nftsol.onrender.com
NODE_ENV=production
```

**⚠️ Important**: 
- Replace `YOUR_KEY` with actual API keys
- Never commit these files to Git
- Use platform secret management features (Render Secrets, Netlify Environment Variables)

---

## Post-Deployment Verification

### Backend Health Check

```bash
curl https://nftsol.onrender.com/healthz
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-31T12:00:00Z"
}
```

### Test CLOUT Endpoints

```bash
# Test balance endpoint
curl https://nftsol.onrender.com/api/clout/balance/YOUR_WALLET_ADDRESS

# Test vault balance
curl https://nftsol.onrender.com/api/clout/vault-balance
```

### Test Frontend

1. Open https://nftsolmarket.netlify.app (or your Netlify URL)
2. Connect wallet
3. Verify CloutBadge appears
4. Test NFT browsing
5. Check console for errors

### Verification Checklist

- [ ] Backend health endpoint responds
- [ ] CLOUT endpoints return data
- [ ] Frontend loads without errors
- [ ] Wallet connection works
- [ ] CloutBadge displays correctly
- [ ] API calls succeed (check browser Network tab)
- [ ] No CORS errors in console

---

## Troubleshooting

### Backend Issues

#### Service Won't Start
- Check Render logs for errors
- Verify all required environment variables are set
- Ensure `DATABASE_URL` is correct
- Check `PLATFORM_SECRET_KEY_BASE58` is set as Secret

#### Database Connection Errors
- Verify `DATABASE_URL` format
- Check database is accessible from Render
- Ensure database is not paused (Render free tier)

#### Port Issues
- Render automatically assigns PORT
- Don't hardcode port numbers
- Use `process.env.PORT || 3000`

### Frontend Issues

#### Build Fails
- Check build logs in Netlify
- Verify all dependencies in `package.json`
- Ensure `NODE_VERSION` is set (if needed)

#### API Calls Fail
- Verify `VITE_API_BASE` is correct
- Check CORS configuration in backend
- Verify backend is running

#### Environment Variables Not Working
- Re-deploy after adding variables
- Check variable names start with `VITE_` (for Vite)
- Ensure no typos in variable names

### Common Solutions

#### Clear Build Cache
**Netlify:**
1. Site settings → Build & deploy → Clear cache and retry deploy

**Render:**
- Delete service and recreate, or
- Contact Render support

#### Check Logs
- **Render**: Dashboard → Logs tab
- **Netlify**: Site → Deploys → Click deploy → View logs

#### Verify Environment Variables
- Double-check all variable names
- Ensure no extra spaces
- Verify values are correct format

---

## Production Checklist

### Before Going Live

- [ ] All environment variables configured
- [ ] Backend health check passes
- [ ] Frontend loads correctly
- [ ] Wallet connection tested
- [ ] CLOUT token balance displays
- [ ] Database migrations run
- [ ] SSL certificates active (automatic on Render/Netlify)
- [ ] CORS properly configured
- [ ] Error monitoring set up
- [ ] Backup strategy in place

### Security Checklist

- [ ] All secrets stored in platform secret managers
- [ ] No secrets committed to Git
- [ ] `.env` files in `.gitignore`
- [ ] CORS restricted to production domains
- [ ] Rate limiting enabled
- [ ] Security headers configured
- [ ] Database credentials secured
- [ ] Wallet private keys secured

---

## Monitoring

### Health Monitoring

Set up uptime monitoring:
- **Render**: Built-in health checks
- **External**: Use services like UptimeRobot, Pingdom

### Error Tracking

Consider integrating:
- Sentry for error tracking
- LogRocket for session replay
- Custom logging to external service

### Performance Monitoring

- Monitor API response times
- Track database query performance
- Monitor Solana RPC usage
- Watch for rate limit issues

---

## Updates and Maintenance

### Updating Backend

1. Push changes to GitHub
2. Render auto-deploys (if CD enabled)
3. Or manually trigger deploy in Render dashboard
4. Monitor deployment logs

### Updating Frontend

1. Push changes to GitHub
2. Netlify auto-deploys (if CD enabled)
3. Or trigger manual deploy
4. Check build logs

### Database Migrations

Run migrations through backend:
```bash
# Add migration scripts to package.json
npm run migrate
```

---

## Support

- **GitHub Issues**: Report bugs and feature requests
- **Render Support**: [support.render.com](https://support.render.com)
- **Netlify Support**: [docs.netlify.com](https://docs.netlify.com)

---

**Last Updated:** October 2025  
**Maintained by:** NFTSol Development Team
