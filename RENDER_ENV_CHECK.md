# 🔍 Render Environment Variables Check

## ✅ Variables You Already Have

All of these are correctly configured:

```bash
✅ ALLOWED_ORIGINS (CORS setup)
✅ DATABASE_URL (PostgreSQL connection)
✅ SOLANA_RPC_URL (Helius mainnet with API key)
✅ SOLANA_CLUSTER=mainnet-beta
✅ CLOUT_MINT
✅ CLOUT_PROGRAM_ID
✅ REWARDS_VAULT
✅ PLATFORM_PUBLIC_KEY
✅ PINATA_API_KEY
✅ NODE_ENV=production
✅ All CLOUT configuration (fees, treasury, etc.)
✅ All withdrawal limits and settings
```

## ⚠️ CRITICAL MISSING Variables

You **MUST** add these to Render for the system to work:

### 1. **PLATFORM_SECRET_KEY_BASE58** (CRITICAL!)
**Required for:**
- Ultra-cheap NFT minting
- Eternal Echoes creation
- CLOUT vault operations
- Withdrawals

**How to get it:**
```bash
# This is your platform wallet's private key in base58 format
# If you have it as a JSON array from Phantom/Solflare:
# Use this tool: https://tools.frcode.org/base58-converter
```

### 2. **JWT_SECRET**
**Required for:** Admin authentication

**Generate a secure random string:**
```bash
# Use any long random string (32+ characters)
# Example: openssl rand -hex 32
JWT_SECRET=your_super_secret_random_string_here_change_this_32chars
```

### 3. **HELIUS_API_KEY**
**Required for:** Grok verification, DAS API, marketplace browsing

**You have it in your RPC URL!** Extract it:
```bash
# From: https://mainnet.helius-rpc.com/?api-key=ea0ed024-cd7c-4338-8b9b-b6be4d004d36
HELIUS_API_KEY=ea0ed024-cd7c-4338-8b9b-b6be4d004d36
```

### 4. **PINATA_JWT**
**Required for:** IPFS uploads for NFT metadata

**Get from:** https://app.pinata.cloud/developers/api-keys
```bash
PINATA_JWT=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 5. **PINATA_SECRET_KEY** (Optional but recommended)
**Get from:** Same Pinata dashboard
```bash
PINATA_SECRET_KEY=your_pinata_secret_key
```

### 6. **IRYS_WALLET_PRIVATE_KEY** (Optional for Eternal Echoes)
**Required for:** Arweave uploads via Irys (permanent storage)

**Can use same as PLATFORM_SECRET_KEY_BASE58 or separate wallet**

### 7. **BUBBLEGUM_TREE_ADDRESS** (Optional, saves $)
**Required for:** Reusing Merkle tree for ultra-cheap minting

**Leave empty initially, add after first mint**
```bash
# After first mint, check logs for:
# "💡 Store this address to reuse: BUBBLEGUM_TREE_ADDRESS=<address>"
BUBBLEGUM_TREE_ADDRESS=
```

## 📋 Summary Checklist

### Before Deploying:
- [ ] Add `PLATFORM_SECRET_KEY_BASE58` (CRITICAL!)
- [ ] Add `JWT_SECRET`
- [ ] Add `HELIUS_API_KEY` (extract from RPC URL)
- [ ] Add `PINATA_JWT`
- [ ] Fund platform wallet with 0.5-1 SOL

### After First Successful Mint:
- [ ] Copy `BUBBLEGUM_TREE_ADDRESS` from logs
- [ ] Add it to Render environment variables
- [ ] Subsequent mints will be ultra-cheap!

## 🔐 Security Notes

1. **NEVER commit private keys to git**
2. **Use Render's secret/encrypted environment variables**
3. **Rotate JWT_SECRET periodically**
4. **Monitor platform wallet balance**

## 💰 Wallet Funding

Your platform wallet (`PLATFORM_SECRET_KEY_BASE58`) needs:

- **Initial**: 0.5-1 SOL
  - ~0.15 SOL for first Merkle tree creation
  - ~0.35 SOL for buffer + testing

- **Ongoing**: Very minimal
  - ~$0.0001-0.001 per compressed NFT mint
  - 1 SOL = ~10,000 mints!

## 🚀 Deployment Steps

1. **Add all CRITICAL variables to Render**
2. **Fund the platform wallet**
3. **Deploy/restart the service**
4. **Test a mint** (checks logs for tree address)
5. **Add BUBBLEGUM_TREE_ADDRESS** from logs
6. **Enjoy ultra-cheap minting!**

---

**Status: Ready to deploy once CRITICAL variables are added! 🎉**

