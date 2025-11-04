# 🔧 Fix Missing Endpoints - Implementation Plan

## ✅ **ENDPOINTS THAT EXIST BUT NOT MOUNTED**

### 1. Marketplace Routes
**Status:** Routes exist in `apps/backend/src/routes/marketplace.ts` but may not be mounted.

**Fix:** Mount the marketplace router:
```typescript
// In apps/backend/src/index.ts
import marketplaceRouter from './routes/marketplace';
app.use('/api/marketplace', marketplaceRouter);
```

---

## ❌ **ACTUALLY MISSING ENDPOINTS**

### 1. `/api/nfts/verify/:address`
**Used by:** `MintForm.tsx`, `WithdrawalForm.tsx`
**Purpose:** Verify wallet address exists on Solana

**Implementation:**
```typescript
app.get('/api/nfts/verify/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const exists = await solanaService.accountExists(address);
    res.json({ success: true, data: { exists } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Verification failed' });
  }
});
```

### 2. `/api/nfts/balance/:address`
**Used by:** `WithdrawalForm.tsx`
**Purpose:** Get wallet balance

**Implementation:**
```typescript
app.get('/api/nfts/balance/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const balance = await solanaService.getBalance(address);
    res.json({ success: true, data: { balance } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get balance' });
  }
});
```

### 3. `/api/nfts/mint`
**Used by:** `MintForm.tsx`
**Purpose:** Mint NFT (different from `/api/v1/simple-mint`)

**Implementation:** Redirect to `/api/v1/simple-mint` or implement separately.

### 4. `/api/mint/nft`
**Used by:** `UnifiedDashboard.tsx`
**Purpose:** Mint NFT from Echo system

**Implementation:** Should use echo minting service.

### 5. `/api/mint/estimate` and `/api/mint/compare`
**Used by:** `useMintCost.ts`
**Purpose:** Estimate minting costs

**Implementation:** Calculate minting costs based on current network fees.

### 6. `/api/echo/stats`
**Used by:** `Hero.tsx`
**Purpose:** Get Echo statistics

**Implementation:** Query database for Echo NFT stats.

### 7. `/api/echo/:id`
**Used by:** `EchoViewer.tsx`
**Purpose:** Get specific Echo NFT details

**Implementation:** Query Echo NFT by ID.

### 8. `/api/clout/balance/:address`
**Used by:** `useCloutBalance.ts`
**Purpose:** Get CLOUT token balance

**Implementation:** Query token balance from Solana.

### 9. `/api/clout/vault-balance`
**Used by:** `useCloutBalance.ts`
**Purpose:** Get rewards vault balance

**Implementation:** Query vault account balance.

### 10. `/api/grok/archive/live-feed`
**Used by:** `UnifiedDashboard.tsx`
**Purpose:** Get Grok archive live feed

**Implementation:** Query Grok archive data.

### 11. `/api/grok/analyze-eternal-echo`
**Used by:** `UnifiedDashboard.tsx`
**Purpose:** Analyze Echo with Grok

**Implementation:** Call Grok API for analysis.

### 12. `/api/auth/admin`
**Status:** EXISTS at `/api/v1/auth/admin` but frontend calls `/api/auth/admin`
**Fix:** Add redirect or mount at both paths.

### 13. `/api/admin/withdrawals`
**Status:** EXISTS at `/api/v1/admin/withdrawals` but frontend calls `/api/admin/withdrawals`
**Fix:** Add redirect or mount at both paths.

### 14. `/api/wallets/withdraw`
**Status:** EXISTS at `/api/v1/wallets/withdraw` but frontend calls `/api/wallets/withdraw`
**Fix:** Add redirect or mount at both paths.

---

## 🚀 **QUICK FIX: Add Path Redirects**

Create a middleware to handle path mismatches:

```typescript
// In apps/backend/src/index.ts
app.use('/api', (req, res, next) => {
  // Don't redirect if already /api/v1
  if (req.path.startsWith('/v1/')) {
    return next();
  }
  
  const redirectMap: Record<string, string> = {
    '/auth/admin': '/v1/auth/admin',
    '/admin/withdrawals': '/v1/admin/withdrawals',
    '/wallets/withdraw': '/v1/wallets/withdraw',
    '/nfts/:owner': '/v1/nfts/:owner', // This needs special handling
  };
  
  // Check if path matches redirect map
  for (const [oldPath, newPath] of Object.entries(redirectMap)) {
    if (req.path === oldPath || req.path.startsWith(oldPath.split(':')[0])) {
      req.url = newPath + req.path.substring(oldPath.split(':')[0].length);
      break;
    }
  }
  
  next();
});
```

---

## 📋 **IMPLEMENTATION ORDER**

1. **Mount marketplace router** (if not already mounted)
2. **Add path redirect middleware** (quick fix for path mismatches)
3. **Implement missing verification endpoints** (high priority)
4. **Implement missing balance endpoints** (high priority)
5. **Implement Echo endpoints** (medium priority)
6. **Implement Clout endpoints** (medium priority)
7. **Implement Grok endpoints** (low priority)
8. **Implement mint cost estimation** (low priority)

---

**Next Steps:**
1. Check if marketplace router is mounted
2. Add redirect middleware
3. Implement critical missing endpoints
