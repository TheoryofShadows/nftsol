# NFTSol - Revolutionary NFT Platform

> The Most Revolutionary NFT Platform on Solana with CLOUT Token Rewards

## 🚀 Overview

NFTSol is a cutting-edge NFT marketplace built on Solana blockchain, featuring:
- **Real-time WebSocket integration** for live updates
- **CLOUT token rewards** for user engagement
- **Responsive mobile-first design** with 2026 UI trends
- **Social integration** (Twitter/Discord feeds)
- **AI-powered features** for rarity scoring and metadata
- **Privacy-focused trading** with ZK features
- **Comprehensive testing suite** (Unit, Integration, E2E)

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
├── client/                 # React frontend (Netlify)
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API and WebSocket services
│   │   └── utils/          # Utility functions
│   ├── cypress/            # E2E tests
│   ├── dist/               # Production build
│   └── env.*               # Environment configurations
├── server/                 # Express.js backend (Render)
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── utils/          # Utilities
│   │   └── tests/          # Backend tests
│   └── env.*               # Environment configurations
├── anchor/                 # Solana smart contracts
└── docs/                   # Documentation
```

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
   
   # Install client dependencies
   cd client && npm install
   
   # Install server dependencies
   cd ../server && npm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy environment files
   cp client/env.development client/.env.local
   cp server/env.development server/.env
   ```

4. **Start development servers**
   ```bash
   # Start backend (Terminal 1)
   cd server && npm run dev
   
   # Start frontend (Terminal 2)
   cd client && npm run dev
   ```

### Production Deployment

#### Frontend (Netlify)
1. Build the frontend: `cd client && npm run build`
2. Deploy `client/dist` folder to Netlify
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
# ... see server/env.production for complete list
```

## 🧪 Testing

### Frontend Tests
```bash
cd client
npm run test          # Unit tests
npm run test:ui       # Test UI
npm run cypress:open  # E2E tests
```

### Backend Tests
```bash
cd server
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

- [ ] AI-powered rarity scoring
- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)
- [ ] Multi-chain support
- [ ] NFT fractionalization
- [ ] Advanced trading features

---

**Built with ❤️ by the NFTSol Team**