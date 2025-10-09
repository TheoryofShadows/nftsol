# 🚀 NFTSol - Solana NFT Marketplace with Rewards

A comprehensive NFT marketplace built on Solana featuring CLOUT token rewards, social trading, AI enhancements, and a complete loyalty system.

## ✨ Features

### Core Features
- 🎨 **NFT Marketplace** - Buy, sell, and discover Solana NFTs
- 💰 **CLOUT Token Rewards** - Earn rewards for marketplace activity
- 🔗 **Multi-Wallet Support** - Phantom, Solflare, and more
- 📊 **Portfolio Tracking** - Monitor your NFT holdings
- 🎯 **Loyalty System** - Tier-based rewards (Bronze → Diamond)

### Advanced Features
- 👥 **Social Trading** - Follow top traders and copy trades
- 🤖 **AI Enhancements** - AI-powered NFT descriptions and analysis
- 📈 **Analytics Dashboard** - Real-time market insights
- 🎮 **Gamification** - Challenges and achievements
- 💬 **Community Features** - Comments, likes, and social interactions

### Technical Features
- ⚡ **High Performance** - Optimized bundle splitting and lazy loading
- 🔐 **Secure** - JWT auth, rate limiting, input validation
- 🌐 **Multiple API Integrations** - Helius, Magic Eden, QuickNode, and more
- 📱 **Responsive Design** - Works on desktop and mobile
- 🔄 **Real-time Updates** - WebSocket support

## 🏗️ Architecture

```
nftsol/
├── client/           # React frontend (Vite + TypeScript)
├── server/           # Express backend (Node.js + TypeScript)
├── shared/           # Shared types and schemas
├── anchor/           # Solana programs (Anchor framework)
│   └── solana_rewards/
│       ├── programs/
│       │   ├── clout_staking/     # Staking program
│       │   ├── market_escrow/     # Marketplace escrow
│       │   ├── rewards_vault/     # Token rewards
│       │   └── loyalty_registry/  # User loyalty
│       └── generated/  # Generated IDLs and types
├── docs/             # Documentation
└── scripts/          # Deployment and utility scripts
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Solana CLI (for program deployment)
- Anchor CLI (for Solana programs)

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd nftsol
npm install
```

### 2. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env and set required variables
# Minimum required:
# - DATABASE_URL
# - JWT_SECRET
```

**Required Environment Variables:**

```env
DATABASE_URL=postgresql://user:pass@host:5432/database
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
SOLANA_NETWORK=devnet
```

**Recommended API Keys:**

```env
HELIUS_API_KEY=your-helius-key  # Get from https://helius.dev
OPENAI_API_KEY=your-openai-key  # Get from https://platform.openai.com
```

### 3. Database Setup

```bash
# The app will automatically create tables on first run
# using Drizzle ORM migrations

# Or manually run migrations
npx drizzle-kit push:pg
```

### 4. Deploy Anchor Programs (Optional)

```bash
cd anchor/solana_rewards
anchor build
anchor deploy --provider.cluster devnet

# Copy program IDs to .env
```

### 5. Deploy CLOUT Token (Optional)

```bash
npm run deploy:token
# Copy the mint address to .env as CLOUT_TOKEN_MINT_ADDRESS
```

### 6. Start Development Server

```bash
# Start both frontend and backend
npm run dev

# Or start separately
npm run dev:server  # Backend on http://localhost:3001
npm run dev:client  # Frontend on http://localhost:5173
```

## 📦 Available Scripts

```bash
# Development
npm run dev              # Start both client and server
npm run dev:server       # Start backend only
npm run dev:client       # Start frontend only

# Building
npm run build            # Build for production
npm run prebuild         # Build Anchor programs and generate types

# Deployment
npm start                # Start production server

