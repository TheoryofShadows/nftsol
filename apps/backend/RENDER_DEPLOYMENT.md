# 🚀 Render Deployment Configuration for apps/backend

## ✅ **VERIFIED CONFIGURATION**

### Build Settings (Render Dashboard):

**Root Directory:** `apps/backend`
**Build Command:** `npm install && npm run build`
**Start Command:** `npm start`

### What This Does:
1. `npm install` - Installs all dependencies
2. `npm run build` - Compiles TypeScript to JavaScript (outputs to `dist/`)
3. `npm start` - Runs `node dist/index.js`

---

## 📋 **REQUIRED ENVIRONMENT VARIABLES**

### Critical (Must Set):
```
DATABASE_URL=postgresql://user:pass@host:port/db
ALLOWED_ORIGINS=https://nftsol.app,https://www.nftsol.app
PLATFORM_SECRET_KEY_BASE58=your_base58_key_here
JWT_SECRET=your_jwt_secret_here
NODE_ENV=production
PORT=10000
```

### Important (Should Set):
```
SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
SOLANA_RPC_BACKUP=https://api.mainnet-beta.solana.com
ADMIN_WALLETS=wallet1,wallet2
CLOUT_MINT=your_clout_mint_address
CLOUT_PROGRAM_ID=your_clout_program_id
REWARDS_OWNER=your_rewards_wallet
```

### Optional (Nice to Have):
```
ERROR_TRACKING_URL=https://your-error-tracking.com
SENTRY_DSN=https://your-sentry-dsn
HELIUS_API_KEY=your_helius_key
```

### Withdrawal Settings (Optional):
```
WITHDRAWAL_AUTO_APPROVE_LAMPORTS=100000000
WITHDRAWAL_DAILY_LIMIT_LAMPORTS=5000000000
WITHDRAWAL_RATE_LIMIT_WINDOW_MS=900000
WITHDRAWAL_RATE_LIMIT_MAX=5
```

---

## 🔍 **TROUBLESHOOTING**

### If Server Won't Start:

1. **Check Build Logs:**
   - Look for TypeScript compilation errors
   - Check for missing dependencies
   - Verify `dist/index.js` is created

2. **Check Runtime Logs:**
   - Look for "Missing required environment variables" errors
   - Check database connection errors
   - Verify port is set correctly (Render uses PORT env var)

3. **Common Issues:**
   - ❌ Missing `DATABASE_URL` → Server won't start
   - ❌ Missing `ALLOWED_ORIGINS` in production → Server throws error
   - ❌ Wrong `PORT` → Server won't bind correctly
   - ❌ Database connection fails → App may start but API calls fail

### Health Check:
Once deployed, test:
- `https://your-app.onrender.com/healthz` - Basic health
- `https://your-app.onrender.com/api/health/detailed` - Detailed health

---

## 📝 **VERIFICATION CHECKLIST**

After deployment, verify:
- [ ] Server starts without errors
- [ ] Health check endpoint works
- [ ] Database connection successful
- [ ] CORS headers are correct
- [ ] API endpoints respond
- [ ] Environment variables are set

---

**Last Updated:** $(date)
**Server Path:** `apps/backend`
**Status:** ✅ Ready for deployment

