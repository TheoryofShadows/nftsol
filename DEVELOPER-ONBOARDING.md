# Developer Onboarding Guide

**Welcome to NFTSol!** This guide will help you get started as a developer.

---

## 🎯 Quick Start (5 Minutes)

### Prerequisites Checklist

- [ ] **Node.js 20+** installed (`node --version`)
- [ ] **npm** installed (`npm --version`)
- [ ] **Git** installed (`git --version`)
- [ ] **PostgreSQL 14+** (for backend) OR use mock mode for frontend-only
- [ ] **Code Editor** (VS Code recommended)
- [ ] **Solana Wallet** (Phantom or Solflare) for testing

### Clone & Setup

```bash
# 1. Clone repository
git clone https://github.com/TheoryofShadows/nftsol.git
cd nftsol

# 2. Install backend dependencies
cd apps/backend
npm install

# 3. Install frontend dependencies
cd ../../client
npm install

# 4. You're ready! See below for running the app
```

---

## 🚀 Running the Application

### Backend Development

```bash
cd apps/backend

# Development mode (hot reload)
npm run dev

# The server will start on http://localhost:3000
# Check http://localhost:3000/healthz for health status
```

**Environment Setup:**
```bash
# Copy template (if exists) or create .env
cat > .env << EOF
NODE_ENV=development
PORT=3000
SOLANA_RPC_DEVNET=https://api.devnet.solana.com
DATABASE_URL=postgresql://user:pass@localhost:5432/nftsol
# See BACKEND-ENV-VARS-QUICKREF.md for full list
EOF
```

### Frontend Development

```bash
cd client

# Development mode (Vite dev server)
npm run dev

# The app will start on http://localhost:5173
# Hot Module Replacement (HMR) enabled - instant updates!
```

---

## 📚 Understanding the Codebase

### Architecture Overview

```
NFTSol/
├── apps/
│   └── backend/          # Express.js API server
│       ├── src/
│       │   ├── routes/   # API endpoints
│       │   ├── services/ # Business logic
│       │   ├── lib/      # Database, Solana utilities
│       │   ├── middleware/# Security, validation
│       │   └── utils/    # Helpers
│       └── package.json
│
├── client/                # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── echo/         # Eternal Echoes features
│   │   ├── hooks/        # Custom React hooks
│   │   └── context/      # State management
│   └── package.json
│
└── Documentation/
    ├── README.md
    ├── TECHNICAL-DOCS.md
    ├── BACKEND-OVERVIEW.md
    └── This file
```

### Key Technologies

**Backend:**
- **Express.js:** Web framework
- **TypeScript:** Type safety
- **PostgreSQL:** Database
- **Drizzle ORM:** Database queries
- **Solana Web3.js:** Blockchain interaction
- **Metaplex SDK:** NFT operations

**Frontend:**
- **React 18:** UI framework
- **Vite 7:** Build tool (latest 2025)
- **TypeScript:** Type safety
- **Tailwind CSS:** Styling
- **Solana Wallet Adapter:** Wallet integration

---

## 🛠️ Development Workflow

### 1. Making Changes

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make your changes
# ... edit files ...

# Test your changes
cd apps/backend && npm run build
cd ../../client && npm run build

# Commit with meaningful message
git add .
git commit -m "feat: add your feature description"
```

### 2. Code Quality

**Before Committing:**
```bash
# Run linter
npm run lint

# Format code
npm run format

# Check for secrets (automatic via pre-commit hook)
# Scripts located in scripts/verify-no-secrets.ps1
```

### 3. Testing

```bash
# Backend tests (when implemented)
cd apps/backend
npm test

# Frontend tests (when implemented)
cd client
npm test
```

---

## 📖 Key Concepts

### 1. **API Design**

All API endpoints follow RESTful conventions:

```typescript
// GET /api/v1/programs
// POST /api/v1/simple-mint
// GET /api/v1/nft/:mintAddress
```

**Response Format:**
```typescript
{
  success: boolean,
  data?: any,
  error?: string,
  code?: string,
  requestId?: string
}
```

### 2. **Error Handling**

Errors are handled consistently:

```typescript
try {
  // Your code
} catch (error) {
  errorLogger(error as Error, { context });
  // Return error response
}
```

### 3. **Type Safety**

Everything is typed with TypeScript:

```typescript
import { ApiResponse, MintRequest } from './types';

const response: ApiResponse = {
  success: true,
  data: { ... }
};
```

### 4. **Security**

Always:
- ✅ Validate input (use Zod schemas)
- ✅ Sanitize user data
- ✅ Use parameterized queries
- ✅ Never log secrets
- ✅ Check authentication
- ✅ Rate limit endpoints

---

## 🔧 Common Tasks

### Adding a New API Endpoint

1. **Create route file** (`apps/backend/src/routes/my-feature.ts`)
2. **Add route handler:**
   ```typescript
   import express from 'express';
   const router = express.Router();
   
   router.get('/my-endpoint', async (req, res) => {
     // Handler logic
   });
   
   export default router;
   ```
3. **Mount in** `apps/backend/src/index.ts`:
   ```typescript
   import myRouter from './routes/my-feature';
   app.use('/api/my-feature', myRouter);
   ```

### Adding a New React Component

1. **Create component** (`client/src/components/MyComponent.tsx`)
2. **Use TypeScript:**
   ```typescript
   interface Props {
     title: string;
   }
   
   export default function MyComponent({ title }: Props) {
     return <div>{title}</div>;
   }
   ```
3. **Import and use:**
   ```typescript
   import MyComponent from './components/MyComponent';
   ```

### Working with Solana

```typescript
import { Connection, PublicKey } from '@solana/web3.js';
import { solanaService } from './services/solana';

