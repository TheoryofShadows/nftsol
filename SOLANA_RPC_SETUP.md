# ⚡ Solana RPC Setup Guide

## Why You Need This
- **Free Public RPC**: Slow, rate-limited, unreliable for production
- **Premium RPC**: Fast, reliable, better for user experience

## Option 1: Free Public RPC (Start Here)
Add to Replit Secrets:
- **Key**: `VITE_SOLANA_RPC_URL`
- **Value**: `https://api.mainnet-beta.solana.com`

## Option 2: Alchemy (Recommended)
### Step 1: Create Account
1. Go to [alchemy.com](https://alchemy.com)
2. Sign up for free account

### Step 2: Create Solana App
1. Click "Create new app"
2. Chain: **Solana**
3. Network: **Solana Mainnet**
4. Name: **NFTSol Marketplace**

### Step 3: Get Your RPC URL
1. Click on your app
2. Copy the HTTPS URL (looks like):
   ```
   https://solana-mainnet.g.alchemy.com/v2/your-api-key
   ```

### Step 4: Add to Replit
- **Key**: `VITE_SOLANA_RPC_URL`
- **Value**: Your Alchemy URL

## Option 3: QuickNode (Alternative)
1. Go to [quicknode.com](https://quicknode.com)
2. Create account → Select Solana → Mainnet
3. Copy endpoint URL
4. Add as `VITE_SOLANA_RPC_URL`

## Option 4: Helius (Advanced)
1. Go to [helius.xyz](https://helius.xyz)
2. Create account → Create Solana RPC
3. Copy endpoint URL
4. Add as `VITE_SOLANA_RPC_URL`

## Free Tier Limits
- **Alchemy**: 300M compute units/month
- **QuickNode**: 50M credits/month  
- **Helius**: 100K requests/day

All perfect for starting your NFT marketplace!

## Test Your Setup
Once added, your wallet connections will be faster and more reliable.