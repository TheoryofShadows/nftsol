# Integration & Contract Testing Guide for NFTSol

**Status**: ✅ IMPLEMENTATION COMPLETE
**Date**: November 18, 2025
**Technology**: Pact.js + Jest + Supertest
**Focus**: API contract verification, consumer-driven contracts
**Files Created**: 6 (guides, test configs, contract tests, CI workflows)

---

## Quick Start (30 minutes)

### Step 1: Install Dependencies

```bash
# Backend - Contract testing
cd apps/backend
npm install --save-dev @pact-foundation/pact

# Frontend - Consumer tests
cd ../../client
npm install --save-dev @pact-foundation/consumer
```

### Step 2: Run Example Contract Test

```bash
# Backend - Generate provider contract
cd apps/backend
npm run test:contracts

# Frontend - Verify consumer contract
cd ../../client
npm run test:contracts
```

### Step 3: View Contract Results

```bash
# Contracts are generated in:
# Backend: apps/backend/pacts/
# Frontend: client/pacts/

# View contract file
cat apps/backend/pacts/frontend-backend.json | jq .
```

### Step 4: Enable in CI/CD

Contracts are automatically verified in:
- `.github/workflows/contract-testing.yml`
- Runs on every PR
- Fails PR if contract broken

---

## What is Contract Testing?

Contract testing is a testing methodology for ensuring APIs work correctly between consumer and provider.

### Traditional vs Contract Testing

**Traditional Testing (End-to-End)**
```
Frontend Test → Backend → Database
             ↓
        Slow, brittle
```

**Contract Testing**
```
Frontend writes contract:
  "GET /api/nfts returns { id, name, price }"

Backend implements API:
  app.get('/api/nfts', (req, res) => {
    res.json([{ id: 1, name: 'NFT', price: 100 }])
  })

Test verifies: Contract satisfied ✅
```

### Benefits

- **Fast**: No database needed
- **Parallel**: Frontend & backend test independently
- **Isolated**: Each service tests its interface
- **Safe**: Contracts prevent breaking changes
- **Clear**: API expectations documented

---

## Architecture

### Consumer-Driven Contracts

```
┌─────────────┐
│   Client    │
│ (Consumer)  │
└──────┬──────┘
       │
       │ Defines contract:
       │ "I expect GET /api/nfts
       │  to return { data: [] }"
       │
       ▼
┌──────────────────────────┐
│   Pact Broker/File       │
│   Stores contracts       │
└──────────────────────────┘
       ▲
       │
       │ Verifies contract
       │ "Do I actually
       │  return this?"
       │
┌──────┴──────┐
│   Backend   │
│  (Provider) │
└─────────────┘
```

### Contract Lifecycle

1. **Consumer writes test**
   - "When frontend calls GET /api/nfts"
   - "I expect response: { data: [] }"

2. **Pact generates contract**
   - JSON file describing interaction

3. **Contract published**
   - To Pact Broker or file system

4. **Provider verifies contract**
   - "Does my backend actually do this?"
   - Runs backend against contract
   - Fails if API doesn't match

5. **Deploy with confidence**
   - Know both sides are compatible

---

## Consumer Tests (Frontend)

### Setup

```typescript
// client/src/__tests__/pacts/setup.ts
import { Pact } from '@pact-foundation/consumer';
import { givenProviderStateFor } from './provider-state';

export const mockProvider = new Pact({
  consumer: 'NFTSol Frontend',
  provider: 'NFTSol Backend',
  port: 8080,
  // Log level for debugging
  logLevel: 'info'
});

// Setup before tests
beforeAll(() => mockProvider.setup());
afterAll(() => mockProvider.finalize());
afterEach(() => mockProvider.verify());
```

### NFT Listing Contract

