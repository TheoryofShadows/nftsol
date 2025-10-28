# 🚀 NFTSol Render Environment Configuration

## **Required Environment Variables for Production**

### **Core Configuration**
```
NODE_ENV=production
PORT=3000
```

### **Database Configuration**
```
DATABASE_URL=postgresql://user:password@host:port/database
```

### **Solana Configuration**
```
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_CLUSTER=mainnet-beta
```

### **Platform Wallet (CRITICAL - Use Render Secrets)**
```
PLATFORM_WALLET_PUBLIC_KEY=YourPlatformPubKeyHere
PLATFORM_SECRET_KEY_BASE58=your_base58_encoded_private_key_here
```

### **Withdrawal System Configuration**
```
WITHDRAWALS_ENABLED=true
WITHDRAWALS_PAUSED=false
WITHDRAWAL_AUTO_APPROVE_LAMPORTS=100000000
WITHDRAWAL_DAILY_LIMIT_LAMPORTS=5000000000
WITHDRAWAL_RATE_LIMIT_WINDOW_MS=900000
WITHDRAWAL_RATE_LIMIT_MAX=5
```

### **Emergency Controls**
```
MAX_SINGLE_WITHDRAWAL_LAMPORTS=10000000000
MAX_DAILY_PER_USER_LAMPORTS=50000000000
```

### **Security Configuration**
```
ALLOWED_ORIGINS=https://nftsol.app,https://www.nftsol.app
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

## **🔐 Security Notes**

1. **PLATFORM_SECRET_KEY_BASE58** - Store in Render Secrets, NOT environment variables
2. **DATABASE_URL** - Use Render's managed PostgreSQL
3. **All sensitive keys** - Use Render Secrets Manager

## **📋 Render Dashboard Setup Steps**

1. Go to your Render service dashboard
2. Navigate to "Environment" tab
3. Add each variable above
4. For sensitive data, use "Add Secret" instead of "Add Variable"
5. Click "Save Changes"
6. Click "Deploy latest commit" to apply changes

## **✅ Verification Commands**

After setting up, test these endpoints:
- `GET /healthz` - Should return healthy status
- `GET /api/programs` - Should return program configuration
- `GET /api/admin/emergency/status` - Should return system status
