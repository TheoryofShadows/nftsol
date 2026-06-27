# NFTSol Technical Documentation

**Version:** 2.2
**Last Updated:** June 2026
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
┌───────▼─────┐ ┌─────▼──────┐ ┌───▼────┐ ┌───────▼──────┐
│   Solana    │ │ PostgreSQL │ │ Redis  │ │  Storage     │
│    RPC      │ │  Database  │ │ Cache  │ │ (Irys/Pinata │
│             │ │ (Drizzle)  │ │        │ │  / AWS S3)   │
└─────────────┘ └────────────┘ └────────┘ └──────────────┘
```

### Technology Stack

**Frontend** — React 18.3, TypeScript 5.9, Vite 7.1, Tailwind CSS 3.4, `@solana/wallet-adapter-react` 0.15+ (Phantom, Solflare, Backpack, Ledger, Coinbase, MathWallet, Exodus, Torus), `@tanstack/react-query` 5+, `react-joyride`, `@solana/web3.js` 1.98+.

**Backend** — Node.js 20+, Express 4.18, TypeScript 5.9+, PostgreSQL + Drizzle ORM 0.45, `@solana/web3.js` 1.98+, `@metaplex-foundation/js` 0.20 + `umi` 1.x, `@metaplex-foundation/mpl-bubblegum` 5.x, `@coral-xyz/anchor` 0.29, content storage via Irys / Pinata / AWS S3, JWT auth (`jsonwebtoken`) plus CSRF (`@dr.pogodin/csurf`).

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
│   │   ├── config/           # Client config (wallet adapters, RPC selection)
│   │   ├── echo/             # Eternal Echoes feature (EchoMint, VideoUpload)
│   │   ├── wallet/           # Phantom-specific provider helper
│   │   └── App.tsx
│   ├── vite.config.ts
│   └── package.json
│
├── apps/
│   ├── backend/              # Main backend application
│   │   ├── src/
│   │   │   ├── routes/       # 34 Express routers (clout, echo, marketplace, mint, grok, …)
│   │   │   ├── services/     # CloutTokenService, BubblegumService, eternalEchoesService, …
│   │   │   ├── middleware/   # Auth, CSRF, rate limit, security, file-upload
│   │   │   ├── config/       # Env config, program IDs
│   │   │   ├── lib/          # DB pool, swagger, helpers
│   │   │   ├── utils/        # clout-vault, helpers
│   │   │   └── index.ts      # Entry point (mounts all routers)
│   │   └── tsconfig.json
│   └── smart-contracts/      # Anchor workspace
│       ├── Anchor.toml
│       └── programs/eternal_echoes/   # Anchor 0.29 on-chain program
│
├── shared/                   # Code shared client ↔ server
│   ├── types/               # TS interfaces
│   ├── constants/           # App-wide constants (CLOUT_CONFIG, RATE_LIMITS, …)
│   ├── config/              # Environment config
│   ├── validation/          # Zod schemas
│   ├── services/            # Cross-cutting services (email, etc.)
│   └── utils/               # Logger, errors
│
└── docs/                    # User-facing guides (served via GitHub Pages, Jekyll/Cayman)
```

> The legacy top-level `server/` directory has been removed. All backend code lives under `apps/backend/`.

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
  async getNfts(filters: NFTFilters): Promise<NFT[]> {
    /* ... */
  }
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
logger.info('NFT minted', { mintAddress, creator }); // ✅
console.log('NFT minted'); // ❌
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

# CLOUT — mint address is the same as CLOUT_PROGRAM_ID (legacy alias).
CLOUT_MINT=26iJ37BE3icVtoo2QRkfjtYXFHMudG2sbTHAnhF2D6ab
REWARDS_OWNER=3WCkmqcoJZnVbscWSD3xr9tyG1kqnc3MsVPusriKKKad
# REWARDS_VAULT is auto-derived as the ATA(REWARDS_OWNER, CLOUT_MINT) at runtime.

DATABASE_URL=postgresql://user:password@localhost:5432/nftsol

# Admin wallets (comma-separated base58 pubkeys allowed to call admin endpoints)
ADMIN_WALLETS=

# Secrets — never commit
PLATFORM_SECRET_KEY_BASE58=...
JWT_SECRET=...
SESSION_SECRET=...

