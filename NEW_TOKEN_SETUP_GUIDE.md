# New CLOUT Token Setup Guide

## 🎯 Overview

This guide walks you through creating a new CLOUT token on Solana and configuring your application to use it.

## 📋 Prerequisites

Before you begin, ensure you have:

1. **Solana CLI Tools** installed
   ```bash
   # Install on Linux/Mac
   sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
   
   # On Windows (PowerShell)
   # Download from: https://github.com/solana-labs/solana/releases
   ```

2. **SPL Token CLI** installed
   ```bash
   cargo install spl-token-cli
   ```

3. **A funded Solana wallet** (at least 0.1 SOL for token creation and fees)
   ```bash
   # Create a new wallet or use existing
   solana-keygen new --outfile ~/my-solana-wallet.json
   
   # Set as default
   solana config set --keypair ~/my-solana-wallet.json
   
   # Check balance
   solana balance
   ```

4. **RPC endpoint configured** (mainnet-beta for production)
   ```bash
   # Use default mainnet RPC
   solana config set --url https://api.mainnet-beta.solana.com
   
   # Or use Helius (recommended for better performance)
   solana config set --url https://mainnet.helius-rpc.com/?api-key=YOUR_API_KEY
   ```

## 🚀 Step 1: Create New Token

### Option A: Using Our Script (Recommended)

```bash
# Make sure you're in the project root
cd /workspace

# Run the token creation script
bash scripts/create-new-clout-token.sh
```

This script will:
- ✅ Create a new SPL token mint
- ✅ Create a token account
- ✅ Mint initial supply (1 Billion CLOUT)
- ✅ Save token info to `NEW_TOKEN_INFO.md`
- ✅ Provide next steps

### Option B: Manual Creation

```bash
# 1. Create the token mint (9 decimals)
spl-token create-token --decimals 9 --url https://api.mainnet-beta.solana.com

# Output: Creating token <MINT_ADDRESS>
# Save this MINT_ADDRESS!

# 2. Create token account
spl-token create-account <MINT_ADDRESS> --url https://api.mainnet-beta.solana.com

# Output: Creating account <TOKEN_ACCOUNT>
# Save this TOKEN_ACCOUNT as your REWARDS_VAULT!

# 3. Mint initial supply (1 Billion = 1000000000)
spl-token mint <MINT_ADDRESS> 1000000000 --url https://api.mainnet-beta.solana.com
```

## 📝 Step 2: Save Token Information

After creation, you'll have three important addresses:

1. **MINT_ADDRESS** (CLOUT_MINT / CLOUT_PROGRAM_ID)
2. **TOKEN_ACCOUNT** (REWARDS_VAULT)
3. **OWNER_ADDRESS** (your wallet that owns the mint)

**Example:**
```
MINT_ADDRESS: ABC123...xyz (44 characters)
TOKEN_ACCOUNT: DEF456...uvw (44 characters)
OWNER_ADDRESS: GHI789...rst (44 characters)
```

⚠️ **SAVE THESE SECURELY** - You'll need them for configuration!

## 🔧 Step 3: Update Codebase

Run the update script with your new addresses:

```bash
node scripts/update-token-addresses.js <MINT_ADDRESS> <TOKEN_ACCOUNT> <OWNER_ADDRESS>
```

**Example:**
```bash
node scripts/update-token-addresses.js \
  ABC123DefG456HijK789LmnO012PqrS345TuvW678XyzA \
  DEF456GhiJ789KlmN012OpqR345StuV678WxyZ012AbcD \
  GHI789JklM012NopQ345RstU678VwxY012ZabC345DefG
```

This will update all configuration files, documentation, and source code with your new token addresses.

## 🌐 Step 4: Update Environment Variables

### Local Development (.env files)

Update your local environment files:

```bash
# /workspace/apps/backend/.env
CLOUT_MINT=<YOUR_MINT_ADDRESS>
CLOUT_PROGRAM_ID=<YOUR_MINT_ADDRESS>
REWARDS_VAULT=<YOUR_TOKEN_ACCOUNT>
```

### Render (Backend)

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Select your backend service
3. Go to "Environment" tab
4. Update these variables:
   ```
   CLOUT_MINT=<YOUR_MINT_ADDRESS>
   CLOUT_PROGRAM_ID=<YOUR_MINT_ADDRESS>
   REWARDS_VAULT=<YOUR_TOKEN_ACCOUNT>
   ```
5. Save changes (will trigger redeploy)

### Netlify (Frontend)

