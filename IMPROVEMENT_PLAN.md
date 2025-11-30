# NFTSol Quality Improvement Plan - Path to 100/100

**Project**: NFTSol NFT Marketplace on Solana
**Date**: November 30, 2025
**Goal**: Achieve 100/100 score across all 10 technical categories
**Current Score**: 83/100 (B+)
**Improvement Needed**: 17 points across all areas

---

## Executive Summary

This document provides a comprehensive roadmap to transform NFTSol from B+ (83/100) to A+ (100/100) across all technical evaluation categories. The plan is organized by priority level and estimated effort.

**Key Statistics**:
- Total Estimated Effort: **200-250 developer hours**
- Critical Issues to Fix: **5 items** (20-30 hours)
- High Priority Items: **10 items** (60-80 hours)
- Medium Priority Items: **12 items** (80-100 hours)
- Timeline: **6-8 weeks** for 1 full-time developer

---

## Progress Summary

### ✅ Completed (Session 1)
1. **Anchor Program Compilation** - Fixed spl-token-2022 dependency conflicts
2. **CI/CD Test Blocking** - Removed `continue-on-error` flags so tests block deployments
3. **Cargo.lock Cleanup** - Fresh build for Solana smart contracts

### 📋 Pending (This Session)
1. Server consolidation
2. Test coverage implementation
3. Structured logging
4. TypeScript strict mode
5. index.ts refactoring
6. And 20+ more items

---

## Category-by-Category Improvement Plan

### 1. TESTING (Current: 65/100 → Target: 100/100) **[CRITICAL]**

**Current State**:
- Test coverage: <5% (CRITICAL GAP)
- CI doesn't block on test failures (FIXED ✅)
- No unit tests for services
- No E2E test suite
- No integration tests

**Required Work** (Est: 25-30 hours):

#### Phase 1: Backend Testing (15 hours)
```
Backend Test Structure to Implement:
├── Unit Tests (services, utilities)
│   ├── nftService.test.ts
│   ├── walletService.test.ts
│   ├── solanaService.test.ts
│   ├── cloutService.test.ts
│   └── ... (all services)
├── Route Tests
│   ├── routes/nfts.test.ts
│   ├── routes/wallets.test.ts
│   ├── routes/mint.test.ts
│   └── ... (all routes)
└── Integration Tests
    ├── database.test.ts
    ├── solana-integration.test.ts
    └── workflow.test.ts
```

**Implementation Steps**:
1. Add Jest configuration to `apps/backend/jest.config.js`
2. Setup test database (separate from production)
3. Create test utilities and fixtures
4. Write service layer tests (each service: 1-2 hours)
5. Write route handler tests (each route: 30-60 minutes)
6. Target: 80%+ line coverage

**Files to Create**:
```
apps/backend/src/__tests__/
├── services/
│   ├── nftService.test.ts
│   ├── walletService.test.ts
│   ├── solanaService.test.ts
│   ├── heliusService.test.ts
│   ├── cloutService.test.ts
│   └── ...
├── routes/
│   ├── nfts.test.ts
│   ├── wallets.test.ts
│   ├── mint.test.ts
│   ├── clout.test.ts
│   └── ...
├── middleware/
│   ├── validation.test.ts
│   ├── security.test.ts
│   └── ...
└── utils/
    ├── validation.test.ts
    └── logger.test.ts
```

#### Phase 2: Frontend Testing (10 hours)
```
Frontend Test Structure:
├── Component Tests
│   ├── MintForm.test.tsx
│   ├── NftGrid.test.tsx
│   ├── WalletConnect.test.tsx
│   └── ... (major components)
├── Hook Tests
│   ├── useNfts.test.ts
│   ├── useWallet.test.ts
│   └── ... (all hooks)
└── Service Tests
    ├── nftService.test.ts
    ├── walletService.test.ts
    └── apiService.test.ts
```

**Implementation**:
1. Update `client/vitest.config.ts` for React Testing Library
2. Create test utilities and mock providers
3. Write component tests for major components
4. Write hook tests for custom React hooks
5. Write service layer tests
6. Target: 70%+ coverage

