# NFTSol Step 0 — Client + IPFS Proxy

[![CI](https://img.shields.io/github/actions/workflow/status/TheoryofShadows/nftsol/ci.yml?branch=main&label=CI)](https://github.com/TheoryofShadows/nftsol/actions)
![License](https://img.shields.io/badge/license-MIT-informational)
![Stars](https://img.shields.io/github/stars/TheoryofShadows/nftsol?style=social)

A tiny, production-minded setup for:
- **IPFS image proxy** (Node/Express, pm2) with gateway rotation + browser-like headers
- **Vite/React client** that loads images via the local proxy (`/ipfs-img?u=...`)

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
