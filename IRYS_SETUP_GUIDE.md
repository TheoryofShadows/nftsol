# 🚀 Irys Setup Guide for NFTSol

This guide walks you through setting up Irys for permanent NFT metadata storage.

---

## 📋 What is Irys?

**Irys** = Permanent data storage on Arweave blockchain
- Upload once, store forever
- Immutable metadata
- Perfect for NFT metadata URIs
- Uses same keys as Ethereum/Solana

---

## Step 1: Install Irys Package

```bash
cd apps/backend
npm install @irys/js
```

---

## Step 2: Get Testnet Tokens (Optional for Testing)

Go to: https://testnet-faucet.irys.xyz/

This gives you test tokens to experiment without spending real money.

---

## Step 3: Create Irys Configuration File

Create file: `apps/backend/src/services/irys-client.ts`

```typescript
import IrysClient from "@irys/js";

interface IrysConfig {
  privateKey: string;
  network: "mainnet" | "testnet";
}

let irysClientInstance: IrysClient | null = null;

export async function initializeIrysClient(config: IrysConfig): Promise<IrysClient> {
  if (irysClientInstance) {
    return irysClientInstance;
  }

  try {
    // Network endpoints
    const rpcUrl = config.network === "testnet"
      ? "https://testnet-rpc.irys.xyz/v1"
      : "https://mainnet-rpc.irys.xyz/v1";

    console.log(`[Irys] Initializing on ${config.network}...`);

    // Create Irys client
    const irysClient = new IrysClient(rpcUrl);

    // Get your Irys address (same as Ethereum/Solana)
    const addresses = irysClient.account.getAddresses(config.privateKey);
    console.log(`[Irys] Address: ${addresses.irys}`);

    // Check balance
    const balanceInMIrys = await irysClient.account.getBalance(addresses.irys);
    const balanceInIrys = parseInt(balanceInMIrys.toString()) / 1_000_000_000; // Convert mIrys to Irys
    console.log(`[Irys] Balance: ${balanceInIrys} Irys`);

    irysClientInstance = irysClient;
    return irysClient;
  } catch (error) {
    console.error("[Irys] Initialization failed:", error);
    throw error;
  }
}

export async function uploadMetadataToIrys(metadata: any): Promise<string> {
  if (!irysClientInstance) {
    throw new Error("Irys client not initialized");
  }

  try {
    // Convert metadata to JSON
    const dataToUpload = JSON.stringify(metadata);

    // Create transaction
    const tx = irysClientInstance.createTransaction(dataToUpload);

    // Prepare chunks
    await tx.prepareChunks(Buffer.from(dataToUpload));

    // Get fee
    const fee = await tx.getFee();
    console.log(`[Irys] Upload fee: ${fee} mIrys`);

    // Check balance
    const balance = await irysClientInstance.account.getBalance(
      irysClientInstance.account.getAddresses(process.env.IRYS_WALLET_PRIVATE_KEY!).irys
    );

    if (parseInt(balance.toString()) < parseInt(fee.toString())) {
      throw new Error("Insufficient Irys balance for upload");
    }

    // Sign transaction
    const signedTx = await tx.sign(process.env.IRYS_WALLET_PRIVATE_KEY!);

    // Upload header
    await signedTx.uploadHeader();

    // Upload data
    await signedTx.uploadChunks(Buffer.from(dataToUpload));

    // Get the transaction ID (this is your metadata URI)
    const txId = signedTx.id;
    const metadataUri = `https://arweave.net/${txId}`;

    console.log(`[Irys] Metadata uploaded: ${metadataUri}`);
    return metadataUri;
  } catch (error) {
    console.error("[Irys] Upload failed:", error);
    throw error;
  }
}

export async function getIrysBalance(): Promise<number> {
  if (!irysClientInstance) {
    throw new Error("Irys client not initialized");
  }

  const addresses = irysClientInstance.account.getAddresses(
    process.env.IRYS_WALLET_PRIVATE_KEY!
  );
  const balance = await irysClientInstance.account.getBalance(addresses.irys);
  return parseInt(balance.toString()) / 1_000_000_000; // Convert to Irys
}
```

---

## Step 4: Add Irys to Backend Initialization

Update: `apps/backend/src/index.ts`

```typescript
import { initializeIrysClient } from './services/irys-client';

// In your server initialization
async function startServer() {
  try {
    // ... other initialization code ...

    // Initialize Irys if private key is provided
    if (process.env.IRYS_WALLET_PRIVATE_KEY) {
      await initializeIrysClient({
        privateKey: process.env.IRYS_WALLET_PRIVATE_KEY,
        network: process.env.SOLANA_CLUSTER === 'mainnet-beta' ? 'mainnet' : 'testnet',
      });
      console.log('✅ Irys initialized for permanent metadata storage');
    }

    // ... rest of initialization ...
  } catch (error) {
    console.error('Server initialization failed:', error);
    process.exit(1);
  }
}