**Implementation Timeline**:
- Week 1: Backend unit tests (15 hours)
- Week 2: Frontend + integration tests (10 hours)
- Week 3: Increase coverage to 80%+ (5 hours)

---

### 2. CODE QUALITY - Logging (Current: 80/100 → Target: 100/100) **[CRITICAL]**

**Current State**:
- 560+ console.log statements in production code
- No structured logging
- No log levels (ERROR, WARN, INFO, DEBUG)
- No log aggregation support
- Difficult to trace requests across services

**Required Work** (Est: 6-8 hours):

#### Action Items:
1. **Install Winston** (structured logging library)
```bash
npm install winston winston-daily-rotate-file
```

2. **Create logger utility** (`apps/backend/src/utils/logger.ts`):
```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'nftsol-backend' },
  transports: [
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error'
    }),
    new winston.transports.File({
      filename: 'logs/combined.log'
    }),
    new winston.transports.DailyRotateFile({
      filename: 'logs/daily-%DATE%.log',
      datePattern: 'YYYY-MM-DD'
    })
  ],
});

// Add console for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

export default logger;
```

3. **Replace all console.log calls**:
   - `console.log()` → `logger.info()`
   - `console.error()` → `logger.error()`
   - `console.warn()` → `logger.warn()`
   - `console.debug()` → `logger.debug()`

