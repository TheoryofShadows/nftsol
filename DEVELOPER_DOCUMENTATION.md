# 🚀 NFTSol Developer Documentation

## Complete Guide for World-Class Solana/Helius Development

---

## 📚 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Quick Start](#quick-start)
3. [Environment Setup](#environment-setup)
4. [Frontend Development](#frontend-development)
5. [Backend Development](#backend-development)
6. [Solana Integration](#solana-integration)
7. [Helius Integration](#helius-integration)
8. [Database Schema](#database-schema)
9. [API Reference](#api-reference)
10. [Deployment](#deployment)
11. [Testing](#testing)
12. [Troubleshooting](#troubleshooting)

---

## 🏗️ Architecture Overview

### Tech Stack

**Frontend:**
- **React 18** - UI library
- **TypeScript 5.9** - Type safety
- **Vite 7.1** - Build tool (fast HMR)
- **Tailwind CSS 3.4** - Utility-first styling
- **React Query (TanStack)** - Data fetching & caching
- **Solana Wallet Adapter** - Multi-wallet support

**Backend:**
- **Node.js 20** - Runtime
- **Express 4** - Web framework
- **TypeScript 5.9** - Type safety
- **PostgreSQL** - Database
- **Drizzle ORM** - Type-safe database queries
- **Winston** - Logging

**Blockchain:**
- **Solana** - Layer 1 blockchain
- **Helius** - Enhanced RPC provider
- **Metaplex** - NFT standard
- **Anchor** - Smart contract framework
- **CLOUT Token** - Native utility token

**Infrastructure:**
- **Netlify** - Frontend hosting
- **Render** - Backend hosting
- **GitHub** - Version control
- **GitHub Actions** - CI/CD

### Project Structure

```
NFTSol/
├── client/                    # Frontend React app
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── context/         # React Context providers
│   │   ├── services/        # API services
│   │   ├── lib/             # Utility libraries
│   │   ├── styles/          # CSS files
│   │   ├── echo/            # Eternal Echoes feature
│   │   └── main.tsx         # Entry point
│   ├── public/              # Static assets
│   ├── vite.config.ts       # Vite configuration
│   └── package.json         # Frontend dependencies
│
├── apps/backend/             # Backend Express API
│   ├── src/
│   │   ├── routes/          # API route handlers
│   │   ├── services/        # Business logic services
│   │   ├── lib/             # Utility libraries
│   │   ├── utils/           # Helper functions
│   │   ├── middleware/      # Express middleware
│   │   ├── config/          # Configuration
│   │   └── index.ts         # Entry point
│   ├── migrations/          # Database migrations
│   └── package.json         # Backend dependencies
│
├── apps/smart-contracts/     # Solana programs
│   └── programs/            # Anchor programs
│
├── docs/                     # Documentation files
│   ├── DEPLOYMENT_VERIFICATION_2026.md
│   ├── MODERN_DESIGN_2024.md
│   ├── SOLANA_BEST_PRACTICES.md
│   └── NETLIFY_QUICK_SETUP.md
│
├── scripts/                  # Utility scripts
├── netlify.toml             # Netlify configuration
├── render.yaml              # Render configuration
└── package.json             # Root workspace config
```

---

## ⚡ Quick Start

### Prerequisites

- **Node.js 20+** - [Download](https://nodejs.org/)
- **npm 10+** - Comes with Node.js
- **Git** - [Download](https://git-scm.com/)
- **PostgreSQL 14+** - [Download](https://www.postgresql.org/)
- **Solana CLI** (optional) - [Install](https://docs.solana.com/cli/install-solana-cli-tools)

### 1. Clone Repository

```bash
git clone https://github.com/TheoryofShadows/nftsol.git
cd nftsol
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install client dependencies
cd client
npm install

# Install backend dependencies
cd ../apps/backend
npm install
```

### 3. Setup Environment Variables

**Frontend (.env in `client/` folder):**
```env
VITE_API_BASE=http://localhost:3001
VITE_SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
VITE_SOLANA_CLUSTER=mainnet-beta
VITE_HELIUS_API_KEY=YOUR_HELIUS_API_KEY
VITE_GA_TRACKING_ID=G-XXXXXXXXXX
```

**Backend (.env in `apps/backend/` folder):**
```env
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://user:password@localhost:5432/nftsol
SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
SOLANA_CLUSTER=mainnet-beta
HELIUS_API_KEY=YOUR_HELIUS_API_KEY
<<<<<<< HEAD
CLOUT_MINT=26iJ37BE3icVtoo2QRkfjtYXFHMudG2sbTHAnhF2D6ab
REWARDS_VAULT=7SBYHw5KQasPKajH6gCDnpWmb5QAh9EBvTi3cUnFAc1v
=======
CLOUT_MINT=62hWQAgAV4jugHSuZsMqzxZNVXaVLrbRpz3Sw58Z64Mw
REWARDS_VAULT=2KkNwFZbznAtYX1xjVS6e5BBqQnfaBuTjn42G4zJXAps
>>>>>>> origin/develop
JWT_SECRET=your-secret-key-here
```

### 4. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd apps/backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```

**Access:**
- Frontend: http://localhost:5173
- Backend: http://localhost:3001

---

## 🎨 Frontend Development

### Component Structure

**Modern Component Example:**
```tsx
import React from 'react';

interface MyComponentProps {
  title: string;
  onAction: () => void;
}

export default function MyComponent({ title, onAction }: MyComponentProps) {
  return (
    <div className="card-modern p-6">
      <h2 className="text-heading gradient-text-modern">{title}</h2>
      <button className="btn-modern" onClick={onAction}>
        <span className="relative z-10">Click Me</span>
      </button>
    </div>
  );
}
```

### Modern Design System

**CSS Classes:**
```css
/* Cards */
.card-modern          /* Glassmorphism card with hover effects */
.glass-modern         /* Frosted glass effect */

/* Typography */
.text-display         /* Large hero text (responsive) */
.text-heading         /* Section headings (responsive) */
.text-body            /* Body text with optimal line-height */
.gradient-text-modern /* Rainbow gradient text effect */

/* Buttons */
.btn-modern           /* Premium button with shimmer effect */
.badge-modern         /* Modern badge/pill component */

/* Animations */
.float-animation      /* Floating up/down animation */
.shimmer              /* Shimmer loading effect */
.skeleton             /* Skeleton loader */
.glow-border          /* Animated glow border on hover */
.scroll-reveal        /* Fade in on scroll */
```

### Hooks

#### useCloutBalance
```tsx
import { useCloutBalance } from './hooks/useCloutBalance';

function MyComponent() {
  const { balance, isLoading, error, refetch } = useCloutBalance();
  
  return (
    <div>
      {isLoading ? 'Loading...' : `${balance} CLOUT`}
    </div>
  );
}
```

#### useSolanaBalance
```tsx
import { useSolanaBalance } from './lib/solana-optimized';

function WalletInfo() {
  const { data: balance, isLoading } = useSolanaBalance();
  
  return <div>{balance} SOL</div>;
}
```

### State Management

**React Query for Data Fetching:**
```tsx
import { useQuery, useMutation } from '@tanstack/react-query';

// Fetch data
const { data, isLoading, error } = useQuery({
  queryKey: ['nfts', 'marketplace'],
  queryFn: () => fetch('/api/nfts').then(r => r.json()),
  staleTime: 5 * 60 * 1000, // 5 minutes
});

// Mutate data
const mutation = useMutation({
  mutationFn: (newNFT) => fetch('/api/nfts', {
    method: 'POST',
    body: JSON.stringify(newNFT),
  }),
  onSuccess: () => {
    queryClient.invalidateQueries(['nfts']);
  },
});
```

---

## ⚙️ Backend Development

### API Route Structure

```typescript
// apps/backend/src/routes/myroute.ts
import { Router } from 'express';
import type { Request, Response } from 'express';

const router = Router();

router.get('/api/myendpoint', async (req: Request, res: Response) => {
  try {
    // Your logic here
    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

export default router;
```

### Database Queries

```typescript
import { pool } from '../lib/db';

// Simple query
const result = await pool.query('SELECT * FROM nfts WHERE id = $1', [nftId]);

// With error handling
try {
  const result = await pool.query(
    'INSERT INTO nfts (name, image_url, owner) VALUES ($1, $2, $3) RETURNING *',
    [name, imageUrl, owner]
  );
  return result.rows[0];
} catch (error) {
  console.error('Database error:', error);
  throw error;
}
```

### Middleware

**Authentication:**
```typescript
import jwt from 'jsonwebtoken';

export function authenticateJWT(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
}
```

---

## ⛓️ Solana Integration

### Connection Setup

```typescript
import { Connection, PublicKey } from '@solana/web3.js';

const connection = new Connection(
  process.env.SOLANA_RPC_URL,
  'confirmed'
);
```

### Fetching Account Balance

```typescript
const balance = await connection.getBalance(
  new PublicKey(walletAddress)
);
console.log(`Balance: ${balance / LAMPORTS_PER_SOL} SOL`);
```

### CLOUT Token Operations

```typescript
import { getAssociatedTokenAddress, getAccount } from '@solana/spl-token';

const mint = new PublicKey(process.env.CLOUT_MINT);
const owner = new PublicKey(walletAddress);

const ata = await getAssociatedTokenAddress(mint, owner);
const tokenAccount = await getAccount(connection, ata);

console.log(`CLOUT Balance: ${tokenAccount.amount}`);
```

---

## 🚀 Helius Integration

### Digital Asset Standard (DAS) API

**Get Assets by Owner:**
```typescript
import { heliusService } from './services/helius';

const assets = await heliusService.getAssetsByOwner(
  'owner_wallet_address',
  { page: 1, limit: 50 }
);

console.log(`Found ${assets.total} NFTs`);
```

**Priority Fee Recommendations:**
```typescript
const fees = await heliusService.getPriorityFeeEstimate();

console.log(`Recommended fee: ${fees.medium} lamports`);
```

**Send Optimized Transaction:**
```typescript
const signature = await heliusService.sendOptimizedTransaction(
  transaction,
  { skipPreflight: false, maxRetries: 3 }
);
```

---

## 🗄️ Database Schema

### Main Tables

**nfts:**
```sql
CREATE TABLE nfts (
  id SERIAL PRIMARY KEY,
  mint_address VARCHAR(44) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  symbol VARCHAR(10),
  description TEXT,
  image_url TEXT,
  metadata_uri TEXT,
  owner VARCHAR(44) NOT NULL,
  creator VARCHAR(44) NOT NULL,
  price DECIMAL(20, 9),
  listed BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**wallets:**
```sql
CREATE TABLE wallets (
  address VARCHAR(44) PRIMARY KEY,
  balance_sol DECIMAL(20, 9) DEFAULT 0,
  balance_clout DECIMAL(20, 9) DEFAULT 0,
  nft_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 📡 API Reference

### Public Endpoints

#### GET `/api/public/stats`
Get platform statistics.

**Response:**
```json
{
  "success": true,
  "platform": {
    "totalNFTs": 1234,
    "listedNFTs": 567,
    "soldNFTs": 89,
    "totalVolume": 45.67
  }
}
```

#### GET `/api/nfts`
Get all NFTs with optional filters.

**Query Parameters:**
- `collection` - Filter by collection
- `status` - Filter by status (listed, sold, etc.)
- `owner` - Filter by owner address

**Response:**
```json
{
  "success": true,
  "nfts": [
    {
      "id": "1",
      "name": "Cool NFT #1",
      "imageUrl": "https://...",
      "price": "1.5",
      "owner": "wallet_address"
    }
  ]
}
```

#### GET `/api/clout/balance/:address`
Get CLOUT token balance for address.

**Response:**
```json
{
  "success": true,
  "data": {
    "address": "wallet_address",
    "balance": 1000,
<<<<<<< HEAD
    "token": "26iJ37BE3icVtoo2QRkfjtYXFHMudG2sbTHAnhF2D6ab"
=======
    "token": "62hWQAgAV4jugHSuZsMqzxZNVXaVLrbRpz3Sw58Z64Mw"
>>>>>>> origin/develop
  }
}
```

---

## 🚢 Deployment

### Netlify (Frontend)

**Configuration:** `netlify.toml`
```toml
[build]
  base = "client"
  publish = "dist"
  command = "npm install --include=dev && npm run build"

[build.environment]
  NODE_VERSION = "20"
  CI = "false"
  NPM_CONFIG_PRODUCTION = "false"
```

**Environment Variables:**
- `VITE_API_BASE`
- `VITE_SOLANA_RPC_URL`
- `VITE_SOLANA_CLUSTER`
- `VITE_HELIUS_API_KEY`

### Render (Backend)

**Build Command:**
```bash
cd apps/backend && npm ci && npm run build
```

**Start Command:**
```bash
cd apps/backend && node dist/index.js
```

**Environment Variables:**
- See `RENDER-ENV-VARS-COMPLETE.txt`

---

## 🧪 Testing

### Frontend Tests

```bash
cd client
npm run test
```

### Backend Tests

```bash
cd apps/backend
npm run test
```

### E2E Tests

```bash
npm run test:e2e
```

---

## 🔧 Troubleshooting

### Common Issues

#### CORS Errors
**Problem:** Frontend can't connect to backend  
**Solution:** Add your frontend URL to `ALLOWED_ORIGINS` in backend env vars

#### Wallet Won't Connect
**Problem:** Phantom/Solflare won't connect  
**Solution:** Check `VITE_SOLANA_RPC_URL` is correct, test in browser console

#### CLOUT Balance Shows 0
**Problem:** Balance not displaying  
**Solution:** Verify wallet has CLOUT tokens, check backend logs for `[CLOUT]` errors

#### Build Fails on Netlify
**Problem:** "vite: not found"  
**Solution:** Ensure `NPM_CONFIG_PRODUCTION=false` is set

---

## 📞 Support

- **GitHub Issues:** https://github.com/TheoryofShadows/nftsol/issues
- **Documentation:** See `/docs` folder
- **Best Practices:** `SOLANA_BEST_PRACTICES.md`

---

**Last Updated:** 2024-11-03  
**Version:** 1.0.0  
**Maintainer:** NFTSol Team

