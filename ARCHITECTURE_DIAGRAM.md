# Architecture Diagram: RPC Proxy & Archive Integration

## System Architecture

### Before (❌ Broken)
```
┌─────────────────────────────────────────────────────────────────┐
│                     USER BROWSER (Frontend)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  React Components                                       │   │
│  │  ├─ MagicEdenHeader                                   │   │
│  │  ├─ PhantomConnect                                    │   │
│  │  └─ ArchiveSearchResults                             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                            ↓                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Direct HTTP Requests (🔴 NO PROXY)                  │   │
│  │  ├─ https://api.mainnet-beta.solana.com  ❌ 403 ERROR  │   │
│  │  └─ https://archive.org/api/              ❌ CORS ERROR  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                            ↓                                      │
│                     🔴 REQUEST BLOCKED                           │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### After (✅ Fixed)
```
┌─────────────────────────────────────────────────────────────────┐
│                     USER BROWSER (Frontend)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  React Components                                       │   │
│  │  ├─ MagicEdenHeader                                   │   │
│  │  ├─ PhantomConnect                                    │   │
│  │  └─ ArchiveSearchResults                             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                            ↓                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  RPC Proxy Service (solanaRpcProxy)  ✅ NEW             │   │
│  │  ├─ getBalance()                                      │   │
│  │  ├─ getTokenAccountBalance()                          │   │
│  │  └─ [10+ other RPC methods]                           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                            ↓                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  HTTP Request to BACKEND PROXY                        │   │
│  │  POST /api/rpc              ✅ SAME ORIGIN             │   │
│  │  POST /api/archive/...      ✅ SAME ORIGIN             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                            ↓                                      │
└─────────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                   BACKEND SERVER (Node.js)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Express Routes  ✅ NEW                               │   │
│  │  ├─ POST /api/rpc               → rpcProxyRouter      │   │
│  │  ├─ POST /api/archive/advanced-search → archiveRouter │   │
│  │  └─ GET  /api/rpc/health        → health check        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                            ↓                                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  RPC Provider Selection Logic                           │  │
│  │  Priority:                                              │  │
│  │  1. HELIUS_RPC_URL  (Optimized, recommended)           │  │
│  │  2. SOLANA_RPC_URL  (Custom RPC)                       │  │
│  │  3. api.mainnet-beta.solana.com (Public, rate-limited) │  │
│  └──────────────────────────────────────────────────────────┘  │
│                  ↓                         ↓                      │
│       ┌──────────────────────┐  ┌──────────────────────┐        │
│       │  Helius RPC          │  │  Archive.org API     │        │
│       │  (Best Performance)  │  │  (Search Results)    │        │
│       └──────────────────────┘  └──────────────────────┘        │
│                  ↓                         ↓                      │
│       ┌──────────────────────┐  ┌──────────────────────┐        │
│       │  RPC Response        │  │  Archive Results     │        │
│       │  (JSON-RPC 2.0)      │  │  (Formatted)         │        │
│       └──────────────────────┘  └──────────────────────┘        │
│                  ↓                         ↓                      │
│       └──────────────────────┬──────────────────────┘            │
│                              ↓                                    │
│       ┌──────────────────────────────────────────┐              │
│       │  Response Validation & Formatting        │              │
│       │  ├─ Rate limiting headers                │              │
│       │  ├─ CORS headers added                   │              │
│       │  └─ Error handling                       │              │
│       └──────────────────────────────────────────┘              │
│                              ↓                                    │
└──────────────────────────────────────────────────────────────────┘
                             ↓
                   ✅ Response sent to browser
```

---

## Data Flow Diagram

### RPC Balance Query
```
User clicks "Refresh Balance"
            ↓
MagicEdenHeader component detects wallet change
            ↓
Calls: solanaRpcProxy.getBalanceInSol(publicKey)
            ↓
RPC Proxy Service sends:
POST /api/rpc
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "getBalance",
  "params": [publicKey]
}
            ↓
Backend RPC Router receives request
            ↓
Validates method (getBalance is in whitelist) ✓
            ↓
Forwards to Helius/Custom RPC endpoint
            ↓
Solana RPC responds with balance in lamports
            ↓
Backend converts response
            ↓
Returns to Frontend
            ↓
Frontend converts lamports to SOL
            ↓
Component displays: "5.25 SOL" ✓
```

### Archive Search Query
```
User types "documentaries"
            ↓
ArchiveSearchResults component detects input
            ↓
Debounces input (wait 500ms)
            ↓
Calls: archiveService.advancedSearch("documentaries", {filters})
            ↓
