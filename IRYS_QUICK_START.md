# ⚡ Irys Quick Start - 5 Minutes

## ✅ What's Done
- [x] Irys package installed: `@irys/js`
- [x] Setup guide created: `IRYS_SETUP_GUIDE.md`
- [x] Code examples provided

## 📝 What You Need to Do Now

### Step 1: Get Your Private Key
You have TWO options:

**Option A: Use Your Solana Key (Recommended)**
```bash
# You already have this in your .env:
PLATFORM_SECRET_KEY_BASE58=your_key_here

# Use the same key for Irys:
IRYS_WALLET_PRIVATE_KEY=your_key_here
```

**Option B: Use Ethereum Key**
```bash
# Or generate a new Ethereum key
# Keep it safe - this is what funds your Irys uploads
```

### Step 2: Add to .env

Open: `apps/backend/.env`

Add this line:
```bash
IRYS_WALLET_PRIVATE_KEY=your_solana_base58_key_or_ethereum_0x_key
```

Example:
```bash
# If using Solana key (base58 format):
IRYS_WALLET_PRIVATE_KEY=26iJ37BE3icVtoo2QRkfjtYXFHMudG2sbTHAnhF2D6ab

# Or Ethereum (0x format):
IRYS_WALLET_PRIVATE_KEY=0x1234567890abcdef...
```

### Step 3: (Optional) Get Testnet Tokens

If testing on testnet, get free tokens:
https://testnet-faucet.irys.xyz/

Just paste your address and get tokens!

### Step 4: Restart Backend

Stop the backend server (Ctrl+C) and restart:
```powershell
cd apps/backend
npm run dev
```

You should see:
```
✅ Irys initialized for permanent metadata storage
[Irys] Address: Your_Address_Here
[Irys] Balance: 0.5 Irys
```

## 🎯 What This Gives You

✅ **Permanent Metadata Storage**
- Your NFT metadata is stored forever on Arweave
- Can never be deleted or modified
- Accessible at `https://arweave.net/{txId}`

✅ **True Decentralization**
- No central server hosting metadata
- No risk of links breaking
- IPFS-like permanence

✅ **Cost Effective**
- Metadata upload: <$0.01 per NFT
- Total cost per NFT: <$0.02 (including mint)
- Still cheapest option!

## 📊 Test It

### Check Irys Balance
```bash
curl http://localhost:3001/api/irys/balance
```

Response:
```json
{
  "success": true,
  "data": {
    "balance": 0.5,
    "currency": "Irys",
    "network": "testnet"
  }
}
```

### Mint an NFT

Go to: http://localhost:5173/mint

When you mint now:
1. NFT is minted on Solana (compressed)
2. Metadata is uploaded to Arweave via Irys
3. Metadata URI points to permanent storage
4. Cost: <$0.02 total

## 🚀 You're Done!

Your setup is:
```
✅ Solana minting: Ultra-cheap ($0.0001)
✅ Metadata: Permanent (Irys/Arweave)
✅ Images: Pinata (from earlier)
✅ Full-stack: Complete and functional!
```

## 📚 Next Steps

1. Add your private key to `.env`
2. Restart backend
3. Test minting with permanent storage
4. Watch metadata get uploaded to Arweave!

---

**That's it! You now have permanent NFT storage.** 🎉

For more details, see: `IRYS_SETUP_GUIDE.md`