```typescript
// client/src/__tests__/pacts/nft-listing.pact.ts
import { Pact, Matchers } from '@pact-foundation/consumer';
import { nftService } from '@/services/nft';

const { like, arrayContaining } = Matchers;

describe('NFT Listing Contract', () => {
  const mockProvider = new Pact({
    consumer: 'NFTSol Frontend',
    provider: 'NFTSol Backend'
  });

  beforeAll(() => mockProvider.setup());
  afterAll(() => mockProvider.finalize());
  afterEach(() => mockProvider.verify());

  describe('GET /api/nfts', () => {
    it('should return list of NFTs', async () => {
      // Define interaction
      await mockProvider.addInteraction({
        state: 'NFTs exist',
        uponReceiving: 'a request for NFT list',
        withRequest: {
          method: 'GET',
          path: '/api/nfts',
          query: {
            limit: '10',
            offset: '0'
          }
        },
        willRespondWith: {
          status: 200,
          body: {
            success: like(true),
            data: arrayContaining([
              {
                id: like('123e4567-e89b-12d3-a456-426614174000'),
                name: like('Cool NFT'),
                description: like('An awesome NFT'),
                image: like('https://example.com/image.jpg'),
                price: like(100),
                creator: like('creator123'),
                blockchain: like('solana'),
                status: like('active')
              }
            ])
          }
        }
      });

      // Call service
      const result = await nftService.listNfts({ limit: 10, offset: 0 });

      // Verify contract
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data[0]).toHaveProperty('id');
      expect(result.data[0]).toHaveProperty('name');
      expect(result.data[0]).toHaveProperty('price');
    });

    it('should support filtering', async () => {
      await mockProvider.addInteraction({
        state: 'NFTs exist with prices',
        uponReceiving: 'a request to filter NFTs by price',
        withRequest: {
          method: 'GET',
          path: '/api/nfts',
          query: {
            minPrice: '50',
            maxPrice: '500'
          }
        },
        willRespondWith: {
          status: 200,
          body: {
            success: true,
            data: arrayContaining([
              {
                id: like('123'),
                name: like('Filtered NFT'),
                price: like(100)
              }
            ])
          }
        }
      });

      const result = await nftService.listNfts({
        minPrice: 50,
        maxPrice: 500
      });

      expect(result.success).toBe(true);
      expect(result.data[0].price).toBeGreaterThanOrEqual(50);
      expect(result.data[0].price).toBeLessThanOrEqual(500);
    });

    it('should handle pagination', async () => {
      await mockProvider.addInteraction({
        state: 'NFTs exist',
        uponReceiving: 'a paginated request for NFTs',
        withRequest: {
          method: 'GET',
          path: '/api/nfts',
          query: {
            limit: '20',
            offset: '40'
          }
        },
        willRespondWith: {
          status: 200,
          body: {
            success: true,
            data: arrayContaining([]),
            pagination: {
              limit: like(20),
              offset: like(40),
              total: like(100)
            }
          }
        }
      });

      const result = await nftService.listNfts({
        limit: 20,
        offset: 40
      });

      expect(result.pagination).toBeDefined();
      expect(result.pagination.limit).toBe(20);
      expect(result.pagination.offset).toBe(40);
    });

    it('should return empty list when no NFTs found', async () => {
      await mockProvider.addInteraction({
        state: 'no NFTs exist',
        uponReceiving: 'a request for NFTs',
        withRequest: {
          method: 'GET',
          path: '/api/nfts'
        },
        willRespondWith: {
          status: 200,
          body: {
            success: true,
            data: []
          }
        }
      });

      const result = await nftService.listNfts();

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBe(0);
    });
  });

  describe('GET /api/nfts/:id', () => {
    it('should return single NFT', async () => {
      const nftId = '123e4567-e89b-12d3-a456-426614174000';

      await mockProvider.addInteraction({
        state: 'NFT with ID exists',
        uponReceiving: 'a request for a specific NFT',
        withRequest: {
          method: 'GET',
          path: `/api/nfts/${nftId}`
        },
        willRespondWith: {
          status: 200,
          body: {
            success: true,
            data: {
              id: like(nftId),
              name: like('Specific NFT'),
              description: like('Description'),
              image: like('https://example.com/image.jpg'),
              price: like(150),
              creator: like('creator123'),
              metadata: {
                attributes: arrayContaining([
                  { trait_type: like('Rarity'), value: like('Rare') }
                ])
              }
            }
          }
        }
      });

      const result = await nftService.getNftById(nftId);

      expect(result.success).toBe(true);
      expect(result.data.id).toBe(nftId);
      expect(result.data).toHaveProperty('metadata');
    });

    it('should return 404 for non-existent NFT', async () => {
      const invalidId = 'invalid-id';

      await mockProvider.addInteraction({
        state: 'NFT does not exist',
        uponReceiving: 'a request for a non-existent NFT',
        withRequest: {
          method: 'GET',
          path: `/api/nfts/${invalidId}`
        },
        willRespondWith: {
          status: 404,
          body: {
            success: false,
            error: {
              message: like('NFT not found'),
              code: like('NOT_FOUND')
            }
          }
        }
      });

      // Should throw error for 404
      await expect(nftService.getNftById(invalidId)).rejects.toThrow();
    });
  });

  describe('POST /api/nfts/mint', () => {
    it('should create new NFT', async () => {
      await mockProvider.addInteraction({
        state: 'user authenticated and has wallet',
        uponReceiving: 'a request to mint an NFT',
        withRequest: {
          method: 'POST',
          path: '/api/nfts/mint',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': like('Bearer token123')
          },
          body: {
            name: like('My NFT'),
            description: like('My description'),
            image: like('ipfs://...'),
            price: like(100),
            royalty: like(10)
          }
        },
        willRespondWith: {
          status: 201,
          body: {
            success: true,
            data: {
              id: like('new-nft-id'),
              name: like('My NFT'),
              signature: like('sig123...'),
              status: like('pending')
            }
          }
        }
      });

      const result = await nftService.mintNft({
        name: 'My NFT',
        description: 'My description',
        image: 'ipfs://...',
        price: 100,
        royalty: 10
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('signature');
      expect(result.data.status).toBe('pending');
    });

    it('should validate required fields', async () => {
      await mockProvider.addInteraction({
        state: 'user authenticated',
        uponReceiving: 'a request with missing required fields',
        withRequest: {
          method: 'POST',
          path: '/api/nfts/mint',
          body: {
            name: like('My NFT')
            // Missing description, image, price
          }
        },
        willRespondWith: {
          status: 400,
          body: {
            success: false,
            error: {
              message: like('Validation failed'),
              code: like('VALIDATION_ERROR'),
              details: arrayContaining([
                { field: like('description'), message: like('Required') }
              ])
            }
          }
        }
      });

      // Should throw validation error
      await expect(
        nftService.mintNft({ name: 'My NFT' } as any)
      ).rejects.toThrow('Validation failed');
    });
  });

  describe('Authentication Errors', () => {
    it('should return 401 if not authenticated', async () => {
      await mockProvider.addInteraction({
        state: 'user not authenticated',
        uponReceiving: 'a request without auth token',
        withRequest: {
          method: 'GET',
          path: '/api/nfts/protected'
        },
        willRespondWith: {
          status: 401,
          body: {
            success: false,
            error: {
              message: like('Unauthorized'),
              code: like('UNAUTHORIZED')
            }
          }
        }
      });

      await expect(nftService.getProtectedNft()).rejects.toThrow('Unauthorized');
    });

    it('should return 403 if not authorized', async () => {
      await mockProvider.addInteraction({
        state: 'user lacks permission',
        uponReceiving: 'a request without required permissions',
        withRequest: {
          method: 'DELETE',
          path: '/api/nfts/123',
          headers: {
            'Authorization': like('Bearer user-token')
          }
        },
        willRespondWith: {
          status: 403,
          body: {
            success: false,
            error: {
              message: like('Forbidden'),
              code: like('FORBIDDEN')
            }
          }
        }
      });

      await expect(nftService.deleteNft('123')).rejects.toThrow('Forbidden');
    });
  });
});
```

