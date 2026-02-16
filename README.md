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
- **Video NFT Minting** - Upload and mint video NFTs with Grok AI verification
- **Grok AI Verification** - AI-powered authenticity verification for video NFTs
- **Modern Dashboard** - Portfolio, stats, and activity feed
- **Smart Onboarding** - Interactive tours and welcome experience
- **CLOUT Token** - Native reward token (`26iJ37BE3icVtoo2QRkfjtYXFHMudG2sbTHAnhF2D6ab`)
- **Eternal Echoes** - Collaborative, layered NFT creation with video support
- **Compressed NFTs** - Low-cost minting via Metaplex Bubblegum
- **Enterprise Security** - Rate limiting, JWT auth, audit trails
- **9 Wallet Support** - Phantom, Solflare, Solong, Slope, Trust, TokenPocket, Ledger, MathWallet, Torus
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

**Frontend**: React 18.3, TypeScript 5.9, Vite 7.1, Tailwind CSS, React Query, Solana Wallet Adapter
**Backend**: Node.js 20, Express, PostgreSQL, Drizzle ORM, Solana Web3.js, Metaplex UMI, Irys SDK
**Blockchain**: Solana Mainnet, Metaplex Bubblegum, SPL Token, Anchor Programs

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
CLOUT_PROGRAM_ID=26iJ37BE3icVtoo2QRkfjtYXFHMudG2sbTHAnhF2D6ab
PLATFORM_SECRET_KEY_BASE58=your_base58_secret_key
JWT_SECRET=your_jwt_secret_64_chars
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
- `GET /health` - Health check
- `GET /api/v1/programs` - Program configuration
- `GET /api/v1/market` - Marketplace NFTs
- `GET /api/v1/nfts/:mintAddress` - NFT metadata
- `GET /api/v1/wallet/:address` - Wallet info

### Protected (JWT)
- `POST /api/v1/simple-mint` - Mint NFT
- `POST /api/echo/mint` - Mint Eternal Echo
- `GET /api/clout/balance/:wallet` - CLOUT balance

### Admin
- `POST /api/v1/auth/admin` - Admin auth (wallet signature)
- `POST /api/v1/admin/withdrawals` - Process withdrawals

Full API docs: **[TECHNICAL-DOCS.md](TECHNICAL-DOCS.md)**

## CLOUT Token

- **Token Address**: `26iJ37BE3icVtoo2QRkfjtYXFHMudG2sbTHAnhF2D6ab`
- **Rewards Vault**: `7SBYHw5KQasPKajH6gCDnpWmb5QAh9EBvTi3cUnFAc1v`
- **Solscan**: [View Token](https://solscan.io/token/26iJ37BE3icVtoo2QRkfjtYXFHMudG2sbTHAnhF2D6ab)

Users earn CLOUT through minting, purchases, referrals, and engagement.

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

| Document | Description |
|---------|-------------|
| [README.md](README.md) | Project overview |
| [TECHNICAL-DOCS.md](TECHNICAL-DOCS.md) | API reference, database schema |
| [ARCHITECTURE.md](ARCHITECTURE.md) | System architecture |
| [SECURITY.md](SECURITY.md) | Security policy |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Contributing guidelines |
| [CHANGELOG.md](CHANGELOG.md) | Version history |

## Contributing

See **[CONTRIBUTING.md](CONTRIBUTING.md)** for guidelines.

## License

MIT License

## Support

- **GitHub Issues**: https://github.com/TheoryofShadows/nftsol/issues

---

**Built on Solana** | https://nftsol.app

*Last Updated: February 2026*
