# 🔍 Missing Endpoints Report - Comprehensive Audit

## 📊 Summary

After auditing all frontend API calls, I found **22 endpoints** that the frontend expects but may not exist in the backend.

---

## ❌ **CONFIRMED MISSING ENDPOINTS**

### 1. Marketplace Operations
- ❌ `/api/marketplace/list` - Used by `MyNfts.tsx`
- ❌ `/api/marketplace/delist` - Used by `MyNfts.tsx`

### 2. NFT Operations (Non-v1)
- ❌ `/api/nfts?owner=...` - Used by `MyNfts.tsx` (query param)
- ❌ `/api/nfts/mint` - Used by `MintForm.tsx`
- ❌ `/api/nfts/verify/:address` - Used by `MintForm.tsx` and `WithdrawalForm.tsx`
- ❌ `/api/nfts/balance/:address` - Used by `WithdrawalForm.tsx`

### 3. Minting Operations
- ❌ `/api/mint/estimate` - Used by `useMintCost.ts`
- ❌ `/api/mint/compare` - Used by `useMintCost.ts`
- ❌ `/api/mint/nft` - Used by `UnifiedDashboard.tsx`

### 4. Grok/Archive Operations
- ❌ `/api/grok/archive/live-feed` - Used by `UnifiedDashboard.tsx`
- ❌ `/api/grok/analyze-eternal-echo` - Used by `UnifiedDashboard.tsx`

### 5. Echo Operations
- ❌ `/api/echo/stats` - Used by `Hero.tsx`
- ❌ `/api/echo/:id` - Used by `EchoViewer.tsx`
- ❌ `/api/nfts?collection=eternal-echoes` - Used by `EchoMarketplace.tsx` (query param)

### 6. Clout Operations
- ❌ `/api/clout/balance/:address` - Used by `useCloutBalance.ts`
- ❌ `/api/clout/vault-balance` - Used by `useCloutBalance.ts`

### 7. Withdrawal Operations
- ❌ `/api/wallets/withdraw` - Used by `WithdrawalForm.tsx`
  - Note: Backend has `/api/v1/wallets/withdraw` but frontend calls `/api/wallets/withdraw`

### 8. Admin Operations
- ❌ `/api/admin/withdrawals` - Used by `AdminDashboard.tsx`
- ❌ `/api/admin/withdrawals/:id/:action` - Used by `AdminDashboard.tsx`
- ❌ `/api/auth/admin` - Used by `AdminAuth.tsx`
  - Note: Backend has `/api/v1/auth/admin` but frontend calls `/api/auth/admin`

### 9. Public/Stats
- ⚠️ `/api/public/stats` - Used by `Hero.tsx` (may exist, needs verification)
- ⚠️ `/api/waitlist/subscribe` - Used by `WaitlistSignup.tsx` (may exist, needs verification)

---

## 🔄 **PATH MISMATCHES**

### Frontend calls `/api/...` but backend has `/api/v1/...`:

1. **Withdrawals:**
   - Frontend: `/api/wallets/withdraw`
   - Backend: `/api/v1/wallets/withdraw`

2. **Admin Auth:**
   - Frontend: `/api/auth/admin`
   - Backend: `/api/v1/auth/admin`

3. **NFTs:**
   - Frontend: `/api/nfts?owner=...`
   - Backend: `/api/v1/nfts/:owner`

4. **Minting:**
   - Frontend: `/api/nfts/mint`, `/api/mint/nft`
   - Backend: `/api/v1/simple-mint`

---

## ✅ **WORKING ENDPOINTS (v1)**

These are properly using `/api/v1/` prefix:
- ✅ `/api/v1/programs` - Used by `ContractInfo.tsx`, `CloutInfo.tsx`
- ✅ `/api/v1/market` - Used by `AppContext.tsx`
- ✅ `/api/v1/collections` - Used by `Collections.tsx`
- ✅ `/api/v1/wallet/:address` - Used by `apiService.ts`

---

## 🛠️ **RECOMMENDED FIXES**

### Option 1: Add Redirects/Middleware (Quick Fix)
Create middleware that redirects `/api/*` to `/api/v1/*` for backward compatibility:

```typescript
// In apps/backend/src/index.ts
app.use('/api', (req, res, next) => {
  // Don't redirect if already /api/v1
  if (req.path.startsWith('/v1/')) {
    return next();
  }
  
  // Redirect /api/nfts to /api/v1/nfts, etc.
  if (req.path.startsWith('/nfts') || 
      req.path.startsWith('/marketplace') ||
      req.path.startsWith('/auth') ||
      req.path.startsWith('/wallets')) {
    req.url = `/v1${req.path}`;
  }
  next();
});
```

### Option 2: Update Frontend (Better Long-term)
Update all frontend API calls to use `/api/v1/` prefix consistently.

### Option 3: Implement Missing Endpoints
Add all missing endpoints that don't have v1 equivalents.

---

## 📋 **PRIORITY LIST**

### HIGH PRIORITY (Critical for app functionality):
1. `/api/nfts?owner=...` or redirect to `/api/v1/nfts/:owner`
2. `/api/nfts/verify/:address` - Wallet verification
3. `/api/marketplace/list` - List NFT for sale
4. `/api/marketplace/delist` - Remove listing
5. `/api/wallets/withdraw` - Withdrawal requests
6. `/api/auth/admin` - Admin authentication

### MEDIUM PRIORITY (Feature functionality):
7. `/api/clout/balance/:address` - CLOUT token balance
8. `/api/echo/stats` - Echo statistics
9. `/api/echo/:id` - Echo viewer
10. `/api/public/stats` - Platform statistics

### LOW PRIORITY (Nice to have):
11. `/api/grok/archive/live-feed` - Grok integration
12. `/api/grok/analyze-eternal-echo` - Grok analysis
13. `/api/mint/estimate` - Mint cost estimation
14. `/api/mint/compare` - Mint cost comparison
15. `/api/waitlist/subscribe` - Waitlist signup

---

## 🎯 **IMMEDIATE ACTION ITEMS**

1. **Add API path redirect middleware** - Quick fix for path mismatches
2. **Implement missing marketplace endpoints** - List/delist functionality
3. **Add wallet verification endpoint** - Used by multiple components
4. **Fix withdrawal endpoint path** - Critical for withdrawal feature
5. **Add admin auth endpoint** - Required for admin dashboard

---

**Generated:** $(date)
**Files Checked:** 24 frontend files
**Total Missing:** 22 endpoints