4. **Add request logging middleware**:
```typescript
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`, {
    requestId: req.headers['x-request-id'],
    userAgent: req.headers['user-agent']
  });
  next();
});
```

5. **Files to update** (560 instances across):
   - `apps/backend/src/index.ts` (~150 logs)
   - `apps/backend/src/routes/*.ts` (~200 logs)
   - `apps/backend/src/services/*.ts` (~150 logs)
   - `apps/backend/src/lib/*.ts` (~60 logs)

**Timeline**: 1-2 days for one developer

---

### 3. ARCHITECTURE - Server Consolidation (Current: 85/100 → Target: 100/100) **[CRITICAL]**

**Current State**:
- Dual server structure: `/server` and `/apps/backend`
- Code duplication
- Maintenance burden
- Confusion about which code is active
- Total: ~150 files in `/server`

**Required Work** (Est: 20-24 hours):

#### Phase 1: Audit (2 hours)
```bash
# Find what's unique in /server
# Identify overlaps with /apps/backend
# Document which routes are active
```

#### Phase 2: Consolidation (20 hours)

**Step 1**: Identify all services in `/server` that aren't in `/apps/backend`:
- `ai-features-service.ts`
- `clout-system.ts`
- `enhanced-solana-api.ts`
- `external-apis.ts`
- `helius-api.ts`
- `magic-eden-api.ts`
- `moralis-api.ts`
- `recommendation-engine.ts`
- `pricing-analytics.ts`
- And more...

**Step 2**: Move to `/apps/backend/src/services/`:
```bash
cp /server/ai-features-service.ts /apps/backend/src/services/
cp /server/clout-system.ts /apps/backend/src/services/
# ... etc for all unique services
```

**Step 3**: Update import paths in `/apps/backend/src/index.ts`

**Step 4**: Run tests to verify all routes still work

**Step 5**: Delete `/server` directory
```bash
rm -rf /server
```

**Step 6**: Update `.gitignore` to ensure `/server` doesn't come back

**Timeline**: 1 week for code review + migration

---

### 4. TYPESCRIPT STRICT MODE (Current: 80/100 → Target: 100/100)

**Current State**:
- `@ts-nocheck` directives in 8 files
- `noImplicitAny: false` in client/tsconfig.json
- Several `any` types used implicitly
- Weak type safety in problematic areas

**Required Work** (Est: 4-6 hours):

#### Phase 1: Fix Type Issues in 8 Files (3 hours)

Files with `@ts-nocheck`:
1. `client/src/components/FloorPriceChart.tsx`
2. `client/src/components/VirtualizedNFTGrid.tsx`
3. `client/src/lib/solana-optimized.ts`
4. `client/src/hooks/useNfts.ts`
5. `client/src/hooks/useOptimizedNFTQuery.ts`
6. `client/src/services/nftService.ts`
7. `client/src/services/walletService.ts`
8. `shared/validation/schemas.ts`

**For each file**:
1. Remove `// @ts-nocheck`
2. Fix type errors:
   - Add proper type annotations
   - Use `unknown` instead of `any`
   - Update React Query v5 API (removed `onSuccess`)
   - Fix library incompatibilities
3. Run `npm run type-check` to verify

**Example Fix - useOptimizedNFTQuery.ts**:
```typescript
// BEFORE (with @ts-nocheck)
onSuccess: (data) => {
  if (data.hasMore) {
    queryClient.prefetchQuery({...});
  }
}

// AFTER (React Query v5 - no onSuccess)
// Use useEffect hook instead:
useEffect(() => {
  if (data?.hasMore) {
    queryClient.prefetchQuery({...});
  }
}, [data, queryClient]);
```

#### Phase 2: Enable Strict Mode (1 hour)

**Update `client/tsconfig.json`**:
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictPropertyInitialization": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true
  }
}
```

**Timeline**: 3-4 days

---

### 5. CODE REFACTORING - index.ts (Current: 80/100 → Target: 100/100) **[CRITICAL]**

**Current State**:
- `apps/backend/src/index.ts`: 1999 lines
- Monolithic file with all concerns mixed
- Difficult to maintain and test
- Hard to understand dataflow

**Ideal Structure** (After refactoring):
```
apps/backend/src/
├── index.ts (50-100 lines - entry point only)
├── app.ts (Express app setup)
├── middleware/
│   ├── security.ts (helmet, CORS, CSP)
│   ├── compression.ts
│   ├── logging.ts
│   ├── csrf.ts
│   ├── validation.ts
│   ├── rate-limiting.ts
│   └── error-handling.ts
├── initialization/
│   ├── database.ts
│   ├── solana.ts
│   ├── helius.ts
│   ├── secrets.ts
│   ├── monitoring.ts
│   └── swagger.ts
├── health/
│   ├── health-checks.ts
│   └── status-endpoints.ts
├── routes/
│   ├── index.ts (mount all routers)
│   └── (all existing route files)
└── utils/
    ├── csrf.ts
    ├── validation.ts
    ├── logger.ts
    └── errors.ts
```

**Required Work** (Est: 12-16 hours):

#### Step 1: Extract Middleware Setup (3 hours)
Create `apps/backend/src/middleware/setup.ts`:
- Session middleware setup
- Helmet/CORS/CSP configuration
- Compression middleware
- Trust proxy setup
- All middleware ordering logic

#### Step 2: Extract Initialization Logic (4 hours)
Create files in `apps/backend/src/initialization/`:
- Database connection
- Solana services (Web3.js Connection)
- Helius optimization
- RPC failover setup
- Sentry setup
- Swagger documentation loading

#### Step 3: Extract Health Checks (2 hours)
Create `apps/backend/src/health/endpoints.ts`:
- All health check logic
- Database health
- Solana RPC health
- Combined health status

#### Step 4: Extract Route Registration (2 hours)
Create `apps/backend/src/routes/register.ts`:
- All `app.use()` and `app.get()` calls
- Route mounting in logical order
- API documentation routes

#### Step 5: Refactor Main index.ts (3 hours)
New simplified `apps/backend/src/index.ts`:
```typescript
import express from 'express';
import { initializeApp } from './initialization';
import { setupMiddleware } from './middleware/setup';
import { registerRoutes } from './routes/register';
import { setupHealthChecks } from './health/endpoints';
import { appConfig } from './config';

const app = express();

// Initialize all services
await initializeApp();

// Setup middleware
setupMiddleware(app);

// Register routes
registerRoutes(app);

// Setup health checks
setupHealthChecks(app);

// Start server
const PORT = appConfig.port;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

**Timeline**: 2-3 weeks with code review

---

### 6. DATABASE - Migrations (Current: 75/100 → Target: 100/100)

**Current State**:
- No migration tooling
- Database changes are ad-hoc
- No version control for schema changes
- Difficult to track schema evolution
- Hard to replicate production schema locally

**Required Work** (Est: 8-10 hours):

#### Setup Drizzle Migrations:
```bash
npm install -D drizzle-kit
```

#### Create migration files:
```typescript
// apps/backend/src/db/migrations/0001_initial_schema.ts
import { sql } from 'drizzle-orm';

export async function up(db) {
  await db.schema
    .createTable('users')
    .addColumn('id', 'uuid', (col) => col.primaryKey())
    .addColumn('wallet_address', 'text', (col) => col.notNull().unique())
    .addColumn('created_at', 'timestamp', (col) => col.notNull().defaultNow())
    .execute();
}

export async function down(db) {
  await db.schema.dropTable('users').execute();
}
```

#### Track all existing tables:
1. Users table
2. NFTs table
3. Transactions table
4. CLOUT rewards table
5. Echo ledgers table
6. And others...

#### Create package.json scripts:
```json
{
  "scripts": {
    "db:migrate": "drizzle-kit up --config drizzle.config.ts",
    "db:generate": "drizzle-kit generate:pg --config drizzle.config.ts",
    "db:studio": "drizzle-kit studio --config drizzle.config.ts"
  }
}
```

**Timeline**: 1 week

---

### 7. AUTHENTICATION - JWT Refresh Tokens (Current: 80/100 → Target: 100/100)

**Current State**:
- No token refresh mechanism
- JWTs likely have long expiration
- Security risk for compromised tokens
- Users can't refresh expired tokens

**Required Work** (Est: 4-6 hours):

#### Implementation:
```typescript
// apps/backend/src/services/auth.ts

export async function generateTokenPair(userId: string) {
  const accessToken = jwt.sign(
    { userId, type: 'access' },
    process.env.JWT_SECRET!,
    { expiresIn: '15m' } // Short-lived
  );

  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: '7d' } // Longer-lived
  );

  // Store refresh token in database
  await db.refreshTokens.create({
    userId,
    token: hashToken(refreshToken),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  });

  return { accessToken, refreshToken };
}

export async function refreshToken(refreshToken: string) {
  // Verify token signature
  const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!);

  // Check if token exists in DB and not revoked
  const storedToken = await db.refreshTokens.findOne({
    userId: decoded.userId,
    token: hashToken(refreshToken)
  });

  if (!storedToken) {
    throw new Error('Refresh token not found or revoked');
  }

  // Generate new pair
  return generateTokenPair(decoded.userId);
}
```

#### Create endpoints:
- `POST /api/auth/refresh` - Refresh token endpoint
- `POST /api/auth/logout` - Revoke refresh token

#### Update database schema:
```typescript
// Add refresh_tokens table
```

**Timeline**: 2-3 days

---

### 8. API VERSIONING (Current: 78/100 → Target: 100/100)

**Current State**:
- No API versioning
- All endpoints under `/api/`
- Hard to deprecate endpoints
- Breaking changes affect all clients

**Required Work** (Est: 6-8 hours):

#### Strategy: Implement `/v1/` namespace

**Step 1**: Create versioned route structure
```
apps/backend/src/routes/
├── v1/
│   ├── index.ts (mount all v1 routes)
│   ├── nfts.ts
│   ├── wallets.ts
│   ├── mint.ts
│   ├── clout.ts
│   └── ...
└── (keep v0 routes for backward compat temporarily)
```

**Step 2**: Update index.ts to mount v1:
```typescript
import v1Router from './routes/v1';

app.use('/api/v1', v1Router);
// For backward compatibility temporarily:
app.use('/api', v1Router);
```

**Step 3**: Document API versioning policy:
- Versions are maintained for 6-12 months
- Old versions deprecated in changelog
- Breaking changes require new major version

**Step 4**: Update API documentation to show multiple versions

**Timeline**: 1 week

---

### 9. ERROR HANDLING & DOCUMENTATION (Current: 75/100 → Target: 100/100)

**Current State**:
- Inconsistent error responses
- No standardized error codes
- No error documentation
- Hard to debug client issues

**Required Work** (Est: 5-7 hours):

#### Create Error Code Registry

**File**: `apps/backend/src/errors/codes.ts`
```typescript
export const ERROR_CODES = {
  // Wallet errors
  WALLET_NOT_FOUND: 'WALLET_001',
  INVALID_WALLET_ADDRESS: 'WALLET_002',
  WALLET_BALANCE_INSUFFICIENT: 'WALLET_003',

  // NFT errors
  NFT_NOT_FOUND: 'NFT_001',
  NFT_ALREADY_MINTED: 'NFT_002',
  INVALID_METADATA: 'NFT_003',

  // Solana errors
  SOLANA_RPC_ERROR: 'SOLANA_001',
  TRANSACTION_FAILED: 'SOLANA_002',
  BLOCKHASH_EXPIRED: 'SOLANA_003',

  // Auth errors
  UNAUTHORIZED: 'AUTH_001',
  TOKEN_EXPIRED: 'AUTH_002',
  INVALID_SIGNATURE: 'AUTH_003',

  // General errors
  INTERNAL_SERVER_ERROR: 'SERVER_001',
  VALIDATION_ERROR: 'SERVER_002',
  RATE_LIMITED: 'SERVER_003'
};
```

#### Standardize Error Response Format

```typescript
// All errors should return:
{
  "success": false,
  "error": {
    "code": "NFT_001",
    "message": "NFT not found",
    "details": {
      "mintAddress": "...",
      "attempted_lookup_time": "2025-11-30T..."
    },
    "suggestion": "Verify the NFT mint address and try again"
  }
}
```

#### Create Error Documentation

**File**: `ERROR_REFERENCE.md`
- All error codes with descriptions
- How to handle each error on frontend
- Example errors and fixes

**Timeline**: 1 week

---

### 10. MONITORING & PERFORMANCE (Current: 85/100 → Target: 100/100)

**Current State**:
- No APM (Application Performance Monitoring)
- No distributed tracing
- No error tracking beyond logs
- No performance metrics

**Required Work** (Est: 8-10 hours):

#### Setup Sentry

```bash
npm install @sentry/node @sentry/tracing
```

**Configuration** (`apps/backend/src/config/sentry.ts`):
```typescript
import * as Sentry from '@sentry/node';

export function initSentry() {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.OnUncaughtException(),
      new Sentry.Integrations.OnUnhandledRejection()
    ]
  });
}

// In middleware:
app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());
```

#### Add Performance Monitoring

```typescript
// Track slow database queries
db.on('query', (query) => {
  if (query.duration > 1000) {
    logger.warn('Slow query detected', {
      sql: query.sql,
      duration: query.duration
    });
  }
});

// Track RPC requests
const recordRpcDuration = (method: string, duration: number) => {
  if (duration > 5000) {
    logger.warn('Slow RPC call', { method, duration });
  }
};
```

#### Create Monitoring Dashboard

- Track error rates by endpoint
- Monitor RPC response times
- Database query performance
- Transaction success rates
- API latency percentiles (p50, p95, p99)

**Timeline**: 1 week

---

## Implementation Timeline (Recommended Phases)

### Phase 1: Foundation (Weeks 1-2) - 40 hours
**Priority: CRITICAL**
- [ ] Fix test blocking (DONE ✅)
- [ ] Replace console.log with structured logging (6-8 hrs)
- [ ] Add basic test framework (5 hrs)
- [ ] Document error codes (5 hrs)
- [ ] Setup Sentry (4 hrs)
- [ ] Update documentation (3 hrs)

**Deliverable**: Logs are searchable, basic tests pass, errors are tracked

---

### Phase 2: Quality Assurance (Weeks 3-4) - 50 hours
**Priority: HIGH**
- [ ] Write 80+ test cases for services (15 hrs)
- [ ] Write 40+ test cases for routes (12 hrs)
- [ ] Setup test database (3 hrs)
- [ ] Implement JWT refresh tokens (4 hrs)
- [ ] Add API versioning (6 hrs)
- [ ] Increase overall test coverage (10 hrs)

**Deliverable**: 40%+ test coverage, token refresh working, API versioned

---

### Phase 3: Architecture (Weeks 5-6) - 60 hours
**Priority: HIGH**
- [ ] Consolidate servers (/server → /apps/backend) (24 hrs)
- [ ] Refactor 1999-line index.ts (16 hrs)
- [ ] Remove @ts-nocheck directives (4 hrs)
- [ ] Setup database migrations (8 hrs)
- [ ] Update all imports and test (8 hrs)

**Deliverable**: Single server codebase, modular structure, migrations working

---

### Phase 4: Polish (Weeks 7-8) - 50 hours
**Priority: MEDIUM**
- [ ] Increase test coverage to 80%+ (20 hrs)
- [ ] Add feature flags system (8 hrs)
- [ ] Implement caching layer (Redis) (12 hrs)
- [ ] Create comprehensive API docs (Swagger) (10 hrs)

**Deliverable**: 80%+ test coverage, comprehensive documentation, optimized performance

---

## Success Metrics

| Category | Current | Target | Success Criteria |
|----------|---------|--------|------------------|
| Testing | 65 | 100 | 80%+ code coverage, all tests passing |
| Code Quality | 80 | 100 | <2 console.logs, structured logging everywhere |
| Architecture | 85 | 100 | Single server, modular, <300 lines per file |
| TypeScript | 80 | 100 | No @ts-nocheck, strict mode enabled |
| Error Handling | 75 | 100 | All errors have codes, documented |
| Security | 88 | 100 | Secrets never exposed, rate limits enforced |
| DevOps | 90 | 100 | Zero-downtime deployments, full monitoring |
| Documentation | 92 | 100 | OpenAPI + all error codes documented |
| Performance | 85 | 100 | p99 latency <500ms, RPC failover working |
| Dependencies | 78 | 100 | All vulnerabilities patched, no @ts-nocheck |

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|-----------|
| Breaking changes during refactoring | Medium | High | Comprehensive tests before + after |
| Data loss during migration | Low | Critical | Backup database, test migrations staging first |
| Performance regression | Medium | Medium | APM monitoring + benchmarks |
| Incomplete test coverage | Medium | Medium | Require PR reviews + coverage gates |

---

## Resource Requirements

**Developer**: 1 Full-time (preferred) or 2 Part-time
**Timeline**: 6-8 weeks for 100/100
**Cost**: ~$15,000-$20,000 (consultant + tools)
**Tools Needed**:
- Sentry (error tracking)
- New Relic or Datadog (APM)
- GitHub Copilot (code assistance)
- JetBrains IDE (refactoring tools)

---

## Next Steps

1. **Immediate** (This Week):
   - [ ] Start Phase 1 work (logging, tests, Sentry)
   - [ ] Review this plan and adjust priorities
   - [ ] Setup test infrastructure

2. **Short Term** (Weeks 2-4):
   - [ ] Complete Phase 1 & 2
   - [ ] Get test coverage to 40%+
   - [ ] Implement JWT refresh

3. **Medium Term** (Weeks 5-8):
   - [ ] Complete Phase 3 (consolidation)
   - [ ] Refactor index.ts
   - [ ] Get coverage to 80%+

4. **Before Production Release**:
   - [ ] All audit findings addressed
   - [ ] 100% passing CI/CD
   - [ ] Full monitoring active
   - [ ] Disaster recovery tested

---

## Appendix: Quick Reference Commands

```bash
# Testing
npm run test:coverage          # Generate coverage report
npm run test:watch            # Watch mode for TDD

# Logging
npm run logs:view             # View recent logs
npm run logs:errors           # View only errors

# Database
npm run db:migrate            # Run pending migrations
npm run db:rollback           # Rollback last migration
npm run db:studio             # Visualize schema

# Code Quality
npm run type-check            # Check TypeScript
npm run lint                  # Run ESLint
npm run format                # Format with Prettier

# Deployment
npm run build                 # Production build
npm run start:prod            # Start production server
npm run health:check          # Check all services
```

---

**Document Version**: 1.0
**Last Updated**: November 30, 2025
**Next Review**: December 15, 2025

For questions or updates, contact: development team
