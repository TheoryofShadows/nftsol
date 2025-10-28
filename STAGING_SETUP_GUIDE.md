# 🚀 NFTSol Staging Setup Guide

## 📋 Overview
This guide will walk you through setting up your NFTSol staging environment on Render.com.

## ✅ Prerequisites
- [ ] GitHub repository connected to Render
- [ ] Render.com account with billing set up
- [ ] API keys for Helius, Pinata, and Irys
- [ ] Domain names for staging (optional)

## 🎯 Step-by-Step Setup

### 1. 🗄️ Create PostgreSQL Database

1. **Go to Render Dashboard**
   - Visit https://dashboard.render.com
   - Click "New +" → "PostgreSQL"

2. **Configure Database**
   - **Name**: `nftsol-staging-db`
   - **Database**: `nftsol_staging`
   - **User**: `nftsol_staging_user`
   - **Plan**: Starter ($7/month)
   - **Region**: Choose closest to your users

3. **Save Connection Details**
   - Copy the **External Database URL**
   - Format: `postgresql://username:password@host:port/database`
   - You'll need this for the `DATABASE_URL` environment variable

### 2. 🔴 Create Redis Instance

1. **Create Redis Service**
   - Click "New +" → "Redis"
   - **Name**: `nftsol-staging-redis`
   - **Plan**: Starter ($10/month)
   - **Region**: Same as database

2. **Save Connection Details**
   - Copy the **Redis URL**
   - Format: `redis://username:password@host:port`
   - You'll need this for the `REDIS_URL` environment variable

### 3. 🚀 Deploy Backend Service

1. **Create Web Service**
   - Click "New +" → "Blueprint"
   - Connect your GitHub repository
   - Select the `develop` branch

2. **Configure Service**
   - **Name**: `nftsol-server-staging`
   - **Root Directory**: `apps/backend`
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Starter ($7/month)

3. **Set Environment Variables**
   ```
   # Core Configuration
   NODE_ENV=production
   SOLANA_CLUSTER=devnet
   PORT=3000
   LOG_LEVEL=info
   
   # Database & Cache
   DATABASE_URL=<your_postgres_url_from_step_1>
   REDIS_URL=<your_redis_url_from_step_2>
   
   # Security
   SESSION_SECRET=<generate_random_32_char_string>
   JWT_SECRET=<generate_random_64_char_string>
   BCRYPT_ROUNDS=10
   
   # Solana Configuration
   HELIUS_API_KEY=<your_helius_api_key>
   BUBBLEGUM_PRIVATE_KEY=<your_bubblegum_private_key>
   IRYS_WALLET_PRIVATE_KEY=<your_irys_wallet_private_key>
   
   # CORS & Origins
   ALLOWED_ORIGINS=https://staging.nftsol.app,https://staging.market.nftsol.app
   
   # Features
   WS_ENABLED=true
   SENDER_ENABLED=true
   TIPS_ENABLED=true
   ENABLE_MONITORING=true
   LOG_REQUESTS=true
   
   # File Upload
   MAX_FILE_SIZE=50MB
   UPLOAD_DIR=./uploads
   
   # Security Headers
   SECURE_COOKIES=false
   TRUST_PROXY=true
   RATE_LIMITING_ENABLED=true
   HELMET_ENABLED=true
   
   # Clout Token Configuration
   CLOUT_MINT=4aHwytKbZnTJY5uNDSX75g2zChfYnC53GdNJHEZtwDPf
   CLOUT_TREASURY=J9msWkhEUPMLBXzkycwZjuU6B5vjfvNguASHLxJKAAfh
   CLOUT_FEE_COLLECTOR=5Gu3RnFApFEDmMJj5czHTFPRf6A5xNypSRPrqewmPLHW
   CLOUT_DEVELOPER=7pRUDnHS1y3b7EycVm7xtV2MgBArKFcAnFpdZCMPvLio
   
   # Helius Configuration
   HELIUS_SENDER_URL=https://sender.helius-rpc.com/fast
   DEFAULT_TIP_LAMPORTS=1000000
   TIP_ACCOUNTS=4ACfpUFoaSD9bfPdeu6DBt89gB6ENTeHBXCAi87NhDEE,D2L6yPZ2FmmmTKPgzaMKdhu6EWZcTpLy1Vhx8uvZe7NZ,9bnz4RShgq1hAnLnZbP8kbgBg1kEmcJBYQq3gQbmnSta
   
   # Webhook (optional)
   WEBHOOK_SECRET=<your_webhook_secret>
   ```

