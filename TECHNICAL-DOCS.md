# NFTSol Technical Documentation

**Version 1.0**  
**Last Updated:** October 2025

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Project Structure](#project-structure)
3. [Development Setup](#development-setup)
4. [API Reference](#api-reference)
5. [Database Schema](#database-schema)
6. [Blockchain Integration](#blockchain-integration)
7. [CLOUT Token System](#clout-token-system)
8. [Security Implementation](#security-implementation)
9. [Testing](#testing)
10. [Performance Optimization](#performance-optimization)

---

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Client)                    │
│  React 18 + TypeScript + Vite + Solana Wallet Adapter   │
│              Deployed: Netlify                         │
└─────────────────────┬───────────────────────────────────┘
                      │
                      │ HTTPS/REST API
                      │
┌─────────────────────▼───────────────────────────────────┐
│                  Backend (Server)                      │
│      Node.js + Express + TypeScript + PostgreSQL        │
│              Deployed: Render                          │
└─────────────────────┬───────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┬──────────────┐
        │             │             │              │
┌───────▼─────┐ ┌─────▼──────┐ ┌───▼────┐ ┌───────▼─────┐
│   Solana    │ │PostgreSQL  │ │ Redis  │ │   IPFS      │
│    RPC      │ │  Database  │ │ Cache  │ │  Storage    │
└─────────────┘ └───────────┘ └────────┘ └─────────────┘
```

### Technology Stack

#### Frontend
- **Framework**: React 18.3.1
- **Language**: TypeScript 5.6+
- **Build Tool**: Vite 5.4+
- **UI**: Tailwind CSS + Custom Design System
- **Wallet**: @solana/wallet-adapter-react
- **Blockchain**: @solana/web3.js 1.98+

#### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express 4.21+
- **Language**: TypeScript 5.9+
- **Database**: PostgreSQL with Drizzle ORM
- **Blockchain**: 
  - @solana/web3.js 1.98+
  - @metaplex-foundation/js 0.19+
  - @coral-xyz/anchor 0.32+
- **Storage**: IPFS via Pinata
- **Authentication**: JWT + Session Management

---

## Project Structure

```
NFTSol/
├── client/                     # Frontend application
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── CloutBadge.tsx
│   │   │   ├── Hero.tsx
│   │   │   ├── MintForm.tsx
│   │   │   ├── NftGrid.tsx
│   │   │   └── ...
│   │   ├── hooks/             # Custom React hooks
│   │   │   └── useCloutBalance.ts
│   │   ├── context/           # React contexts
│   │   ├── styles/            # CSS files
│   │   └── App.tsx            # Main application
│   ├── package.json
│   └── vite.config.ts
│
├── apps/
│   ├── backend/               # Backend API
│   │   ├── src/
│   │   │   ├── routes/        # API routes
│   │   │   │   ├── clout.ts
│   │   │   │   ├── nfts.ts
│   │   │   │   └── ...
│   │   │   ├── services/      # Business logic
│   │   │   │   ├── cloutToken.ts
│   │   │   │   └── ...
│   │   │   ├── utils/         # Utility functions
│   │   │   │   └── clout-vault.ts
│   │   │   ├── config/        # Configuration
│   │   │   │   └── index.ts
│   │   │   ├── lib/           # Library integrations
│   │   │   │   └── solana.ts
│   │   │   └── index.ts       # Entry point
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── smart-contracts/       # Solana programs
│       └── solana_rewards/
│           └── programs/
│               └── eternal_echoes/
│
└── README.md
```

---

## Development Setup

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Solana CLI (optional, for local testing)
- Git

### Local Development

#### 1. Clone Repository
```bash
git clone https://github.com/TheoryofShadows/nftsol.git
cd nftsol
```

#### 2. Backend Setup
```bash
cd apps/backend
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your configuration
# Set SOLANA_RPC_URL, DATABASE_URL, etc.

# Start development server
npm run dev
```

#### 3. Frontend Setup
```bash
cd client
npm install

# Copy environment template
cp .env.example .env

# Edit .env
# Set VITE_API_BASE=http://localhost:3001

# Start development server
npm run dev
```

### Environment Variables

#### Backend (.env)
```bash
# Server
NODE_ENV=development
PORT=3001

# Solana
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_CLUSTER=devnet

# CLOUT Token
CLOUT_PROGRAM_ID=62hWQAgAV4jugHSuZsMqzxZNVXaVLrbRpz3Sw58Z64Mw
REWARDS_VAULT=2KkNwFZbznAtYX1xjVS6e5BBqQnfaBuTjn42G4zJXAps

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/nftsol

# Security (NEVER commit these)
PLATFORM_SECRET_KEY_BASE58=your_key_here
JWT_SECRET=your_jwt_secret
SESSION_SECRET=your_session_secret

# Optional Services
HELIUS_API_KEY=your_helius_key
PINATA_JWT=your_pinata_jwt
```

#### Frontend (.env)
```bash
VITE_API_BASE=http://localhost:3001
VITE_SOLANA_RPC_URL=https://api.devnet.solana.com
VITE_SOLANA_CLUSTER=devnet
VITE_IMG_PROXY_BASE=http://localhost:3001
```

---

## API Reference

### Base URL
- **Development**: `http://localhost:3001`
- **Production**: `https://nftsol.onrender.com`

### Authentication

Most endpoints require wallet connection via Solana Wallet Adapter. Some admin endpoints require additional authentication.

### CLOUT Endpoints

#### GET /api/clout/balance/:address
Get CLOUT token balance for a wallet address.

**Request:**
```http
GET /api/clout/balance/11111111111111111111111111111112
```

**Response:**
```json
{
  "success": true,
  "data": {
    "address": "11111111111111111111111111111112",
    "balance": 1000,
    "token": "CLOUT"
  }
}
```

#### GET /api/clout/vault-balance
Get the CLOUT rewards vault balance.

**Request:**
```http
GET /api/clout/vault-balance
```

**Response:**
```json
{
  "success": true,
  "data": {
    "balance": 50000,
    "token": "CLOUT",
    "vaultAddress": "2KkNwFZbznAtYX1xjVS6e5BBqQnfaBuTjn42G4zJXAps"
  }
}
```

#### POST /api/clout/reward
Distribute CLOUT tokens to a user (admin only).

**Request:**
```http
POST /api/clout/reward
Content-Type: application/json

{
  "recipient": "11111111111111111111111111111112",
  "amount": 100,
  "reason": "NFT Sale"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "transaction": "5j7s8...",
    "amount": 100,
    "recipient": "11111111111111111111111111111112"
  }
}
```

### NFT Endpoints

#### GET /api/nfts
List NFTs on the marketplace.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `collection`: Filter by collection
- `creator`: Filter by creator address

**Response:**
```json
{
  "success": true,
  "data": {
    "nfts": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100
    }
  }
}
```

#### POST /api/nfts/mint
Mint a new NFT (requires wallet signature).

**Request:**
```http
POST /api/nfts/mint
Content-Type: application/json

{
  "name": "My NFT",
  "description": "Description",
  "image": "https://...",
  "attributes": [...],
  "royalty": 500
}
```

### Health Endpoints

#### GET /healthz
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-31T12:00:00Z"
}
```

---

## Database Schema

### Core Tables

#### Users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  wallet_address VARCHAR(44) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### NFTs
```sql
CREATE TABLE nfts (
  id UUID PRIMARY KEY,
  mint_address VARCHAR(44) UNIQUE NOT NULL,
  creator_address VARCHAR(44) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Transactions
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY,
  transaction_signature VARCHAR(88) UNIQUE NOT NULL,
  from_address VARCHAR(44),
  to_address VARCHAR(44),
  amount BIGINT,
  type VARCHAR(50),
  status VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Blockchain Integration

### Solana Connection

```typescript
import { Connection, clusterApiUrl } from '@solana/web3.js';

const connection = new Connection(
  process.env.SOLANA_RPC_URL || clusterApiUrl('devnet'),
  'confirmed'
);
```

### CLOUT Token Service

The `CloutTokenService` handles:
- Balance queries
- Token transfers
- Associated Token Account (ATA) creation
- Vault management

**Key Methods:**
```typescript
class CloutTokenService {
  async getBalance(address: string): Promise<number>
  async transfer(recipient: string, amount: number): Promise<string>
  async getVaultBalance(): Promise<number>
}
```

### NFT Minting with Metaplex

```typescript
import { Metaplex } from '@metaplex-foundation/js';

const metaplex = Metaplex.make(connection)
  .use(walletAdapterIdentity(wallet));

const { nft } = await metaplex.nfts().create({
  uri: metadataUri,
  name: nftName,
  sellerFeeBasisPoints: royalty,
});
```

---

## CLOUT Token System

### Token Configuration

- **Mint Address**: `62hWQAgAV4jugHSuZsMqzxZNVXaVLrbRpz3Sw58Z64Mw` (mainnet)
- **Decimals**: 9
- **Total Supply**: 1,000,000,000 CLOUT

### Reward Distribution

Rewards are distributed through the `CloutTokenService`:

```typescript
// Example: Reward user for NFT purchase
await cloutService.distributeReward(
  userAddress,
  50, // CLOUT amount
  'NFT Purchase'
);
```

### Vault Management

The rewards vault (`REWARDS_VAULT`) holds tokens for distribution. The vault ATA is automatically created if it doesn't exist.

---

## Security Implementation

### Input Validation

All inputs are validated using `express-validator`:

```typescript
import { body, validationResult } from 'express-validator';

router.post('/api/clout/reward',
  body('recipient').isBase58().isLength({ min: 32, max: 44 }),
  body('amount').isInt({ min: 1 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // ...
  }
);
```

### Rate Limiting

API endpoints are rate-limited:

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
```

### CORS Configuration

```typescript
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
  credentials: true
}));
```

### Security Headers

Using Helmet.js:

```typescript
import helmet from 'helmet';
app.use(helmet());
```

---

## Testing

### Unit Tests

```bash
cd apps/backend
npm test
```

### Integration Tests

```bash
# Test API endpoints
npm run test:integration

# Test CLOUT endpoints
npm run test:clout
```

### Manual Testing

1. Start backend: `cd apps/backend && npm run dev`
2. Start frontend: `cd client && npm run dev`
3. Connect wallet in browser
4. Test minting, buying, CLOUT balance

---

## Performance Optimization

### Caching Strategy

- **Redis**: Cache frequently accessed data (optional)
- **In-Memory Cache**: Use `node-cache` for quick lookups
- **Database Indexing**: Proper indexes on query columns

### Database Optimization

- Connection pooling
- Query optimization
- Indexed columns
- Pagination for large datasets

### Frontend Optimization

- Code splitting with lazy loading
- Image optimization
- Asset caching
- React memoization

---

## Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <pid> /F

# Linux/Mac
lsof -ti:3001 | xargs kill -9
```

#### Module Resolution Errors
- Ensure `npm install` is run in correct directory
- Check TypeScript configuration
- Verify import paths don't include `.js` extensions for local modules

#### Wallet Connection Issues
- Ensure wallet extension is installed
- Check CORS configuration
- Verify RPC URL is accessible

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## License

MIT License - See [LICENSE](LICENSE) file.

---

**For deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md)**
