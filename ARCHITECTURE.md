# NFTSol Architecture Guide

## 📁 Project Structure

```
NFTSol/
├── shared/                    # Shared code between client and server
│   ├── types/                 # TypeScript type definitions
│   ├── constants/             # Constants and enums
│   ├── config/                # Configuration management
│   ├── validation/            # Zod validation schemas
│   └── utils/                 # Shared utilities (logger, errors)
│
├── client/                     # Frontend React application
│   └── src/
│       ├── features/          # Feature-based modules (NEW)
│       │   ├── nfts/
│       │   ├── echo/
│       │   ├── clout/
│       │   └── wallet/
│       ├── components/        # Shared UI components
│       ├── hooks/              # Custom React hooks
│       ├── services/          # API services
│       ├── context/            # React contexts
│       ├── utils/             # Client utilities
│       └── config/             # Client config
│
├── server/                     # Backend Express API
│   ├── routes/                # API route handlers
│   ├── services/              # Business logic services
│   ├── middleware/            # Express middleware
│   ├── utils/                 # Server utilities
│   └── types/                 # Server-specific types
│
└── apps/                      # Additional applications
    └── backend/               # Alternative backend structure
```

## 🎯 Key Architectural Principles

### 1. **Feature-Based Organization**
Organize code by feature, not by type. Each feature is self-contained:

```
features/nfts/
├── components/
│   ├── NftGrid.tsx
│   ├── NftCard.tsx
│   └── NftDetailModal.tsx
├── hooks/
│   ├── useNfts.ts
│   └── useNftMint.ts
├── services/
│   └── nftService.ts
├── types.ts
└── index.ts
```

### 2. **Shared Package**
All shared code lives in `shared/`:
- **Types**: Single source of truth for types
- **Constants**: No magic numbers or strings
- **Validation**: Zod schemas for type-safe validation
- **Utils**: Reusable utilities (logger, errors)

### 3. **Service Layer Pattern**
Business logic separated from UI and routes:

```typescript
// services/nftService.ts
export class NftService {
  async getNfts(filters: NFTFilters): Promise<NFT[]> {
    // Business logic here
  }
}

// In components
const nfts = await nftService.getNfts(filters);
```

### 4. **Error Handling Strategy**
- Use custom error classes (`AppError`, `ValidationError`)
- Centralized error handling middleware
- Consistent error response format

### 5. **Type Safety**
- Shared types between client/server
- Zod schemas for runtime validation
- Strict TypeScript configuration

## 📦 Package Organization

### Shared Package (`shared/`)

**Purpose**: Code shared between client and server

```
shared/
├── types/          # TypeScript interfaces and types
├── constants/      # App-wide constants
├── config/         # Environment configuration
├── validation/     # Zod schemas
└── utils/          # Shared utilities
```

**Usage**:
```typescript
// Client or Server
import { NFT, ApiResponse } from '@shared/types';
import { POLLING_INTERVALS } from '@shared/constants';
import { envConfig } from '@shared/config/environment';
import { mintRequestSchema } from '@shared/validation/schemas';
```

## 🔧 Best Practices

### 1. **Import Paths**
Use absolute imports with path aliases:

```typescript
// ✅ Good
import { NFT } from '@shared/types';
import { nftService } from '@/services/nftService';

// ❌ Bad
import { NFT } from '../../../shared/types';
```

### 2. **Error Handling**
Always use custom error classes:

```typescript
// ✅ Good
throw new ValidationError('Invalid NFT name', { name });

// ❌ Bad
throw new Error('Invalid NFT name');
```

### 3. **Constants**
Never hardcode values:

```typescript
// ✅ Good
const interval = POLLING_INTERVALS.STATS;

// ❌ Bad
const interval = 300000; // What is this?
```

### 4. **Validation**
Always validate with Zod schemas:

```typescript
// ✅ Good
const validated = mintRequestSchema.parse(requestBody);

// ❌ Bad
if (!requestBody.name) throw new Error('Name required');
```

### 5. **Logging**
Use structured logging:

```typescript
// ✅ Good
logger.info('NFT minted', { mintAddress, creator });

// ❌ Bad
console.log('NFT minted');
```

## 🚀 Migration Guide

### Step 1: Update Imports
Replace local types with shared types:

```typescript
// Before
import { NFT } from '../types';

// After
import { NFT } from '@shared/types';
```

### Step 2: Extract Constants
Move hardcoded values to constants:

```typescript
// Before
const interval = 60000;

// After
import { POLLING_INTERVALS } from '@shared/constants';
const interval = POLLING_INTERVALS.STATS;
```

### Step 3: Add Validation
Add Zod schemas for validation:

```typescript
// Before
if (!data.name) throw new Error('Name required');

// After
import { mintRequestSchema } from '@shared/validation/schemas';
const validated = mintRequestSchema.parse(data);
```

### Step 4: Use Error Classes
Replace generic errors:

```typescript
// Before
throw new Error('Not found');

// After
import { NotFoundError } from '@shared/utils/errors';
throw new NotFoundError('NFT');
```

## 📝 Next Steps

1. **Feature Migration**: Move components to feature-based structure
2. **API Consolidation**: Merge `api.ts` and `api-optimized.ts`
3. **Service Layer**: Extract business logic to services
4. **Testing**: Add tests for shared utilities
5. **Documentation**: Document each feature module

## 🔍 Missing Enhancements Checklist

- [x] Shared types package
- [x] Constants organization
- [x] Validation schemas
- [x] Error handling utilities
- [x] Logger service
- [ ] Feature-based folder structure
- [ ] API service consolidation
- [ ] Service layer abstraction
- [ ] Comprehensive testing
- [ ] API documentation (OpenAPI/Swagger)
- [ ] Monitoring and observability
- [ ] Caching strategy
- [ ] Rate limiting client-side
- [ ] Feature flags system
- [ ] Analytics abstraction