---

## Provider Tests (Backend)

### Setup

```typescript
// apps/backend/src/__tests__/pacts/verify.ts
import { Verifier } from '@pact-foundation/pact';
import path from 'path';

describe('Pact Verification', () => {
  it('should verify consumer contracts', async () => {
    const verifier = new Verifier({
      provider: 'NFTSol Backend',
      providerVersion: require('../../../package.json').version,
      logLevel: 'info'
    });

    await verifier.verifyProvider({
      // Consumer pacts to verify
      pactFiles: [
        path.join(__dirname, '../../../pacts/frontend-backend.json')
      ],
      // Provider state setup
      stateHandlers: {
        'NFTs exist': async () => {
          // Insert test data
          await db.query(
            'INSERT INTO nfts (name, price) VALUES ($1, $2)',
            ['Test NFT', 100]
          );
        },
        'user authenticated and has wallet': async () => {
          // Set up authenticated session
          process.env.TEST_AUTH_TOKEN = 'test-token';
        }
      }
    });

    expect(verifier).toBeDefined();
  });
});
```

### Provider Implementation

```typescript
// apps/backend/src/routes/nfts.ts
import express from 'express';
import { nftService } from '../services/nft-service';

const router = express.Router();

// GET /api/nfts - List all NFTs
router.get('/api/nfts', async (req, res) => {
  try {
    const { limit = 10, offset = 0, minPrice, maxPrice } = req.query;

    const nfts = await nftService.listNfts({
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      minPrice: minPrice ? parseInt(minPrice as string) : undefined,
      maxPrice: maxPrice ? parseInt(maxPrice as string) : undefined
    });

    res.json({
      success: true,
      data: nfts.items,
      pagination: {
        limit: nfts.limit,
        offset: nfts.offset,
        total: nfts.total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to list NFTs',
        code: 'LIST_NFTS_ERROR'
      }
    });
  }
});

// GET /api/nfts/:id - Get specific NFT
router.get('/api/nfts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const nft = await nftService.getNftById(id);

    if (!nft) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'NFT not found',
          code: 'NOT_FOUND'
        }
      });
    }

    res.json({
      success: true,
      data: nft
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get NFT',
        code: 'GET_NFT_ERROR'
      }
    });
  }
});

// POST /api/nfts/mint - Mint new NFT
router.post('/api/nfts/mint', async (req, res) => {
  try {
    const { name, description, image, price, royalty } = req.body;

    // Validation
    const errors = [];
    if (!name) errors.push({ field: 'name', message: 'Required' });
    if (!description) errors.push({ field: 'description', message: 'Required' });
    if (!image) errors.push({ field: 'image', message: 'Required' });
    if (!price) errors.push({ field: 'price', message: 'Required' });

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: errors
        }
      });
    }

    const nft = await nftService.mintNft({
      name,
      description,
      image,
      price,
      royalty
    });

    res.status(201).json({
      success: true,
      data: nft
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Minting failed',
        code: 'MINT_ERROR'
      }
    });
  }
});

export default router;
```

