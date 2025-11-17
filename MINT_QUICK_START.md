# ⚡ Mint Your First NFT - 10 Minute Quickstart

## 🎯 The Goal
Mint a real NFT on Solana Devnet in under 10 minutes, spending less than $0.01

---

## ✅ Checklist (Do these first)

- [ ] Solana CLI installed (`solana --version` should work)
- [ ] Have a Devnet wallet
- [ ] Have at least 2 SOL on Devnet
- [ ] NFTSol backend running (`npm run dev`)
- [ ] An image file ready to upload

---

## 🚀 Let's Go! (5 steps)

### Step 1: Get Free Devnet SOL (1 minute)

If you don't have a wallet yet:
```bash
solana-keygen new --outfile ~/.config/solana/my-devnet-wallet.json
solana address -k ~/.config/solana/my-devnet-wallet.json
```

Get your address, then request free SOL:
```bash
# Copy your wallet address from above and paste here
solana airdrop 2 YOUR_WALLET_ADDRESS --url devnet
```

Check you got it:
```bash
solana balance YOUR_WALLET_ADDRESS --url devnet
# Should say: 2 SOL
```

### Step 2: Upload Your Image (2 minutes)

**Easiest: Use NFT.Storage (free forever)**

1. Go to: https://nft.storage
2. Sign in with GitHub
3. Drag & drop your image
4. Wait for upload
5. Copy the link that says `ipfs://Qm...`
6. Convert to HTTP: Replace `ipfs://` with `https://ipfs.io/ipfs/`
   - Example: `https://ipfs.io/ipfs/QmYourHashHere`

**Alternative: Use Pinata**
1. Go to: https://pinata.cloud
2. Sign up (free)
3. Upload your image
4. Click "Pin it"
5. Copy IPFS Hash
6. Format as: `https://ipfs.io/ipfs/YOUR_HASH`

### Step 3: Start NFTSol Backend (if not running)

```bash
cd NFTSol
npm run dev
```

Wait for:
```
✅ Server running on http://localhost:3001
```

### Step 4: Mint Your NFT (2 minutes)

**Option A: Using the interactive script (easiest)**
```bash
node mint-nft-quick.js
```

Then answer the prompts:
- Wallet Address: Paste your devnet wallet
- NFT Name: Anything! ("My Cool NFT")
- Symbol: Optional, press Enter
- Description: Optional, press Enter
- Image URL: Paste your IPFS URL from Step 2

Done! Watch for success message.

**Option B: Using curl (if you know curl)**
```bash
curl -X POST http://localhost:3001/api/mint/ultra-cheap \
  -H "Content-Type: application/json" \
  -d '{
    "toAddress": "YOUR_WALLET_ADDRESS_HERE",
    "name": "My First NFT",
    "symbol": "FIRST",
    "description": "My first NFT on Solana!",
    "imageUrl": "https://ipfs.io/ipfs/QmYourHashHere"
  }'
```

### Step 5: View Your NFT (1 minute)

When successful, you'll get a **Mint Address**. Go to:

```
https://explorer.solana.com/address/MINT_ADDRESS_HERE?cluster=devnet
```

You should see:
- Your NFT's name
- Your image
- Metadata
- Transaction history

---

## 🎉 Success!

You now have a real NFT on Solana Devnet!

**What you can do next:**
- Share it with friends (send explorer link)
- Mint more NFTs
- Add it to Magic Eden (devnet)
- Create a collection
- List on marketplace

---

## ❓ Common Issues & Fixes

### "Insufficient funds"
```bash
solana airdrop 2 YOUR_ADDRESS --url devnet
```

### "Connection refused" (backend not running)
```bash
cd NFTSol && npm run dev
```

### "Invalid image URL"
- Test the URL in your browser first
- Make sure it's the full HTTP URL
- Should start with: `https://ipfs.io/ipfs/`

### "Wallet not found"
- Copy the exact address from `solana address -k ...`
- Make sure it's the **devnet** wallet
- Should be 44 characters long

### "Request timeout"
- Backend might be slow, wait 30 seconds
- Check backend logs with `npm run dev`
- Restart backend if needed

---

## 📚 Links You'll Need

**Your NFT**:
- Devnet Explorer: https://explorer.solana.com (select "Devnet" at top)
- Magic Eden Devnet: https://devnet.magiceden.io

**Image Hosting**:
- NFT.Storage: https://nft.storage (free)
- Pinata: https://pinata.cloud (easy UI)

**Free Devnet SOL**:
- Solana CLI: `solana airdrop`
- Solfaucet: https://solfaucet.com
- Devnet Faucet: https://faucet.solana.com

---

## 🆘 Still Stuck?

See the full guide: **DEVNET_MINTING_GUIDE.md**

Or check the API docs in: **apps/backend/src/routes/mint.ts**

---

**That's it! You're a Solana NFT creator now!** 🚀

*Questions? DM @nftsol or create an issue on GitHub*
