# NFTSol - Solana NFT Marketplace

[![CI](https://img.shields.io/github/actions/workflow/status/TheoryofShadows/nftsol/ci.yml?branch=main&label=CI)](https://github.com/TheoryofShadows/nftsol/actions)
![License](https://img.shields.io/badge/license-MIT-informational)
![Solana](https://img.shields.io/badge/Solana-mainnet-14F195?logo=solana)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)

Enterprise-grade NFT marketplace on Solana with compressed NFTs, CLOUT rewards, Eternal Echoes, and AI-powered verification.

## Production URLs

- **App**: https://nftsol.app
- **Backend API**: https://nftsol.onrender.com
- **GitHub**: https://github.com/TheoryofShadows/nftsol

## Core Features

- **Full NFT Marketplace** - Mint, buy, sell NFTs on Solana mainnet
- **Open-Web Media Search** - Search ~700M openly-licensed works (Openverse: Flickr, Wikimedia, Smithsonian, museums) plus Internet Archive video, then mint license-safe NFTs
- **Gasless Minting** - The platform relayer pays mint/upload fees so users mint without holding SOL for gas
- **Video NFT Minting** - Upload and mint video NFTs with Grok AI verification
- **Grok AI Verification** - AI-powered authenticity verification, with an honest heuristic fallback (labeled as such) when no AI key is configured
- **Modern Dashboard** - Portfolio, stats, and activity feed
- **Smart Onboarding** - Interactive tours and welcome experience
- **CLOUT Token** - Native reward token (`26iJ37BE3icVtoo2QRkfjtYXFHMudG2sbTHAnhF2D6ab`)
- **Eternal Echoes** - Collaborative, layered NFT creation with video support (Anchor program: `14Z6HF4jSdKJse3C6uL6pyodepAZojVgqcMGDARwgNFG`)
- **Compressed NFTs** - Low-cost minting via Metaplex Bubblegum
- **Enterprise Security** - Rate limiting, JWT + CSRF auth, structured logging with secret redaction
- **Multi-Wallet Support** - Phantom, Solflare, Backpack, Ledger, Coinbase, MathWallet, Exodus, Torus via Solana Wallet Adapter
- **Optimized Performance** - React Query, intelligent caching, RPC failover

## Architecture

```
Frontend (React 18 + Vite + Tailwind)
         │ HTTPS/REST
Backend  (Node.js + Express + TypeScript)
         │
    ┌────┼────┐
    │    │    │
  Solana  DB  Storage
  (RPC) (PG) (Irys)
```

## Tech Stack

**Frontend**: React 18.3, TypeScript 5.9, Vite 7.1, Tailwind CSS 3.4, React Query 5, Solana Wallet Adapter (Phantom, Solflare, Backpack, Ledger, Coinbase, MathWallet, Exodus, Torus)
**Backend**: Node.js 20, Express 4.18, PostgreSQL + Drizzle ORM 0.45, Solana Web3.js, Metaplex UMI + Bubblegum, Irys / Pinata / S3 uploaders, JWT + CSRF auth
**Blockchain**: Solana Mainnet, Metaplex Bubblegum (compressed NFTs), SPL Token, Anchor 0.29 (eternal_echoes program)

## Quick Start

### Prerequisites

- Node.js 20.x+
- PostgreSQL 14+

### Setup

```bash
git clone https://github.com/TheoryofShadows/nftsol.git
cd nftsol

# Backend
cd apps/backend
npm install
cp .env.example .env  # Configure your .env
npm run dev            # http://localhost:3001

# Frontend (new terminal)
cd client
npm install
cp .env.example .env
npm run dev            # http://localhost:5173
```

### Backend Environment (`apps/backend/.env`)

```env
DATABASE_URL=postgresql://user:password@localhost:5432/nftsol
SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
SOLANA_CLUSTER=mainnet-beta
HELIUS_API_KEY=your_helius_key
CLOUT_MINT=26iJ37BE3icVtoo2QRkfjtYXFHMudG2sbTHAnhF2D6ab
REWARDS_OWNER=3WCkmqcoJZnVbscWSD3xr9tyG1kqnc3MsVPusriKKKad
PLATFORM_SECRET_KEY_BASE58=your_base58_secret_key
JWT_SECRET=your_jwt_secret_64_chars
ADMIN_WALLETS=comma,separated,admin,wallet,addresses
ALLOWED_ORIGINS=https://nftsol.app,https://www.nftsol.app,https://nftsolmarket.netlify.app
NODE_ENV=development
```

### Frontend Environment (`client/.env`)

```env
VITE_API_BASE=http://localhost:3001
VITE_SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
```

### Video & AI Features (optional)

```env
PINATA_JWT=your_pinata_jwt_token     # Pinata for video storage
XAI_API_KEY=your_xai_api_key         # xAI Grok for AI verification
```

**Never commit `.env` files or secrets to Git.**

## API Endpoints

### Public

- `GET /health`, `GET /api/health`, `GET /healthz` - Health checks (last one includes DB + Solana status)
- `GET /api/public/stats` - Platform statistics
- `GET /api/v1/programs` - Program configuration (mints, vaults, program IDs)
- `GET /api/v1/solana/status` - Solana network health
- `GET /api/v1/market` - Marketplace NFTs
- `GET /api/v1/collections` - Collections with floor prices
- `GET /api/v1/nft/:mintAddress` - Single NFT metadata
- `GET /api/v1/nfts/:owner` - NFTs owned by a wallet
- `GET /api/v1/wallet/:address` - Wallet info (balance, existence)
- `GET /api/clout/balance/:address` - CLOUT balance
- `GET /api/clout/vault-balance` - Rewards vault balance
- `GET /api/archive/search?q=...` - Internet Archive search
- `POST /api/v1/web-search` - Open-web media search (Openverse images/audio + Internet Archive video)
- `POST /api/v1/web-search/verify` - Grok/heuristic verification for an open-web result
- `GET /api/mint/relayer-status` - Platform relayer wallet address + SOL balance (public key only) for gasless-mint readiness
- `GET /api/mint/estimate` - Estimated mint cost

### CSRF-protected (browser flows)

- `POST /api/v1/simple-mint` - Mint NFT (double-submit CSRF; get token from `GET /api/v1/csrf-token` or `GET /api/csrf-token`)
- `POST /api/echo/mint` - Mint Eternal Echo
- `POST /api/marketplace/list` / `POST /api/marketplace/delist` - Listings
- `POST /api/grok/verify` - AI content verification

### Admin (JWT, wallet-signature auth)

- `POST /api/v1/auth/admin` - Admin auth (wallet signature → JWT)
- `POST /api/clout/reward` - Distribute CLOUT
- `POST /api/v1/admin/withdrawals` - Process withdrawals
- `GET  /api/v1/admin/emergency/status` - Emergency pause status
- `POST /api/v1/admin/emergency/pause-withdrawals` - Toggle withdrawal pause

Full API docs: **[TECHNICAL-DOCS.md](TECHNICAL-DOCS.md)**

## CLOUT Token

- **Mint Address**: `26iJ37BE3icVtoo2QRkfjtYXFHMudG2sbTHAnhF2D6ab` (9 decimals, 1B supply)
- **Rewards Owner**: `3WCkmqcoJZnVbscWSD3xr9tyG1kqnc3MsVPusriKKKad` (the rewards vault is the deterministic Associated Token Account of this owner for the CLOUT mint; auto-derived at runtime via `getRewardsVaultAddress()`)
- **Solscan**: [View Token](https://solscan.io/token/26iJ37BE3icVtoo2QRkfjtYXFHMudG2sbTHAnhF2D6ab)

Users earn CLOUT through minting, purchases, referrals, and engagement. See `shared/constants/index.ts` (`CLOUT_CONFIG.REWARD_RATES`) for the canonical reward schedule.

## Deployment

- **Frontend** → Netlify (auto-deploy on push to `main`, custom domain: nftsol.app)
- **Backend** → Render (auto-deploy on push to `main`)

## Development Commands

```bash
# Root
npm run install:all      # Install all deps
npm run build            # Build everything
npm run lint             # Lint all code
npm run format           # Format with Prettier

# Client (from client/)
npm run dev              # Dev server
npm run build            # Production build
npm test                 # Tests

# Backend (from apps/backend/)
npm run dev              # Dev server with hot reload
npm run build            # Compile TypeScript
npm test                 # Run tests
npm run type-check       # Check types
```

## Documentation

| Document                               | Description                                                                                                          |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| [README.md](README.md)                 | Project overview                                                                                                     |
| [TECHNICAL-DOCS.md](TECHNICAL-DOCS.md) | Architecture, API reference, database schema                                                                         |
| [SECURITY.md](SECURITY.md)             | Security policy & current measures                                                                                   |
| [CONTRIBUTING.md](CONTRIBUTING.md)     | Contributing guidelines                                                                                              |
| [CLAUDE.md](CLAUDE.md)                 | Guide for AI assistants working on this repo                                                                         |
| [CHANGELOG.md](CHANGELOG.md)           | Version history                                                                                                      |
| [docs/](docs/)                         | User-facing guides — also published at [theoryofshadows.github.io/nftsol](https://theoryofshadows.github.io/nftsol/) |

## Contributing

See **[CONTRIBUTING.md](CONTRIBUTING.md)** for guidelines.

## License

MIT License

## Support

- **GitHub Issues**: https://github.com/TheoryofShadows/nftsol/issues

---

**Built on Solana** | https://nftsol.app

_Last Updated: June 2026_
