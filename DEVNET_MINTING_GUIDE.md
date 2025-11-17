# 🚀 NFTSol Devnet Minting Guide
**Get Your First NFT on Devnet Today!**

---

## 📋 Quick Start (5 minutes)

### Step 1: Get Your Devnet Wallet Ready
```bash
# Install Solana CLI (if not installed)
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Create or import your wallet
solana-keygen new --outfile ~/.config/solana/devnet-wallet.json

# Get your wallet address
solana address -k ~/.config/solana/devnet-wallet.json
# Copy this address - you'll need it!
```

### Step 2: Get Free Devnet SOL
```bash
# Request airdrop (get free SOL)
solana airdrop 2 <YOUR_WALLET_ADDRESS> --url devnet

# Check balance
solana balance <YOUR_WALLET_ADDRESS> --url devnet
# Should show: 2 SOL
```

### Step 3: Prepare Your NFT Image
- Upload image to **IPFS** (free options):
  - Pinata.cloud (easiest)
  - Nft.storage (free forever)
  - Lighthouse.storage
- Save the IPFS URL (looks like: `ipfs://QmXxxx...`)

### Step 4: Mint Your NFT

**Option A: Using curl (no code required)**
```bash
curl -X POST http://localhost:3001/api/mint/ultra-cheap \
  -H "Content-Type: application/json" \
  -d '{
    "toAddress": "YOUR_WALLET_ADDRESS",
    "name": "My Awesome NFT",
    "symbol": "MYNFT",
    "description": "My first NFT on Solana Devnet!",
    "imageUrl": "https://ipfs.io/ipfs/YOUR_IPFS_HASH"
  }'
```

**Option B: Using the minting script (easier)**
```bash
cd NFTSol
node scripts/mint-nft.js
```

**Option C: Using the Web UI (recommended)**
- Open http://localhost:5173
- Go to "Mint NFT" page
- Fill in details
- Click "Mint"
- Wait for confirmation

---

## 🎨 Full Minting Guide

### Prerequisites
- ✅ Node.js v25.2.0+
- ✅ npm 11.6.1+
- ✅ Solana CLI tools
- ✅ Devnet wallet with SOL
- ✅ IPFS image URL

### Step-by-Step Instructions

#### 1. Start the Backend Server
```bash
cd NFTSol
npm run dev
```
Wait for:
```
✅ Server running on http://localhost:3001
✅ WebSocket connected
✅ Database synced
```

#### 2. Start the Frontend (Optional - for UI)
Open another terminal:
```bash
cd NFTSol/client
npm run dev
```
Access: http://localhost:5173

#### 3. Upload Your Image to IPFS

**Using Pinata (Easiest)**:
1. Go to pinata.cloud
2. Sign up (free)
3. Upload your image
4. Copy the IPFS URL (pin it)
5. Format URL as: `https://ipfs.io/ipfs/<PIN_HASH>`

**Using NFT.Storage (Free Forever)**:
1. Go to nft.storage
2. Sign in with GitHub
3. Upload file
4. Copy URL: `ipfs://Qm...`

#### 4. Mint Your NFT

**Using API (cURL)**:
```bash
# Create a file: mint-request.json
{
  "toAddress": "YOUR_DEVNET_WALLET_ADDRESS",
  "name": "My First NFT",
  "symbol": "FIRST",
  "description": "Minted on NFTSol Devnet",
  "imageUrl": "https://ipfs.io/ipfs/QmYourHash",
  "externalUrl": "https://nftsol.app"
}

# Send the request
curl -X POST http://localhost:3001/api/mint/ultra-cheap \
  -H "Content-Type: application/json" \
  -d @mint-request.json
```

**Response (Success)**:
```json
{
  "success": true,
  "data": {
    "mintAddress": "9qL5VJcDvZ3... (your NFT mint address)",
    "signature": "5LWaM4wJ... (transaction signature)",
    "cost": 0.00234,
    "costUSD": 0.0001,
    "name": "My First NFT",
    "imageUrl": "https://ipfs.io/ipfs/..."
  },
  "message": "NFT minted for only $0.0001!"
}
```

#### 5. View Your NFT

**On Devnet Explorer**:
- Go to: https://explorer.solana.com
- Switch to **Devnet** (top dropdown)
- Paste your mint address
- View your NFT metadata!

**On Magic Eden (Devnet)**:
- Go to: https://devnet.magiceden.io
- Search for your wallet address
- See your newly minted NFT!

---

## 🛠️ Minting Script (Advanced)

Create `scripts/mint-nft.js`:

```javascript
const fetch = require('node-fetch');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise(resolve => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log('\n🚀 NFTSol Devnet NFT Minter\n');

  const walletAddress = await question('Enter your Devnet wallet address: ');
  const name = await question('NFT Name: ');
  const symbol = await question('NFT Symbol (e.g., MYNFT): ');
  const description = await question('Description: ');
  const imageUrl = await question('IPFS Image URL (https://ipfs.io/ipfs/...): ');

  console.log('\n⏳ Minting NFT...\n');

  try {
    const response = await fetch('http://localhost:3001/api/mint/ultra-cheap', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        toAddress: walletAddress,
        name,
        symbol,
        description,
        imageUrl,
      }),
    });

    const result = await response.json();

    if (result.success) {
      console.log('✅ NFT MINTED SUCCESSFULLY!\n');
      console.log(`Mint Address: ${result.data.mintAddress}`);
      console.log(`Transaction: ${result.data.signature}`);
      console.log(`Cost: ${result.data.costUSD} USD\n`);
      console.log(`View on Devnet: https://explorer.solana.com/address/${result.data.mintAddress}?cluster=devnet`);
    } else {
      console.log(`❌ Minting failed: ${result.error}`);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  rl.close();
}

