# Backend Environment Variables - Quick Reference

## 🔴 Required (Production)

```bash
# Core
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Solana
SOLANA_RPC_DEVNET=https://api.mainnet-beta.solana.com
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_CLUSTER=mainnet-beta

# Programs
CLOUT_PROGRAM_ID=62hWQAgAV4jugHSuZsMqzxZNVXaVLrbRpz3Sw58Z64Mw
MARKET_PROGRAM_ID=HTs1hErzM8MywaUojfUY7QA1T6gLQD977R3HsCnKj7m7
LOYALTY_PROGRAM_ID=2TujfT3Czd2ncawJ6ZLmfGeJ2t1Ugb9bqEvxSE2EKoo9
REWARDS_VAULT=2KkNwFZbznAtYX1xjVS6e5BBqQnfaBuTjn42G4zJXAps

# Security
JWT_SECRET=your-jwt-secret-key
SESSION_SECRET=your-session-secret
ALLOWED_ORIGINS=https://nftsol.app,https://www.nftsol.app

# Platform Wallet (one required)
PLATFORM_SECRET_KEY_BASE58=your_base58_key
# OR
PLATFORM_SECRET_KEY_JSON=[1,2,3,...]
```

## 🟡 Optional but Recommended

```bash
# Helius (better RPC)
HELIUS_API_KEY=your-helius-key
HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY

# Redis (for sessions/caching)
REDIS_URL=redis://localhost:6379

# Withdrawal Limits
WITHDRAWAL_AUTO_APPROVE_LAMPORTS=100000000      # 0.1 SOL
WITHDRAWAL_DAILY_LIMIT_LAMPORTS=5000000000     # 5 SOL
MAX_SINGLE_WITHDRAWAL_LAMPORTS=10000000000     # 10 SOL
MAX_DAILY_PER_USER_LAMPORTS=50000000000        # 50 SOL

# Rate Limiting
WITHDRAWAL_RATE_LIMIT_WINDOW_MS=900000         # 15 min
WITHDRAWAL_RATE_LIMIT_MAX=5

# Emergency Controls
WITHDRAWALS_PAUSED=false

# CORS (alternative to ALLOWED_ORIGINS)
CORS_ORIGINS=https://nftsol.app,https://www.nftsol.app
```

## 🟢 Optional Services

```bash
# AI/ML
XAI_API_KEY=your-xai-key
XAI_MODEL=grok-beta
GROK_MODE=heuristic
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_AI_TOKEN=your-ai-token

# FHE (Fully Homomorphic Encryption)
FHE_ENABLED=false
FHE_MOCK_MODE=true
FHE_NETWORK=devnet
FHE_PUBLIC_KEY=
FHE_PRIVATE_KEY=

# File Upload
MAX_FILE_SIZE=10MB
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,image/webp
UPLOAD_DIR=./uploads

# Logging
LOG_LEVEL=info
LOG_REQUESTS=true
ENABLE_MONITORING=true

# Security
BCRYPT_ROUNDS=12
SECURE_COOKIES=true
TRUST_PROXY=true
RATE_LIMITING_ENABLED=true
HELMET_ENABLED=true

# Other
WS_ENABLED=true
REWARDS_OWNER=wallet_address
PLATFORM_WALLET=wallet_address
```

## 📝 Environment-Specific Defaults

### Development Defaults (Auto-set if NODE_ENV !== 'production')

- `SOLANA_RPC_DEVNET`: `https://api.devnet.solana.com`
- `SOLANA_CLUSTER`: `devnet`
- `CLOUT_PROGRAM_ID`: `62hWQAgAV4jugHSuZsMqzxZNVXaVLrbRpz3Sw58Z64Mw`
- `MARKET_PROGRAM_ID`: `HTs1hErzM8MywaUojfUY7QA1T6gLQD977R3HsCnKj7m7`
- `LOYALTY_PROGRAM_ID`: `2TujfT3Czd2ncawJ6ZLmfGeJ2t1Ugb9bqEvxSE2EKoo9`
- `REWARDS_VAULT`: `2KkNwFZbznAtYX1xjVS6e5BBqQnfaBuTjn42G4zJXAps`
- `PORT`: `3000`
- `ALLOWED_ORIGINS`: `http://localhost:5173,http://localhost:3000`
- `BCRYPT_ROUNDS`: `10`
- `LOG_LEVEL`: `debug`

### Production Defaults

- `BCRYPT_ROUNDS`: `12`
- `LOG_LEVEL`: `info`
- `SECURE_COOKIES`: `true`
- `TRUST_PROXY`: `true`
- Database SSL: `true`

## 🔐 Security Notes

1. **Never commit** `.env` files to version control
2. **Use strong secrets** for `JWT_SECRET` and `SESSION_SECRET`
3. **Store platform keys** in secure secret management (not env files)
4. **Rotate keys** periodically
5. **Use HTTPS** in production
6. **Enable SSL** for database connections in production
7. **Restrict CORS** to only necessary origins

## 🚀 Quick Setup Commands

### Development
```bash
cp config/development/backend.env .env
# Edit .env with your values
npm run dev
```

### Production
```bash
# Set all required variables in your hosting platform
npm run build
npm start
```

## 📋 Validation Checklist

Before deploying to production, ensure:

- [ ] `NODE_ENV=production`
- [ ] `DATABASE_URL` is set and valid
- [ ] `JWT_SECRET` is set (strong random string)
- [ ] `SESSION_SECRET` is set (strong random string)
- [ ] `PLATFORM_SECRET_KEY_BASE58` or `PLATFORM_SECRET_KEY_JSON` is set
- [ ] `ALLOWED_ORIGINS` includes your production domain(s)
- [ ] `SOLANA_RPC_URL` points to mainnet or reliable RPC
- [ ] All program IDs are correct for your network
- [ ] Withdrawal limits are configured appropriately
- [ ] `REWARDS_VAULT` address is correct

---

**See `BACKEND-OVERVIEW.md` for complete documentation.**

