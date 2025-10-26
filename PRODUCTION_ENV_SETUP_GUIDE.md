# 🚀 Production Environment Variables Setup Guide

## ✅ What Was Done

Updated `render.yaml` to include production API credentials that must be configured in the Render dashboard.

---

## 📋 Required Production Environment Variables

Your production deployment on Render requires these environment variables to be set:

### 🔑 **API Credentials** (Must Set in Render UI)

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `PINATA_API_KEY` | Production Pinata API key for IPFS storage | https://pinata.cloud → API Keys |
| `PINATA_SECRET_KEY` | Production Pinata secret key | https://pinata.cloud → API Keys |
| `HELIUS_API_KEY` | Production Helius API key for Solana RPC | https://helius.xyz → Get API Key |
| `HELIUS_RPC_URL` | Production Helius RPC endpoint | https://mainnet.helius-rpc.com/?api-key=YOUR_KEY |
| `WEBHOOK_SECRET` | Secret for webhook verification | Generate a secure random string |

---

## 🎯 How to Set Production Variables in Render

### Step 1: Access Render Dashboard
1. Go to https://dashboard.render.com
2. Sign in to your account
3. Navigate to your **nftsol-server-prod** service

### Step 2: Open Environment Variables Section
1. Click on **"nftsol-server-prod"** service
2. Click on **"Environment"** tab in the left sidebar

### Step 3: Add Production Credentials
Click **"Add Environment Variable"** and add each of these:

```
Variable Name: PINATA_API_KEY
Value: [Your production Pinata API key]
```

```
Variable Name: PINATA_SECRET_KEY
Value: [Your production Pinata secret key]
```

```
Variable Name: HELIUS_API_KEY
Value: [Your production Helius API key]
```

```
Variable Name: HELIUS_RPC_URL
Value: https://mainnet.helius-rpc.com/?api-key=[YOUR_KEY]
```

```
Variable Name: WEBHOOK_SECRET
Value: [Generate a secure random string]
```

### Step 4: Deploy
1. Click **"Save Changes"**
2. Render will automatically redeploy your service
3. Monitor the deployment in the "Events" tab

---

## 🔐 Security Best Practices

### ✅ DO:
- ✅ Use **separate production credentials** (don't reuse dev keys)
- ✅ Keep API keys **secret** (never commit to git)
- ✅ Use **strong secrets** (32+ characters for JWT and session)
- ✅ Rotate keys **regularly** (every 90 days recommended)
- ✅ Monitor usage in provider dashboards

### ❌ DON'T:
- ❌ Never commit `.env` files with real secrets
- ❌ Don't share API keys in screenshots or public forums
- ❌ Don't use the same keys for dev and production
- ❌ Don't store secrets in client-side code

---

## 🧪 Verify Production Configuration

After setting the environment variables, verify your production deployment:

### 1. Check Health Endpoint
```bash
curl https://nftsol-server-prod.onrender.com/health
```

Should return:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-14T..."
}
```

### 2. Check API Endpoints
```bash
# Test NFT fetching
curl https://nftsol-server-prod.onrender.com/api/nfts

# Test CLOUT info
curl https://nftsol-server-prod.onrender.com/api/clout/info
```

### 3. Check Service Logs
In Render dashboard → **"Logs"** tab, you should see:
```
✅ Redis connected successfully
✅ Environment validation passed
Server running on port 3000
```

---

## 📊 Development vs Production Comparison

| Configuration | Development (Local) | Production (Render) |
|---------------|---------------------|---------------------|
| **Solana Network** | devnet | mainnet-beta |
| **Database** | Local PostgreSQL | Render PostgreSQL |
| **IPFS** | Dev Pinata | Production Pinata |
| **Helius** | Dev Helius Key | Production Helius Key |
| **CORS** | localhost origins | Production domains |
| **Error Logging** | Full stack traces | Sanitized errors |

---

## 🚨 Troubleshooting

### Issue: "IPFS upload failed"
**Solution:** Verify `PINATA_API_KEY` and `PINATA_SECRET_KEY` are set correctly in Render

### Issue: "Helius RPC error"
**Solution:** Check `HELIUS_API_KEY` and `HELIUS_RPC_URL` in Render environment

### Issue: "Authentication failed"
**Solution:** Ensure `JWT_SECRET` and `SESSION_SECRET` are set (32+ characters)

### Issue: "Database connection failed"
**Solution:** Verify `DATABASE_URL` is correct and database is running

---

## 📝 Next Steps

1. ✅ **Set environment variables** in Render dashboard (above)
2. ✅ **Deploy** the updated configuration
3. ✅ **Test** production endpoints
4. ✅ **Monitor** logs for errors
5. ✅ **Update** frontend to use production API URL

---

## 🔗 Quick Links

- **Render Dashboard**: https://dashboard.render.com
- **Pinata Dashboard**: https://pinata.cloud
- **Helius Dashboard**: https://helius.xyz
- **Production API**: https://nftsol-server-prod.onrender.com
- **Health Check**: https://nftsol-server-prod.onrender.com/health

---

**Last Updated**: 2025-01-14  
**Status**: ✅ Configuration updated, waiting for Render environment variables to be set