// Check balance
const balance = await solanaService.getBalance(address);

// Check account exists
const exists = await solanaService.accountExists(address);
```

### Working with Database

```typescript
import { pool } from './lib/db';

// Query database
const result = await pool.query(
  'SELECT * FROM users WHERE id = $1',
  [userId]
);
```

---

## 🐛 Debugging

### Backend Debugging

```bash
# Enable debug logging
NODE_ENV=development npm run dev

# Check logs
# Logs appear in console with timestamps
```

**Common Issues:**
- **Port already in use:** Change PORT in .env
- **Database connection failed:** Check DATABASE_URL
- **Solana RPC error:** Check SOLANA_RPC_URL

### Frontend Debugging

```bash
# Dev server with source maps
npm run dev

# Check browser console
# React DevTools extension recommended
```

**Common Issues:**
- **Wallet not connecting:** Check wallet extension
- **CORS errors:** Check backend CORS config
- **Build errors:** Check TypeScript errors

---

## 📝 Code Standards

### TypeScript

- ✅ Always use types
- ✅ Use interfaces for objects
- ✅ Avoid `any` type
- ✅ Use strict mode

### Naming Conventions

- **Files:** `camelCase.ts` or `kebab-case.ts`
- **Components:** `PascalCase.tsx`
- **Functions:** `camelCase()`
- **Constants:** `UPPER_SNAKE_CASE`

### Code Style

- ✅ Use Prettier (runs on save)
- ✅ Follow ESLint rules
- ✅ Keep functions small
- ✅ Add comments for complex logic

---

## 🧪 Testing Strategy

### Unit Tests (Future)

```typescript
import { describe, it, expect } from '@jest/globals';

describe('MyFunction', () => {
  it('should work correctly', () => {
    expect(myFunction()).toBe(expected);
  });
});
```

### Integration Tests (Future)

Test API endpoints with actual database/blockchain.

### Manual Testing Checklist

- [ ] Test wallet connection
- [ ] Test NFT minting
- [ ] Test marketplace browsing
- [ ] Test withdrawal (if applicable)
- [ ] Test error scenarios

---

## 🚀 Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete deployment guide.

**Quick Summary:**
- **Backend:** Deploy to Render
- **Frontend:** Deploy to Netlify
- **Database:** Render PostgreSQL
- **Environment:** Set all env vars

---

## 📚 Learning Resources

### Solana Development
- [Solana Docs](https://docs.solana.com/)
- [Web3.js Docs](https://solana-labs.github.io/solana-web3.js/)
- [Metaplex Docs](https://docs.metaplex.com/)

### React Development
- [React Docs](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Docs](https://vitejs.dev/)

### Project-Specific
- [BACKEND-OVERVIEW.md](BACKEND-OVERVIEW.md) - Backend architecture
- [TECHNICAL-DOCS.md](TECHNICAL-DOCS.md) - Complete API reference
- [BACKEND-ENV-VARS-QUICKREF.md](BACKEND-ENV-VARS-QUICKREF.md) - Environment variables

---

## 🤝 Contributing

### Before Submitting PR

1. ✅ Run `npm run lint`
2. ✅ Run `npm run format`
3. ✅ Run `npm run build` (both backend & frontend)
4. ✅ Test your changes
5. ✅ Update documentation
6. ✅ Verify no secrets in code

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How was this tested?

## Checklist
- [ ] Code follows style guidelines
- [ ] Tests added/updated
- [ ] Documentation updated
```

---

## ❓ Getting Help

### Resources

1. **Documentation:**
   - README.md
   - TECHNICAL-DOCS.md
   - BACKEND-OVERVIEW.md

2. **Code Comments:**
   - Most files have inline comments
   - Check service files for examples

3. **GitHub Issues:**
   - Search existing issues
   - Create new issue with details

### Common Questions

**Q: How do I add a new dependency?**
A: Install in the appropriate package.json (backend or client), then commit both package.json and package-lock.json.

**Q: How do I test Solana transactions?**
A: Use devnet for testing. Set SOLANA_CLUSTER=devnet in .env.

**Q: Can I work on frontend only?**
A: Yes! Backend can run in mock mode for frontend-only development.

**Q: How do I debug TypeScript errors?**
A: Check the error message, line number, and type definitions. Use `any` temporarily if needed (but fix later).

---

## 🎓 Next Steps

1. **Read:** BACKEND-OVERVIEW.md for backend details
2. **Read:** TECHNICAL-DOCS.md for API reference
3. **Explore:** Browse the codebase
4. **Start Small:** Fix a typo or add a comment
5. **Ask:** Create GitHub issue for questions

---

## ✅ Developer Checklist

Before you start coding:

- [ ] Repository cloned
- [ ] Dependencies installed
- [ ] Environment variables set
- [ ] Dev servers running
- [ ] Wallet connected (for testing)
- [ ] Documentation read
- [ ] Codebase explored

---

**Welcome to the team! Happy coding! 🚀**

---

*Questions? Create an issue or ask in discussions.*

