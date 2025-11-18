# Contract Testing - Quick Reference

## Install

```bash
# Backend
cd apps/backend
npm install --save-dev @pact-foundation/pact jest supertest

# Frontend
cd client
npm install --save-dev @pact-foundation/consumer pact-web
```

## Quick Test Example

### Consumer (Frontend)

```typescript
// client/src/__tests__/api.pact.ts
import { Pact, Matchers } from '@pact-foundation/consumer';

const mockProvider = new Pact({
  consumer: 'NFTSol Frontend',
  provider: 'NFTSol Backend'
});

describe('NFT API Contract', () => {
  beforeAll(() => mockProvider.setup());
  afterAll(() => mockProvider.finalize());
  afterEach(() => mockProvider.verify());

  it('returns NFTs', async () => {
    await mockProvider.addInteraction({
      state: 'NFTs exist',
      uponReceiving: 'a request for NFTs',
      withRequest: {
        method: 'GET',
        path: '/api/nfts'
      },
      willRespondWith: {
        status: 200,
        body: {
          success: true,
          data: Matchers.arrayContaining({
            id: Matchers.like('123'),
            name: Matchers.like('NFT')
          })
        }
      }
    });

    const response = await fetch(mockProvider.mockServiceUrl + '/api/nfts');
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });
});
```

### Provider (Backend)

```typescript
// apps/backend/src/__tests__/api.verify.ts
import { Verifier } from '@pact-foundation/pact';
import app from '../app';
import path from 'path';

describe('API Verification', () => {
  const server = app.listen(3001);

  afterAll(() => server.close());

  it('verifies contracts', async () => {
    const verifier = new Verifier({
      provider: 'NFTSol Backend',
      providerVersion: '1.0.0'
    });

    const result = await verifier.verifyProvider({
      pactFiles: [
        path.join(__dirname, '../../pacts/frontend-backend.json')
      ],
      stateHandlers: {
        'NFTs exist': async () => {
          // Setup test data
        }
      }
    });

    expect(result).toBe(true);
  });
});
```

## Run Tests

```bash
# Consumer
npm run test -- api.pact.ts

# Provider
npm run test:pact:verify

# View generated contract
cat pacts/frontend-backend.json | jq .
```

## Package.json Scripts

```json
{
  "scripts": {
    "test:contracts": "jest --testPathPattern=.pact.ts",
    "test:pact:verify": "jest --testPathPattern=.verify.ts",
    "test:pact:publish": "pact-broker publish pacts/ --consumer-app-version=1.0.0",
    "test:pact:can-i-deploy": "pact-broker can-i-deploy --pacticipant=NFTSol-Backend --version=1.0.0"
  }
}
```

## Common Patterns

### List API

```typescript
await mockProvider.addInteraction({
  state: 'items exist',
  uponReceiving: 'a request for items',
  withRequest: { method: 'GET', path: '/api/items' },
  willRespondWith: {
    status: 200,
    body: {
      success: true,
      data: Matchers.arrayContaining({ id: Matchers.like('1') })
    }
  }
});
```

### Create API

```typescript
await mockProvider.addInteraction({
  state: 'database ready',
  uponReceiving: 'a request to create item',
  withRequest: {
    method: 'POST',
    path: '/api/items',
    body: { name: 'Item' }
  },
  willRespondWith: {
    status: 201,
    body: { success: true, data: { id: Matchers.like('1') } }
  }
});
```

### Error Handling

```typescript
await mockProvider.addInteraction({
  state: 'item does not exist',
  uponReceiving: 'a request for non-existent item',
  withRequest: { method: 'GET', path: '/api/items/999' },
  willRespondWith: {
    status: 404,
    body: { success: false, error: { message: 'Not found' } }
  }
});
```

## CI/CD

```yaml
# .github/workflows/contract-tests.yml
- name: Consumer tests
  run: npm run test:contracts
  working-directory: client

- name: Publish contracts
  run: npm run test:pact:publish
  env:
    PACT_BROKER_URL: https://pact.example.com

- name: Provider verification
  run: npm run test:pact:verify
  working-directory: apps/backend
```

## Files to Create

```
client/
├── src/__tests__/
│   └── pacts/
│       ├── setup.ts              # Pact setup
│       ├── nft-listing.pact.ts    # NFT contract tests
│       ├── marketplace.pact.ts    # Marketplace contract tests
│       └── auth.pact.ts           # Auth contract tests
└── pacts/                         # Generated contracts
    └── frontend-backend.json      # Pact file

apps/backend/
├── src/__tests__/
│   └── pacts/
│       ├── verify.ts              # Verification setup
│       └── nft-provider.verify.ts  # NFT provider verification
└── pacts/                         # Consume frontend pacts
    └── frontend-backend.json
```

## Troubleshooting

```bash
# Port in use
lsof -ti:8080 | xargs kill -9

# Clear old pacts
rm -rf pacts/

# View contract structure
cat pacts/frontend-backend.json | jq '.interactions[0]'

# Debug mode
DEBUG=pact:* npm run test:contracts
```

## Testing Checklist

- [ ] Consumer tests written (frontend)
- [ ] Provider tests written (backend)
- [ ] Contracts generated successfully
- [ ] Provider verification passes
- [ ] Error scenarios tested
- [ ] Authentication flows tested
- [ ] CI/CD integration working
- [ ] Team trained on approach

---

**Key Takeaway**: Contract tests bridge frontend and backend, ensuring they always agree on API interface.
