# 🚀 NFTSol Deployment Guide

## 📋 **Overview**

This guide provides step-by-step instructions for deploying NFTSol to staging and production environments using Render.com.

## ✅ **Pre-Deployment Checklist**

- [ ] All tests passing (100% core services)
- [ ] Environment variables configured
- [ ] Database connection strings set
- [ ] API keys obtained (Helius, Pinata, Irys)
- [ ] SSL certificates configured
- [ ] Monitoring tools set up
- [ ] Backup procedures documented

## 🏗️ **Architecture**

```
┌─────────────────┐
│   Frontend      │
│   (Netlify)     │
└────────┬────────┘
         │ HTTPS
         │
┌────────▼────────┐
│   Backend       │
│   (Render)      │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌──▼───┐
│  DB   │ │Redis │
│(Render)│ │(Redis)│
└───────┘ └──────┘
```

## 🎯 **Deploy to Staging**

### **1. Render.com Setup**

1. **Create Service**
   ```bash
   # Connect GitHub repository to Render
   # Go to https://dashboard.render.com
   # New -> Blueprint
   # Select repository: TheoryofShadows/nftsol
   # Select branch: develop
   ```

2. **Configure Backend Service**
   - **Name**: `nftsol-server-staging`
   - **Environment**: Node
   - **Root Directory**: `apps/backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Starter ($7/month)

3. **Environment Variables**
   ```env
   NODE_ENV=production
   SOLANA_CLUSTER=devnet
   PORT=3000
   LOG_LEVEL=info
   WS_ENABLED=true
   SENDER_ENABLED=true
   TIPS_ENABLED=true
   HELIUS_API_KEY=<your_helius_key>
   WEBHOOK_SECRET=<your_webhook_secret>
   ALLOWED_ORIGINS=https://staging.nftsol.app
   DATABASE_URL=<postgres_connection_string>
   CLOUT_MINT=4aHwytKbZnTJY5uNDSX75g2zChfYnC53GdNJHEZtwDPf
   CLOUT_TREASURY=J9msWkhEUPMLBXzkycwZjuU6B5vjfvNguASHLxJKAAfh
   CLOUT_FEE_COLLECTOR=5Gu3RnFApFEDmMJj5czHTFPRf6A5xNypSRPrqewmPLHW
   CLOUT_DEVELOPER=7pRUDnHS1y3b7EycVm7xtV2MgBArKFcAnFpdZCMPvLio
   ```

4. **Health Check**
   - Path: `/healthz`
   - Timeout: 10 seconds

### **2. Database Setup**

```bash
# Render PostgreSQL
1. Create PostgreSQL database in Render
2. Connect to database
3. Run migrations:
   cd apps/backend
   npm run db:migrate

# Or use existing database
# Copy connection string to DATABASE_URL
```

### **3. Redis Setup**

```bash
# Create Redis instance in Render
1. New -> Redis
2. Plan: Starter ($10/month)
3. Copy connection URL
4. Add to environment variables as REDIS_URL
```

### **4. Deploy Frontend**

```bash
# Netlify Setup
cd apps/frontend

# Build locally to test
npm run build

# Deploy to Netlify
# Method 1: Via CLI
npm install -g netlify-cli
netlify login
netlify deploy --prod

# Method 2: Via Netlify Dashboard
1. Go to https://app.netlify.com
2. New site from Git
3. Connect repository
4. Build settings:
   - Base directory: apps/frontend
   - Build command: npm run build
   - Publish directory: dist
```

### **5. Configure Frontend Environment**

```env
# Netlify Environment Variables
VITE_API_BASE=https://nftsol-server-staging.onrender.com
VITE_SOLANA_CLUSTER=devnet
VITE_WALLET_ADAPTER_NETWORK=devnet
```

### **6. Post-Deployment Testing**

```bash
# Test API Endpoints
curl https://nftsol-server-staging.onrender.com/healthz

# Test Frontend
open https://staging.nftsol.app

# Test NFT Minting
curl -X POST https://nftsol-server-staging.onrender.com/api/nft/mint \
  -H "Content-Type: application/json" \
  -d '{"name":"Test NFT","description":"Test","image":"https://example.com/image.png"}'

# Monitor Logs
# Go to Render dashboard -> Logs section
```

## 🚀 **Deploy to Production**

### **1. Prerequisites**

- [ ] Staging deployment successful
- [ ] All tests passing
- [ ] Security audit completed
- [ ] Performance testing completed
- [ ] Monitoring set up
- [ ] Backup procedures tested

### **2. Update Render Service**

1. **Modify Service for Production**
   - Change branch: `main` (instead of `develop`)
   - Update service name: `nftsol-server-prod`
   - Increase plan: Standard ($25/month) for better performance

2. **Production Environment Variables**
   ```env
   NODE_ENV=production
   SOLANA_CLUSTER=mainnet-beta  # CHANGE TO MAINNET
   PORT=3000
   LOG_LEVEL=info
   WS_ENABLED=true
   SENDER_ENABLED=true
   TIPS_ENABLED=true
   HELIUS_API_KEY=<production_helius_key>
   HELIUS_RPC_URL=<production_rpc_url>
   PINATA_API_KEY=<production_pinata_key>
   PINATA_SECRET_KEY=<production_pinata_secret>
   WEBHOOK_SECRET=<production_webhook_secret>
   ALLOWED_ORIGINS=https://nftsol.app,https://market.nftsol.app
   DATABASE_URL=<production_database_url>
   CLOUT_MINT=4aHwytKbZnTJY5uNDSX75g2zChfYnC53GdNJHEZtwDPf
   CLOUT_TREASURY=J9msWkhEUPMLBXzkycwZjuU6B5vjfvNguASHLxJKAAfh
   CLOUT_FEE_COLLECTOR=5Gu3RnFApFEDmMJj5czHTFPRf6A5xNypSRPrqewmPLHW
   CLOUT_DEVELOPER=7pRUDnHS1y3b7EycVm7xtV2MgBArKFcAnFpdZCMPvLio
   ```

3. **Production Database**
   - Use dedicated production PostgreSQL instance
   - Enable automated backups
   - Set up replication for high availability

4. **Deploy Backend**
   ```bash
   # Option 1: Auto-deploy from main branch
   # Render will auto-deploy on push to main
   
   # Option 2: Manual deploy
   git checkout main
   git push origin main
   # Render will detect changes and deploy
   ```

5. **Update Frontend**
   ```bash
   # Update frontend environment variables
   VITE_API_BASE=https://nftsol-server-prod.onrender.com
   
   # Deploy to production Netlify site
   netlify deploy --prod --dir=dist
   ```

### **3. DNS Configuration**

```bash
# Backend Domain
CNAME  api.nftsol.app  ->  nftsol-server-prod.onrender.com

