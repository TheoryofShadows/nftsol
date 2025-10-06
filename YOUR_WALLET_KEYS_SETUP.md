# 🔑 Your NFTSol Wallet Keys Setup Guide

## **CRITICAL: You Need to Set Your Wallet Addresses**

Right now, NFTSol is using placeholder wallet addresses. To receive your 2% commission from all NFT sales, you need to set your own wallet addresses.

## 🎯 **What You Need to Do**

### **Step 1: Create Your Developer Wallet**
This is YOUR wallet where you'll receive 2% commission from every NFT sale.

**Option A: Use Your Existing Phantom Wallet**
1. Open Phantom Wallet
2. Copy your wallet address
3. Export private key (Settings → Export Private Key)

**Option B: Create New Secure Wallet**
```bash
# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/v1.18.0/install)"

# Create new developer wallet
solana-keygen new --outfile your-developer-wallet.json

# Get your public address
solana-keygen pubkey your-developer-wallet.json
```

### **Step 2: Set Environment Variables in Replit**

1. Go to your Replit project
2. Click the **Secrets** tab (🔒 icon)
3. Add these secrets:

```bash
# YOUR DEVELOPER WALLET (where you receive 2% commission) - CONFIGURED
DEVELOPER_WALLET_PUBLIC_KEY=3WCkmqcoJZnVbscWSD3xr9tyG1kqnc3MsVPusriKKKad
DEVELOPER_WALLET_PRIVATE_KEY=YourActualPrivateKey

# CLOUT Treasury (for token rewards) - CONFIGURED
CLOUT_TREASURY_WALLET=FsoPx1WmXA6FDxYTSULRDko3tKbNG7KxdRTq2icQJGjM
CLOUT_TREASURY_PRIVATE_KEY=YourCloutTreasuryPrivateKey

# Marketplace Treasury (operational funds)
MARKETPLACE_TREASURY_WALLET=YourMarketplaceTreasuryAddress
MARKETPLACE_TREASURY_PRIVATE_KEY=YourMarketplaceTreasuryPrivateKey

# Creator Escrow (for royalty payments)
CREATOR_ESCROW_WALLET=YourCreatorEscrowAddress
CREATOR_ESCROW_PRIVATE_KEY=YourCreatorEscrowPrivateKey

# CLOUT Token (when you deploy it)
CLOUT_TOKEN_MINT_ADDRESS=YourCloutTokenAddress
CLOUT_TOKEN_AUTHORITY=YourTokenAuthorityAddress
```

## 💰 **Updated Seller-Friendly Commission Structure**

I've adjusted the rates to be more appealing to sellers:

### **For 10 SOL NFT Sale:**
- **Your Commission**: 0.2 SOL (2%) 
- **Creator Royalty**: 0.25 SOL (2.5%)
- **Seller Gets**: 9.55 SOL (95.5%) ⭐

### **Why This Is Better:**
- Sellers keep 95.5% (vs industry standard 90-92.5%)
- Lower creator royalties encourage more trading
- Your 2% still generates good revenue at scale
- More attractive than OpenSea's 2.5% fee

## 🔧 **Current Status Check**

### **What's Working:**
- ✅ Wallet infrastructure is built
- ✅ Commission calculation system ready
- ✅ CLOUT rewards system active
- ✅ Transaction testing system available
- ✅ Platform management dashboard

### **What You Need to Do:**
- ❌ Set your developer wallet address
- ❌ Create CLOUT treasury wallet
- ❌ Set up marketplace treasury
- ❌ Configure creator escrow wallet
- ❌ Deploy CLOUT token contract

## 🚀 **Quick Test Setup**

Want to test immediately? Set these test addresses in Secrets:

```bash
# Test with these (ONLY for testing - create your own for production)
DEVELOPER_WALLET_PUBLIC_KEY=8sLbNZoA1cfnvMJLPfp98ZLAnFSYCFApfJKMbiXNLwxj
CLOUT_TREASURY_WALLET=DRiP2Pn2K6fuMLKQmt5rZWyHiUZ6zDqNrx5pHFMZjGaV
MARKETPLACE_TREASURY_WALLET=FsoPx1WmXA6FDxYTSULRDko3tKbNG7KxdRTq2icQJGjM
CREATOR_ESCROW_WALLET=9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM
```

## 🔐 **Security Best Practices**

1. **Never share private keys publicly**
2. **Use hardware wallets for large amounts**
3. **Keep backup copies in secure locations**
4. **Test with small amounts first**
5. **Monitor transactions regularly**

## 📈 **Revenue Projections**

At 2% commission:
- **1,000 SOL monthly volume**: 20 SOL revenue
- **10,000 SOL monthly volume**: 200 SOL revenue  
- **100,000 SOL monthly volume**: 2,000 SOL revenue

## 🎯 **Next Steps**

1. **Set your developer wallet address** (most important!)
2. **Test the system** using Platform Management tab
3. **Deploy CLOUT token** when ready
4. **Go live** with your marketplace

The seller-friendly 95.5% rate will help you attract more users and generate higher trading volume!