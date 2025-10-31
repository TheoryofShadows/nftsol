<!-- BADGES:BEGIN -->
[![CI](https://github.com/TheoryofShadows/nftsol/actions/workflows/ci.yml/badge.svg)](https://github.com/TheoryofShadows/nftsol/actions/workflows/ci.yml) [![Pages](https://github.com/TheoryofShadows/nftsol/actions/workflows/pages.yml/badge.svg)](https://github.com/TheoryofShadows/nftsol/actions/workflows/pages.yml)
<!-- BADGES:END -->

# NFTSol - Decentralized NFT Marketplace on Solana

[![CI](https://img.shields.io/github/actions/workflow/status/TheoryofShadows/nftsol/ci.yml?branch=main&label=CI)](https://github.com/TheoryofShadows/nftsol/actions)
![License](https://img.shields.io/badge/license-MIT-informational)
![Stars](https://img.shields.io/github/stars/TheoryofShadows/nftsol?style=social)

**NFTSol** is a comprehensive, production-ready NFT marketplace built on the Solana blockchain, featuring:

- 🎨 **Full NFT Marketplace**: Create, buy, and sell NFTs
- ⭐ **CLOUT Token System**: Native reward token for platform engagement  
- 🚀 **Solana Integration**: Real blockchain transactions with low fees
- 🔒 **Enterprise Security**: Bank-grade security with comprehensive audit trails
- 📱 **Modern UI**: Beautiful, responsive interface with wallet integration

## 📚 Documentation

- **[WHITEPAPER.md](WHITEPAPER.md)** - Complete project overview, tokenomics, and roadmap
- **[TECHNICAL-DOCS.md](TECHNICAL-DOCS.md)** - Technical documentation, API reference, and architecture
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Deployment guide for Render and Netlify
- **[SECURITY.md](SECURITY.md)** - Security best practices and guidelines

## Quick Start

### Proxy (pm2)
cd server
cp -n .env.example .env
pm2 start ecosystem.config.cjs
pm2 save
pm2 status

### Client
cd ../client
cp -n .env.example .env
npm ci
npm run dev -- --port 5174
# open http://localhost:5174

## Handy
pm2 logs ipfs-proxy --lines 50
pm2 restart ipfs-proxy
fuser -k 5174/tcp || true

<!-- LIVE-DEMO:BEGIN -->
## Live Demo & Local Setup

**GitHub Pages:** https://theoryofshadows.github.io/nftsol/

### Run locally (WSL)
```bash
# backend (proxy + static)
pm2 start /server/ecosystem.config.cjs && pm2 save
curl -I http://127.0.0.1:8088/image.png | head -n 6

# client
cd /client
npm run dev -- --port 5174 --host 127.0.0.1 --strictPort
```

### Configure client to use your proxy
Create `nftsol/client/.env` with:
```dotenv
VITE_IMG_PROXY_BASE=http://localhost:3003
```

If not set, the site runs in **Demo Mode** so Pages visitors still see a sample image.
<!-- LIVE-DEMO:END -->