# Optional
HELIUS_API_KEY=...
PINATA_JWT=...
XAI_API_KEY=...
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
{
  "success": true,
  "data": {
    "address": "...",
    "balance": 1000,
    "token": "CLOUT",
    "mintAddress": "26iJ37BE3icVtoo2QRkfjtYXFHMudG2sbTHAnhF2D6ab"
  }
}
```

**GET /api/clout/vault-balance** — rewards-vault balance (vault address is computed deterministically)

```json
{ "success": true, "data": { "balance": 50000, "token": "CLOUT", "vaultAddress": "..." } }
```

**POST /api/clout/reward** _(admin / CSRF)_ — distribute CLOUT

```json
// Request
{ "recipient": "...", "amount": 100, "reason": "NFT Sale" }
// Response
{ "success": true, "data": { "transaction": "5j7s8...", "amount": 100, "recipient": "..." } }
```

### NFT endpoints

**GET /api/nfts** — list NFTs
Query params: `owner`, `collection`, `status`, `limit`.

**GET /api/v1/nft/:mintAddress** — single NFT metadata (note: singular `nft`).

**GET /api/v1/nfts/:owner** — NFTs owned by a wallet.

**POST /api/v1/simple-mint** — mint a new NFT (CSRF-protected; fetch token from `GET /api/v1/csrf-token`).

```json
{ "name": "My NFT", "description": "...", "imageUrl": "https://...", "creatorWallet": "..." }
```

`POST /api/nfts/mint` and `POST /api/mint/nft` are kept as compatibility redirects to `/api/v1/simple-mint`.

**GET /api/mint/relayer-status** — report the platform relayer wallet that pays fees for gasless mints. Minting is gasless for users: the **platform relayer keypair** (not the user's connected wallet) funds the Irys metadata upload and the compressed-mint fee. If this wallet runs out of SOL, mints fail with a clear "relayer wallet needs SOL" message instead of a cryptic "insufficient funds for fee". Use this endpoint to find the address to top up. Read-only — never exposes the secret key.

```json
// Response
{
  "success": true,
  "data": {
    "address": "Fz...9k",
    "balanceSol": 0.0042,
    "cluster": "mainnet-beta",
    "funded": false,
    "minSol": 0.01
  }
}
```

### Open-web search endpoints

The Discover → Mint flow searches the open web for license-safe media, then runs the
same verify → mint pipeline. Image/audio come from **Openverse** (Creative Commons'
own API indexing ~700M openly-licensed works — no API key); video falls back to the
**Internet Archive**. Each provider is best-effort, so one failing provider still
returns the others. Both routes are also mounted unversioned at `/api/web-search`.

**POST /api/v1/web-search** — search the open web.

```json
// Request
{ "query": "apollo moon", "mediaType": "all", "limit": 24, "page": 1 }
// Response
{ "success": true, "data": { "query": "apollo moon", "totalResults": 1234,
  "results": [ { "identifier": "openverse:…", "title": "…", "thumbnailUrl": "https://…",
  "licenseType": "cc-by", "source": "openverse" } ], "sources": ["openverse"] } }
```

`mediaType` is one of `all | image | audio | video`. Results are normalised to the
shared `SearchResult` shape (same as Internet Archive results) so they flow through
verify and mint unchanged. Only commercial-use + modification licenses are surfaced.

**POST /api/v1/web-search/verify** — Grok/heuristic verification for one open-web result.

```json
// Request: a single search result item (title, description, creator, licenseType, …)
// Response
{
  "success": true,
  "data": {
    "verification": { "truthScore": 66, "method": "heuristic", "verified": false },
    "readyForMinting": true
  }
}
```

`method` is `"grok"` when an `XAI_API_KEY`/`GROK_API_KEY` is configured, otherwise
`"heuristic"` (an honest per-item estimate — never presented as AI-verified).

### Marketplace endpoints

**GET /api/v1/market** — listings (with pagination).
**GET /api/v1/collections** — collections + floor prices.
**POST /api/marketplace/list** / **POST /api/marketplace/delist** — manage listings (CSRF).

### Health

**GET /health** — liveness probe.
**GET /api/health** — same, namespaced.
**GET /healthz** — readiness; includes DB connectivity and Solana RPC status.

```json
{ "status": "healthy", "timestamp": "2026-05-24T12:00:00Z" }
```

### Response envelope

All endpoints return:

```json
{ "success": true, "data": { /* payload */ } }
// or
{ "success": false, "error": "Human-readable message", "code": "ERROR_CODE", "requestId": "..." }
```

`error` is a string and the error code/details are sibling fields, not a nested object.

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

`CloutTokenService` (`apps/backend/src/services/cloutToken.ts`) handles balance queries, transfers, ATA creation, and vault management.

```typescript
class CloutTokenService {
  async distributeCloutRewards(
    recipient: string,
    amount: number,
    reason: string
  ): Promise<CloutRewardResult>;
  async getCloutBalance(walletAddress: string): Promise<number>;
  async getVaultBalance(): Promise<number>;
  async ensureRewardsVault(platformKeypair: Keypair): Promise<PublicKey>;
}
```

The rewards vault is the deterministic ATA of `REWARDS_OWNER` for the CLOUT mint — derive it via `getRewardsVaultAddress()` / `getOrCreateCloutVault()` in `apps/backend/src/utils/clout-vault.ts`. Don't hardcode the vault address.

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
- **Rewards owner**: `3WCkmqcoJZnVbscWSD3xr9tyG1kqnc3MsVPusriKKKad`
- **Rewards vault**: derived at runtime as the ATA of `REWARDS_OWNER` for the CLOUT mint (not a fixed environment variable).

Reward rates and distribution percentages live in `shared/constants/index.ts` under `CLOUT_CONFIG`. Distribute rewards via `cloutService.distributeCloutRewards(address, amount, reason)` — the service auto-creates the vault ATA on first use.

---

## Security Implementation

Full policy lives in [SECURITY.md](SECURITY.md). Quick summary:

- Inputs validated via `express-validator` and Zod schemas (in `shared/validation/schemas.ts`)
- Rate limiting via `express-rate-limit` (Redis-backed in production via `ioredis`)
- CORS locked to `ALLOWED_ORIGINS` in production (production allowlist: `nftsol.app`, `www.nftsol.app`, `nftsolmarket.netlify.app`)
- Helmet.js for security headers (CSP, HSTS, X-Frame-Options, etc.)
- JWT auth (`jsonwebtoken`) + CSRF double-submit cookies (`@dr.pogodin/csurf`) for stateful browser flows; API token auth is exempted from CSRF.

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
