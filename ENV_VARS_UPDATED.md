# Environment Variables - Updated for Ultra-Cheap Minting

## New Required Variables for Compressed NFTs

### Backend (.env)

Add these new environment variables to support UMI + Bubblegum compressed NFT minting:

```bash
# ========================================
# COMPRESSED NFT MINTING (NEW!)
# ========================================

# Optional: Reuse existing Merkle tree (saves 0.15 SOL per deployment)
# Leave empty on first run - the service will create a tree and log the address
# BUBBLEGUM_TREE_ADDRESS=

# Note: After first mint, check the logs for:
# "💡 Store this address to reuse: BUBBLEGUM_TREE_ADDRESS=<address>"
# Then add it to your .env file to reuse the tree for 16,384+ mints
```

## Complete Backend Environment Variables

```bash
# ========================================
# DATABASE
# ========================================
DATABASE_URL=postgresql://username:password@host:port/database

# ========================================
# SOLANA & HELIUS
# ========================================
SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_HELIUS_API_KEY
SOLANA_CLUSTER=mainnet-beta
HELIUS_API_KEY=YOUR_HELIUS_API_KEY

# ========================================
# CLOUT TOKEN
# ========================================
CLOUT_MINT=YOUR_CLOUT_TOKEN_MINT_ADDRESS
CLOUT_PROGRAM_ID=YOUR_CLOUT_PROGRAM_ID
REWARDS_VAULT=YOUR_REWARDS_VAULT_ADDRESS

# ========================================
# PLATFORM WALLET (CRITICAL!)
# ========================================
PLATFORM_SECRET_KEY_BASE58=YOUR_PLATFORM_WALLET_PRIVATE_KEY_BASE58

# ========================================
# AUTHENTICATION
# ========================================
JWT_SECRET=your-super-secret-jwt-key-change-this

# ========================================
# STORAGE (IPFS/PINATA)
# ========================================
PINATA_JWT=YOUR_PINATA_JWT_TOKEN
PINATA_SECRET_KEY=YOUR_PINATA_SECRET_KEY

# ========================================
# IRYS/ARWEAVE (For compressed NFT metadata)
# ========================================
# Optional: Custom Irys wallet (defaults to PLATFORM_SECRET_KEY_BASE58)
# IRYS_WALLET_PRIVATE_KEY=

# ========================================
# COMPRESSED NFT MINTING
# ========================================
# Optional: Reuse existing Merkle tree
# BUBBLEGUM_TREE_ADDRESS=

# ========================================
# SERVER
# ========================================
PORT=3001
NODE_ENV=production
```

## Frontend Environment Variables (No Changes)

The frontend `.env` remains the same:

```bash
VITE_API_BASE=https://your-backend.onrender.com
VITE_SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_HELIUS_API_KEY
VITE_SOLANA_CLUSTER=mainnet-beta
VITE_HELIUS_API_KEY=YOUR_HELIUS_API_KEY
VITE_GA_TRACKING_ID=G-680PM8QN21

# Build settings
CI=false
NPM_CONFIG_PRODUCTION=false
```

## Render Deployment Update

### New Environment Variable to Add

In your Render dashboard for the backend service, add:

**Key**: `BUBBLEGUM_TREE_ADDRESS`  
**Value**: Leave empty initially, then update after first deployment when the logs show the tree address

### Important Notes

1. **First Deployment**: 
   - The service will create a new Merkle tree (~0.15 SOL)
   - Check the logs for: `💡 Store this address to reuse: BUBBLEGUM_TREE_ADDRESS=<address>`
   - Copy that address and add it to Render's environment variables

2. **Subsequent Deployments**:
   - The service will reuse the existing tree (ultra-cheap mints!)
   - Each tree supports 16,384 compressed NFTs

3. **Multiple Trees**:
   - If you need more capacity, you can create additional trees
   - Store them in the database for rotation

## Funding the Platform Wallet

The platform wallet (`PLATFORM_SECRET_KEY_BASE58`) needs:

### Initial Funding
- **Tree Creation**: ~0.15 SOL (one-time per tree)
- **First 100 Mints**: ~0.01 SOL
- **Recommended**: Fund with 0.5-1 SOL to start

### Ongoing Costs
- **Per cNFT**: ~0.00001-0.0001 SOL
- **1000 mints**: ~0.01-0.1 SOL
- **Very affordable!**

## Verification Checklist

After adding the new environment variables:

- [ ] Backend has `PLATFORM_SECRET_KEY_BASE58` set
- [ ] Backend has `HELIUS_API_KEY` set
- [ ] Platform wallet is funded with 0.5+ SOL
- [ ] First mint creates Merkle tree successfully
- [ ] `BUBBLEGUM_TREE_ADDRESS` logged and saved
- [ ] Subsequent mints use existing tree (ultra-cheap!)
- [ ] Cost estimates show ~$0.0001-0.001 per mint
- [ ] Frontend displays cost comparison correctly

## Testing the Setup

### 1. Check Wallet Balance
```bash
solana balance <PLATFORM_WALLET_PUBLIC_KEY> --url mainnet-beta
```

### 2. Test Mint Endpoint
```bash
curl -X GET https://your-backend.onrender.com/api/mint/cost-estimate
```

Expected response:
```json
{
  "solCost": 0.00001,
  "usdCost": 0.0005
}
```

### 3. Test Actual Mint
```bash
curl -X POST https://your-backend.onrender.com/api/mint/nft \
  -H "Content-Type: application/json" \
  -d '{
    "toAddress": "YOUR_WALLET_ADDRESS",
    "name": "Test cNFT",
    "symbol": "TEST",
    "imageUrl": "https://arweave.net/test-image",
    "description": "Testing ultra-cheap minting"
  }'
```

### 4. Check Logs
Look for:
```
[UltraCheapMint] ✅ New Merkle tree created: <address>
[UltraCheapMint] 💡 Store this address to reuse: BUBBLEGUM_TREE_ADDRESS=<address>
```

## Cost Savings Example

| Mints | Traditional NFT | Compressed NFT | Savings |
|-------|-----------------|----------------|---------|
| 1 | $0.20 | $0.150 (tree) | -25% (initial) |
| 10 | $2.00 | $0.16 | 92% |
| 100 | $20.00 | $0.25 | 98.75% |
| 1,000 | $200.00 | $1.50 | 99.25% |
| 10,000 | $2,000.00 | $15.00 | 99.25% |

**The more you mint, the cheaper it gets!**

## Support

If you encounter issues:

1. Check wallet balance: `solana balance <address> --url mainnet-beta`
2. Verify Helius RPC: `curl https://mainnet.helius-rpc.com/?api-key=YOUR_KEY`
3. Review backend logs in Render dashboard
4. Check `ULTRA_CHEAP_MINTING.md` for detailed troubleshooting

---

**🚀 You're now ready for ultra-cheap NFT minting!**

