# NFTSol - Decentralized NFT Marketplace on Solana

[![CI](https://img.shields.io/github/actions/workflow/status/TheoryofShadows/nftsol/ci.yml?branch=main&label=CI)](https://github.com/TheoryofShadows/nftsol/actions)
![License](https://img.shields.io/badge/license-MIT-informational)
![Stars](https://img.shields.io/github/stars/TheoryofShadows/nftsol?style=social)

**NFTSol** is a production-ready, decentralized NFT marketplace built on Solana blockchain, featuring compressed NFTs, CLOUT token rewards, and Eternal Echoes collaborative NFT creation.

## 🚀 Live Demo

- **Production Frontend:** https://nftsolmarket.netlify.app
- **Production Backend:** https://nftsol.onrender.com

## ✨ Features

- 🎨 **Full NFT Marketplace**: Create, buy, and sell NFTs on Solana
- ⭐ **CLOUT Token System**: Native reward token for platform engagement
- 🎬 **Eternal Echoes**: Collaborative, layered NFT creation with historical verification
- 🌳 **Compressed NFTs (cNFTs)**: Low-cost NFT minting using Metaplex Bubblegum
- 📦 **Storage Integration**: Irys SDK for decentralized Arweave storage
- 🔒 **Enterprise Security**: Bank-grade security with comprehensive audit trails
- 📱 **Modern UI**: Beautiful, responsive interface with Phantom/Solflare wallet integration
- 💰 **Fee System**: 2.5% platform fee on all mints

## 📚 Documentation

- **[WHITEPAPER.md](WHITEPAPER.md)** - Complete project overview, tokenomics, and roadmap
- **[TECHNICAL-DOCS.md](TECHNICAL-DOCS.md)** - Technical documentation, API reference, and architecture
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Deployment guide for Render and Netlify

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and optimized builds
- **Tailwind CSS** for modern, responsive UI
- **Solana Wallet Adapter** for wallet integration (Phantom, Solflare, Ledger, etc.)
- **React Lazy Loading** for optimal performance

### Backend
- **Node.js** with TypeScript
- **Express.js** REST API
- **PostgreSQL** database with Drizzle ORM
- **Solana Web3.js** for blockchain interactions
- **Metaplex UMI** for NFT operations
- **Irys SDK** for decentralized storage
- **Helius API** for enhanced Solana RPC

### Blockchain
- **Solana Mainnet** for production
- **Metaplex Bubblegum** for compressed NFTs (cNFTs)
- **SPL Token** for CLOUT token standard
- **Anchor Programs** for on-chain logic

## 🚀 Quick Start for Developers

### Prerequisites

- **Node.js** 20.x or later
- **PostgreSQL** 14+ database
- **Solana CLI** (optional, for program deployment)
- **Git** for version control

### 1. Clone the Repository

```bash
git clone https://github.com/TheoryofShadows/nftsol.git
cd nftsol
git checkout main  # or develop for latest development
```

### 2. Backend Setup

```bash
cd apps/backend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Configure environment variables (see DEPLOYMENT.md)
# Edit .env with your database URL, Solana RPC, and keys

# Run database migrations
npm run db:migrate

# Start development server
npm run dev
```

Backend will run on `http://localhost:3001`

### 3. Frontend Setup

```bash
cd client

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Configure environment variables (see DEPLOYMENT.md)
# Edit .env with your backend URL and Solana RPC

# Start development server
npm run dev
```

Frontend will run on `http://localhost:5173`

### 4. Environment Variables

#### Backend (`.env` in `apps/backend/`)

See `RENDER-ENV-VARS-COMPLETE.txt` for complete list. Key variables:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/nftsol

# Solana Configuration
SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
SOLANA_CLUSTER=mainnet-beta
HELIUS_API_KEY=your_helius_api_key

# Platform Wallet (for fee collection)
PLATFORM_SECRET_KEY_BASE58=your_base58_secret_key

# CLOUT Token Configuration
CLOUT_PROGRAM_ID=62hWQAgAV4jugHSuZsMqzxZNVXaVLrbRpz3Sw58Z64Mw
REWARDS_VAULT=2KkNwFZbznAtYX1xjVS6e5BBqQnfaBuTjn42G4zJXAps
```

#### Frontend (`.env` in `client/`)

See `NETLIFY-ENV-VARS.txt` for complete list. Key variables:

```env
# Backend API
VITE_API_BASE=http://localhost:3001

# Solana Configuration
VITE_SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
VITE_SOLANA_CLUSTER=mainnet-beta
```

⚠️ **Never commit `.env` files or actual API keys!**

## 📁 Project Structure

```
nftsol/
├── apps/
│   └── backend/              # Backend API server
│       ├── src/
│       │   ├── routes/       # API route handlers
│       │   ├── services/     # Business logic
│       │   ├── lib/          # Solana/blockchain utilities
│       │   ├── workers/      # Background jobs
│       │   └── utils/        # Helper functions
│       ├── package.json
│       └── tsconfig.json
│
├── client/                   # Frontend React app
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── echo/            # Eternal Echoes features
│   │   ├── hooks/           # Custom React hooks
│   │   ├── context/         # React context providers
│   │   └── styles/          # CSS stylesheets
│   ├── public/              # Static assets
│   ├── package.json
│   └── vite.config.ts
│
├── WHITEPAPER.md            # Project overview
├── TECHNICAL-DOCS.md        # Technical documentation
├── DEPLOYMENT.md            # Deployment guide
└── README.md                # This file
```

## 🔧 Development

### Available Scripts

#### Backend (`apps/backend/`)

```bash
npm run dev          # Start development server with hot reload
npm run build        # Build TypeScript to JavaScript
npm run start        # Start production server
npm run db:migrate   # Run database migrations
npm run lint         # Lint code
```

#### Frontend (`client/`)

```bash
npm run dev          # Start Vite dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Lint code
npm run format       # Format code with Prettier
```

## 📡 API Endpoints

Key endpoints (see [TECHNICAL-DOCS.md](TECHNICAL-DOCS.md) for complete API reference):

- `GET /api/v1/programs` - Get Solana program configuration
- `POST /api/nfts/mint` - Mint new NFT
- `GET /api/nfts` - List NFTs with pagination
- `GET /api/clout/balance/:address` - Get CLOUT token balance
- `POST /api/clout/reward` - Send CLOUT rewards
- `POST /api/echo/mint` - Mint Eternal Echo
- `GET /api/echo/trending` - Get trending echoes

## 💰 Fee Structure

- **Platform Fee:** 2.5% of mint cost
- **Mint Cost:** 0.01 SOL base cost
- **Total Mint Cost:** 0.01025 SOL (0.01 + 2.5% fee)

Fees are automatically collected and sent to the platform wallet configured via `PLATFORM_SECRET_KEY_BASE58`.

## 🔒 Security

- All secrets stored in environment variables (never commit to Git)
- Platform keypair loaded securely from `PLATFORM_SECRET_KEY_BASE58`
- Database connection uses SSL in production
- JWT authentication for protected endpoints
- Rate limiting on API endpoints
- Input validation and sanitization

## 🌐 Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete deployment instructions:

- **Backend:** Deploy to Render (PostgreSQL + Node.js)
- **Frontend:** Deploy to Netlify (static hosting)

Both production environments are configured and running:
- Frontend: https://nftsolmarket.netlify.app
- Backend: https://nftsol.onrender.com

## 🤝 Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write tests for new features
- Update documentation for API changes
- Follow existing code style (run `npm run format`)
- Ensure all lint checks pass (`npm run lint`)

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details

## 🙏 Acknowledgments

- **Solana Foundation** for the amazing blockchain
- **Metaplex** for NFT tooling and standards
- **Helius** for enhanced RPC services
- **Irys** (formerly Bundlr) for decentralized storage

## 📞 Support

- **GitHub Issues:** https://github.com/TheoryofShadows/nftsol/issues
- **Documentation:** See [TECHNICAL-DOCS.md](TECHNICAL-DOCS.md)

---

**Built with ❤️ on Solana**