main();
```

Run it:
```bash
node scripts/mint-nft.js
```

---

## 📱 Web UI Minting (Easiest!)

The frontend includes a minting page. To use it:

1. Start both servers:
```bash
# Terminal 1 - Backend
cd NFTSol
npm run dev

# Terminal 2 - Frontend
cd NFTSol/client
npm run dev
```

2. Open http://localhost:5173
3. Navigate to "Mint NFT" or "Create"
4. Fill in the form:
   - Wallet Address (your devnet wallet)
   - NFT Name
   - Description
   - Image URL (IPFS)
5. Click "Mint"
6. Wait for confirmation (30-60 seconds)
7. View on explorer when done!

---

## 🎯 API Endpoints

### Get Minting Cost Estimate
```bash
GET /api/mint/estimate

curl http://localhost:3001/api/mint/estimate

# Response:
{
  "success": true,
  "data": {
    "solCost": 0.00234,
    "usdCost": 0.0001,
    "network": "Solana"
  }
}
```

### Compare with Other Platforms
```bash
GET /api/mint/compare

curl http://localhost:3001/api/mint/compare

# Shows: NFTSol vs OpenSea vs Magic Eden vs Candy Machine
```

### Mint Ultra-Cheap NFT
```bash
POST /api/mint/ultra-cheap

curl -X POST http://localhost:3001/api/mint/ultra-cheap \
  -H "Content-Type: application/json" \
  -d '{
    "toAddress": "YOUR_ADDRESS",
    "name": "NFT Name",
    "symbol": "SYMBOL",
    "description": "Description",
    "imageUrl": "ipfs://or https://..."
  }'
```

---

## 🐛 Troubleshooting

### "Insufficient funds"
- Get more Devnet SOL: `solana airdrop 2 <address> --url devnet`
- Check balance: `solana balance <address> --url devnet`

### "Invalid image URL"
- Image must be accessible online (IPFS or HTTP)
- Test: Paste URL in browser, should load image
- Use IPFS gateway: `https://ipfs.io/ipfs/YOUR_HASH`

### "Wallet not found"
- Ensure wallet address is valid (44 characters, starts with letter)
- Check you're using Devnet address (not Mainnet)
- Get address: `solana address -k ~/.config/solana/devnet-wallet.json --url devnet`

### "Connection timeout"
- Check backend is running: `http://localhost:3001`
- See logs for errors
- Restart with: `npm run dev`

### "Invalid JSON"
- Check request body is valid JSON
- No trailing commas
- All strings in quotes

---

## 🔗 Useful Links

**Solana Devnet Resources**:
- Devnet Explorer: https://explorer.solana.com (select Devnet)
- Magic Eden Devnet: https://devnet.magiceden.io
- Solana Faucet: https://solfaucet.com (free SOL)
- Devnet Status: https://status.solana.com

**IPFS Image Hosting**:
- Pinata: https://pinata.cloud (easy UI)
- NFT.Storage: https://nft.storage (free forever)
- Lighthouse: https://lighthouse.storage
- Web3.Storage: https://web3.storage

**Documentation**:
- Metaplex: https://docs.metaplex.com
- Solana: https://docs.solana.com
- Umi: https://github.com/metaplex-foundation/umi

---

## 💰 Minting Costs

**On NFTSol (Ultra-Cheap)**:
- Per NFT: ~$0.0001 USD (0.0023 SOL)
- **Much cheaper** than other platforms!

**Comparison**:
| Platform | Cost | Notes |
|----------|------|-------|
| **NFTSol** | $0.0001 | ✅ Ultra-cheap |
| OpenSea | $1-5 | Storage + gas |
| Magic Eden | $0.5-2 | Marketplace fee |
| Candy Machine | $0.1-1 | Depends on config |

---

## ✅ Success Checklist

- [ ] Solana CLI installed
- [ ] Devnet wallet created
- [ ] Have 2+ SOL on devnet
- [ ] Image uploaded to IPFS
- [ ] Backend running (port 3001)
- [ ] Minted first NFT
- [ ] Can see NFT on explorer
- [ ] NFT shows in Magic Eden

---

## 🎉 You're Done!

Once you've minted your first NFT:

1. **Share it**: Post on Twitter/Discord with your explorer link
2. **Next steps**:
   - Create collections
   - Set royalties
   - List on marketplace
   - Implement gamification
3. **Scale up**: Mint more NFTs, build community

---

## 📞 Need Help?

- **Backend Issues**: Check logs with `npm run dev`
- **Wallet Issues**: See Solana CLI docs
- **Image Issues**: Test URL in browser first
- **API Issues**: Check request format (use examples above)

**Report bugs**: Create GitHub issue or DM @nftsol

---

**Happy Minting! 🎨✨**

*Built with ❤️ by NFTSol Team*
