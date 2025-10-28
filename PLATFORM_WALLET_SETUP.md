# 💰 NFTSol Platform Wallet Setup Guide

## **🔑 Step 1: Generate Platform Wallet**

### **Option A: Generate New Wallet (Recommended)**
```bash
# Generate new keypair
solana-keygen new --outfile platform-wallet.json

# Get public key
solana-keygen pubkey platform-wallet.json

# Get private key in base58 format
solana-keygen pubkey platform-wallet.json --keypair platform-wallet.json
```

### **Option B: Use Existing Wallet**
```bash
# If you have an existing wallet
solana-keygen pubkey your-existing-wallet.json
```

## **💰 Step 2: Fund Platform Wallet**

### **For Devnet Testing (Start Here)**
```bash
# Set to devnet
solana config set --url https://api.devnet.solana.com

# Request airdrop (devnet only)
solana airdrop 2 <PLATFORM_WALLET_PUBLIC_KEY>

# Check balance
solana balance <PLATFORM_WALLET_PUBLIC_KEY>
```

### **For Mainnet (Production)**
```bash
# Set to mainnet
solana config set --url https://api.mainnet-beta.solana.com

# Transfer SOL from your main wallet to platform wallet
solana transfer <PLATFORM_WALLET_PUBLIC_KEY> 1.0 --from <YOUR_MAIN_WALLET>

# Check balance
solana balance <PLATFORM_WALLET_PUBLIC_KEY>
```

## **🔐 Step 3: Secure Key Storage**

### **Convert to Base58 Format**
```bash
# Convert JSON keypair to base58
node -e "
const fs = require('fs');
const bs58 = require('bs58');
const keypair = JSON.parse(fs.readFileSync('platform-wallet.json', 'utf8'));
console.log('Base58 Private Key:', bs58.encode(new Uint8Array(keypair)));
"
```

### **Store in Render Secrets**
1. Go to Render Dashboard → Your Service → Environment
2. Click "Add Secret"
3. Name: `PLATFORM_SECRET_KEY_BASE58`
4. Value: The base58 private key from above
5. Click "Save"

## **✅ Step 4: Verification**

### **Test Wallet Access**
```bash
# Test that you can access the wallet
solana balance <PLATFORM_WALLET_PUBLIC_KEY>
```

### **Test Small Transaction (Devnet)**
```bash
# Send small amount to test
solana transfer <TEST_WALLET_ADDRESS> 0.001 --from <PLATFORM_WALLET_PUBLIC_KEY>
```

## **⚠️ Security Best Practices**

1. **Never commit private keys to Git**
2. **Use Render Secrets for production**
3. **Keep backup of private key in secure location**
4. **Test on devnet before mainnet**
5. **Start with small amounts**

## **📊 Recommended Funding Amounts**

| Environment | Recommended SOL | Purpose |
|-------------|-----------------|---------|
| **Devnet** | 2-5 SOL | Testing and development |
| **Mainnet** | 10-50 SOL | Production operations |
| **High Volume** | 100+ SOL | Large-scale operations |

## **🔄 Monitoring Wallet Balance**

### **Set up Balance Monitoring**
```bash
# Create monitoring script
echo '#!/bin/bash
BALANCE=$(solana balance <PLATFORM_WALLET_PUBLIC_KEY> --url https://api.mainnet-beta.solana.com | grep -o "[0-9.]* SOL" | cut -d" " -f1)
if (( $(echo "$BALANCE < 1.0" | bc -l) )); then
    echo "WARNING: Platform wallet balance is low: $BALANCE SOL"
    # Add your alert mechanism here
fi' > monitor-balance.sh

chmod +x monitor-balance.sh
```

## **🎯 Next Steps**

1. ✅ Generate platform wallet
2. ✅ Fund with test SOL (devnet)
3. ✅ Configure in Render environment
4. ✅ Test withdrawal system
5. ✅ Fund for production (mainnet)
6. ✅ Set up monitoring
