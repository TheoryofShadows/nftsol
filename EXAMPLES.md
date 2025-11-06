# 📚 Usage Examples

## Service Layer Pattern

### Client-Side Service

```typescript
// client/src/services/nftService.ts
import { NFT, MintRequest } from '@shared/types';
import { nftService } from './nftService';

// In a component
const nfts = await nftService.getMarketplace({ category: 'art' });
const myNft = await nftService.getByMintAddress('...');
const minted = await nftService.mint(mintRequest);
```

### Using the Hook

```typescript
// client/src/components/MyComponent.tsx
import { useNfts } from '@/hooks/useNfts';

function MyComponent() {
  const { nfts, loading, error, refetch } = useNfts({
    autoFetch: true,
    filters: { category: 'art' },
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {nfts.map(nft => (
        <div key={nft.id}>{nft.name}</div>
      ))}
    </div>
  );
}
```

## Validation Middleware

### Server-Side Route with Validation

```typescript
// server/routes/nfts.ts
import { Router } from 'express';
import { validateBody, validateQuery } from '../middleware/validation';
import { mintRequestSchema, nftQuerySchema } from '@shared/validation/schemas';

const router = Router();

// Validate query parameters
router.get(
  '/nfts',
  validateQuery(nftQuerySchema),
  async (req, res) => {
    // req.query is now validated and typed
    const { category, search, page, limit } = req.query;
    // ...
  }
);

// Validate request body
router.post(
  '/mint',
  validateBody(mintRequestSchema),
  async (req, res) => {
    // req.body is now validated and typed
    const mintRequest = req.body;
    // ...
  }
);
```

## Error Handling

### Client-Side Error Handling

```typescript
import { nftService } from '@/services/nftService';
import { ValidationError, NetworkError } from '@shared/utils/errors';
import { logger } from '@shared/utils/logger';

try {
  const nft = await nftService.mint(request);
} catch (error) {
  if (error instanceof ValidationError) {
    // Handle validation error
    console.error('Validation failed:', error.details);
  } else if (error instanceof NetworkError) {
    // Handle network error
    console.error('Network error:', error.message);
  } else {
    // Handle unknown error
    logger.error('Unexpected error', error);
  }
}
```

### Server-Side Error Handling

```typescript
// server/routes/nfts.ts
import { NotFoundError, ValidationError } from '@shared/utils/errors';

router.get('/nfts/:id', async (req, res, next) => {
  try {
    const nft = await getNftById(req.params.id);
    
    if (!nft) {
      throw new NotFoundError('NFT');
    }
    
    res.json({ success: true, data: nft });
  } catch (error) {
    // Error handling middleware will catch this
    next(error);
  }
});
```

## Logging

### Structured Logging

```typescript
import { logger } from '@shared/utils/logger';

// Info log
logger.info('NFT minted', {
  mintAddress: '...',
  creator: '...',
  timestamp: new Date().toISOString(),
});

// Error log
logger.error('Mint failed', error, {
  requestBody: req.body,
  userId: req.user?.id,
});

// Warning log
logger.warn('Rate limit approaching', {
  ip: req.ip,
  endpoint: req.path,
});

// Debug log (only in development)
logger.debug('Cache hit', {
  key: cacheKey,
  ttl: remainingTtl,
});
```

## Constants Usage

### Replacing Hardcoded Values

```typescript
// Before
setInterval(fetchData, 60000); // What is 60000?
const timeout = 30000; // What is 30000?

// After
import { POLLING_INTERVALS, REQUEST_TIMEOUT } from '@shared/constants';

setInterval(fetchData, POLLING_INTERVALS.STATS);
const timeout = REQUEST_TIMEOUT.DEFAULT;
```

### Using Error Messages

```typescript
import { ERROR_MESSAGES } from '@shared/constants';

throw new Error(ERROR_MESSAGES.NETWORK_ERROR);
throw new Error(ERROR_MESSAGES.NOT_FOUND);
```

## Type Safety

### Using Shared Types

```typescript
// Both client and server can use the same types
import { NFT, ApiResponse, MintRequest } from '@shared/types';

// Client
const nft: NFT = { ... };

// Server
function getNft(): ApiResponse<NFT> {
  return { success: true, data: nft };
}
```

### Type Inference from Schemas

```typescript
import { mintRequestSchema } from '@shared/validation/schemas';
import type { MintRequestInput } from '@shared/validation/schemas';

// Type is inferred from schema
const validated: MintRequestInput = mintRequestSchema.parse(data);
```

## Environment Configuration

### Using Environment Config

```typescript
import { envConfig } from '@shared/config/environment';

// Client or Server
if (envConfig.isProduction) {
  // Production-only code
}

const apiUrl = envConfig.apiBase;
const rpcUrl = envConfig.solanaRpcUrl;
const cluster = envConfig.solanaCluster;

// Type-safe environment access
if (envConfig.heliusApiKey) {
  // API key is available
}
```

## Complete Example: NFT Minting

### Client Component

```typescript
// client/src/components/MintForm.tsx
import { useState } from 'react';
import { nftService } from '@/services/nftService';
import { ValidationError, NetworkError } from '@shared/utils/errors';
import { logger } from '@shared/utils/logger';
import { MintRequest } from '@shared/types';

export function MintForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: MintRequest) => {
    setLoading(true);
    setError(null);

    try {
      const result = await nftService.mint(data);
      
      logger.info('NFT minted successfully', {
        mintAddress: result.mintAddress,
      });
      
      // Success handling
    } catch (err) {
      if (err instanceof ValidationError) {
        setError('Please check your input: ' + err.message);
      } else if (err instanceof NetworkError) {
        setError('Network error. Please try again.');
      } else {
        setError('An unexpected error occurred');
        logger.error('Mint failed', err);
      }
    } finally {
      setLoading(false);
    }
  };

  // ... rest of component
}
```

### Server Route

```typescript
// server/routes/mint.ts
import { Router } from 'express';
import { validateBody } from '../middleware/validation';
import { mintRequestSchema } from '@shared/validation/schemas';
import { logger } from '@shared/utils/logger';
import { ValidationError } from '@shared/utils/errors';

const router = Router();

router.post(
  '/mint',
  validateBody(mintRequestSchema),
  async (req, res, next) => {
    try {
      // req.body is already validated
      const mintRequest = req.body;
      
      // Your minting logic
      const result = await mintNFT(mintRequest);
      
      logger.info('NFT minted', {
        mintAddress: result.mintAddress,
        creator: mintRequest.creatorWallet,
      });
      
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
```

## Best Practices

1. **Always use services** - Don't call API directly from components
2. **Validate everything** - Use Zod schemas for all inputs
3. **Handle errors properly** - Use custom error classes
4. **Log consistently** - Use structured logging
5. **Use constants** - Never hardcode values
6. **Type everything** - Use shared types for consistency

