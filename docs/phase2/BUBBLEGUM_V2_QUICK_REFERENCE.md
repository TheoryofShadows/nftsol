# 🚀 Bubblegum v2 Quick Reference

## Essential Commands

### Service Initialization
```typescript
import { BubblegumService } from './services/bubblegumService';
import { Connection, Keypair } from '@solana/web3.js';

const connection = new Connection('https://api.devnet.solana.com');
const service = new BubblegumService(connection, 'https://api.devnet.solana.com');
const keypair = Keypair.fromSecretKey(/* your secret key */);
service.setSigner(keypair);
```

### Create Tree
```typescript
const tree = await service.createTree({
  maxDepth: 14,        // 16,384 NFTs
  maxBufferSize: 64,
  canopyDepth: 0
});
```

### Mint Single cNFT
```typescript
const nft = await service.createCompressedNFT({
  treeAddress: tree.treeAddress,
  metadata: {
    name: 'My cNFT',
    symbol: 'MCNFT',
    description: 'A compressed NFT',
    image: 'https://example.com/image.png'
  }
});
```

### Bulk Mint
```typescript
const result = await service.bulkMintCompressedNFTs({
  treeAddress: tree.treeAddress,
  metadatas: [
    { name: 'NFT #1', symbol: 'BULK', description: 'First', image: 'https://example.com/1.png' },
    { name: 'NFT #2', symbol: 'BULK', description: 'Second', image: 'https://example.com/2.png' }
  ],
  batchSize: 50
});
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/bubblegum/info` | Service information |
| `POST` | `/api/bubblegum/create-tree` | Create tree |
| `POST` | `/api/bubblegum/mint` | Mint single cNFT |
| `POST` | `/api/bubblegum/bulk-mint` | Bulk mint cNFTs |
| `GET` | `/api/bubblegum/merkle-proof` | Get Merkle proof |
| `POST` | `/api/bubblegum/verify-proof` | Verify proof |

## Tree Capacities

| Depth | Capacity | Use Case |
|-------|----------|----------|
| 10 | 1,024 | Small drops |
| 12 | 4,096 | Medium drops |
| 14 | 16,384 | Large drops |
| 16 | 65,536 | Massive drops |
| 20 | 1,048,576 | Enterprise drops |

## Cost Estimates

| NFTs | Cost (SOL) | Cost (USD) |
|------|------------|------------|
| 100 | 0.001 | $0.20 |
| 1,000 | 0.01 | $2.00 |
| 10,000 | 0.1 | $20.00 |
| 100,000 | 1.0 | $200.00 |

## Error Codes

| Error | Cause | Solution |
|-------|-------|----------|
| `NullSigner` | No signer set | Call `service.setSigner(keypair)` |
| `debit an account` | Insufficient funds | Add SOL to wallet |
| `Asset not found` | Invalid tree/asset | Check tree address |
| `Metadata must include` | Invalid metadata | Provide required fields |

## Environment Variables

```bash
# Required
BUBBLEGUM_PRIVATE_KEY=your_base58_private_key
SOLANA_CLUSTER=devnet

# Optional
HELIUS_API_KEY=your_helius_key
IRYS_WALLET_PRIVATE_KEY=your_irys_key
```

## Quick Test

```bash
# Test API
curl http://localhost:3000/api/bubblegum/info

# Test tree creation
curl -X POST http://localhost:3000/api/bubblegum/create-tree \
  -H "Content-Type: application/json" \
  -d '{"maxDepth":14,"maxBufferSize":64}'
```

## Performance Tips

- **Batch Size**: 50-100 for optimal performance
- **Memory**: Process large drops in chunks of 1000
- **Rate Limits**: 5 bulk requests/minute, 100 single requests/minute
- **Monitoring**: Watch transaction costs and success rates

---

**Need help? Check the [Full Developer Guide](./BUBBLEGUM_V2_DEVELOPER_GUIDE.md)**