Frontend service sends:
POST /api/v1/archive/advanced-search
{
  "keyword": "documentaries",
  "mediaTypes": ["video"],
  "limit": 20
}
            ↓
Backend Archive Router receives request
            ↓
Builds query for Internet Archive API
            ↓
Queries: https://archive.org/advancedsearch.php
            ↓
Archive API responds with matching items
            ↓
Backend transforms results to standardized format
            ↓
Returns to Frontend
{
  "success": true,
  "data": {
    "results": [
      {
        "identifier": "...",
        "title": "...",
        "description": "...",
        ...
      }
    ]
  }
}
            ↓
Frontend displays results in grid ✓
```

---

## RPC Method Whitelist

```
┌─────────────────────────────────────────────────┐
│         ALLOWED RPC METHODS (Whitelist)         │
├─────────────────────────────────────────────────┤
│                                                 │
│ Account Operations:                             │
│   • getBalance                                  │
│   • getAccountInfo                              │
│   • getMultipleAccounts                         │
│   • getProgramAccounts                          │
│   • getTokenAccountBalance                      │
│   • getParsedTokenAccountsByOwner               │
│   • getTokenSupply                              │
│   • getTokenLargestAccounts                     │
│                                                 │
│ Block & Commitment:                             │
│   • getBlockHeight                              │
│   • getRecentBlockhash                          │
│   • getLatestBlockhash                          │
│   • isBlockhashValid                            │
│   • getSlot                                     │
│   • getEpochInfo                                │
│   • getEpochSchedule                            │
│                                                 │
│ Transactions:                                   │
│   • sendTransaction                             │
│   • simulateTransaction                         │
│   • getTransaction                              │
│   • getTransactionCount                         │
│   • getSignatureStatuses                        │
│                                                 │
│ Fees & Estimation:                              │
│   • getFeeForMessage                            │
│   • getMinimumBalanceForRentExemption           │
│                                                 │
│ Network Info:                                   │
│   • getVersion                                  │
│   • getClusterNodes                             │
│   • getNonce                                    │
│                                                 │
│ ❌ BLOCKED METHODS:                             │
│   • Custom program interactions                 │
│   • Admin/privileged operations                 │
│   • State mutation methods                      │
│   • Any method not in whitelist                 │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## Error Handling Flow

```
┌────────────────────────────────────┐
│  Frontend makes RPC request        │
└────────────────────────────────────┘
            ↓
┌────────────────────────────────────┐
│  Backend receives request          │
└────────────────────────────────────┘
            ↓
         ┌──┴──┐
         ↓     ↓
    [Valid?] [Whitelisted?]
      ✓  ✗       ✓  ✗
      │  │       │  │
      │  └───────┴──┴─→ ❌ Return 400/403 error
      │
      ↓
┌────────────────────────────────────┐
│  Forward to RPC provider           │
│  (with timeout: 30 seconds)        │
└────────────────────────────────────┘
            ↓
         ┌──┴──┐
         ↓     ↓
    [Success?]
      ✓  ✗
      │  │
      │  └──→ ❌ Timeout or error?
      │           ↓
      │       ┌──────────────────────┐
      │       │ Return RPC error as- │
      │       │ is (JSON-RPC format) │
      │       └──────────────────────┘
      │           ↓
      │       ❌ Error response
      │
      ↓
┌────────────────────────────────────┐
│  Parse and validate RPC response   │
└────────────────────────────────────┘
            ↓
┌────────────────────────────────────┐
│  Add CORS headers                  │
│  Add rate limit headers            │
│  Send to frontend                  │
└────────────────────────────────────┘
            ↓
✅ Frontend receives response
```

---

## Rate Limiting Strategy

```
┌──────────────────────────────────────────┐
│        RATE LIMITING LAYERS              │
├──────────────────────────────────────────┤
│                                          │
│ Layer 1: Express Rate Limiter            │
│   ├─ Global limit: 100 req/min           │
│   ├─ Per IP tracking                     │
│   ├─ Health endpoints skipped            │
│   └─ Local IPs (127.0.0.1) skipped       │
│                                          │
│ Layer 2: Method Rate Limiting (future)   │
│   ├─ getBalance: 200 req/min             │
│   ├─ sendTransaction: 10 req/min         │
│   └─ Others: 100 req/min                 │
│                                          │
│ Layer 3: RPC Provider Limits             │
│   ├─ Helius: Built-in rate limiting      │
│   ├─ Custom RPC: Provider specific       │
│   └─ Public RPC: Limited (fallback)      │
│                                          │
│ Layer 4: Archive API Limits              │
│   └─ Internet Archive: Their own limits  │
│       (typically very generous)          │
│                                          │
│ Response Headers:                        │
│   ├─ RateLimit-Limit: 100                │
│   ├─ RateLimit-Remaining: 45             │
│   ├─ RateLimit-Reset: 1700000000         │
│   └─ Retry-After: 60 (on 429)            │
│                                          │
└──────────────────────────────────────────┘
```