# Frontend Domain  
CNAME  nftsol.app  ->  your-netlify-site.netlify.app
CNAME  www.nftsol.app  ->  your-netlify-site.netlify.app
```

### **4. SSL Certificates**

```bash
# Render handles SSL automatically
# Netlify handles SSL automatically via Let's Encrypt

# Verify SSL
curl https://nftsol.app
# Should return 200 OK with valid certificate
```

### **5. Post-Deployment Verification**

```bash
# 1. Health Check
curl https://api.nftsol.app/healthz

# 2. API Test
curl https://api.nftsol.app/api/nft/list

# 3. Frontend Test
open https://nftsol.app

# 4. Monitor Logs
# Render Dashboard -> Logs
# Watch for errors or warnings

# 5. Performance Test
# Use tools like Apache Bench or Artillery
ab -n 1000 -c 10 https://api.nftsol.app/healthz
```

## 📊 **Monitoring Setup**

### **1. Application Monitoring**

```bash
# Add Sentry for error tracking
1. Sign up at https://sentry.io
2. Create project for NFTSol
3. Add Sentry SDK to backend
   npm install @sentry/node @sentry/integrations
   
# Configure in index.ts
import * as Sentry from "@sentry/node";
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
});
```

### **2. Performance Monitoring**

```bash
# Add Performance Monitoring
# Integrate with DataDog or New Relic
# Track:
# - Response times
# - Error rates
# - Database query performance
# - API endpoint metrics
```

### **3. Uptime Monitoring**

```bash
# Use services like:
# - UptimeRobot (free tier available)
# - Pingdom
# - StatusCake

# Monitor endpoints:
# - https://api.nftsol.app/healthz
# - https://nftsol.app
# - Set alerts for downtime
```

### **4. Log Aggregation**

```bash
# Use services like:
# - Papertrail (easy integration with Render)
# - Loggly
# - Datadog Logs

# In Render:
1. Add Papertrail addon
2. Automatically sends logs to Papertrail
3. Search and analyze logs
```

## 🔄 **Rollback Procedures**

### **Rollback Backend**

```bash
# Option 1: Via Render Dashboard
1. Go to Render Dashboard
2. Select service
3. Deployments tab
4. Click on previous working deployment
5. Select "Restore"

# Option 2: Via Git
1. Revert commit
   git revert HEAD
   git push origin main
2. Render will auto-deploy previous version
```

### **Rollback Frontend**

```bash
# Via Netlify
1. Go to Netlify Dashboard
2. Select site
3. Deploys tab
4. Select previous deployment
5. Click "Publish deploy"
```

## 📈 **Performance Optimization**

### **1. Backend Optimization**

```bash
# Enable compression
# Already configured in backend

# Add caching headers
app.use((req, res, next) => {
  res.set('Cache-Control', 'public, max-age=3600');
  next();
});

# Optimize database queries
# Add indexes to frequently queried columns
```

### **2. Frontend Optimization**

```bash
# Build optimization
- Tree shaking
- Code splitting
- Lazy loading components
- Image optimization

# Already configured in vite.config.ts
```

### **3. CDN Configuration**

```bash
# Netlify provides CDN automatically
# No additional configuration needed

# For static assets:
# Consider Cloudflare for additional CDN
```

## 🔒 **Security Hardening**

### **1. Rate Limiting**

```bash
# Already implemented
# app.use(rateLimiter)

# Adjust limits for production:
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
```

### **2. Security Headers**

```bash
# Helmet already configured
# Verify security headers:
curl -I https://api.nftsol.app
# Should include:
# - X-Content-Type-Options: nosniff
# - X-Frame-Options: DENY
# - X-XSS-Protection: 1; mode=block
# - Strict-Transport-Security
```

### **3. Environment Secrets**

```bash
# Never commit secrets
# Use Render environment variables
# Rotate secrets regularly
# Use separate secrets for staging/production
```

## 📝 **Backup Procedures**

### **Database Backups**

```bash
# Render PostgreSQL provides automated backups
# Manual backup:
pg_dump $DATABASE_URL > backup.sql

# Restore:
psql $DATABASE_URL < backup.sql
```

### **Application Backups**

```bash
# Code is backed up in Git
# Configuration backed up in environment variables
# User data in database (covered above)
```

## 🎯 **Next Steps**

1. **Staging Deployment** - Test all features
2. **Production Deployment** - Go live
3. **Monitor Performance** - Track metrics
4. **Collect Feedback** - User testing
5. **Iterate** - Continuous improvement

---

**Status**: Ready for Deployment  
**Last Updated**: January 2025  
**Next Milestone**: Production Launch
