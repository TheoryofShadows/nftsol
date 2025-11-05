# Irys Usage Guide - When & Why

## Overview
Irys (formerly Bundlr) is used for **permanent, decentralized storage** of NFT metadata on **Arweave blockchain**. It's the standard for Solana NFT metadata storage.

## When Irys is Required

### ✅ **Required For:**
1. **NFT Metadata Storage** (Standard Solana NFTs)
   - All NFT metadata JSON files
   - Image references and attributes
   - Used by Metaplex standard
   - **Size limit: 100KB** (free tier)

2. **Compressed NFT (cNFT) Metadata** (Bubblegum)
   - Metadata for compressed NFTs
   - Used in `bubblegumService-production.ts`
   - Used in `ultra-cheap-mint.ts` (UMI uploader)

3. **Video NFT Metadata** (Eternal Echoes)
   - Metadata JSON for video NFTs
   - Contains video URL, description, attributes
   - **NOT the video file itself** (use Pinata for videos)

### ❌ **NOT Used For:**
1. **Video Files** → Use **Pinata** (1GB free tier)
2. **Large Files** (>100KB) → Use **Pinata** or **Arweave directly**
3. **Images** → Usually stored separately (Pinata/IPFS), referenced in metadata

## Current Usage in Codebase

### 1. Standard NFT Minting
**File:** `apps/backend/src/services/bubblegumService-production.ts`
```typescript
// Upload metadata to Irys/Arweave using latest Irys SDK
const metadataResult = await uploadMetadata(metadata, {
  connection,
  keypair: platformKeypair,
  network: solanaConfig.cluster,
});
```
**When:** Every NFT mint via Bubblegum service
**What:** NFT metadata JSON (~5-10KB typically)

### 2. Ultra-Cheap Minting (UMI)
**File:** `apps/backend/src/services/ultra-cheap-mint.ts`
```typescript
// Add Irys uploader for metadata
this.umi.use(irysUploader());
```
**When:** Using UMI framework for minting
**What:** Metadata uploaded via UMI's built-in Irys uploader

### 3. Video NFT Metadata
**File:** `apps/backend/src/routes/video.ts`
```typescript
// 3. Upload metadata to Irys (free, under 100KB limit)
const metadataResult = await uploadMetadataToIrys(metadata, {
  connection,
  keypair,
  network: solanaConfig.cluster as 'mainnet-beta' | 'devnet',
});
```
**When:** After video is uploaded to Pinata
**What:** Metadata JSON containing:
- Video URL (Pinata IPFS link)
- Description
- Attributes
- Verification scores
- **Size:** Typically 1-5KB

## Architecture Decision: Why Irys for Metadata?

### ✅ **Benefits:**
1. **Permanent Storage** - Arweave is permanent (unlike IPFS which can lose data)
2. **Solana Standard** - Metaplex standard expects Arweave URIs
3. **Free Tier** - 100KB free storage (enough for metadata)
4. **Decentralized** - No single point of failure
5. **Solana Integration** - Native Solana wallet support

### ⚠️ **Limitations:**
1. **100KB Limit** (free tier) - Only for small metadata
2. **Cost** - Paid tier needed for larger files
3. **Speed** - Slower than Pinata for large uploads

## Storage Strategy

### Current Implementation:
```
┌─────────────────────────────────────────┐
│  NFT Creation Flow                      │
└─────────────────────────────────────────┘
         │
         ├─► Video File (100MB)
         │   └─► Pinata IPFS (1GB free)
         │
         ├─► Metadata JSON (<10KB)
         │   └─► Irys/Arweave (100KB free)
         │       └─► Contains: video URL, description, attributes
         │
         └─► NFT Mint
             └─► Points to: Irys metadata URI
```

### Why This Split?
- **Videos → Pinata**: Large files (100MB), need fast CDN, 1GB free tier
- **Metadata → Irys**: Small JSON files, need permanence, Solana standard

## Environment Setup

### Required Variables:
```env
# Irys uses Solana wallet for authentication
PLATFORM_SECRET_KEY_BASE58=...  # Your platform wallet
IRYS_WALLET_PRIVATE_KEY=...      # Same as PLATFORM_SECRET_KEY_BASE58 (for compatibility)

# Network configuration
SOLANA_CLUSTER=devnet  # or mainnet-beta
SOLANA_RPC_URL=https://api.devnet.solana.com
```

### Irys Funding:
- **Free tier**: 100KB uploads
- **Paid tier**: Larger uploads require SOL funding
- **Auto-funding**: Code checks balance and funds if needed

## When to Use Irys vs Pinata

| Use Case | Storage | Size | Why |
|----------|---------|------|-----|
| NFT Metadata JSON | Irys | <100KB | Permanent, Solana standard |
| Video Files | Pinata | Up to 1GB | Fast CDN, large files |
| Images | Pinata | Any size | Fast loading, CDN |
| Large Metadata (>100KB) | Pinata | >100KB | Irys limit exceeded |

## Code Examples

### Upload Metadata (Irys)
```typescript
import { uploadMetadataToIrys, createIrysNode } from '../utils/irysUpload';

const metadata = {
  name: 'My NFT',
  description: 'Description',
  image: 'https://ipfs.io/ipfs/...',
  attributes: [...]
};

const result = await uploadMetadataToIrys(metadata, {
  connection,
  keypair,
  network: 'devnet',
});

console.log('Metadata URI:', result.uri); // https://arweave.net/...
```

### Upload Video (Pinata)
```typescript
import { uploadToPinata } from '../utils/pinataUpload';

const videoCid = await uploadToPinata(videoBuffer, 'video.mp4');
const videoUrl = `https://gateway.pinata.cloud/ipfs/${videoCid}`;

// Then upload metadata (with video URL) to Irys
const metadata = {
  animation_url: videoUrl, // Pinata URL
  // ... other metadata
};
await uploadMetadataToIrys(metadata, options);
```

## Troubleshooting

### Error: "Metadata too large for Irys"
**Solution:** Use Pinata for metadata if >100KB
```typescript
// Check size before upload
const jsonSize = Buffer.byteLength(JSON.stringify(metadata), 'utf8');
if (jsonSize > 90_000) {
  // Use Pinata instead
  await uploadToPinata(metadataBuffer, 'metadata.json');
}
```

### Error: "Irys balance insufficient"
**Solution:** Fund Irys wallet
```typescript
import { fundIrys, checkIrysBalance } from '../utils/irysUpload';

const irys = await createIrysNode(options);
if (!await checkIrysBalance(irys)) {
  await fundIrys(irys, 0.1); // Fund 0.1 SOL
}
```

### Error: "Irys upload failed"
**Check:**
1. Network (devnet vs mainnet)
2. Wallet has SOL balance
3. RPC URL is correct
4. Metadata size < 100KB

## Summary

**Irys is required for:**
- ✅ NFT metadata (all NFTs)
- ✅ Compressed NFT metadata
- ✅ Video NFT metadata JSON
- ✅ Any metadata < 100KB

**Irys is NOT used for:**
- ❌ Video files (use Pinata)
- ❌ Large files (use Pinata)
- ❌ Images (use Pinata/IPFS)

**Rule of Thumb:**
- **Small JSON metadata** → Irys (permanent, standard)
- **Large files/videos** → Pinata (fast, CDN)