---

## Component Interaction Diagram

```
┌─────────────────────────────────────────────────────────┐
│              FRONTEND COMPONENTS                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────┐      ┌────────────────────────┐  │
│  │ MagicEdenHeader  │      │ ArchiveSearchResults   │  │
│  │                  │      │                        │  │
│  │ Shows balance ✓  │      │ Displays search ✓      │  │
│  └──────┬───────────┘      └────────┬───────────────┘  │
│         │                           │                   │
│         └─────────────────┬─────────┘                   │
│                           ↓                             │
│         ┌─────────────────────────────────┐            │
│         │   Shared Services Layer        │            │
│         ├─────────────────────────────────┤            │
│         │ • solanaRpcProxy (NEW) ✓        │            │
│         │   ├─ getBalance()               │            │
│         │   ├─ getBalanceInSol()          │            │
│         │   └─ [10+ RPC methods]          │            │
│         │                                 │            │
│         │ • archiveService (EXISTING)     │            │
│         │   ├─ advancedSearch()           │            │
│         │   ├─ getSuggestions()           │            │
│         │   └─ getTrendingSearches()      │            │
│         │                                 │            │
│         │ • apiService (EXISTING)         │            │
│         │   └─ Common HTTP utility        │            │
│         └─────────────────────────────────┘            │
│                           │                             │
│         ┌─────────────────┴──────────────┐             │
│         ↓                                ↓             │
│  ┌────────────────────┐      ┌────────────────────┐  │
│  │  Backend RPC       │      │  Backend Archive   │  │
│  │  Proxy Endpoint    │      │  Route Handler     │  │
│  │  /api/rpc          │      │  /api/archive/*    │  │
│  └────────────────────┘      └────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Security Model

```
┌─────────────────────────────────────────────────────────┐
│                  SECURITY LAYERS                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Layer 1: Request Validation                            │
│   ├─ Content-Type check (application/json)             │
│   ├─ JSON parsing validation                           │
│   ├─ Required field validation                         │
│   └─ Timeout protection (30s)                          │
│                                                         │
│ Layer 2: Method Whitelisting                           │
│   ├─ Only allowed RPC methods accepted                 │
│   ├─ Dangerous methods blocked                         │
│   ├─ Admin operations blocked                          │
│   └─ Custom contract calls blocked                     │
│                                                         │
│ Layer 3: Rate Limiting                                 │
│   ├─ Global 100 req/min limit                          │
│   ├─ Per-IP tracking                                   │
│   ├─ Exponential backoff for clients                   │
│   └─ Retry-After headers                              │
│                                                         │
│ Layer 4: CORS/Same-Origin                              │
│   ├─ Same-origin requests allowed                      │
│   ├─ Allowed origins configured                        │
│   ├─ Credentials handled properly                      │
│   └─ CSRF protection enabled                           │
│                                                         │
│ Layer 5: Input Sanitization                            │
│   ├─ Parameter validation                              │
│   ├─ No SQL injection risk (no DB)                     │
│   ├─ No code injection risk (no eval)                  │
│   └─ Wallet addresses validated                        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Performance Metrics

```
┌─────────────────────────────────────────────────────────┐
│            EXPECTED PERFORMANCE                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ RPC Calls:                                              │
│   • Backend processing:    5-15ms                       │
│   • Network to RPC:        30-100ms (Helius)            │
│   • RPC processing:        20-50ms                      │
│   • Total round trip:      55-165ms                     │
│                                                         │
│ Archive Search:                                         │
│   • Backend processing:    10-50ms                      │
│   • Archive API query:     300ms-2s (depends on size)   │
│   • Formatting results:    20-100ms                     │
│   • Total round trip:      330ms-2.15s                  │
│                                                         │
│ Throughput:                                             │
│   • RPC proxy:             100+ requests/minute         │
│   • Archive search:        30+ searches/minute          │
│   • Concurrent: Limited by backend resources           │
│                                                         │
│ Caching Opportunities (future):                         │
│   • Block height: Cache 1-5 seconds                     │
│   • Balances: Cache 10-30 seconds                       │
│   • Archive results: Cache per user                     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

**Last Updated:** November 27, 2025
**Diagram Version:** 1.0
**Status:** Complete
