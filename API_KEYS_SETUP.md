# 🔑 API Keys Setup Guide for NFTSol

## Required API Keys

### 1. 🔐 JWT_SECRET
**Purpose**: Secure user authentication tokens
**How to get**: Generate a secure random string

```bash
# Generate a secure JWT secret (run in terminal)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Example**: `a1b2c3d4e5f6...` (64+ character random string)

### 2. 🐛 SENTRY_DSN  
**Purpose**: Error tracking and monitoring in production
**How to get**: 
1. Go to [sentry.io](https://sentry.io)
2. Create account or login
3. Create new project → Choose "Node.js"
4. Copy your DSN URL

**Example**: `https://abc123@o123456.ingest.sentry.io/123456`

### 3. 📊 GOOGLE_ANALYTICS_ID
**Purpose**: Track user analytics and behavior
**How to get**:
1. Go to [analytics.google.com](https://analytics.google.com)
2. Create account/property for your NFT marketplace
3. Get Measurement ID (starts with G-)

**Example**: `G-XXXXXXXXXX`

### 4. ⚡ SOLANA_RPC_URL
**Purpose**: Connect to Solana blockchain
**Options**:

**Free Public RPC** (slower):
- Mainnet: `https://api.mainnet-beta.solana.com`
- Devnet: `https://api.devnet.solana.com`

**Faster Premium RPC** (recommended):
- **Alchemy**: [alchemy.com](https://alchemy.com) → Create Solana app
- **QuickNode**: [quicknode.com](https://quicknode.com) → Get Solana endpoint
- **Helius**: [helius.xyz](https://helius.xyz) → Solana RPC

**Example**: `https://solana-mainnet.g.alchemy.com/v2/your-api-key`

## 🚀 Adding Keys to Replit

### Method 1: Replit Secrets (Recommended)
1. In your Replit workspace, click "Secrets" tab (lock icon)
2. Add each key:
   - Key: `JWT_SECRET` | Value: `your-generated-secret`
   - Key: `SENTRY_DSN` | Value: `your-sentry-dsn`
   - Key: `GOOGLE_ANALYTICS_ID` | Value: `your-ga-id`
   - Key: `SOLANA_RPC_URL` | Value: `your-solana-rpc`

### Method 2: Environment Variables
Add to your deployment environment:
```env
JWT_SECRET=your-generated-secret
SENTRY_DSN=your-sentry-dsn
VITE_GOOGLE_ANALYTICS_ID=your-ga-id
VITE_SOLANA_RPC_URL=your-solana-rpc
VITE_SOLANA_NETWORK=mainnet-beta
```

## ✅ Verification

Once you add the keys, you should see:
- **JWT_SECRET**: Login returns authentication tokens
- **SENTRY_DSN**: Errors are tracked in Sentry dashboard  
- **GOOGLE_ANALYTICS_ID**: Analytics appear in Google Analytics
- **SOLANA_RPC_URL**: Real wallet connections work

## 🔒 Security Notes

- **Never commit API keys to git**
- **Use Replit Secrets for development**
- **Use environment variables for production**
- **Regenerate JWT_SECRET if compromised**

## 📞 Support

If you need help getting any API keys:
1. **JWT_SECRET**: I can generate one for you
2. **Sentry**: Free tier available, I can guide setup
3. **Google Analytics**: Free service, I can help configure
4. **Solana RPC**: Public endpoints work, premium for better performance

Your NFTSol marketplace will work without these keys, but they enable:
- Secure user sessions (JWT)
- Production error monitoring (Sentry)
- User analytics (Google Analytics)  
- Real blockchain connectivity (Solana RPC)