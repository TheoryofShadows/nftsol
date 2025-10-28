# NFTSol - Revolutionary NFT Platform

> The Most Revolutionary NFT Platform on Solana with CLOUT Token Rewards

## 🚀 Overview

NFTSol is a cutting-edge NFT marketplace built on Solana blockchain, featuring:
- **Real-time WebSocket integration** for live updates
- **CLOUT token rewards** for user engagement
- **Responsive mobile-first design** with 2025 UI trends
- **Social integration** (Twitter/Discord feeds)
- **AI-powered features** for rarity scoring and metadata
- **Privacy-focused trading** with ZK features
- **Comprehensive testing suite** (Unit, Integration, E2E)
- **Phase 1 Complete**: Metaplex Core, Irys, Candy Machine
- **Phase 2 Ready**: Bubblegum v2, Genesis Protocol, Mobile Wallet, Token-2022

## 🏗️ Architecture

```
Frontend (Netlify) → Backend (Render) → PostgreSQL (Render)
                  ↓
              Solana RPC (Helius)
                  ↓
              IPFS (Pinata)
```

## 📁 Project Structure

```
NFTSol/
├── apps/                          # Main applications
│   ├── frontend/                  # React frontend (Netlify)
│   │   ├── src/                   # Source code
│   │   │   ├── components/        # React components
│   │   │   ├── hooks/            # Custom React hooks
│   │   │   ├── services/         # API services
│   │   │   └── utils/            # Utility functions
│   │   ├── public/               # Static assets
│   │   ├── tests/                # Test files
│   │   └── package.json          # Frontend dependencies
│   │
│   ├── backend/                  # Express.js backend (Render)
│   │   ├── src/                  # Source code
│   │   │   ├── routes/           # API routes
│   │   │   ├── services/         # Business logic
│   │   │   └── utils/            # Utilities
│   │   ├── tests/                # Test files
│   │   └── package.json          # Backend dependencies
│   │
│   └── smart-contracts/          # Solana smart contracts
│       ├── programs/             # Anchor programs
│       └── scripts/              # Deployment scripts
│
├── config/                       # Environment configurations
│   ├── development/              # Development environment
│   ├── production/               # Production environment
│   └── *.env.example            # Environment templates
│
├── docs/                         # Documentation
│   ├── development/              # Development docs
│   ├── production/               # Production docs
│   └── deployment/               # Deployment guides
│
├── scripts/                      # Build and deployment scripts
│   ├── development/              # Development scripts
│   └── production/               # Production scripts
│
└── tests/                        # Global test utilities
```

> **📋 See [REPOSITORY_STRUCTURE.md](REPOSITORY_STRUCTURE.md) for detailed structure documentation**

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Git
- Solana CLI (for smart contracts)

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/TheoryofShadows/nftsol.git
   cd nftsol
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install frontend dependencies
   cd apps/frontend && npm install
   
   # Install backend dependencies
   cd ../backend && npm install
   ```

3. **Set up environment variables**
   ```bash
   # Frontend (root-level env)
   cp config/frontend.env.example config/development/frontend.env

   # Backend (per-app env under apps/backend)
   cp apps/backend/config/development/backend.env.example apps/backend/config/development/backend.env
   # Fill in local dev values (Devnet signer, optional Helius); PORT is 3001 in dev
   ```

4. **Start development servers**
   ```bash
   # Start backend (Terminal 1)
   cd apps/backend && npm run dev
   
   # Start frontend (Terminal 2)
   cd apps/frontend && npm run dev
   ```

### Production Deployment

#### Frontend (Netlify)
1. Build the frontend: `cd apps/frontend && npm run build`
2. Deploy `apps/frontend/dist` folder to Netlify
3. Set environment variables in Netlify dashboard

#### Backend (Render)
1. Connect GitHub repository to Render
2. Set environment variables in Render dashboard
3. Deploy automatically on push to main branch

## 🔧 Environment Variables

### Frontend (Netlify)
```bash
VITE_API_BASE=https://nftsol.onrender.com
VITE_NODE_ENV=production
VITE_SOLANA_CLUSTER=mainnet-beta
# ... see client/env.production for complete list
```

### Backend (Render)
```bash
ALLOWED_ORIGINS=https://nftsol.app
DATABASE_URL=postgresql://...
SOLANA_CLUSTER=mainnet-beta
# See apps/backend/config/production/backend.env.example for full list
```

## 🧪 Testing

### Frontend Tests
```bash
cd apps/frontend
npm run test          # Unit tests
npm run test:ui       # Test UI
npm run cypress:open  # E2E tests
```

### Backend Tests
```bash
cd apps/backend
npm run test          # Unit tests
npm run test:e2e      # E2E tests
```

## 📚 Features

### Frontend Features
- ✅ Responsive mobile navigation
- ✅ Real-time WebSocket updates
- ✅ Social integration (Twitter/Discord)
- ✅ Shareable NFT cards with QR codes
- ✅ Virtual scrolling for large lists
- ✅ PWA capabilities
- ✅ Accessibility (WCAG 3.0)
- ✅ Performance optimizations

### Backend Features
- ✅ RESTful API with Express.js
- ✅ WebSocket real-time updates
- ✅ Redis caching with compression
- ✅ Database optimization
- ✅ Connection pooling
- ✅ Batch processing
- ✅ Rate limiting and security

### Blockchain Features
- ✅ Solana integration
- ✅ CLOUT token rewards
- ✅ NFT minting and trading
- ✅ IPFS metadata storage
- ✅ Smart contract integration

## 🔒 Security

- HTTPS enforcement
- CORS configuration
- Rate limiting
- Input validation
- SQL injection prevention
- XSS protection
- CSRF protection

## 📊 Performance

- Code splitting and lazy loading
- Image optimization
- CDN integration
- Database query optimization
- Caching strategies
- Core Web Vitals optimization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/TheoryofShadows/nftsol/issues)
- **Discord**: [Join our community](https://discord.gg/nftsol)

## 🎯 Roadmap

### Phase 2 - 2025 Features (Ready to Implement)
- [ ] **Bubblegum v2**: Mass compressed NFT drops (1M+ NFTs at <$0.01 each)
- [ ] **Genesis Protocol**: Fair launches with anti-sniping
- [ ] **Mobile Wallet Support**: Solana Mobile Stack integration
- [ ] **Token-2022 Extensions**: Advanced token features and governance

### Future Enhancements
- [ ] AI-powered rarity scoring
- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)
- [ ] Multi-chain support
- [ ] NFT fractionalization
- [ ] Advanced trading features

📋 **See [PHASE_2_ROADMAP.md](PHASE_2_ROADMAP.md) for detailed implementation plan**  
🚀 **See [PHASE_2_GETTING_STARTED.md](PHASE_2_GETTING_STARTED.md) to begin Phase 2**

---

**Built with ❤️ by the NFTSol Team**