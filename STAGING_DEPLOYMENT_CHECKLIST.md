# ✅ NFTSol Staging Deployment Checklist

## 🎯 Pre-Deployment

- [x] ✅ Git branch switched to `develop`
- [x] ✅ `render.yaml` updated with correct `rootDir: apps/backend`
- [x] ✅ Environment variables added to `render.yaml`
- [x] ✅ Secrets generated for staging
- [ ] 🔄 Create PostgreSQL database on Render
- [ ] 🔄 Create Redis instance on Render
- [ ] 🔄 Deploy backend service to Render
- [ ] 🔄 Configure frontend for staging
- [ ] 🔄 Test staging deployment

## 🔐 Generated Secrets (Copy to Render)

```
SESSION_SECRET=150a27ea1094a55205e2fa4fc94fefeeccd4b14b335513db6b38261f11b192ed
JWT_SECRET=b287055c69891d0978913461ad179f3af218f0890d16b1c659a902854f849409bfd901dde00227deda7794d46965a8afda3be1dc229c16a84f4aa4c85e0be118
WEBHOOK_SECRET=50e8c48fb1da7eb6d8790d0f33f6bcf08900083c3ce398ed470e41ade05a7529
```

## 🗄️ Required Services

### PostgreSQL Database
- **Name**: `nftsol-staging-db`
- **Plan**: Starter ($7/month)
- **Copy DATABASE_URL** when created

### Redis Instance
- **Name**: `nftsol-staging-redis`
- **Plan**: Starter ($10/month)
- **Copy REDIS_URL** when created

### Backend Service
- **Name**: `nftsol-server-staging`
- **Root Directory**: `apps/backend`
- **Branch**: `develop`
- **Plan**: Starter ($7/month)

## 🔑 Required API Keys

- [ ] **HELIUS_API_KEY**: Get from https://helius.xyz
- [ ] **BUBBLEGUM_PRIVATE_KEY**: Your Solana wallet private key
- [ ] **IRYS_WALLET_PRIVATE_KEY**: Your Irys wallet private key

## 🧪 Testing Checklist

- [ ] Health check: `curl https://nftsol-server-staging.onrender.com/healthz`
- [ ] API test: `curl https://nftsol-server-staging.onrender.com/api/nft/list`
- [ ] WebSocket test: `wscat -c wss://nftsol-server-staging.onrender.com`
- [ ] Frontend loads correctly
- [ ] NFT minting works
- [ ] Database connections work
- [ ] Redis caching works

## 📊 Monitoring

- [ ] Check Render logs for errors
- [ ] Monitor CPU and memory usage
- [ ] Set up alerts for high error rates
- [ ] Verify all environment variables are set correctly

## 🚀 Quick Commands

```bash
# Test health endpoint
curl https://nftsol-server-staging.onrender.com/healthz

# Test API endpoint
curl https://nftsol-server-staging.onrender.com/api/nft/list

# Test WebSocket
wscat -c wss://nftsol-server-staging.onrender.com

# Check service status
curl -I https://nftsol-server-staging.onrender.com
```

## 📞 Next Steps

1. **Create services on Render** (PostgreSQL, Redis, Web Service)
2. **Set environment variables** using the generated secrets
3. **Deploy and test** the staging environment
4. **Configure frontend** to point to staging API
5. **Run comprehensive tests** to ensure everything works

---

**Status**: Ready to Deploy  
**Total Cost**: ~$24/month (PostgreSQL $7 + Redis $10 + Web Service $7)  
**Estimated Setup Time**: 30-45 minutes