4. **Deploy**
   - Click "Create Web Service"
   - Render will automatically build and deploy your service
   - Wait for deployment to complete (5-10 minutes)

### 4. 🌐 Configure Frontend for Staging

1. **Update Frontend Environment**
   - Go to `apps/frontend/.env` (or create it)
   - Add staging configuration:
   ```env
   VITE_API_BASE=https://nftsol-server-staging.onrender.com
   VITE_SOLANA_CLUSTER=devnet
   VITE_WALLET_ADAPTER_NETWORK=devnet
   VITE_WS_URL=wss://nftsol-server-staging.onrender.com
   ```

2. **Build and Test Frontend Locally**
   ```bash
   cd apps/frontend
   npm run build
   npm run preview
   ```

### 5. 🧪 Test Staging Deployment

1. **Health Check**
   ```bash
   curl https://nftsol-server-staging.onrender.com/healthz
   ```
   Should return: `{"status":"ok","timestamp":"..."}`

2. **API Test**
   ```bash
   curl https://nftsol-server-staging.onrender.com/api/nft/list
   ```

3. **WebSocket Test**
   ```bash
   # Test WebSocket connection
   wscat -c wss://nftsol-server-staging.onrender.com
   ```

### 6. 📊 Monitor Your Deployment

1. **View Logs**
   - Go to Render Dashboard
   - Select your service
   - Click "Logs" tab
   - Monitor for any errors or warnings

2. **Check Metrics**
   - Monitor CPU, Memory, and Response times
   - Set up alerts for high error rates

## 🔧 Troubleshooting

### Common Issues

1. **Build Failures**
   - Check that `apps/backend/package.json` exists
   - Verify all dependencies are listed
   - Check build logs for specific errors

2. **Database Connection Issues**
   - Verify `DATABASE_URL` is correct
   - Check database is running
   - Ensure IP whitelist includes Render's IPs

3. **Environment Variable Issues**
   - Double-check all required variables are set
   - Verify no typos in variable names
   - Check that secret values are properly escaped

4. **CORS Issues**
   - Verify `ALLOWED_ORIGINS` includes your frontend URL
   - Check that frontend is using correct API base URL

### Debug Commands

```bash
# Check service status
curl -I https://nftsol-server-staging.onrender.com

# Test specific endpoint
curl -X GET https://nftsol-server-staging.onrender.com/api/health

# Check WebSocket
wscat -c wss://nftsol-server-staging.onrender.com
```

## 🎯 Next Steps

1. **Set up Custom Domain** (optional)
   - Add CNAME record: `staging-api.nftsol.app` → `nftsol-server-staging.onrender.com`
   - Update `ALLOWED_ORIGINS` to include custom domain

2. **Configure Monitoring**
   - Set up Sentry for error tracking
   - Configure uptime monitoring
   - Set up log aggregation

3. **Prepare for Production**
   - Test all features thoroughly
   - Performance test the staging environment
   - Document any issues found

## 📞 Support

If you encounter issues:
1. Check the Render logs first
2. Verify all environment variables are set
3. Test locally to isolate issues
4. Check the NFTSol documentation

---

**Status**: Ready for Staging Deployment  
**Last Updated**: January 2025  
**Next Milestone**: Production Deployment
