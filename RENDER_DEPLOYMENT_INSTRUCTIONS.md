# 🚀 NFTSol Backend - Render Deployment Instructions

## **📋 Environment Variables to Set in Render Dashboard**

Go to your Render service dashboard and add these environment variables:

### **Required Environment Variables:**
```
SOLANA_RPC_URL=https://api.devnet.solana.com
PLATFORM_SECRET_KEY_BASE58=57gPGZp3tgwnNAPK2GJxYE4kJpeHh75Vg95M4xRDaNswNe37Gv8PwPBX666sfcDgc4sijPRqw4jTyobuNa2ch15L
USE_MOCK=false
WITHDRAWALS_ENABLED=true
DAILY_WITHDRAWAL_LIMIT_SOL=5
MAX_WITHDRAWAL_SOL=1
RATE_LIMIT_WINDOW_MINUTES=15
RATE_LIMIT_MAX_REQUESTS=5
NODE_ENV=production
PORT=3000
```

### **Database Configuration:**
```
DATABASE_URL=your_postgresql_connection_string_here
```

## **🔧 Render Service Configuration**

### **Build Command:**
```bash
cd apps/backend && npm install && npm run build
```

### **Start Command:**
```bash
cd apps/backend && npm start
```

### **Root Directory:**
```
apps/backend
```

## **📊 Platform Wallet Information**

**Public Key:** `3EgKZgBNotS5tnYTaWuhEuzS9NLyMQww3C4Vaz5RDhM4`

**Next Steps:**
1. Fund this wallet with devnet SOL for testing
2. Test withdrawals to verify functionality
3. Switch to mainnet when ready for production

## **✅ Deployment Checklist**

- [ ] Environment variables set in Render
- [ ] Service deployed successfully
- [ ] Health endpoint responding: `/healthz`
- [ ] New NFT endpoints working: `/api/nfts/*`
- [ ] Withdrawal endpoints working: `/api/wallets/withdraw`
- [ ] Admin endpoints working: `/api/admin/withdrawals/*`
- [ ] Platform wallet funded with devnet SOL
- [ ] Test NFT minting works
- [ ] Test SOL withdrawal works

## **🧪 Testing Commands**

After deployment, test these endpoints:

```bash
# Health check
curl https://your-app.onrender.com/healthz

# Test wallet verification
curl https://your-app.onrender.com/api/nfts/verify/11111111111111111111111111111112

# Test programs endpoint
curl https://your-app.onrender.com/api/programs
```

## **🚨 Security Notes**

- Platform secret key is stored securely in Render secrets
- Never commit secret keys to GitHub
- Use devnet for testing, mainnet for production
- Monitor withdrawal limits and rate limiting
