# NFT Minting Setup & Testing Guide

## Quick Start

### 1. Check Platform Wallet Status
```bash
cd apps/backend
npx ts-node check-funding.ts
```

This will show:
- Current wallet balance
- Minimum required SOL
- Funding instructions

### 2. Test Minting Setup
```bash
npx ts-node test-mint-setup.ts
```

This verifies:
- Platform keypair is configured
- Wallet has sufficient balance
- RPC connection is working
- All systems ready for minting

### 3. Test Mint an NFT
```bash
# On devnet (free test SOL)
npx ts-node test-mint.ts <wallet-address> "My Test NFT"

# On mainnet (requires real SOL)
SOLANA_CLUSTER=mainnet-beta SOLANA_RPC_URL=https://api.mainnet-beta.solana.com npx ts-node test-mint.ts <wallet-address> "My Mainnet NFT"
```

## Environment Variables

Required in `apps/backend/.env`:
```env
PLATFORM_SECRET_KEY_BASE58=your_base58_secret_key_here
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_CLUSTER=mainnet-beta
```

Or for devnet testing:
```env
PLATFORM_SECRET_KEY_BASE58=your_base58_secret_key_here
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_CLUSTER=devnet
```

## Platform Wallet Requirements

### Minimum Balance
- **0.02 SOL** - Minimum for 1 NFT mint
- **0.1 SOL** - Recommended for ~5 NFT mints

### Current Platform Wallet
- **Address**: `3XEs3MJ8PFiqTTqrK6RAkK9vt95jQQ1hKNNKHiE6jJ3o`
- **Devnet Balance**: 1.9852 SOL ✅
- **Mainnet Balance**: 0.0014 SOL ⚠️ (needs funding)

## Funding Instructions

### Devnet (Free Test SOL)
1. Visit https://faucet.solana.com/
2. Enter wallet address: `3XEs3MJ8PFiqTTqrK6RAkK9vt95jQQ1hKNNKHiE6jJ3o`
3. Select "Devnet"
4. Request airdrop

### Mainnet (Real SOL Required)
1. Send SOL from your wallet (Phantom, Solflare, etc.)
2. To address: `3XEs3MJ8PFiqTTqrK6RAkK9vt95jQQ1hKNNKHiE6jJ3o`
3. Send at least 0.1 SOL (recommended)
4. Wait ~30 seconds for confirmation

## API Endpoints

### Check Mint Status
```bash
GET /api/nfts/mint/status
```

Returns:
```json
{
  "success": true,
  "data": {
    "platformWallet": "3XEs3MJ8PFiqTTqrK6RAkK9vt95jQQ1hKNNKHiE6jJ3o",
    "balance": 1.9852,
    "balanceFormatted": "1.9852 SOL",
    "hasMinimumBalance": true,
    "rpcHealth": "ok",
    "rpcWorking": true,
    "rpcUrl": "https://api.mainnet-beta.solana.com",
    "network": "mainnet-beta",
    "canMint": true
  }
}
```

### Mint NFT
```bash
POST /api/nfts/mint
Content-Type: application/json

{
  "toAddress": "wallet-address-here",
  "name": "My NFT Name",
  "description": "NFT description",
  "imageUrl": "https://example.com/image.png"
}
```

## Troubleshooting

### Error: "PLATFORM_KEYPAIR or PLATFORM_SECRET_KEY_BASE58 env var missing"
- Set `PLATFORM_SECRET_KEY_BASE58` in your `.env` file

### Error: "Platform wallet has X SOL (need >= 0.02)"
- Fund the platform wallet (see funding instructions above)

### Error: "RPC connection failed"
- Check `SOLANA_RPC_URL` is correct
- Verify network connectivity
- Try a different RPC endpoint (Helius, QuickNode)

### Error: "Invalid wallet address"
- Ensure the recipient wallet address is valid
- Wallet must exist on the network (devnet/mainnet)

## Test Results

✅ **Devnet Minting**: Working perfectly!
- Successfully minted test NFT
- Mint Address: `D6ASYo3sKsRLc93RdVJe31Nwwzx13hNmBFaFj2Z7u8Jv`
- Transaction: `5DrKgGZWDVQ25fn43e7UyXgLbCPzK6FygCUyC1MCrvUBFmKPXhXnSr249kW519L1GsaXKFGPirnynYQSQPFqRTbn`

⚠️ **Mainnet Minting**: Ready, but needs funding
- Platform wallet has 0.0014 SOL
- Needs at least 0.02 SOL to mint
- Recommended: 0.1 SOL for multiple mints

## Next Steps

1. ✅ Code is working - minting functionality verified
2. ⏳ Fund platform wallet on mainnet (if using mainnet)
3. ✅ Test minting through API endpoint
4. ✅ Integrate with frontend mint form