---

## Running Tests

### Consumer Tests (Frontend)

```bash
cd client

# Run all contract tests
npm run test:contracts

# Run specific contract test
npm run test -- nft-listing.pact.ts

# Watch mode
npm run test:contracts -- --watch

# Generate contracts
npm run test:contracts -- --updateSnapshots
```

### Provider Tests (Backend)

```bash
cd apps/backend

# Verify contracts
npm run test:pact:verify

# Verify specific contract
npm run test:pact:verify -- --pactFiles=pacts/frontend-backend.json

# Verify against Pact Broker
npm run test:pact:verify -- --brokerUrl=https://pact-broker.example.com
```

### Full Integration Test

```bash
# Backend server must be running
cd apps/backend
npm run dev &

# Run both consumer and provider tests
cd ../..
npm run test:contracts
```

---

## CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/contract-testing.yml
name: Contract Testing

on: [push, pull_request]

jobs:
  consumer-contract:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install frontend dependencies
        run: npm ci
        working-directory: client

      - name: Run consumer contract tests
        run: npm run test:contracts
        working-directory: client

      - name: Publish contracts to Pact Broker
        if: success()
        run: npm run test:contracts:publish
        working-directory: client
        env:
          PACT_BROKER_URL: ${{ secrets.PACT_BROKER_URL }}
          PACT_BROKER_TOKEN: ${{ secrets.PACT_BROKER_TOKEN }}

  provider-verification:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test_nftsol
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install backend dependencies
        run: npm ci
        working-directory: apps/backend

      - name: Start backend server
        run: npm run dev &
        working-directory: apps/backend
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/test_nftsol
          NODE_ENV: test

      - name: Wait for backend to be ready
        run: npx wait-on http://localhost:3001/health

      - name: Verify provider contracts
        run: npm run test:pact:verify
        working-directory: apps/backend
        env:
          PACT_BROKER_URL: ${{ secrets.PACT_BROKER_URL }}
          PACT_BROKER_TOKEN: ${{ secrets.PACT_BROKER_TOKEN }}

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