# Anchor Programs
npm run anchor:build     # Build Solana programs
npm run anchor:generate  # Generate TypeScript types
```

## 🔐 Security Features

- ✅ Helmet.js for HTTP security headers
- ✅ CORS configuration
- ✅ Rate limiting
- ✅ Input sanitization
- ✅ SQL injection protection (Drizzle ORM)
- ✅ JWT authentication
- ✅ Password hashing (bcrypt)
- ✅ File upload validation
- ✅ Admin IP restrictions
- ✅ Sentry error monitoring

## 🎯 API Integrations

### Configured APIs

| Service | Purpose | Tier | Status |
|---------|---------|------|--------|
| **Helius** | Enhanced Solana RPC | Free (100K credits/mo) | ✅ Recommended |
| **Magic Eden** | NFT marketplace data | Free | ✅ Working |
| **QuickNode** | Fast Solana RPC | Free (5M credits/mo) | ⚠️ Optional |
| **SimpleHash** | Multi-chain NFT data | Free tier | ⚠️ Optional |
| **OpenAI** | AI features | $5 free credit | ⚠️ For AI features |
| **Solscan** | Transaction data | Free | ✅ Working |
| **CoinGecko** | Price data | Free | ✅ Working |
| **Jupiter** | Token swaps | Free | ✅ Working |

## 🏛️ Solana Programs

### Deployed Programs

1. **Rewards Vault** - Manages CLOUT token distribution
2. **Clout Staking** - Stake CLOUT to earn rewards
3. **Market Escrow** - Handles NFT marketplace settlements
4. **Loyalty Registry** - Tracks user loyalty and tiers

### Loyalty Tiers

| Tier | Volume Required | Bonus Multiplier |
|------|----------------|------------------|
| 🥉 Bronze | 0 SOL | 1.0x |
| 🥈 Silver | 10 SOL | 1.1x |
| 🥇 Gold | 50 SOL | 1.25x |
| 💎 Platinum | 200 SOL | 1.5x |
| 💠 Diamond | 1000 SOL | 2.0x |

### Reward Formula

```
Base Reward = Transaction Amount × 10 CLOUT per SOL
Final Reward = Base Reward × Tier Multiplier
```

## 📊 Performance

### Bundle Optimization

- ✅ Code splitting by vendor (React, Solana, Radix UI)
- ✅ Lazy loading for all pages
- ✅ Tree-shaking for unused code
- ✅ Terser minification
- ✅ Console logs removed in production

### Expected Metrics

| Metric | Target |
|--------|--------|
| Bundle Size | < 800KB |
| First Load | < 1s |
| Time to Interactive | < 1.5s |
| Lighthouse Score | > 95 |

## 🌐 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables in Vercel dashboard
```

Configuration: `vercel.json` ✅

### Railway

```bash
# Connect to Railway
railway link

# Deploy
railway up
```

Configuration: `railway.json` ✅

### Render

1. Connect your GitHub repository
2. Use `render.yaml` for configuration
3. Set environment variables in dashboard

Configuration: `render.yaml` ✅

## 🗄️ Database Schema

### Core Tables

- `users` - User authentication and profiles
- `nfts` - NFT listings and metadata
- `loyalty_profiles` - User loyalty tracking
- `platform_metrics` - Analytics and stats

### Planned Tables

- `traders` - Social trading profiles
- `trades` - Trading history
- `challenges` - Gamification challenges
- `notifications` - User notifications

## 📚 Documentation

- [Optimization Roadmap](./OPTIMIZATION_ROADMAP.md) - Complete audit and fixes
- [Anchor Programs](./docs/anchor-program-spec.md) - Program specifications
- [Rewards Math](./docs/clout-rewards-math.md) - Reward calculations
- [Solana Integration](./docs/solana-rewards-integration.md) - Integration guide

## 🔧 Troubleshooting

### Common Issues

**Dependencies not installing:**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Database connection issues:**
- Verify DATABASE_URL is correct
- Check if database is accessible
- Ensure PostgreSQL is running

**Anchor build fails:**
```bash
# Make sure Anchor is installed
anchor --version

# Rebuild
cd anchor/solana_rewards
anchor clean
anchor build
```

**Frontend not connecting to backend:**
- Check VITE_BACKEND_URL in .env
- Verify backend is running on port 3001
- Check CORS configuration

### Debug Mode

```bash
# Enable detailed logging
NODE_ENV=development npm run dev:server
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests (when available)
5. Submit a pull request

## 📝 Environment Variables Reference

See [.env.example](./.env.example) for complete list of environment variables and setup instructions.

## 🔒 Security

- Report security vulnerabilities privately
- Never commit `.env` file
- Keep API keys secure
- Use strong JWT_SECRET (min 32 characters)

## 📈 Monitoring

### Sentry Integration

```env
SENTRY_DSN=your-sentry-dsn
```

Errors are automatically captured and sent to Sentry in production.

### Health Checks

- Backend: `http://localhost:3001/health`
- API: `http://localhost:3001/api/health`
- Security: `http://localhost:3001/api/security/health`

## 🎨 UI Components

Built with:
- Radix UI primitives
- Tailwind CSS
- Lucide icons
- Custom animations

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Run specific test
npm test -- <test-name>
```

## 📦 Tech Stack

**Frontend:**
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Radix UI
- React Query
- Wouter (routing)

**Backend:**
- Node.js
- Express
- TypeScript
- Drizzle ORM
- PostgreSQL
- WebSocket (Socket.io)

**Blockchain:**
- Solana
- Anchor Framework
- SPL Tokens
- Solana Wallet Adapter

**Tools:**
- ESLint
- PostCSS
- Sentry
- Node-cache

## 📞 Support

- Issues: [GitHub Issues](your-repo/issues)
- Discussions: [GitHub Discussions](your-repo/discussions)
- Discord: [Join our Discord](#)

## 📄 License

See [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- Solana Foundation
- Anchor Framework
- Magic Eden
- Helius
- All contributors

---

**Built with ❤️ for the Solana ecosystem**

*For detailed optimization and deployment guide, see [OPTIMIZATION_ROADMAP.md](./OPTIMIZATION_ROADMAP.md)*
