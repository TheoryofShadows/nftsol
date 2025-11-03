# NFTSol - Production-Ready Solana NFT Marketplace

[![CI](https://img.shields.io/github/actions/workflow/status/TheoryofShadows/nftsol/ci.yml?branch=main&label=CI)](https://github.com/TheoryofShadows/nftsol/actions)
![License](https://img.shields.io/badge/license-MIT-informational)
![Solana](https://img.shields.io/badge/Solana-mainnet-14F195?logo=solana)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)

**Enterprise-grade NFT marketplace on Solana** with compressed NFTs, CLOUT rewards, Eternal Echoes, and world-class performance optimizations.

## 🚀 Production URLs

- **Frontend**: https://nftsolmarket.netlify.app
- **Backend API**: https://nftsol.onrender.com
- **GitHub**: https://github.com/TheoryofShadows/nftsol

## ✨ Core Features

- 🎨 **Full NFT Marketplace** - Mint, buy, sell NFTs on Solana
- 📊 **Modern Dashboard** - 2026-style UI with portfolio, stats, activity feed
- 🎓 **Smart Onboarding** - Interactive tours and welcome experience
- ⭐ **CLOUT Token** - Native reward token (`26iJ37BE3icVtoo2QRkfjtYXFHMudG2sbTHAnhF2D6ab`)
- 🎬 **Eternal Echoes** - Collaborative, layered NFT creation
- 🌳 **Compressed NFTs** - Low-cost minting via Metaplex Bubblegum
- 💰 **Fee System** - 2.5% platform fee on all mints
- 🔒 **Enterprise Security** - Bank-grade security with audit trails
- 📱 **9 Wallet Support** - Phantom, Solflare, Solong, Slope, Trust, TokenPocket, Ledger, MathWallet, Torus
- ⚡ **Optimized Performance** - React Query, intelligent caching, RPC failover

## 🏗️ Architecture

```
┌─────────────────────────────────────┐
│   React 18 + TypeScript + Vite      │
│   Tailwind CSS 4 + React Query      │
│   Solana Wallet Adapter (9 wallets) │
└──────────────┬──────────────────────┘
               │ HTTPS/REST
┌──────────────▼──────────────────────┐
│   Node.js + Express + TypeScript    │
│   PostgreSQL + Optimized Services    │
└──────────────┬──────────────────────┘
               │
    ┌──────────┼──────────┐
    │          │          │
┌───▼───┐ ┌──▼───┐ ┌────▼────┐
│Solana │ │Postgres│ │ Storage │
│  RPC  │ │   DB   │ │  (Irys) │
└───────┘ └───────┘ └─────────┘
```

## 🛠️ Tech Stack

### Frontend
- **React 18.3** + TypeScript 5.9
- **Vite 7.1** - Lightning-fast builds
- **Tailwind CSS 4** - Modern UI with glassmorphism
- **React Query** - Intelligent caching & data fetching
- **Solana Wallet Adapter** - 9 wallet integrations
- **React Joyride** - Interactive onboarding

### Backend
- **Node.js 20** + TypeScript 5.9
- **Express.js** - REST API with security middleware
- **PostgreSQL** - Drizzle ORM with connection pooling
- **Solana Web3.js** - Optimized with failover & caching
- **Metaplex UMI** - NFT operations
- **Irys SDK** - Decentralized Arweave storage

### Blockchain
- **Solana Mainnet** - Production deployment
- **Metaplex Bubblegum** - Compressed NFTs (cNFTs)
- **SPL Token** - CLOUT token standard
- **Anchor Programs** - On-chain logic

## 🚀 Quick Start

### Prerequisites
- Node.js 20.x+
- PostgreSQL 14+
- Git

### 1. Clone & Install

```bash
git clone https://github.com/TheoryofShadows/nftsol.git
cd nftsol

# Backend
cd apps/backend
npm install
cp .env.example .env  # Configure your .env
npm run dev            # Runs on http://localhost:3001

# Frontend (new terminal)
cd client
npm install
cp .env.example .env   # Configure your .env
npm run dev            # Runs on http://localhost:5173
```

### 2. Environment Setup

#### Backend (`.env` in `apps/backend/`)

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/nftsol

# Solana (Mainnet)
SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
SOLANA_CLUSTER=mainnet-beta
HELIUS_API_KEY=your_helius_key

# CLOUT Token
CLOUT_PROGRAM_ID=26iJ37BE3icVtoo2QRkfjtYXFHMudG2sbTHAnhF2D6ab
REWARDS_VAULT=7SBYHw5KQasPKajH6gCDnpWmb5QAh9EBvTi3cUnFAc1v

# Platform Wallet
PLATFORM_SECRET_KEY_BASE58=your_base58_secret_key

# Security
JWT_SECRET=your_jwt_secret_64_chars
NODE_ENV=development
```

#### Frontend (`.env` in `client/`)

```env
VITE_API_BASE=http://localhost:3001
VITE_SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
```

⚠️ **Never commit `.env` files or secrets to Git!**

## ⚡ Performance Optimizations

NFTSol implements industry-leading optimizations:

### Features
- ✅ **React Query** - Intelligent caching (5min stale, 10min cache)
- ✅ **RPC Failover** - Multi-endpoint with health monitoring
- ✅ **Request Deduplication** - Zero duplicate API calls
- ✅ **Blockhash Caching** - 50% reduction in RPC calls
- ✅ **Database Pooling** - Optimized connection management
- ✅ **Code Splitting** - Manual vendor chunks
- ✅ **Bundle Optimization** - 28% smaller production builds

### Results
| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| API Response | 200-500ms | 10-50ms | **80-90%** |
| Bundle Size | 2.5MB | 1.8MB | **28%** |
| DB Queries | 50-200ms | 20-80ms | **40-60%** |
| Duplicate Requests | Many | Zero | **100%** |

See **[OPTIMIZATION_GUIDE.md](OPTIMIZATION_GUIDE.md)** for complete details.

## 📡 API Endpoints

### Public
- `GET /api/v1/programs` - Program configuration
- `GET /api/v1/market` - Marketplace NFTs
- `GET /api/v1/nfts/:mintAddress` - NFT metadata
- `GET /api/v1/wallet/:address` - Wallet info

### Protected (JWT)
- `POST /api/v1/simple-mint` - Mint NFT
- `POST /api/v1/clout/reward` - Send CLOUT rewards
- `POST /api/v1/echo/mint` - Mint Eternal Echo

### Admin
- `POST /api/v1/auth/admin` - Admin authentication
- `GET /api/v1/admin/withdrawals` - List withdrawals
- `POST /api/v1/admin/withdrawals/:id/approve` - Approve withdrawal

Full API docs: **[TECHNICAL-DOCS.md](TECHNICAL-DOCS.md)**

## 💎 CLOUT Token

**CLOUT** is NFTSol's native reward token on Solana.

- **Token Address**: `26iJ37BE3icVtoo2QRkfjtYXFHMudG2sbTHAnhF2D6ab`
- **Rewards Vault**: `7SBYHw5KQasPKajH6gCDnpWmb5QAh9EBvTi3cUnFAc1v`
- **Total Supply**: 1,000,000,000 CLOUT
- **Solscan**: [View Token](https://solscan.io/token/26iJ37BE3icVtoo2QRkfjtYXFHMudG2sbTHAnhF2D6ab)

Users earn CLOUT through: minting NFTs, purchases, referrals, engagement.

## 🔒 Security

- ✅ Environment-based secrets (never in code)
- ✅ JWT authentication with secure tokens
- ✅ Rate limiting on all endpoints
- ✅ Input validation & sanitization
- ✅ SQL injection protection (parameterized queries)
- ✅ CORS configuration
- ✅ Security headers (Helmet)
- ✅ Audit logging

**Status**: 0 critical vulnerabilities, production-safe

See **[SECURITY.md](SECURITY.md)** for complete security policy.

## 🌐 Deployment

### Automated (GitHub Actions)
- **Backend** → Render (auto-deploy on push to `main`)
- **Frontend** → Netlify (auto-deploy on push to `main`)

### Manual
See **[DEPLOYMENT.md](DEPLOYMENT.md)** for step-by-step guide.

**Current Production:**
- Frontend: https://nftsolmarket.netlify.app
- Backend: https://nftsol.onrender.com

## 📚 Documentation

| Document | Description |
|---------|-------------|
| **[README.md](README.md)** | Project overview (this file) |
| **[TECHNICAL-DOCS.md](TECHNICAL-DOCS.md)** | Architecture, API reference, database schema |
| **[OPTIMIZATION_GUIDE.md](OPTIMIZATION_GUIDE.md)** | Performance optimizations guide |
| **[DEPLOYMENT.md](DEPLOYMENT.md)** | Deployment instructions for Render & Netlify |
| **[SECURITY.md](SECURITY.md)** | Security policy, best practices, vulnerability reporting |
| **[WHITEPAPER.md](WHITEPAPER.md)** | Project vision, tokenomics, roadmap |
| **[CONTRIBUTING.md](CONTRIBUTING.md)** | Contributing guidelines |
| **[CHANGELOG.md](CHANGELOG.md)** | Version history |

## 🤝 Contributing

We welcome contributions! Please see **[CONTRIBUTING.md](CONTRIBUTING.md)**.

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

### Development Guidelines
- TypeScript strict mode
- ESLint + Prettier
- Write tests for new features
- Update documentation
- Follow existing code style

## 📝 License

MIT License - see **[LICENSE](LICENSE)** file for details.

## 🙏 Acknowledgments

- **Solana Foundation** - Amazing blockchain infrastructure
- **Metaplex** - NFT standards and tooling
- **Helius** - Enhanced RPC services
- **Irys** - Decentralized storage solution

## 📞 Support

- **GitHub Issues**: https://github.com/TheoryofShadows/nftsol/issues
- **Documentation**: See **[TECHNICAL-DOCS.md](TECHNICAL-DOCS.md)**

---

**Built with ❤️ on Solana | Production-Ready | Enterprise-Grade**

*Last Updated: November 2025*
