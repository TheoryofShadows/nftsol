# CLAUDE.md - AI Assistant Guide for NFTSol

**Version:** 1.0
**Last Updated:** November 2025
**Purpose:** Guide for AI assistants working on the NFTSol codebase

---

## 📋 Table of Contents

1. [Repository Overview](#repository-overview)
2. [Codebase Structure](#codebase-structure)
3. [Technology Stack](#technology-stack)
4. [Development Setup](#development-setup)
5. [Key Conventions](#key-conventions)
6. [File Organization](#file-organization)
7. [Common Development Tasks](#common-development-tasks)
8. [Testing Guidelines](#testing-guidelines)
9. [Deployment Workflows](#deployment-workflows)
10. [Important Notes](#important-notes)
11. [Troubleshooting](#troubleshooting)

---

## 📖 Repository Overview

**NFTSol** is an enterprise-grade NFT marketplace built on Solana with the following key features:

- **Full NFT Marketplace**: Mint, buy, and sell NFTs on Solana mainnet
- **Video NFT Support**: Upload and mint video NFTs with AI verification
- **Grok AI Integration**: AI-powered authenticity verification for video content
- **CLOUT Token System**: Native reward token for platform engagement
- **Eternal Echoes**: Collaborative, layered NFT creation system
- **Compressed NFTs**: Low-cost minting via Metaplex Bubblegum
- **Enterprise Security**: Bank-grade security with audit trails
- **Multi-Wallet Support**: 9 different Solana wallet adapters
- **Modern UI**: 2026-style dashboard with glassmorphism effects

### Production URLs
- **Frontend**: https://nftsolmarket.netlify.app
- **Backend API**: https://nftsol.onrender.com
- **GitHub**: https://github.com/TheoryofShadows/nftsol

---

## 🏗️ Codebase Structure

```
nftsol/
├── client/                      # Frontend React application
│   ├── src/
│   │   ├── components/         # React UI components
│   │   ├── hooks/              # Custom React hooks
│   │   ├── services/           # API service layer
│   │   ├── context/            # React context providers
│   │   ├── lib/                # Client utilities
│   │   ├── styles/             # CSS and styling
│   │   ├── types/              # TypeScript type definitions
│   │   ├── echo/               # Eternal Echoes feature
│   │   ├── wallet/             # Wallet integration
│   │   ├── App.tsx             # Main application component
│   │   └── main.tsx            # Application entry point
│   ├── public/                 # Static assets
│   ├── package.json
│   ├── vite.config.ts          # Vite build configuration
│   ├── tsconfig.json           # TypeScript configuration
│   └── .eslintrc.cjs           # ESLint configuration
│
├── server/                      # Legacy server directory (some files still active)
│   ├── routes/                 # API route handlers
│   ├── services/               # Business logic services
│   └── [various service files] # Standalone service implementations
│
├── apps/
│   ├── backend/                # Main backend application
│   │   ├── src/
│   │   │   ├── routes/        # API endpoints
│   │   │   ├── services/      # Business logic
│   │   │   ├── middleware/    # Express middleware
│   │   │   └── index.ts       # Server entry point
│   │   ├── scripts/           # Utility scripts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── smart-contracts/       # Solana on-chain programs
│       └── solana_rewards/
│           └── programs/
│               └── eternal_echoes/
│
├── shared/                     # Shared code (types, constants, utilities)
│   ├── types/
│   ├── constants/
│   ├── config/
│   ├── validation/
│   └── utils/
│
├── scripts/                    # Development and deployment scripts
│   ├── development/
│   └── [various utility scripts]
│
├── .github/
│   └── workflows/              # GitHub Actions CI/CD
│       ├── ci.yml             # Continuous Integration
│       ├── deploy.yml         # Deployment automation
│       ├── test.yml           # Automated testing
│       ├── health-check.yml   # Production health monitoring
│       └── secret-scan.yml    # Security scanning
│
└── [Documentation files]
    ├── README.md              # Project overview
    ├── ARCHITECTURE.md        # Architecture guide
    ├── TECHNICAL-DOCS.md      # Detailed technical documentation
    ├── CONTRIBUTING.md        # Contribution guidelines
    ├── SECURITY.md            # Security policy
    └── [Various other guides]
```

### Key Directory Notes

- **Active Server Code**: Both `server/` and `apps/backend/` contain server code. The project is in transition from the legacy `server/` directory to `apps/backend/`.
- **Shared Package**: The `shared/` directory contains code shared between client and server (types, constants, validation schemas).
- **Documentation**: Extensive documentation in the root directory covers all aspects of the project.

---

## 🛠️ Technology Stack

### Frontend (`client/`)
- **Framework**: React 18.3.1 with TypeScript 5.6+
- **Build Tool**: Vite 7.1+ (fast development and builds)
- **UI Framework**: Tailwind CSS 4.1 with custom glassmorphism design
- **State Management**:
  - React Context for global state
  - TanStack Query (React Query) v5 for server state and caching
- **Blockchain Integration**:
  - @solana/web3.js v1.98+ for Solana interactions
  - @solana/wallet-adapter-react for wallet connections
  - 9 wallet adapters (Phantom, Solflare, Ledger, etc.)
- **UI Enhancements**:
  - react-joyride for interactive onboarding tours
  - canvas-confetti for celebration effects
  - react-dropzone for file uploads
- **Testing**: Vitest with React Testing Library

### Backend (`apps/backend/` and `server/`)
- **Runtime**: Node.js 20+
- **Framework**: Express 5.1+ with TypeScript 5.9+
- **Database**: PostgreSQL 14+ with connection pooling
- **ORM**: Drizzle ORM (mentioned in docs)
- **Blockchain**:
  - @solana/web3.js v1.98+ for Solana RPC interactions
  - @metaplex-foundation/js v0.20+ for NFT operations
  - @metaplex-foundation/umi for unified Metaplex interface
  - @coral-xyz/anchor v0.32+ for Solana program interactions
  - @solana/spl-token for token operations
  - Metaplex Bubblegum for compressed NFTs
- **Storage**:
  - IPFS via Pinata for video/image storage
  - Irys (Arweave) for decentralized metadata storage
- **Authentication**: JWT + session management
- **Security**:
  - Helmet.js for security headers
  - express-rate-limit for rate limiting
  - bcryptjs for password hashing
- **AI Integration**:
  - xAI Grok API for video verification
  - Cloudflare AI as fallback

### Blockchain
- **Network**: Solana Mainnet (configurable to devnet)
- **CLOUT Token**: `26iJ37BE3icVtoo2QRkfjtYXFHMudG2sbTHAnhF2D6ab`
- **Rewards Vault**: `7SBYHw5KQasPKajH6gCDnpWmb5QAh9EBvTi3cUnFAc1v`
- **NFT Standards**: Metaplex Token Metadata, Bubblegum (cNFTs)

### Development Tools
- **TypeScript**: Strict mode enabled
- **ESLint**: Code linting with TypeScript plugin
- **Prettier**: Code formatting (3.6.2)
- **Husky**: Git hooks for pre-commit checks
- **Commitlint**: Conventional commit enforcement
- **GitHub Actions**: CI/CD automation

---

## 🚀 Development Setup

### Prerequisites
```bash
# Required
- Node.js 20.x+ (check with: node --version)
- npm (comes with Node.js)
- PostgreSQL 14+
- Git

# Recommended
- VSCode with ESLint and Prettier extensions
- Solana CLI (for blockchain testing)
```

### Environment Setup

#### 1. Clone Repository
```bash
git clone https://github.com/TheoryofShadows/nftsol.git
cd nftsol
```

#### 2. Backend Setup
```bash
cd apps/backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your configuration:
# - DATABASE_URL: PostgreSQL connection string
# - SOLANA_RPC_URL: Helius or QuickNode RPC endpoint
# - CLOUT_PROGRAM_ID: Token mint address
# - PLATFORM_SECRET_KEY_BASE58: Platform wallet private key
# - JWT_SECRET: Secret for JWT tokens
# - PINATA_JWT: For video storage (optional)
# - XAI_API_KEY: For Grok AI verification (optional)

# Start development server (runs on port 3001)
npm run dev
```

#### 3. Frontend Setup
```bash
cd client

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env:
# VITE_API_BASE=http://localhost:3001
# VITE_SOLANA_RPC_URL=your_rpc_url

# Start development server (runs on port 5173)
npm run dev
```

#### 4. Access Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **API Health**: http://localhost:3001/healthz

### Development Commands

```bash
# Root level (run from project root)
npm run install:all      # Install all dependencies
npm run build           # Build both frontend and backend
npm run lint            # Lint all code
npm run format          # Format all code with Prettier

# Frontend (run from client/)
npm run dev             # Start dev server
npm run build           # Production build
npm run preview         # Preview production build
npm test                # Run tests
npm run lint            # Lint frontend code

# Backend (run from apps/backend/)
npm run dev             # Start dev server with hot reload
npm run build           # Compile TypeScript to dist/
npm run start           # Run compiled code
npm run start:prod      # Production mode
npm test                # Run test suite
npm run type-check      # Check TypeScript types
```

---

## 📝 Key Conventions

### Code Style

#### TypeScript
- **Strict Mode**: Always enabled
- **Explicit Types**: Prefer explicit return types for functions
- **No `any`**: Avoid `any` type; use `unknown` or proper types
- **Naming Conventions**:
  - PascalCase for components, classes, types, interfaces
  - camelCase for variables, functions, methods
  - UPPER_SNAKE_CASE for constants
  - Prefix interfaces with `I` only when necessary

```typescript
// ✅ Good
interface NFTMetadata {
  name: string;
  description: string;
}

const getNftBalance = async (address: string): Promise<number> => {
  // ...
};

const MAX_RETRY_ATTEMPTS = 3;

// ❌ Avoid
const getData = async (addr: any) => {  // No 'any', no explicit return type
  // ...
};
```

#### React Components
- **Function Components**: Use function components with hooks
- **Props Interface**: Always define props interface
- **File Organization**: One component per file
- **Exports**: Use named exports for components

```typescript
// ✅ Good
interface NftCardProps {
  nft: NFT;
  onSelect?: (nft: NFT) => void;
}

export const NftCard: React.FC<NftCardProps> = ({ nft, onSelect }) => {
  // Component logic
};
```

#### Import Organization
1. React and third-party libraries
2. Solana and blockchain libraries
3. Internal absolute imports (@/)
4. Internal relative imports
5. Types
6. Styles

```typescript
// ✅ Good
import React, { useState, useEffect } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';

import { apiService } from '@/services/api';
import { NFT } from '@/types';

import { calculateRarity } from './utils';
import './styles.css';
```

### Path Aliases

Frontend uses TypeScript path aliases (configured in `client/tsconfig.json`):

```typescript
import { Button } from '@/components/Button';
import { useNfts } from '@/hooks/useNfts';
import { apiService } from '@/services/api';
import { NFT } from '@/types';
```

### Error Handling

#### Frontend
```typescript
// Use try-catch with proper error handling
try {
  const result = await apiService.mintNft(data);
  // Handle success
} catch (error) {
  console.error('NFT minting failed:', error);
  // Show user-friendly error message
  setError('Failed to mint NFT. Please try again.');
}
```

#### Backend
```typescript
// Use consistent error responses
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: {
      message: err.message || 'Internal server error',
      code: err.code || 'INTERNAL_ERROR'
    }
  });
});
```

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Format: <type>(<scope>): <description>

feat(nft): add video NFT minting support
fix(wallet): resolve connection timeout issue
docs(api): update endpoint documentation
refactor(clout): improve token distribution logic
test(mint): add unit tests for minting service
perf(db): optimize NFT query performance
chore(deps): update Solana dependencies
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Test additions or fixes
- `chore`: Build process or tooling changes

### API Response Format

All API endpoints follow a consistent response format:

```typescript
// Success response
{
  "success": true,
  "data": {
    // Response payload
  }
}

// Error response
{
  "success": false,
  "error": {
    "message": "Human-readable error message",
    "code": "ERROR_CODE",
    "details": {} // Optional additional context
  }
}
```

---

## 📂 File Organization

### Where to Find Things

#### Frontend Components
- **UI Components**: `client/src/components/`
  - `Hero.tsx` - Landing page hero section
  - `NftGrid.tsx` - NFT listing grid
  - `MintForm.tsx` - NFT minting form
  - `CloutBadge.tsx` - CLOUT token display
  - And many more...

#### Custom Hooks
- **Location**: `client/src/hooks/`
  - `useCloutBalance.ts` - Fetch CLOUT token balance
  - `useNfts.ts` - NFT data fetching
  - `useWallet.ts` - Wallet connection helpers

#### API Services
- **Location**: `client/src/services/`
  - Main API service layer for backend communication
  - Uses React Query for caching and state management

#### Backend Routes
- **Location**: `server/routes/` and `apps/backend/src/routes/`
  - `ai-features.ts` - AI-powered features
  - `ai-metadata.ts` - AI metadata generation
  - `clout-deployment.ts` - CLOUT token operations
  - `solana-rewards.ts` - Reward distribution
  - `wallet-config.ts` - Wallet configuration

#### Backend Services
- **Location**: `server/` (root level services)
  - `clout-system.ts` - CLOUT token business logic
  - `ai-features-service.ts` - AI integration
  - `enhanced-solana-api.ts` - Optimized Solana RPC
  - `external-apis.ts` - Third-party API integrations
  - `helius-api.ts`, `quicknode-api.ts` - RPC providers
  - `magic-eden-api.ts` - Magic Eden integration
  - `recommendation-engine.ts` - NFT recommendations
  - `pricing-analytics.ts` - Price analysis

#### Documentation Files
- **README.md** - Project overview and quick start
- **ARCHITECTURE.md** - Architectural decisions and structure
- **TECHNICAL-DOCS.md** - Detailed API and database documentation
- **CONTRIBUTING.md** - Contribution guidelines
- **SECURITY.md** - Security policies
- **SAAS_*.md** - SaaS-related documentation
- **REAL_DATA_*.md** - Real data integration guides
- **VIEW_APP_GUIDE.md** - Application viewing guide
- **TESTING_COMPLETE.md** - Testing documentation

---

## 🔧 Common Development Tasks

### Adding a New API Endpoint

1. **Create route handler** in `server/routes/` or `apps/backend/src/routes/`:

```typescript
// server/routes/my-feature.ts
import { Router } from 'express';

const router = Router();

router.get('/api/my-feature', async (req, res) => {
  try {
    // Implementation
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Internal error' }
    });
  }
});

export default router;
```

2. **Register route** in `server/index.ts`:

```typescript
import myFeatureRoutes from './routes/my-feature';
app.use(myFeatureRoutes);
```

3. **Document the endpoint** in `TECHNICAL-DOCS.md`

### Adding a New React Component

1. **Create component file** in `client/src/components/`:

```typescript
// client/src/components/MyComponent.tsx
import React from 'react';

interface MyComponentProps {
  title: string;
  onAction?: () => void;
}

export const MyComponent: React.FC<MyComponentProps> = ({
  title,
  onAction
}) => {
  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold">{title}</h2>
      {onAction && (
        <button onClick={onAction} className="mt-2 btn-primary">
          Click Me
        </button>
      )}
    </div>
  );
};
```

2. **Import and use** in parent component:

```typescript
import { MyComponent } from '@/components/MyComponent';

function App() {
  return <MyComponent title="Hello" onAction={() => alert('Hi!')} />;
}
```

### Integrating with Solana

```typescript
import { Connection, PublicKey } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';

function MyWalletComponent() {
  const { publicKey, connected } = useWallet();
  const connection = new Connection(
    import.meta.env.VITE_SOLANA_RPC_URL,
    'confirmed'
  );

  const fetchBalance = async () => {
    if (!publicKey) return;
    const balance = await connection.getBalance(publicKey);
    console.log('Balance:', balance / 1e9, 'SOL');
  };

  return (
    <div>
      {connected && <button onClick={fetchBalance}>Check Balance</button>}
    </div>
  );
}
```

### Working with CLOUT Tokens

```typescript
// Backend: Distribute CLOUT rewards
import { cloutService } from './clout-system';

async function rewardUser(userAddress: string, amount: number) {
  try {
    const signature = await cloutService.distributeReward(
      userAddress,
      amount,
      'NFT Purchase'
    );
    console.log('Reward sent:', signature);
  } catch (error) {
    console.error('Failed to send reward:', error);
  }
}
```

---

## 🧪 Testing Guidelines

### Running Tests

```bash
# Frontend tests
cd client
npm test              # Run once
npm run test:watch    # Watch mode
npm run test:coverage # With coverage

# Backend tests
cd apps/backend
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage
npm run test:unit     # Unit tests only
npm run test:integration  # Integration tests only
```

### Test Structure

#### Frontend Tests
Located in `client/src/__tests__/`:

```typescript
// client/src/__tests__/MyComponent.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { MyComponent } from '../components/MyComponent';

describe('MyComponent', () => {
  it('renders with title', () => {
    render(<MyComponent title="Test Title" />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('calls onAction when button clicked', () => {
    const mockAction = jest.fn();
    render(<MyComponent title="Test" onAction={mockAction} />);

    fireEvent.click(screen.getByText('Click Me'));
    expect(mockAction).toHaveBeenCalledTimes(1);
  });
});
```

#### Backend Tests
Use Jest with supertest for API testing:

```typescript
// apps/backend/src/routes/__tests__/my-feature.test.ts
import request from 'supertest';
import app from '../../app';

describe('GET /api/my-feature', () => {
  it('returns success response', async () => {
    const response = await request(app)
      .get('/api/my-feature')
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('data');
  });
});
```

### Test Coverage

Aim for:
- **Unit tests**: 80%+ coverage
- **Integration tests**: Critical paths covered
- **E2E tests**: Main user flows tested

---

## 🚢 Deployment Workflows

### CI/CD Pipeline

GitHub Actions workflows (`.github/workflows/`):

1. **CI (`ci.yml`)**
   - Triggers: Push to `main` or `develop`, Pull Requests
   - Steps:
     - Checkout code
     - Setup Node.js 20
     - Install dependencies
     - Build frontend and backend
     - Run linting

2. **Deploy (`deploy.yml`)**
   - Triggers: Push to `main` branch
   - Deploys:
     - Frontend → Netlify (automatic)
     - Backend → Render (automatic)

3. **Tests (`test.yml`)**
   - Triggers: Pull Requests
   - Runs full test suite

4. **Health Check (`health-check.yml`)**
   - Triggers: Scheduled (every hour)
   - Monitors production endpoints

5. **Secret Scan (`secret-scan.yml`)**
   - Triggers: Push events
   - Scans for accidentally committed secrets

### Manual Deployment

#### Frontend (Netlify)
```bash
cd client
npm run build        # Creates dist/ folder
# Netlify auto-deploys from GitHub on push to main
```

#### Backend (Render)
```bash
cd apps/backend
npm run build        # Creates dist/ folder
npm run start:prod   # Production server
# Render auto-deploys from GitHub on push to main
```

### Environment Variables

**Never commit:**
- `.env` files
- API keys
- Private keys
- Secrets

**Always use:**
- Environment variables
- `.env.example` templates
- Secure secret management in production (Netlify/Render dashboards)

---

## ⚠️ Important Notes

### Security Best Practices

1. **Never Commit Secrets**
   - Use `.env` files (already in `.gitignore`)
   - Use platform environment variable managers
   - Rotate keys regularly

2. **Input Validation**
   - Validate all user inputs
   - Sanitize data before database operations
   - Use parameterized queries (SQL injection protection)

3. **Authentication**
   - JWT tokens for API authentication
   - Wallet signatures for blockchain operations
   - Rate limiting on all endpoints

4. **CORS Configuration**
   - Properly configured in backend
   - Only allow trusted origins in production

### Solana Best Practices

1. **RPC Usage**
   - Use commitment level 'confirmed' for most operations
   - Implement retry logic for RPC failures
   - Use Helius or QuickNode for better reliability
   - Cache blockhash when possible

2. **Transaction Handling**
   - Always confirm transactions
   - Implement proper error handling
   - Use appropriate compute budget
   - Handle timeout scenarios

3. **Token Operations**
   - Check Associated Token Account (ATA) existence
   - Create ATA if needed before transfers
   - Validate token mint addresses
   - Handle decimal conversions properly

### Performance Considerations

1. **Frontend**
   - Use React Query for caching
   - Implement lazy loading for images
   - Code-split large components
   - Optimize bundle size

2. **Backend**
   - Database connection pooling
   - Query optimization with indexes
   - Caching frequently accessed data
   - Rate limiting to prevent abuse

3. **Blockchain**
   - Batch RPC requests when possible
   - Cache blockhash (valid for ~60 seconds)
   - Use commitment level appropriately
   - Implement RPC failover

### Known Issues & Limitations

1. **Dual Server Structure**
   - Code exists in both `server/` and `apps/backend/`
   - Currently in transition phase
   - Be aware of which files are actively used

2. **Video NFT Storage**
   - Requires Pinata account (free tier available)
   - Falls back to regular NFTs without Pinata

3. **AI Verification**
   - Requires xAI Grok API key
   - Falls back to Cloudflare AI
   - Can be disabled for basic functionality

---

## 🔍 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <pid> /F

# Linux/Mac
lsof -ti:3001 | xargs kill -9
# or
npx kill-port 3001
```

#### Module Not Found Errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

#### TypeScript Build Errors
```bash
# Type check without building
npm run type-check

# Clean build
npm run clean
npm run build
```

#### Wallet Connection Issues
- Ensure wallet extension is installed
- Check browser console for errors
- Verify RPC URL is accessible
- Try different wallet adapter
- Check network (devnet vs mainnet)

#### Database Connection Errors
- Verify PostgreSQL is running
- Check DATABASE_URL in `.env`
- Ensure database exists
- Check connection limits

#### RPC Rate Limiting
- Use Helius or QuickNode (not public RPC)
- Implement retry logic
- Add delays between requests
- Consider RPC failover

### Debug Mode

#### Frontend Debug
```bash
# Enable React Query Devtools (already included)
# Open browser DevTools → React Query tab

# Enable verbose logging
localStorage.setItem('debug', 'app:*');
```

#### Backend Debug
```bash
# Run with inspect flag
npm run dev:debug

# Then attach debugger:
# Chrome: chrome://inspect
# VSCode: Use "Attach to Node Process" configuration
```

### Getting Help

1. **Check Documentation**
   - README.md - Quick start
   - TECHNICAL-DOCS.md - API reference
   - ARCHITECTURE.md - System design

2. **Search Issues**
   - GitHub Issues: https://github.com/TheoryofShadows/nftsol/issues
   - Check closed issues for solutions

3. **Review Recent Changes**
   - Check CHANGELOG.md
   - Review recent commits
   - Look at recent PRs

---

## 📚 Additional Resources

### Internal Documentation
- **README.md** - Project overview
- **ARCHITECTURE.md** - System architecture
- **TECHNICAL-DOCS.md** - API and database details
- **CONTRIBUTING.md** - How to contribute
- **SECURITY.md** - Security policies
- **SAAS_ONBOARDING_GUIDE.md** - SaaS features
- **REAL_DATA_INTEGRATION_GUIDE.md** - Data integration
- **TESTING_COMPLETE.md** - Testing guide

### External Resources
- [Solana Docs](https://docs.solana.com/)
- [Metaplex Docs](https://docs.metaplex.com/)
- [React Query Docs](https://tanstack.com/query/latest)
- [Vite Docs](https://vite.dev/)
- [Tailwind CSS Docs](https://tailwindcss.com/)

### Useful Commands Reference

```bash
# Install dependencies (root)
npm run install:all

# Development
npm run dev              # Start backend dev server
cd client && npm run dev # Start frontend dev server

# Build
npm run build           # Build everything

# Testing
npm test                # Run tests
npm run test:coverage   # With coverage

# Code Quality
npm run lint            # Lint code
npm run format          # Format code
npm run type-check      # Type checking

# Security
npm run audit           # Check vulnerabilities
npm run scan:secrets    # Scan for secrets
```

---

## ✅ Development Checklist

When working on a new feature:

- [ ] Read relevant documentation
- [ ] Understand existing code patterns
- [ ] Follow TypeScript strict mode
- [ ] Use proper error handling
- [ ] Add appropriate logging
- [ ] Write tests for new code
- [ ] Update documentation
- [ ] Follow commit message conventions
- [ ] Run linting and formatting
- [ ] Test locally before pushing
- [ ] Ensure CI passes
- [ ] Request code review

---

**Remember:** This is a production application handling real assets on Solana mainnet. Always test thoroughly, especially when dealing with blockchain transactions, token transfers, or wallet operations.

**Last Updated:** November 2025
**Maintainer:** NFTSol Team
**License:** MIT