1. Go to [Netlify Dashboard](https://app.netlify.com/)
2. Select your site
3. Go to "Site settings" → "Environment variables"
4. Update:
   ```
   REACT_APP_CLOUT_MINT=<YOUR_MINT_ADDRESS>
   REACT_APP_CLOUT_PROGRAM_ID=<YOUR_MINT_ADDRESS>
   ```
5. Trigger redeploy: Deploys → Trigger deploy → Deploy site

## 🔐 Step 5: Security Considerations

### Option A: Keep Mint Authority (Flexible)

**Pros:**
- Can mint more tokens in the future
- Can adjust supply based on demand
- Flexibility for airdrops and rewards

**Cons:**
- Users need to trust you won't inflate supply
- Less decentralized

**Keep as-is** - Your wallet remains the mint authority.

### Option B: Renounce Mint Authority (Trustless)

**Pros:**
- Fixed supply forever - no inflation possible
- Increased trust and transparency
- More decentralized

**Cons:**
- Can NEVER mint more tokens
- Cannot fix mistakes

**To renounce:**
```bash
spl-token authorize <MINT_ADDRESS> mint --disable --url https://api.mainnet-beta.solana.com
```

⚠️ **WARNING**: This is PERMANENT and IRREVERSIBLE!

### Freeze Authority

Similarly, you can renounce freeze authority (recommended):
```bash
spl-token authorize <MINT_ADDRESS> freeze --disable --url https://api.mainnet-beta.solana.com
```

## 🎨 Step 6: Add Token Metadata (Recommended)

Use Metaplex to add proper token metadata (name, symbol, logo):

```bash
# Install Metaplex Sugar CLI
bash <(curl -sSf https://sugar.metaplex.com/install.sh)

# Create metadata
metaplex-sugar metadata create \
  --keypair ~/my-solana-wallet.json \
  --mint <MINT_ADDRESS> \
  --name "CLOUT" \
  --symbol "CLOUT" \
  --uri "https://your-domain.com/clout-metadata.json" \
  --rpc-url https://api.mainnet-beta.solana.com
```

You'll need to host a metadata JSON file:
```json
{
  "name": "CLOUT",
  "symbol": "CLOUT",
  "description": "Community CLOUT Token for NFTSol platform",
  "image": "https://your-domain.com/clout-logo.png",
  "external_url": "https://nftsol.app",
  "properties": {
    "category": "token"
  }
}
```

## ✅ Step 7: Verification

### 1. Check Token on Explorer

- **Solscan**: https://solscan.io/token/<MINT_ADDRESS>
- **Solana Explorer**: https://explorer.solana.com/address/<MINT_ADDRESS>

Verify:
- ✅ Supply matches (1,000,000,000 with 9 decimals)
- ✅ Decimals are correct (9)
- ✅ Mint authority status
- ✅ Freeze authority status

### 2. Test Locally

```bash
# Start backend
cd apps/backend
npm run dev

# Start frontend
cd client
npm start

# Test that CLOUT features work:
# - Rewards are tracked
# - Balances display correctly
# - Transactions work
```

### 3. Check Environment Variables

```bash
# Backend
curl http://localhost:3001/api/v1/health | jq '.programs'

# Should show your new token addresses
```

## 📊 Step 8: Token Distribution

Plan your token distribution according to your tokenomics:

```bash
# Example: Send tokens to treasury wallet
spl-token transfer <MINT_ADDRESS> 200000000 <TREASURY_ADDRESS> \
  --url https://api.mainnet-beta.solana.com

# Example: Send to marketing wallet
spl-token transfer <MINT_ADDRESS> 150000000 <MARKETING_ADDRESS> \
  --url https://api.mainnet-beta.solana.com
```

## 🚨 Troubleshooting

### "Account not found"
- Ensure wallet is funded with SOL
- Check RPC endpoint is correct
- Verify addresses are correct (44 characters, Base58)

### "Insufficient funds"
- Need at least 0.05 SOL for token creation
- Check: `solana balance`

### "Invalid mint address"
- Ensure you're using the MINT_ADDRESS, not TOKEN_ACCOUNT
- Addresses are case-sensitive

### Token not showing in wallet
- Some wallets need manual token import
- Use: Token Mint Address = <MINT_ADDRESS>
- Wait for blockchain confirmation (30 seconds)

## 📚 Additional Resources

- [Solana Token Program](https://spl.solana.com/token)
- [SPL Token CLI Guide](https://spl.solana.com/token#command-line-utility)
- [Metaplex Metadata](https://docs.metaplex.com/programs/token-metadata/)
- [Token Extensions](https://spl.solana.com/token-2022)

## 🎯 Checklist

- [ ] Prerequisites installed (Solana CLI, SPL Token CLI)
- [ ] Wallet funded with 0.1+ SOL
- [ ] Token created successfully
- [ ] Token addresses saved securely
- [ ] Codebase updated with new addresses
- [ ] Environment variables updated (Render, Netlify)
- [ ] Security decisions made (mint/freeze authority)
- [ ] Token metadata added
- [ ] Verified on blockchain explorer
- [ ] Tested locally
- [ ] Token distributed according to plan
- [ ] Documentation updated
- [ ] Team notified of new token

## 🎉 Success!

Your new CLOUT token is now live and configured! 

**Next steps:**
1. Monitor the token on blockchain explorers
2. Set up token tracking/analytics
3. Announce to community
4. Consider liquidity provision if needed
5. Implement additional features (staking, governance, etc.)

---

**Need help?** Check the troubleshooting section or review the blockchain explorer for your token.