startServer();
```

---

## Step 5: Update Environment Variables

Edit: `apps/backend/.env`

```bash
# Irys Configuration
IRYS_WALLET_PRIVATE_KEY=your_solana_or_ethereum_private_key_here
IRYS_NETWORK=testnet  # Use 'testnet' for testing, 'mainnet' for production

# Example (do NOT use these, generate your own):
# IRYS_WALLET_PRIVATE_KEY=5Ub...xyz (your actual private key as base58)
```

---

## Step 6: Use Irys in Minting Service

Update: `apps/backend/src/services/ultra-cheap-mint.ts`

```typescript
import { uploadMetadataToIrys } from './irys-client';

// In your uploadMetadata method
private async uploadMetadata(params: UltraCheapMintParams): Promise<string> {
  const metadata = {
    name: params.name,
    symbol: params.symbol || 'NFT',
    description: params.description || 'A compressed NFT',
    image: params.imageUrl,
    attributes: [
      { trait_type: 'Mint Type', value: 'Compressed NFT' },
      { trait_type: 'Minted At', value: new Date().toISOString() },
      ...(params.attributes || []),
    ],
    properties: {
      files: [
        {
          uri: params.imageUrl,
          type: 'image/png',
        },
      ],
      category: 'image',
    },
  };

  try {
    // Use Irys if available
    if (process.env.IRYS_WALLET_PRIVATE_KEY) {
      const uri = await uploadMetadataToIrys(metadata);
      console.log('[Mint] Metadata uploaded to Irys:', uri);
      return uri;
    } else {
      // Fallback to Irys uploader (in UMI)
      const uri = await this.umi.uploader.uploadJson(metadata);
      console.log('[Mint] Metadata uploaded via UMI:', uri);
      return uri;
    }
  } catch (error) {
    console.error('[Mint] Failed to upload metadata:', error);
    throw new Error(`Failed to upload metadata: ${error instanceof Error ? error.message : String(error)}`);
  }
}
```

---

## Step 7: Create Irys API Route (Optional)

Create: `apps/backend/src/routes/irys.ts`

```typescript
import { Router, Request, Response } from 'express';
import { getIrysBalance } from '../services/irys-client';

const router = Router();

/**
 * GET /api/irys/balance
 * Get current Irys balance
 */
router.get('/balance', async (_req: Request, res: Response) => {
  try {
    const balance = await getIrysBalance();
    res.json({
      success: true,
      data: {
        balance,
        currency: 'Irys',
        network: process.env.IRYS_NETWORK || 'testnet',
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get balance',
    });
  }
});

export default router;
```

---

## Step 8: Get Private Key for Irys

### Option A: Use Solana Private Key (Recommended for this project)

If using Solana key:
```bash
# You already have PLATFORM_SECRET_KEY_BASE58
# Use the same key for Irys:
IRYS_WALLET_PRIVATE_KEY=26iJ37BE...xyz  # Your Solana base58 key
```

### Option B: Generate New Ethereum Key

```bash
# Using ethers.js
const { ethers } = require('ethers');
const wallet = ethers.Wallet.createRandom();
console.log('Private Key:', wallet.privateKey);
console.log('Address:', wallet.address);
```

Then add to `.env`:
```bash
IRYS_WALLET_PRIVATE_KEY=0x...
```

---

## Testing Irys Setup

### Test 1: Check Irys Balance

```bash
curl http://localhost:3001/api/irys/balance
```

Expected response:
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

### Test 2: Mint with Irys Metadata

When you mint an NFT, the metadata will now be:
1. ✅ Stored on Arweave via Irys
2. ✅ Permanent and immutable
3. ✅ Accessible forever at `https://arweave.net/{txId}`

---

## Troubleshooting

### Issue: "Insufficient Irys balance"
**Solution:** Get testnet tokens from https://testnet-faucet.irys.xyz/

### Issue: "Invalid private key format"
**Solution:** Make sure the key is in correct format:
- Solana: base58 format (starts with digits/letters)
- Ethereum: hex format (starts with 0x)

### Issue: "Irys client not initialized"
**Solution:** Check that `IRYS_WALLET_PRIVATE_KEY` is set in `.env`

### Issue: "Cannot find module @irys/js"
**Solution:** Install it: `npm install @irys/js`

---

## 🎯 Summary

With Irys set up, your NFTs now have:
✅ **Permanent metadata** stored on Arweave
✅ **Immutable records** that last forever
✅ **Decentralized storage** (no single point of failure)
✅ **Cost-effective** metadata hosting

---

## 📊 Cost Breakdown

| Service | Cost |
|---------|------|
| Solana NFT Mint | $0.0001 |
| Irys Metadata Upload | <$0.01 |
| **Total per NFT** | **<$0.02** |

Still cheaper than competitors! 💎

---

## 🔗 Useful Links

- **Irys Docs:** https://docs.irys.xyz/
- **Arweave:** https://www.arweave.org/
- **Testnet Faucet:** https://testnet-faucet.irys.xyz/
- **Mainnet Info:** https://irys.xyz/

---

**Ready to set up?** Let me know when you've added the private key to `.env` and I'll help verify it's working! 🚀
