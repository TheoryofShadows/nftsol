# Render Environment Variables for Production

## Required Environment Variables

### Database
```
DATABASE_URL=postgresql://user:password@host:port/database
```

### Solana Configuration
```
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
PLATFORM_SECRET_KEY_BASE58=your_base58_encoded_secret_key_here
```

### Withdrawal Settings
```
WITHDRAWAL_AUTO_APPROVE_LAMPORTS=100000000
WITHDRAWAL_DAILY_LIMIT_LAMPORTS=5000000000
WITHDRAWAL_RATE_LIMIT_WINDOW_MS=900000
WITHDRAWAL_RATE_LIMIT_MAX=5
```

### Emergency Controls
```
WITHDRAWALS_PAUSED=false
MAX_SINGLE_WITHDRAWAL_LAMPORTS=10000000000
MAX_DAILY_PER_USER_LAMPORTS=50000000000
```

## Security Notes
- Store PLATFORM_SECRET_KEY_BASE58 in Render Secrets (not environment variables)
- Use strong admin authentication
- Enable IP allowlist for admin endpoints
- Set up 2FA for admin access
