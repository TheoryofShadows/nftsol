# 🚀 Bubblegum v2 Developer Guide

## Overview

The Bubblegum v2 service enables mass compressed NFT (cNFT) drops with 99% cost reduction compared to traditional NFTs. This guide covers everything developers need to know to integrate and use the service.

## Table of Contents

- [Quick Start](#quick-start)
- [API Reference](#api-reference)
- [Service Architecture](#service-architecture)
- [Integration Examples](#integration-examples)
- [Error Handling](#error-handling)
- [Performance Optimization](#performance-optimization)
- [Testing](#testing)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## Quick Start

### 1. Installation

```bash
# Backend dependencies
npm install @metaplex-foundation/mpl-bubblegum@^5.0.2
npm install @solana/spl-account-compression@^0.4.1
npm install @metaplex-foundation/umi-uploader-irys
npm install @metaplex-foundation/digital-asset-standard-api
```

### 2. Environment Setup

```bash
# Add to your .env file
BUBBLEGUM_PRIVATE_KEY=your_base58_private_key_here
SOLANA_CLUSTER=devnet  # or mainnet-beta
```

### 3. Basic Usage

```typescript
import { BubblegumService } from './services/bubblegumService';
import { Connection, Keypair } from '@solana/web3.js';

// Initialize service
const connection = new Connection('https://api.devnet.solana.com');
const service = new BubblegumService(connection, 'https://api.devnet.solana.com');

// Set signer
const keypair = Keypair.fromSecretKey(/* your secret key */);
service.setSigner(keypair);

// Create tree
const treeResult = await service.createTree({
  maxDepth: 14,        // 16,384 NFTs capacity
  maxBufferSize: 64,
  canopyDepth: 0
});

// Mint compressed NFT
const mintResult = await service.createCompressedNFT({
  treeAddress: treeResult.treeAddress,
  metadata: {
    name: 'My cNFT',
    symbol: 'MCNFT',
    description: 'A compressed NFT',
    image: 'https://example.com/image.png'
  }
});
```

## API Reference

### Service Methods

#### `createTree(options: CreateTreeOptions)`

Creates a new Bubblegum tree for compressed NFTs.

**Parameters:**
- `maxDepth: number` - Tree depth (2^depth = capacity)
- `maxBufferSize: number` - Buffer size for concurrent operations
- `canopyDepth?: number` - Canopy depth for optimization

**Returns:**
```typescript
{
  treeAddress: PublicKey;
  signature: string;
}
```

**Example:**
```typescript
const tree = await service.createTree({
  maxDepth: 14,        // 16,384 NFTs
  maxBufferSize: 64,
  canopyDepth: 0
});
console.log(`Tree created: ${tree.treeAddress.toString()}`);
```

#### `createCompressedNFT(options: MintCompressedNFTOptions)`

Mints a single compressed NFT.

**Parameters:**
- `treeAddress: PublicKey` - Tree address
- `metadata: CompressedNFTMetadata` - NFT metadata
- `owner?: PublicKey` - Owner address (optional)
- `collectionMint?: PublicKey` - Collection mint (optional)

**Returns:**
```typescript
{
  assetId: PublicKey;
  signature: string;
}
```

**Example:**
```typescript
const nft = await service.createCompressedNFT({
  treeAddress: treeAddress,
  metadata: {
    name: 'Cool cNFT',
    symbol: 'COOL',
    description: 'A really cool compressed NFT',
    image: 'https://example.com/cool-image.png',
    attributes: [
      { trait_type: 'Rarity', value: 'Legendary' },
      { trait_type: 'Color', value: 'Blue' }
    ]
  }
});
```

#### `bulkMintCompressedNFTs(options: BulkMintOptions)`

Mints multiple compressed NFTs efficiently.

**Parameters:**
- `treeAddress: PublicKey` - Tree address
- `metadatas: CompressedNFTMetadata[]` - Array of metadata
- `owner?: PublicKey` - Owner address (optional)
- `batchSize?: number` - Batch size (default: 50)

**Returns:**
```typescript
{
  minted: number;
  signatures: string[];
  totalCost: number;
}
```

**Example:**
```typescript
const metadatas = Array(1000).fill(null).map((_, i) => ({
  name: `NFT #${i + 1}`,
  symbol: 'BULK',
  description: `Bulk NFT number ${i + 1}`,
  image: `https://example.com/nft${i + 1}.png`
}));

const result = await service.bulkMintCompressedNFTs({
  treeAddress: treeAddress,
  metadatas: metadatas,
  batchSize: 100
});

console.log(`Minted ${result.minted} NFTs for $${result.totalCost}`);
```

#### `getMerkleProof(treeAddress: PublicKey, leafIndex: number)`

Gets Merkle proof for a compressed NFT.

**Returns:**
```typescript
string[]  // Array of proof hashes
```

#### `verifyMerkleProof(treeAddress: PublicKey, leafIndex: number, proof: string[])`

Verifies a Merkle proof.

**Returns:**
```typescript
boolean  // true if proof is valid
```

### REST API Endpoints

#### `GET /api/bubblegum/info`

Get service information.

**Response:**
```json
{
  "success": true,
  "data": {
    "name": "Bubblegum v2 Service",
    "version": "2.0.0",
    "description": "Mass cNFT drops with 99% cost reduction",
    "features": ["Tree Creation", "Single Mint", "Bulk Minting", "Progress Tracking", "Metadata Upload"],
    "costPerNFT": "$0.00001",
    "typicalBatchSize": "100-10000",
    "typicalCost": "$1-10 for 100K NFTs"
  }
}
```

#### `POST /api/bubblegum/create-tree`

Create a new Bubblegum tree.

**Request:**
```json
{
  "maxDepth": 14,
  "maxBufferSize": 64,
  "canopyDepth": 0
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "treeAddress": "11111111111111111111111111111112",
    "signature": "transaction_signature",
    "capacity": 16384,
    "maxDepth": 14,
    "maxBufferSize": 64
  }
}
```

#### `POST /api/bubblegum/mint`

Mint a single compressed NFT.

**Request:**
```json
{
  "treeAddress": "11111111111111111111111111111112",
  "metadata": {
    "name": "My cNFT",
    "symbol": "MCNFT",
    "description": "A compressed NFT",
    "image": "https://example.com/image.png"
  },
  "owner": "11111111111111111111111111111113",
  "collectionMint": "11111111111111111111111111111114"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "assetId": "11111111111111111111111111111115",
    "signature": "transaction_signature",
    "metadata": { /* original metadata */ }
  }
}
```

#### `POST /api/bubblegum/bulk-mint`

Bulk mint multiple compressed NFTs.

**Request:**
```json
{
  "treeAddress": "11111111111111111111111111111112",
  "metadatas": [
    {
      "name": "NFT #1",
      "symbol": "BULK",
      "description": "First bulk NFT",
      "image": "https://example.com/nft1.png"
    },
    {
      "name": "NFT #2",
      "symbol": "BULK",
      "description": "Second bulk NFT",
      "image": "https://example.com/nft2.png"
    }
  ],
  "batchSize": 50
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "minted": 2,
    "total": 2,
    "signatures": ["sig1", "sig2"],
    "totalCost": 0.00002,
    "averageCostPerNFT": 0.00001
  }
}
```

## Service Architecture

### Core Components

1. **BubblegumService** - Main service class
2. **Irys Uploader** - Metadata upload to IPFS
3. **DAS API** - Digital Asset Standard API for proofs
4. **Umi Framework** - Metaplex SDK integration

### Data Flow

```
1. Create Tree → 2. Upload Metadata → 3. Mint cNFT → 4. Generate Proof
     ↓                    ↓                ↓              ↓
  Merkle Tree         Irys/IPFS      Blockchain      DAS API
```

### Cost Structure

- **Tree Creation**: ~0.01 SOL (one-time)
- **Per cNFT**: ~$0.00001 (0.00001 SOL)
- **Bulk Discount**: 99% cost reduction vs traditional NFTs

## Integration Examples

### Frontend Integration

```typescript
// React component example
import { useState } from 'react';
import { bubblegumService } from './services/bubblegumService';

function BubblegumMinter() {
  const [treeAddress, setTreeAddress] = useState('');
  const [isMinting, setIsMinting] = useState(false);

  const createTree = async () => {
    try {
      const result = await bubblegumService.createTree({
        maxDepth: 14,
        maxBufferSize: 64
      });
      setTreeAddress(result.treeAddress.toString());
    } catch (error) {
      console.error('Failed to create tree:', error);
    }
  };

  const mintNFT = async (metadata) => {
    if (!treeAddress) return;
    
    setIsMinting(true);
    try {
      const result = await bubblegumService.createCompressedNFT({
        treeAddress,
        metadata
      });
      console.log('NFT minted:', result.assetId.toString());
    } catch (error) {
      console.error('Failed to mint NFT:', error);
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <div>
      <button onClick={createTree}>Create Tree</button>
      <button 
        onClick={() => mintNFT({
          name: 'My NFT',
          symbol: 'MINE',
          description: 'A test NFT',
          image: 'https://example.com/image.png'
        })}
        disabled={!treeAddress || isMinting}
      >
        {isMinting ? 'Minting...' : 'Mint NFT'}
      </button>
    </div>
  );
}
```

### Node.js Integration

```javascript
const { BubblegumService } = require('./services/bubblegumService');
const { Connection, Keypair } = require('@solana/web3.js');

async function massMint() {
  const connection = new Connection('https://api.devnet.solana.com');
  const service = new BubblegumService(connection, 'https://api.devnet.solana.com');
  
  // Set up signer
  const keypair = Keypair.fromSecretKey(/* your secret key */);
  service.setSigner(keypair);
  
  // Create tree
  const tree = await service.createTree({
    maxDepth: 16,  // 65,536 NFTs
    maxBufferSize: 64
  });
  
  console.log(`Tree created: ${tree.treeAddress.toString()}`);
  
  // Generate metadata for 1000 NFTs
  const metadatas = Array(1000).fill(null).map((_, i) => ({
    name: `Mass Drop #${i + 1}`,
    symbol: 'MASS',
    description: `NFT from mass drop #${i + 1}`,
    image: `https://example.com/nft${i + 1}.png`,
    attributes: [
      { trait_type: 'Number', value: i + 1 },
      { trait_type: 'Rarity', value: i % 10 === 0 ? 'Rare' : 'Common' }
    ]
  }));
  
  // Bulk mint
  const result = await service.bulkMintCompressedNFTs({
    treeAddress: tree.treeAddress,
    metadatas: metadatas,
    batchSize: 100
  });
  
  console.log(`✅ Minted ${result.minted} NFTs for $${result.totalCost}`);
  console.log(`📝 Signatures: ${result.signatures.length}`);
}
```

## Error Handling

### Common Errors

#### NullSigner Error
```
Error: Trying to use a NullSigner. Did you forget to set a Signer on your Umi instance?
```
**Solution:** Call `service.setSigner(keypair)` before using the service.

#### Insufficient Funds
```
Error: Attempt to debit an account but found no record of a prior credit.
```
**Solution:** Fund your wallet with SOL for transaction fees.

#### Invalid Metadata
```
Error: Metadata must include: name, description, image
```
**Solution:** Ensure all required metadata fields are provided.

### Error Handling Best Practices

```typescript
try {
  const result = await service.createCompressedNFT(options);
  console.log('Success:', result);
} catch (error) {
  if (error.message.includes('NullSigner')) {
    console.error('Please set a signer first');
  } else if (error.message.includes('debit an account')) {
    console.error('Insufficient funds - please add SOL to wallet');
  } else {
    console.error('Unexpected error:', error.message);
  }
}
```

## Performance Optimization

### Batch Sizing

- **Small drops (< 100 NFTs)**: batchSize = 10-20
- **Medium drops (100-1000 NFTs)**: batchSize = 50-100
- **Large drops (1000+ NFTs)**: batchSize = 100-200

### Memory Management

```typescript
// For very large drops, process in chunks
const CHUNK_SIZE = 1000;
const metadatas = generateLargeMetadataArray(10000);

for (let i = 0; i < metadatas.length; i += CHUNK_SIZE) {
  const chunk = metadatas.slice(i, i + CHUNK_SIZE);
  const result = await service.bulkMintCompressedNFTs({
    treeAddress: treeAddress,
    metadatas: chunk,
    batchSize: 100
  });
  console.log(`Processed chunk ${i / CHUNK_SIZE + 1}: ${result.minted} NFTs`);
}
```

### Rate Limiting

The API includes built-in rate limiting:
- **Bulk mint**: 5 requests per minute
- **Single mint**: 100 requests per minute
- **Info/Proof**: 1000 requests per minute

## Testing

### Unit Tests

```typescript
import { BubblegumService } from '../services/bubblegumService';

describe('BubblegumService', () => {
  let service: BubblegumService;
  
  beforeEach(() => {
    service = new BubblegumService(mockConnection, 'https://api.devnet.solana.com');
  });
  
  it('should return service info', () => {
    const info = service.getServiceInfo();
    expect(info.name).toBe('Bubblegum v2 Service');
  });
  
  it('should validate metadata', () => {
    const invalidMetadata = { name: '', symbol: '', description: '', image: '' };
    expect(() => {
      service.createCompressedNFT({ treeAddress: mockAddress, metadata: invalidMetadata });
    }).rejects.toThrow();
  });
});
```

### Integration Tests

```typescript
import request from 'supertest';
import app from '../app';

describe('Bubblegum API', () => {
  it('should get service info', async () => {
    const response = await request(app)
      .get('/api/bubblegum/info')
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.data.name).toBe('Bubblegum v2 Service');
  });
  
  it('should create tree with valid parameters', async () => {
    const response = await request(app)
      .post('/api/bubblegum/create-tree')
      .send({ maxDepth: 14, maxBufferSize: 64 })
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('treeAddress');
  });
});
```

## Deployment

### Environment Variables

```bash
# Required
BUBBLEGUM_PRIVATE_KEY=your_base58_private_key
SOLANA_CLUSTER=devnet  # or mainnet-beta

# Optional
HELIUS_API_KEY=your_helius_key  # for better RPC performance
IRYS_WALLET_PRIVATE_KEY=your_irys_key  # for metadata uploads
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist/ ./dist/
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

### Production Checklist

- [ ] Set up proper environment variables
- [ ] Configure rate limiting
- [ ] Set up monitoring and logging
- [ ] Test with small amounts first
- [ ] Monitor transaction costs
- [ ] Set up error alerting

## Troubleshooting

### Common Issues

#### 1. Service Not Starting
**Symptoms:** Server fails to start with signer errors
**Solution:** Ensure `BUBBLEGUM_PRIVATE_KEY` is set in environment

#### 2. Transaction Failures
**Symptoms:** "Simulation failed" errors
**Solution:** Check wallet balance and network connectivity

#### 3. Metadata Upload Issues
**Symptoms:** Irys upload failures
**Solution:** Verify Irys wallet funding and network access

#### 4. Proof Generation Errors
**Symptoms:** DAS API errors
**Solution:** Check asset exists and network connectivity

### Debug Mode

Enable debug logging:

```typescript
// Set log level to debug
process.env.LOG_LEVEL = 'debug';

// The service will output detailed logs
console.log('🌳 Creating Bubblegum tree...');
console.log('📤 Uploading metadata to Irys...');
console.log('✅ Tree created successfully');
```

### Support

For additional support:
- Check the [GitHub Issues](https://github.com/your-repo/issues)
- Review the [API Documentation](./API_DOCUMENTATION.md)
- Contact the development team

## Changelog

### v2.0.0 (Current)
- ✅ Bubblegum v2 SDK integration
- ✅ Irys metadata upload
- ✅ DAS API proof generation
- ✅ Bulk minting with batch processing
- ✅ Comprehensive error handling
- ✅ Rate limiting and validation
- ✅ Complete test suite

### v1.0.0 (Legacy)
- Basic compressed NFT functionality
- Simple metadata handling
- Limited error handling

---

**Ready to revolutionize NFT minting with 99% cost reduction! 🚀**