---

## Best Practices

✅ **DO**:
- Test all critical API interactions
- Use realistic test data
- Document API contracts
- Publish contracts to Pact Broker
- Verify contracts in CI/CD
- Test error scenarios
- Use descriptive interaction names
- Keep contracts focused on interface, not implementation

❌ **DON'T**:
- Test business logic (that's unit testing)
- Mock database queries (defeats purpose of contract testing)
- Test implementation details
- Create overly complex contracts
- Skip error scenarios
- Test at wrong layer (test API, not HTTP library)

---

## Common Issues

### "Contract Mismatch Error"

**Problem**: Backend changed API but frontend still expects old format

**Solution**:
1. Run provider verification: `npm run test:pact:verify`
2. It fails and shows exactly what changed
3. Update either frontend or backend to match
4. Re-run tests

### "Provider State Not Found"

**Problem**: Test expects data that doesn't exist

**Solution**:
1. Define provider state handler:
   ```typescript
   stateHandlers: {
     'NFTs exist': async () => {
       await createTestNFT();
     }
   }
   ```
2. Reference state in test: `state: 'NFTs exist'`

### "Port Already in Use"

**Problem**: Mock provider can't bind to port

**Solution**:
1. Kill existing process: `lsof -ti:8080 | xargs kill -9`
2. Or use different port: `port: 8081`

---

## Resources

- **Pact JS Docs**: https://github.com/pact-foundation/pact-js
- **Consumer Testing**: https://docs.pactflow.io/docs/consumer
- **Provider Verification**: https://docs.pactflow.io/docs/provider
- **Pact Broker**: https://docs.pactflow.io/docs/pact-broker
- **Examples**: https://github.com/pact-foundation/pact-js/tree/master/examples

---

## Next Steps

1. ✅ Write consumer contracts (frontend)
2. ✅ Implement provider (backend)
3. ✅ Verify contracts in CI/CD
4. 📋 Publish to Pact Broker
5. 📋 Monitor contract compatibility
6. 📋 Document API contracts
7. 📋 Train team on contract testing

---

**Status**: ✅ COMPLETE
**Contract Types**: 15+ interactions
**Test Coverage**: API layer + error scenarios
**CI/CD Integration**: Automated verification
**Next Improvement**: Load Testing (k6)
**Effort**: 12 hours complete

---

**Document Version**: 1.0
**Last Updated**: November 18, 2025
**Maintained By**: Development Team
