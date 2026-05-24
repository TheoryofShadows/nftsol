# NFTSol Technical Documentation

**Version:** 2.1
**Last Updated:** May 2026
**Status:** Production

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Project Structure](#project-structure)
3. [Architectural Principles](#architectural-principles)
4. [Shared Package](#shared-package)
5. [Development Setup](#development-setup)
6. [API Reference](#api-reference)
7. [Database Schema](#database-schema)
8. [Blockchain Integration](#blockchain-integration)
9. [CLOUT Token System](#clout-token-system)
10. [Security Implementation](#security-implementation)
11. [Testing](#testing)
12. [Performance Optimization](#performance-optimization)
13. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Client)                    │
│  React 18 + TypeScript + Vite + Solana Wallet Adapter   │
│              Deployed: Netlify                          │
└─────────────────────┬───────────────────────────────────┘
                      │ HTTPS/REST API
┌─────────────────────▼───────────────────────────────────┐
│                  Backend (Server)                       │
│      Node.js + Express + TypeScript + PostgreSQL        │
│              Deployed: Render                           │
└─────────────────────┬───────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┬──────────────┐
        │             │             │              │
┌───────▼─────┐ ┌─────▼──────┐ ┌───▼────┐ ┌───────▼─────┐
│   Solana    │ │PostgreSQL  │ │ Redis  │ │   IPFS      │
│    RPC      │ │  Database  │ │ Cache  │ │  Storage    │
└─────────────┘ └────────────┘ └────────┘ └─────────────┘
```

### Technology Stack

**Frontend** — React 18.3, TypeScript 5.9, Vite 7.1, Tailwind CSS 4.1, `@solana/wallet-adapter-react` (9 adapters), `react-joyride`, `@solana/web3.js` 1.98+.

**Backend** — Node.js 20+, Express 5.1+, TypeScript 5.9+, PostgreSQL + Drizzle ORM, `@solana/web3.js`, `@metaplex-foundation/js` + `umi`, `@coral-xyz/anchor` 0.32+, IPFS via Pinata, JWT auth.

---

## Project Structure

```
nftsol/
├── client/                    # Frontend React app
│   ├── src/
│   │   ├── components/       # Shared UI components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── services/         # API service layer
│   │   ├── context/          # React contexts
│   │   ├── echo/             # Eternal Echoes feature
│   │   ├── wallet/           # Wallet integration
│   │   ├── styles/           # CSS
│   │   └── App.tsx
│   ├── vite.config.ts
│   └── package.json
│
├── server/                    # Legacy server (some files still active)
│   ├── routes/               # API route handlers
│   └── services/             # Business logic
│
├── apps/
│   ├── backend/              # Main backend application
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   ├── services/
│   │   │   ├── middleware/
│   │   │   ├── config/
│   │   │   ├── lib/
│   │   │   └── index.ts
│   │   └── tsconfig.json
│   └── smart-contracts/      # Solana on-chain programs
│       └── solana_rewards/
│           └── programs/eternal_echoes/
│
├── shared/                   # Code shared client ↔ server
│   ├── types/               # TS interfaces
│   ├── constants/           # App-wide constants
│   ├── config/              # Environment config
│   ├── validation/          # Zod schemas
│   └── utils/               # Logger, errors, helpers
│
└── docs/                    # User-facing guides (served via GitHub Pages)
```

> **Note:** `server/` and `apps/backend/` coexist during migration to the `apps/backend/` layout. Check `git log -- <path>` to see which is active for a given file.

---

## Architectural Principles

### 1. Shared package
Single source of truth for cross-cutting code:

```typescript
import { NFT, ApiResponse } from '@shared/types';
import { POLLING_INTERVALS } from '@shared/constants';
import { envConfig } from '@shared/config/environment';
import { mintRequestSchema } from '@shared/validation/schemas';
```

### 2. Service layer pattern
Keep business logic out of routes and components:

```typescript
// services/nftService.ts
export class NftService {
  async getNfts(filters: NFTFilters): Promise<NFT[]> { /* ... */ }
}
```

### 3. Error handling
Use custom error classes (`AppError`, `ValidationError`, `NotFoundError`) and centralized middleware. Never throw bare `Error`s.

### 4. Type safety
Strict TypeScript everywhere. Validate at boundaries with Zod schemas — don't trust untyped input.

### 5. No magic values
Constants live in `@shared/constants`. No inline `60000`s.

### 6. Absolute imports
Use path aliases — `@shared/...`, `@/...` — not `../../..`.

### 7. Structured logging
```typescript
logger.info('NFT minted', { mintAddress, creator });  // ✅
console.log('NFT minted');                              // ❌
```

---

## Shared Package

The `shared/` directory is consumable from both client and server:

```
shared/
├── types/          # TypeScript interfaces and types
├── constants/      # App-wide constants
├── config/         # Environment configuration
├── validation/     # Zod schemas
└── utils/          # Logger, errors, helpers
```

When adding cross-cutting code, prefer here over duplicating in `client/` and `apps/backend/`.

---

## Development Setup

### Prerequisites
- Node.js 20+
- PostgreSQL 14+
- Git

### Local development

```bash
# 1. Clone
git clone https://github.com/TheoryofShadows/nftsol.git
cd nftsol

# 2. Backend
cd apps/backend
npm install
cp .env.example .env   # fill in DATABASE_URL, SOLANA_RPC_URL, etc.
npm run dev            # → http://localhost:3001

# 3. Frontend (separate terminal)
cd client
npm install
cp .env.example .env   # VITE_API_BASE=http://localhost:3001
npm run dev            # → http://localhost:5173
```

### Backend `.env` essentials

```bash
NODE_ENV=development
PORT=3001

SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_CLUSTER=devnet

CLOUT_PROGRAM_ID=26iJ37BE3icVtoo2QRkfjtYXFHMudG2sbTHAnhF2D6ab
REWARDS_VAULT=7SBYHw5KQasPKajH6gCDnpWmb5QAh9EBvTi3cUnFAc1v

DATABASE_URL=postgresql://user:password@localhost:5432/nftsol

# Secrets — never commit
PLATFORM_SECRET_KEY_BASE58=...
JWT_SECRET=...
SESSION_SECRET=...

# Optional
HELIUS_API_KEY=...
PINATA_JWT=...
```

### Frontend `.env`

```bash
VITE_API_BASE=http://localhost:3001
VITE_SOLANA_RPC_URL=https://api.devnet.solana.com
VITE_SOLANA_CLUSTER=devnet
VITE_IMG_PROXY_BASE=http://localhost:3001
```

---

## API Reference

**Base URLs**
- Development: `http://localhost:3001`
- Production: `https://nftsol.onrender.com`

Most endpoints require wallet connection via Solana Wallet Adapter; admin endpoints require additional authentication.

### CLOUT endpoints

**GET /api/clout/balance/:address** — token balance for a wallet
```json
{ "success": true, "data": { "address": "...", "balance": 1000, "token": "CLOUT" } }
```

**GET /api/clout/vault-balance** — rewards-vault balance
```json
{ "success": true, "data": { "balance": 50000, "token": "CLOUT", "vaultAddress": "..." } }
```

**POST /api/clout/reward** *(admin)* — distribute CLOUT
```json
// Request
{ "recipient": "...", "amount": 100, "reason": "NFT Sale" }
// Response
{ "success": true, "data": { "transaction": "5j7s8...", "amount": 100, "recipient": "..." } }
```

### NFT endpoints

**GET /api/nfts** — list NFTs
Query params: `page`, `limit`, `collection`, `creator`.

**POST /api/nfts/mint** — mint a new NFT (requires wallet signature)
```json
{ "name": "My NFT", "description": "...", "image": "https://...", "attributes": [...], "royalty": 500 }
```

### Health

**GET /healthz**
```json
{ "status": "healthy", "timestamp": "2026-05-24T12:00:00Z" }
```

### Response envelope

All endpoints return:

```json
{ "success": true, "data": { /* payload */ } }
// or
{ "success": false, "error": { "message": "...", "code": "...", "details": {} } }
```

---

## Database Schema

### Core tables

```sql
CREATE TABLE users (
  id              UUID PRIMARY KEY,
  wallet_address  VARCHAR(44) UNIQUE NOT NULL,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE nfts (
  id              UUID PRIMARY KEY,
  mint_address    VARCHAR(44) UNIQUE NOT NULL,
  creator_address VARCHAR(44) NOT NULL,
  name            VARCHAR(255) NOT NULL,
  description     TEXT,
  image_url       TEXT,
  metadata        JSONB,
  created_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE transactions (
  id                    UUID PRIMARY KEY,
  transaction_signature VARCHAR(88) UNIQUE NOT NULL,
  from_address          VARCHAR(44),
  to_address            VARCHAR(44),
  amount                BIGINT,
  type                  VARCHAR(50),
  status                VARCHAR(20),
  created_at            TIMESTAMP DEFAULT NOW()
);
```

---

## Blockchain Integration

### Solana connection

```typescript
import { Connection, clusterApiUrl } from '@solana/web3.js';

const connection = new Connection(
  process.env.SOLANA_RPC_URL || clusterApiUrl('devnet'),
  'confirmed'
);
```

### CLOUT token service

The `CloutTokenService` handles balance queries, transfers, ATA creation, and vault management.

```typescript
class CloutTokenService {
  async getBalance(address: string): Promise<number>
  async transfer(recipient: string, amount: number): Promise<string>
  async getVaultBalance(): Promise<number>
}
```

### NFT minting via Metaplex

```typescript
import { Metaplex } from '@metaplex-foundation/js';

const metaplex = Metaplex.make(connection).use(walletAdapterIdentity(wallet));
const { nft } = await metaplex.nfts().create({
  uri: metadataUri,
  name: nftName,
  sellerFeeBasisPoints: royalty,
});
```

---

## CLOUT Token System

- **Mint address**: `26iJ37BE3icVtoo2QRkfjtYXFHMudG2sbTHAnhF2D6ab` (mainnet)
- **Decimals**: 9
- **Total supply**: 1,000,000,000 CLOUT
- **Rewards vault**: `7SBYHw5KQasPKajH6gCDnpWmb5QAh9EBvTi3cUnFAc1v`

The vault ATA is auto-created when first referenced. Distribute rewards via `cloutService.distributeReward(address, amount, reason)`.

---

## Security Implementation

Full policy lives in [SECURITY.md](SECURITY.md). Quick summary:

- Inputs validated via `express-validator` or Zod schemas
- Rate limiting via `express-rate-limit` (and Redis-backed where deployed)
- CORS locked to `ALLOWED_ORIGINS` in production
- Helmet.js for security headers (CSP, HSTS, XFO, etc.)
- JWT auth + CSRF double-submit cookies for stateful flows

---

## Testing

```bash
# Backend
cd apps/backend
npm test                  # all
npm run test:unit
npm run test:integration

# Frontend
cd client
npm test
npm run test:coverage
```

Manual smoke test: start both servers, connect a wallet in the browser, mint/buy/check CLOUT balance.

---

## Performance Optimization

**Caching** — Redis for hot data; `node-cache` for in-process lookups; cache the Solana blockhash (valid ~60s).

**Database** — connection pooling, query indexes on `wallet_address`, `mint_address`, `transaction_signature`; pagination on list endpoints.

**Frontend** — code splitting + lazy loading, image optimization, React Query for server-state caching, `React.memo` on heavy lists.

**RPC** — prefer Helius / QuickNode over public RPC; implement retry + failover; batch requests when possible.

---

## Troubleshooting

**Port already in use**
```bash
# Linux/Mac
lsof -ti:3001 | xargs kill -9
# or
npx kill-port 3001
```

**Module resolution errors**
- `npm install` in the right directory
- Verify path aliases in `tsconfig.json`
- Don't append `.js` to TypeScript imports

**Wallet connection issues**
- Wallet extension installed and unlocked
- Browser console for adapter errors
- RPC URL reachable
- Network matches (devnet vs mainnet)

**RPC rate-limiting** — switch off public RPC, implement retry/failover.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). For AI-assistant-specific guidance, see [CLAUDE.md](CLAUDE.md).

## License

MIT — see [LICENSE](LICENSE).
