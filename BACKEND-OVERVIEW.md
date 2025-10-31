# Backend Comprehensive Overview

**Last Updated:** Generated from comprehensive codebase analysis  
**Backend Path:** `apps/backend/`  
**Status:** ✅ Production Ready

---

## 📋 Table of Contents

1. [Project Structure](#project-structure)
2. [Configuration System](#configuration-system)
3. [Environment Variables](#environment-variables)
4. [Dependencies](#dependencies)
5. [Services Architecture](#services-architecture)
6. [API Routes & Endpoints](#api-routes--endpoints)
7. [Security Configuration](#security-configuration)
8. [Database Configuration](#database-configuration)
9. [Solana/Blockchain Integration](#solana-blockchain-integration)
10. [Logging & Monitoring](#logging--monitoring)
11. [Deployment Configuration](#deployment-configuration)

---

## 🏗️ Project Structure

```
apps/backend/
├── src/
│   ├── index.ts              # Main entry point (app.ts wrapper)
│   ├── app.ts                # Express app (production-ready)
│   ├── app-production.ts     # Alternative production setup
│   ├── server-production.ts  # Production server
│   ├── config/
│   │   ├── index.ts          # Main configuration loader
│   │   └── programs.ts       # Solana program IDs
│   ├── lib/
│   │   ├── db.ts             # PostgreSQL connection pool
│   │   └── solana.ts         # Solana connection & utilities
│   ├── middleware/
│   │   └── security.ts       # Security middleware (CORS, Helmet, Rate Limiting)
   ├── routes/
│   │   ├── admin/
│   │   │   └── withdrawals.ts
│   │   ├── clout.ts          # CLOUT token routes
│   │   ├── echo.ts           # Echo service routes
│   │   ├── nfts.ts           # NFT operations
│   │   ├── orb.ts            # Orb service routes
│   │   └── withdrawals.ts   # User withdrawal routes
│   ├── services/
│   │   ├── cloutToken.ts     # CLOUT token service
│   │   ├── eternalEchoesService.ts
│   │   ├── fheService.ts     # Fully Homomorphic Encryption
│   │   ├── nft.ts            # NFT service
│   │   ├── orbService.ts     # Orb service
│   │   └── solana.ts         # Solana service wrapper
│   ├── types/
│   │   ├── echo.ts
│   │   ├── index.ts
│   │   └── jsonwebtoken.d.ts
│   ├── utils/
│   │   ├── cloudflare-ai.ts
│   │   ├── clout-vault.ts
│   │   ├── grokpedia-*.ts    # Multiple Grok implementations
│   │   ├── irysUpload.ts
│   │   ├── logger.ts         # Winston-based logging
│   │   └── validation.ts
│   ├── workers/
│   │   └── reconciliation.ts
│   └── schema.ts
├── dist/                     # Compiled JavaScript
├── migrations/               # Database migrations
├── scripts/                 # Utility scripts
├── package.json
└── tsconfig.json
```

---

## ⚙️ Configuration System

### Configuration Files

1. **`src/config/index.ts`** - Main configuration loader
   - Loads environment variables via `dotenv`
   - Validates required variables in production
   - Provides typed configuration objects
   - Sets defaults for development

2. **`src/config/programs.ts`** - Solana Program IDs
   - Defines program constants
   - Environment-based overrides

### Configuration Objects

#### `appConfig`
```typescript
{
  port: number                    // Server port (default: 3000)
  nodeEnv: 'development'    // Environment mode
  cors: {
    origin: string[]             // Allowed origins
    credentials: boolean         // Enable credentials
  }
  rateLimit: {
    windowMs: number             // Time window (default: 15 min)
    max: number                  // Max requests (default: 100)
  }
  fileUpload: {
    maxSize: number              // Max file size (default: 10MB)
    allowedTypes: string[]       // Allowed MIME types
  }
}
```

#### `solanaConfig`
```typescript
{
  rpcUrl: string                 // Solana RPC endpoint
  commitment: 'confirmed'       // Transaction commitment
  cluster: 'devnet' | 'mainnet' // Solana cluster
}
```

#### `databaseConfig`
```typescript
{
  url: string                    // PostgreSQL connection string
  ssl: boolean                   // Enable SSL (production)
  pool: {
    min: number                  // Min pool connections (2)
    max: number                  // Max pool connections (10)
  }
}
```

#### `programConfig`
```typescript
{
  cloutProgramId: string         // CLOUT program ID
  marketProgramId: string        // Marketplace program ID
  loyaltyProgramId: string       // Loyalty program ID
  rewardsVault: string           // Rewards vault address
}
```

#### `withdrawalConfig`
```typescript
{
  solanaRpcUrl: string
  platformSecretKeyBase58: string
  platformSecretKeyJson: string
  autoApproveLamports: number   // Auto-approve threshold (0.1 SOL)
  dailyLimitLamports: number    // Daily limit (5 SOL)
  rateLimitWindowMs: number     // Rate limit window (15 min)
  rateLimitMax: number          // Max requests per window (5)
}
```

---

## 🔐 Environment Variables

### Required (Production)

| Variable | Description | Default (Dev) | Example |
|----------|-------------|---------------|---------|
| `NODE_ENV` | Environment mode | `development` | `production` |
| `PORT` | Server port | `3000` | `3000` |
| `SOLANA_RPC_DEVNET` | Solana RPC URL | `https://api.devnet.solana.com` | `https://api.mainnet-beta.solana.com` |
| `CLOUT_PROGRAM_ID` | CLOUT program address | `62hWQAgAV4jugHSuZsMqzxZNVXaVLrbRpz3Sw58Z64Mw` | - |
| `MARKET_PROGRAM_ID` | Marketplace program | `HTs1hErzM8MywaUojfUY7QA1T6gLQD977R3HsCnKj7m7` | - |
| `LOYALTY_PROGRAM_ID` | Loyalty program | `2TujfT3Czd2ncawJ6ZLmfGeJ2t1Ugb9bqEvxSE2EKoo9` | - |
| `REWARDS_VAULT` | Rewards vault address | `2KkNwFZbznAtYX1xjVS6e5BBqQnfaBuTjn42G4zJXAps` | - |

### Database

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `DATABASE_URL` | PostgreSQL connection string | None (required in prod) | `postgresql://user:pass@host:5432/db` |

### Solana/Blockchain

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `SOLANA_RPC_URL` | Solana RPC endpoint | `https://api.devnet.solana.com` | `https://api.mainnet-beta.solana.com` |
| `SOLANA_CLUSTER` | Solana cluster | `devnet` | `mainnet-beta` |
| `PLATFORM_SECRET_KEY_BASE58` | Platform wallet (Base58) | None | `base58_encoded_key` |
| `PLATFORM_SECRET_KEY_JSON` | Platform wallet (JSON) | None | `[1,2,3,...]` |
| `HELIUS_API_KEY` | Helius API key | None | - |
| `HELIUS_RPC_URL` | Helius RPC URL | None | - |

### Security & Authentication

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `JWT_SECRET` | JWT signing secret | None (required) | Random string |
| `SESSION_SECRET` | Session secret | None | Random string |
| `BCRYPT_ROUNDS` | Bcrypt rounds | `10` (dev), `12` (prod) | `12` |
| `ALLOWED_ORIGINS` | CORS allowed origins | `http://localhost:5173,...` | `https://nftsol.app` |
| `CORS_ORIGINS` | Alternative CORS config | - | Comma-separated |

### Withdrawal Configuration

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `WITHDRAWAL_AUTO_APPROVE_LAMPORTS` | Auto-approve threshold | `100000000` (0.1 SOL) | - |
| `WITHDRAWAL_DAILY_LIMIT_LAMPORTS` | Daily withdrawal limit | `5000000000` (5 SOL) | - |
| `WITHDRAWAL_RATE_LIMIT_WINDOW_MS` | Rate limit window | `900000` (15 min) | - |
| `WITHDRAWAL_RATE_LIMIT_MAX` | Max requests per window | `5` | - |
| `WITHDRAWALS_PAUSED` | Emergency pause | `false` | `true` |
| `MAX_SINGLE_WITHDRAWAL_LAMPORTS` | Max single withdrawal | `10000000000` (10 SOL) | - |
| `MAX_DAILY_PER_USER_LAMPORTS` | Max daily per user | `50000000000` (50 SOL) | - |

### AI/ML Services

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `XAI_API_KEY` | xAI Grok API key | None | - |
| `XAI_MODEL` | xAI model | `grok-beta` | - |
| `GROK_MODE` | Grok mode | - | `heuristic` |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID | None | - |
| `CLOUDFLARE_AI_TOKEN` | Cloudflare AI token | None | - |

### File Upload

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `MAX_FILE_SIZE` | Max upload size | `10MB` | `50MB` |
| `ALLOWED_FILE_TYPES` | Allowed file types | `image/jpeg,image/png...` | - |
| `UPLOAD_DIR` | Upload directory | `./uploads` | - |

### Redis (Optional)

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `REDIS_URL` | Redis connection string | None | `redis://localhost:6379` |

### FHE (Fully Homomorphic Encryption)

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `FHE_ENABLED` | Enable FHE | `false` | `true` |
| `FHE_MOCK_MODE` | Use FHE mock | `true` | `false` |
| `FHE_NETWORK` | FHE network | `devnet` | `mainnet` |
| `FHE_PUBLIC_KEY` | FHE public key | None | - |
| `FHE_PRIVATE_KEY` | FHE private key | None | - |

### Monitoring & Logging

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `LOG_LEVEL` | Log level | `debug` (dev), `info` (prod) | `info` |
| `LOG_REQUESTS` | Enable request logging | `true` | `true` |
| `ENABLE_MONITORING` | Enable monitoring | `true` | `true` |

### Other

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `WS_ENABLED` | WebSocket enabled | `true` | `true` |
| `SECURE_COOKIES` | Secure cookies | `false` (dev) | `true` |
| `TRUST_PROXY` | Trust proxy | `false` (dev) | `true` |
| `RATE_LIMITING_ENABLED` | Rate limiting | `true` | `true` |
| `HELMET_ENABLED` | Helmet security | `true` | `true` |
| `REWARDS_OWNER` | Rewards owner wallet | Platform wallet | - |
| `PLATFORM_WALLET` | Platform wallet (alias) | Platform key | - |

---

## 📦 Dependencies

### Core Framework
- **express**: `^4.21.2` - Web framework
- **http**: Built-in - HTTP server
- **compression**: `^1.8.1` - Response compression
- **morgan**: `^1.10.1` - HTTP request logger

### Solana/Blockchain
- **@solana/web3.js**: `^1.98.4` - Solana JavaScript SDK
- **@solana/spl-token**: `^0.4.14` - SPL Token library
- **@solana/spl-account-compression**: `^0.4.1` - Account compression
- **@coral-xyz/anchor**: `^0.32.1` - Anchor framework
- **@metaplex-foundation/js**: `^0.19.0` - Metaplex SDK
- **@metaplex-foundation/mpl-bubblegum**: `^5.0.2` - Bubblegum NFTs
- **@metaplex-foundation/mpl-token-metadata**: `^3.4.0` - Token metadata
- **@irys/sdk**: `^0.2.11` - Arweave/Irys upload

### Database
- **pg**: `^8.11.3` - PostgreSQL client
- **postgres**: `^3.4.7` - Alternative PostgreSQL client
- **drizzle-orm**: `^0.44.6` - ORM
- **drizzle-kit**: `^0.31.6` - Drizzle tooling

### Security
- **helmet**: `^8.0.0` - Security headers
- **cors**: `^2.8.5` - CORS middleware
- **express-rate-limit**: `^7.4.1` - Rate limiting
- **bcryptjs**: `^3.0.2` - Password hashing
- **jsonwebtoken**: `^9.0.2` - JWT tokens

### Utilities
- **axios**: `^1.7.9` - HTTP client
- **dotenv**: `^16.6.1` - Environment variables
- **nanoid**: `^5.0.8` - ID generation
- **bs58**: `^5.0.0` - Base58 encoding
- **zod**: `^3.25.76` - Schema validation
- **express-validator**: `^7.1.0` - Request validation
- **winston**: `^3.11.0` - Logging
- **sharp**: `^0.33.0` - Image processing

### AI/ML
- **openai**: `^6.7.0` - OpenAI SDK (for xAI compatibility)

### File Handling
- **multer**: `^2.0.2` - File upload middleware

### Dev Dependencies
- **typescript**: `^5.9.3`
- **ts-node-dev**: `^2.0.0` - Development runner
- **@types/node**: `^24.9.2`
- **jest**: `^29.7.0` - Testing
- **eslint**: `^8.57.0` - Linting

---

## 🏛️ Services Architecture

### Service Layer (`src/services/`)

#### 1. **solanaService** (`solana.ts`)
- Solana blockchain interactions
- Health checks
- Balance queries
- Account existence checks
- Wrapper for Solana RPC operations

#### 2. **nftService** (`nft.ts`)
- NFT minting operations
- Metadata retrieval
- NFT queries by owner
- Mint request validation

#### 3. **cloutTokenService** (`cloutToken.ts`)
- CLOUT token operations
- Token transfers
- Balance queries
- Vault management

#### 4. **orbService** (`orbService.ts`)
- Orb (World ID) verification
- Human verification
- Proof validation
- Requires Helius API key

#### 5. **fheService** (`fheService.ts`)
- Fully Homomorphic Encryption
- Private computation
- Mock mode for development
- Configurable via env vars

#### 6. **eternalEchoesService** (`eternalEchoesService.ts`)
- Eternal Echoes feature
- (Implementation details in service file)

---

## 🛣️ API Routes & Endpoints

### Base Path: `/api/v1`

#### Health & Status
- `GET /healthz` - Full health check (Solana + Database)
- `GET /health` - Simple health check
- `GET /api/v1/programs` - Program configuration
- `GET /api/v1/solana/status` - Solana network status

#### NFT Operations
- `POST /api/v1/simple-mint` - Mint NFT (with file upload)
- `GET /api/v1/nft/:mintAddress` - Get NFT metadata
- `GET /api/v1/nfts/:owner` - Get NFTs by owner
- `GET /api/v1/nfts/*` - NFT router (additional routes)

#### Wallet Operations
- `GET /api/v1/wallet/:address` - Get wallet info & balance

#### Market & Collections
- `GET /api/v1/market` - Marketplace listings
- `GET /api/v1/collections` - NFT collections

#### Withdrawals
- `POST /api/v1/wallets/withdraw` - Request withdrawal (authenticated)
  - Rate limited: 5 requests per 15 minutes
  - Requires JWT authentication
  - Emergency pause support

#### Admin (Authenticated + Admin Role)
- `GET /api/v1/admin/withdrawals` - List withdrawals
- `POST /api/v1/admin/withdrawals/:id/approve` - Approve withdrawal
- `POST /api/v1/admin/withdrawals/:id/reject` - Reject withdrawal
- `GET /api/v1/admin/emergency/status` - Emergency controls status
- `POST /api/v1/admin/emergency/pause-withdrawals` - Toggle withdrawals

#### Echo Service
- `POST /api/echo/*` - Echo service routes
- Various echo endpoints for testing/debugging

#### Orb Service
- `POST /api/orb/*` - Orb verification routes
- Human verification endpoints

#### CLOUT Routes
- `GET /api/clout/*` - CLOUT token routes
- Token operations, balances, rewards

---

## 🔒 Security Configuration

### Middleware Stack (`src/middleware/security.ts`)

#### CORS Configuration
```typescript
origin: process.env.CORS_ORIGINS || allowedOrigins
credentials: true
methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
```

#### Helmet Security
- Content Security Policy (customized)
- XSS protection
- MIME type sniffing prevention
- Frame options

#### Rate Limiting
- **General**: 100 requests / minute
- **Auth**: 20 requests / minute
- **API**: 300 requests / minute
- **Upload**: 30 requests / minute
- **Withdrawals**: 5 requests / 15 minutes

#### Security Headers
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: no-referrer`

#### Authentication
- JWT-based authentication
- Token in `Authorization: Bearer <token>` header
- Admin role verification
- Request ID tracking

#### Input Sanitization
- Request body sanitization
- File upload validation
- CSRF protection
- Wallet address validation

#### File Upload Security
- Max size: 10MB (configurable)
- Allowed types: `image/jpeg`, `image/png`, `image/gif`, `image/webp`
- Memory storage (no disk writes)

---

## 🗄️ Database Configuration

### Connection Pool (`src/lib/db.ts`)

#### Configuration
```typescript
{
  connectionString: process.env.DATABASE_URL,
  max: 20,                      // Max connections
  idleTimeoutMillis: 30000,     // 30 seconds
  connectionTimeoutMillis: 2000 // 2 seconds
}
```

#### Features
- Connection pooling
- Automatic reconnection
- Error handling
- Mock mode for development (when DATABASE_URL not set)
- Health check support

#### Migrations
- Located in `migrations/` directory
- SQL-based migrations
- Example: `20251028_add_withdrawals.sql`

### Database Schema
- Uses Drizzle ORM
- Schema definitions in `src/schema.ts` (currently minimal)

---

## ⛓️ Solana/Blockchain Integration

### Connection (`src/lib/solana.ts`)

#### Configuration
```typescript
RPC_URL: process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com'
COMMITMENT: 'confirmed'
```

#### Platform Wallet
- Loads from `PLATFORM_SECRET_KEY_BASE58` or `PLATFORM_SECRET_KEY_JSON`
- Lazy loading (prevents startup failures)
- Used for:
  - NFT minting
  - SOL transfers
  - Transaction signing

#### Metaplex Integration
- Configured with platform keypair
- NFT creation and management
- Metadata operations

#### Program IDs (Default Devnet)
- **CLOUT**: `62hWQAgAV4jugHSuZsMqzxZNVXaVLrbRpz3Sw58Z64Mw`
- **Market**: `HTs1hErzM8MywaUojfUY7QA1T6gLQD977R3HsCnKj7m7`
- **Loyalty**: `2TujfT3Czd2ncawJ6ZLmfGeJ2t1Ugb9bqEvxSE2EKoo9`
- **Rewards Vault**: `2KkNwFZbznAtYX1xjVS6e5BBqQnfaBuTjn42G4zJXAps`

#### Supported Operations
- Balance queries
- Account existence checks
- NFT minting
- SOL transfers
- Transaction confirmation
- Health checks

---

## 📊 Logging & Monitoring

### Logger (`src/utils/logger.ts`)

#### Log Levels
- `info` - General information
- `error` - Error messages
- `warn` - Warnings
- `debug` - Debug (dev only)

#### Log Formats
- **Development**: Human-readable with timestamps
- **Production**: JSON structured logs

#### Log Types

1. **Request Logger**
   - HTTP method, URL, status code
   - Response time
   - IP address, User-Agent

2. **Error Logger**
   - Error message & stack trace
   - Request context

3. **Audit Logger**
   - Security events
   - Authentication attempts
   - Admin actions

4. **Security Logger**
   - High-severity security events
   - Failed authentications
   - Rate limit violations

5. **Performance Logger**
   - Operation duration
   - Slow request warnings (>1s)

---

## 🚀 Deployment Configuration

### Build Configuration

#### TypeScript (`tsconfig.json`)
```json
{
  "module": "CommonJS",
  "moduleResolution": "Node",
  "strict": true,
  "forceConsistentCasingInFileNames": true,
  "rootDir": "./src",
  "outDir": "./dist"
}
```

#### Build Script
```bash
npm run build  # Compiles TypeScript to dist/
npm start      # Runs dist/index.js
```

### Production Files

#### `app-production.ts`
- Alternative production setup
- Redis integration support
- Enhanced security headers
- Optimized middleware stack

#### `server-production.ts`
- Production server wrapper
- Environment validation
- Graceful shutdown handling

### Environment Validation

#### Production Requirements
- All required env vars must be set
- Missing vars throw errors on startup
- Development defaults for non-critical vars

### Graceful Shutdown
- SIGTERM handler
- SIGINT handler
- Server close on shutdown
- Connection cleanup

### Health Checks
- `/healthz` - Full health check
- `/health` - Simple check
- Database connectivity check
- Solana network check

---

## 📝 Key Features

### ✅ Implemented
- RESTful API with versioning
- JWT authentication
- Role-based access control (Admin)
- Rate limiting (multiple tiers)
- File upload with validation
- Health monitoring
- Comprehensive logging
- Error handling
- Security headers
- CORS configuration
- Database connection pooling
- Solana blockchain integration
- NFT minting
- Withdrawal system with limits
- Emergency controls
- Request ID tracking
- Input sanitization

### 🔄 Supported Integrations
- Solana (Mainnet/Devnet)
- PostgreSQL
- Redis (optional)
- Helius API
- xAI Grok
- Cloudflare AI
- Irys/Arweave
- Metaplex
- Orb (World ID)
- FHE (Fully Homomorphic Encryption)

---

## 🔧 Development vs Production

### Development
- Mock database (if DATABASE_URL not set)
- Verbose logging
- Debug mode enabled
- Local CORS origins
- Development defaults for program IDs

### Production
- Required env vars validation
- Structured JSON logging
- Secure cookies
- Trust proxy enabled
- Production Solana endpoints
- SSL database connections
- Enhanced security headers

---

## 📈 Performance Optimizations

- Connection pooling (Database & Solana)
- Response compression
- Request ID tracking
- Slow request monitoring (>1s)
- Memory-based file uploads
- Lazy loading (platform keypair)
- Rate limiting to prevent abuse

---

## 🐛 Error Handling

- Centralized error middleware
- Request ID in error responses
- Context-aware error logging
- Security event logging
- User-friendly error messages (production)
- Detailed errors (development)

---

## 📚 Documentation Files

- `COMPLETE_WITHDRAWAL_SYSTEM.md` - Withdrawal system docs
- `RENDER_ENV_VARS.md` - Render deployment guide
- Code comments in service files
- Type definitions in `src/types/`

---

**Status**: ✅ Production Ready  
**Last Review**: Comprehensive codebase analysis  
**Next Steps**: Monitor performance, scale as needed

