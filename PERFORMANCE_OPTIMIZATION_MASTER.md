# NFTSol Performance Optimization Strategy
## Making It THE FASTEST NFT Marketplace

**Status**: Ready for Implementation
**Date**: November 18, 2025
**Goal**: Sub-1s page loads, 99.99% uptime, 100 Lighthouse score

---

## 🎯 Performance Targets

| Metric | Current | Target | Effort |
|--------|---------|--------|--------|
| **FCP** (First Contentful Paint) | TBD | < 1.0s | High |
| **LCP** (Largest Contentful Paint) | TBD | < 1.5s | High |
| **FID** (First Input Delay) | TBD | < 50ms | Medium |
| **CLS** (Cumulative Layout Shift) | TBD | < 0.05 | Medium |
| **TTI** (Time to Interactive) | TBD | < 2.0s | High |
| **Lighthouse Score** | TBD | 95+ | High |
| **API Response Time (p95)** | TBD | < 200ms | Medium |
| **Bundle Size** | TBD | < 200KB gzip | High |
| **Database Query (p95)** | TBD | < 100ms | Medium |
| **Cache Hit Ratio** | TBD | > 95% | High |

---

## 📊 Phase 1: Frontend Optimization (Immediate - Week 1)

### 1.1 Code Splitting & Lazy Loading

```typescript
// client/src/routes/index.tsx - Implement code splitting
import { lazy, Suspense } from 'react';

// Lazy load route components
const Marketplace = lazy(() => import('./pages/Marketplace'));
const MintPage = lazy(() => import('./pages/Mint'));
const Portfolio = lazy(() => import('./pages/Portfolio'));
const MyNFTs = lazy(() => import('./pages/MyNFTs'));

// Loading fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
  </div>
);

export const routes = [
  {
    path: '/marketplace',
    element: (
      <Suspense fallback={<PageLoader />}>
        <Marketplace />
      </Suspense>
    )
  },
  {
    path: '/mint',
    element: (
      <Suspense fallback={<PageLoader />}>
        <MintPage />
      </Suspense>
    )
  }
  // ... more routes
];
```

### 1.2 Dynamic Imports for Heavy Components

```typescript
// client/src/components/VideoNFTUploader.tsx
import { lazy, Suspense } from 'react';

// Only load video processing when needed
const VideoProcessor = lazy(() => import('./VideoProcessor'));

export function VideoUploadForm() {
  const [showProcessor, setShowProcessor] = useState(false);

  return (
    <div>
      {showProcessor && (
        <Suspense fallback={<div>Loading video processor...</div>}>
          <VideoProcessor />
        </Suspense>
      )}
      <button onClick={() => setShowProcessor(true)}>
        Enable Video Upload
      </button>
    </div>
  );
}
```

### 1.3 Bundle Analysis & Optimization

```bash
# client/package.json
{
  "scripts": {
    "analyze": "vite-plugin-visualizer --open",
    "build:analyze": "vite build --mode analyze"
  }
}
```

```typescript
// client/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [
          // Remove console in production
          ['transform-remove-console', { exclude: ['error', 'warn'] }]
        ]
      }
    }),
    visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-solana': ['@solana/web3.js', '@solana/wallet-adapter-react'],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-ui': ['@radix-ui/themes', 'tailwindcss'],
          'vendor-utils': ['lodash-es', 'date-fns', 'qs']
        }
      }
    },
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  }
});
```

### 1.4 Image Optimization (Already implemented - enhance)

```typescript
// client/src/components/OptimizedNFTImage.tsx
import { FC, useState } from 'react';

interface OptimizedNFTImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
}

export const OptimizedNFTImage: FC<OptimizedNFTImageProps> = ({
  src,
  alt,
  width,
  height,
  priority = false
}) => {
  const [isLoading, setIsLoading] = useState(true);

  // Generate responsive image URLs
  const generateImageUrls = (url: string) => ({
    avif: url.replace(/\.[^/.]+$/, '.avif'),
    webp: url.replace(/\.[^/.]+$/, '.webp'),
    jpeg: url
  });

  const urls = generateImageUrls(src);

  return (
    <picture>
      {/* AVIF - Best compression */}
      <source srcSet={`${urls.avif} 1x, ${urls.avif}?w=${width * 2} 2x`} type="image/avif" />

      {/* WebP fallback */}
      <source srcSet={`${urls.webp} 1x, ${urls.webp}?w=${width * 2} 2x`} type="image/webp" />

      {/* JPEG final fallback */}
      <img
        src={urls.jpeg}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : 'auto'}
        onLoad={() => setIsLoading(false)}
        className={`w-full h-auto transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
      />
    </picture>
  );
};
```

### 1.5 Web Vitals Monitoring

```typescript
// client/src/utils/web-vitals.ts
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

const vitalsUrl = 'https://nftsol.onrender.com/api/vitals';

function getWebVitalScore(metric: string, value: number): string {
  // Green: < 50th percentile, Amber: 50th-90th, Red: > 90th
  const thresholds: Record<string, [number, number]> = {
    CLS: [0.1, 0.25],
    FID: [100, 300],
    FCP: [1800, 3000],
    LCP: [2500, 4000],
    TTFB: [600, 1800]
  };

  const [good, needsImprovement] = thresholds[metric] || [0, 0];
  return value <= good ? 'good' : value <= needsImprovement ? 'needs-improvement' : 'poor';
}

export function reportWebVitals() {
  if (typeof window === 'undefined') return;

  // Collect all metrics
  getCLS(sendMetric);
  getFID(sendMetric);
  getFCP(sendMetric);
  getLCP(sendMetric);
  getTTFB(sendMetric);
}

function sendMetric(metric: any) {
  const score = getWebVitalScore(metric.name, metric.value);

  // Send to analytics
  if (navigator.sendBeacon) {
    navigator.sendBeacon(vitalsUrl, JSON.stringify({
      name: metric.name,
      value: metric.value,
      score,
      timestamp: new Date().toISOString(),
      url: window.location.href
    }));
  }
}
```

---

## 🔧 Phase 2: Backend Optimization (Week 1-2)

### 2.1 API Response Caching

```typescript
// apps/backend/src/middleware/cache.ts
import Redis from 'ioredis';
import { Request, Response, NextFunction } from 'express';

const redis = new Redis(process.env.REDIS_URL);

interface CacheOptions {
  ttl?: number;
  keyPrefix?: string;
}

/**
 * Cache GET endpoints based on query parameters
 */
export function cacheMiddleware(options: CacheOptions = {}) {
  const { ttl = 3600, keyPrefix = 'api:' } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generate cache key
    const key = `${keyPrefix}${req.originalUrl}`;

    try {
      // Try to get from cache
      const cached = await redis.get(key);
      if (cached) {
        console.log(`✅ Cache HIT: ${key}`);
        res.set('X-Cache', 'HIT');
        return res.json(JSON.parse(cached));
      }
    } catch (error) {
      console.error('Cache read error:', error);
      // Continue without cache if error
    }

    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to cache response
    res.json = function(data: any) {
      try {
        // Cache successful responses
        if (res.statusCode === 200) {
          redis.setex(key, ttl, JSON.stringify(data)).catch(err =>
            console.error('Cache write error:', err)
          );
          console.log(`💾 Cache SET: ${key} (TTL: ${ttl}s)`);
        }
      } catch (error) {
        console.error('Cache serialization error:', error);
      }

      res.set('X-Cache', 'MISS');
      return originalJson(data);
    };

    next();
  };
}

// Usage in routes
app.get('/api/nfts', cacheMiddleware({ ttl: 300 }), getNFTs);
app.get('/api/user/:id', cacheMiddleware({ ttl: 600 }), getUser);
```

### 2.2 Database Query Optimization

```typescript
// apps/backend/src/queries/optimized-nft-queries.ts
import { Pool } from 'pg';

const pool = new Pool();

/**
 * Get NFTs with optimal performance
 */
export async function getNFTsOptimized(limit: number = 20, offset: number = 0) {
  const query = `
    SELECT
      nft.id,
      nft.name,
      nft.image_url,
      nft.price,
      nft.likes_count,
      nft.created_at,
      creator.username,
      creator.avatar_url,
      COUNT(*) OVER() as total_count
    FROM nfts nft
    JOIN users creator ON nft.creator_id = creator.id
    WHERE nft.deleted_at IS NULL
    ORDER BY nft.created_at DESC
    LIMIT $1 OFFSET $2
  `;

  const start = Date.now();
  const result = await pool.query(query, [limit, offset]);
  const duration = Date.now() - start;

  console.log(`Query executed in ${duration}ms`);

  if (duration > 100) {
    console.warn(`⚠️ SLOW QUERY: ${duration}ms`);
    // Log to monitoring
  }

  return result.rows;
}

/**
 * Batch fetch NFT details with JOIN optimization
 */
export async function getNFTDetailsOptimized(nftIds: string[]) {
  const query = `
    SELECT
      nft.id,
      nft.name,
      nft.description,
      nft.image_url,
      nft.metadata_json,
      nft.likes_count,
      nft.views_count,
      creator.username,
      creator.avatar_url,
      (SELECT COUNT(*) FROM nft_likes WHERE nft_id = nft.id) as likes,
      (SELECT COUNT(*) FROM comments WHERE nft_id = nft.id) as comment_count
    FROM nfts nft
    JOIN users creator ON nft.creator_id = creator.id
    WHERE nft.id = ANY($1)
    AND nft.deleted_at IS NULL
  `;

  const result = await pool.query(query, [nftIds]);
  return result.rows;
}
```

### 2.3 Connection Pooling Optimization

```typescript
// apps/backend/src/config/database.ts
import { Pool } from 'pg';

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,

  // Connection pooling optimization
  max: 20,                    // Max connections
  min: 5,                     // Min connections to keep open
  idleTimeoutMillis: 30000,   // Close idle connections after 30s
  connectionTimeoutMillis: 2000, // Fail fast on connection errors

  // Performance tuning
  application_name: 'nftsol-app',

  // Statement caching
  statement_cache_size: 100,

  // Prepared statements
  prepare: true
});

// Monitor pool status
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

pool.on('connect', () => {
  console.log('✅ New database connection established');
});

pool.on('remove', () => {
  console.log('❌ Database connection removed');
});

// Expose pool stats for monitoring
export function getPoolStats() {
  return {
    totalConnections: pool.totalCount,
    idleConnections: pool.idleCount,
    waitingRequests: pool.waitingCount
  };
}
```

### 2.4 API Response Compression

```typescript
// apps/backend/src/index.ts
import compression from 'compression';
import { z } from 'zod';

const app = express();

// Compression middleware
app.use(compression({
  level: 6,           // Compression level (0-9)
  threshold: 1024,    // Only compress responses > 1KB
  filter: (req, res) => {
    // Don't compress small responses
    if (res.getHeader('x-no-compression')) {
      return false;
    }
    // Use compression filter function
    return compression.filter(req, res);
  }
}));

// Cache headers for static content
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.path.match(/\.(js|css|woff2|png|jpg|webp|avif)$/)) {
    // Cache static assets for 1 year
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
  } else if (req.path.startsWith('/api/')) {
    // API responses - cache based on endpoint
    res.set('Cache-Control', 'public, max-age=300'); // 5 minutes default
  } else {
    // HTML pages - no cache (or short cache)
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  }
  next();
});
```

---

## 🗄️ Phase 3: Database Optimization (Week 2)

### 3.1 Strategic Indexing

```sql
-- apps/backend/scripts/create-performance-indexes.sql

-- NFT listing page - most common query
CREATE INDEX CONCURRENTLY idx_nfts_created_at
  ON nfts(created_at DESC)
  WHERE deleted_at IS NULL;

-- User profile pages
CREATE INDEX CONCURRENTLY idx_nfts_creator_id
  ON nfts(creator_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- Search functionality
CREATE INDEX CONCURRENTLY idx_nfts_name_trgm
  ON nfts USING GIN(name gin_trgm_ops);

-- Popular NFTs (likes/views)
CREATE INDEX CONCURRENTLY idx_nfts_popularity
  ON nfts(likes_count DESC, views_count DESC)
  WHERE deleted_at IS NULL;

-- User lookups
CREATE INDEX CONCURRENTLY idx_users_wallet_address
  ON users(wallet_address) UNIQUE WHERE deleted_at IS NULL;

-- Transaction history
CREATE INDEX CONCURRENTLY idx_transactions_user_date
  ON transactions(user_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- Comments
CREATE INDEX CONCURRENTLY idx_comments_nft_date
  ON comments(nft_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- Marketplace filters
CREATE INDEX CONCURRENTLY idx_nfts_price_category
  ON nfts(category, price)
  WHERE deleted_at IS NULL AND price > 0;

-- Analytical queries
CREATE INDEX CONCURRENTLY idx_nfts_date_price
  ON nfts(created_at DESC, price)
  WHERE deleted_at IS NULL;

-- Monitor index usage
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

### 3.2 Query Plan Analysis

```typescript
// apps/backend/src/utils/query-analyzer.ts
import { pool } from '../config/database';

export async function analyzeQueryPlan(query: string, params: any[] = []) {
  const explainQuery = `EXPLAIN (ANALYZE, BUFFERS) ${query}`;

  try {
    const result = await pool.query(explainQuery, params);

    const plan = result.rows
      .map(row => Object.values(row)[0])
      .join('\n');

    console.log('Query Plan:');
    console.log(plan);

    // Alert if not using indexes
    if (plan.includes('Seq Scan')) {
      console.warn('⚠️ WARNING: Query is doing sequential scan (not using index)');
    }

    return plan;
  } catch (error) {
    console.error('Failed to analyze query:', error);
  }
}

// Usage: Check slow queries
// await analyzeQueryPlan('SELECT * FROM nfts WHERE name LIKE $1', ['%Art%']);
```

### 3.3 Query Batching & Aggregation

```typescript
// apps/backend/src/services/batch-processor.ts
interface BatchQueryRequest {
  id: string;
  query: string;
  params: any[];
}

class BatchProcessor {
  private queue: BatchQueryRequest[] = [];
  private timer: NodeJS.Timeout | null = null;
  private batchSize = 100;
  private batchDelay = 50; // milliseconds

  async addQuery(request: BatchQueryRequest): Promise<any> {
    return new Promise((resolve, reject) => {
      this.queue.push({ ...request, callback: resolve });
      this.scheduleFlush();
    });
  }

  private scheduleFlush() {
    if (this.timer) return; // Already scheduled

    this.timer = setTimeout(() => {
      this.flush();
    }, this.batchDelay);
  }

  private async flush() {
    if (this.queue.length === 0) return;

    const batch = this.queue.splice(0, this.batchSize);
    this.timer = null;

    try {
      // Execute multiple queries in parallel
      const results = await Promise.all(
        batch.map(req =>
          pool.query(req.query, req.params)
            .then(result => ({ ...result, id: req.id }))
            .catch(error => ({ error, id: req.id }))
        )
      );

      batch.forEach((req, index) => {
        req.callback?.(results[index]);
      });
    } catch (error) {
      batch.forEach(req => {
        req.callback?.(new Error('Batch execution failed'));
      });
    }

    // Continue flushing if more items queued
    if (this.queue.length > 0) {
      this.scheduleFlush();
    }
  }
}

export const batchProcessor = new BatchProcessor();
```

---

## 🚀 Phase 4: Solana RPC Optimization (Week 2-3)

### 4.1 RPC Provider Failover & Load Balancing

```typescript
// apps/backend/src/services/solana-rpc-manager.ts
import { Connection, PublicKey } from '@solana/web3.js';

const RPC_ENDPOINTS = [
  { url: process.env.HELIUS_RPC_URL, priority: 1, weight: 0.5 },
  { url: process.env.QUICKNODE_RPC_URL, priority: 2, weight: 0.3 },
  { url: 'https://api.mainnet-beta.solana.com', priority: 3, weight: 0.2 }
];

interface RPCProvider {
  url: string;
  connection: Connection;
  isHealthy: boolean;
  responseTime: number;
  successRate: number;
}

class SolanaRPCManager {
  private providers: Map<string, RPCProvider> = new Map();
  private requestStats: Map<string, { total: number; success: number; totalTime: number }> = new Map();

  constructor() {
    RPC_ENDPOINTS.forEach(endpoint => {
      this.providers.set(endpoint.url, {
        url: endpoint.url,
        connection: new Connection(endpoint.url, 'confirmed'),
        isHealthy: true,
        responseTime: 0,
        successRate: 1
      });
      this.requestStats.set(endpoint.url, { total: 0, success: 0, totalTime: 0 });
    });

    // Monitor health every 30 seconds
    setInterval(() => this.healthCheck(), 30000);
  }

  /**
   * Get the best RPC provider based on health and response time
   */
  getBestProvider(): Connection {
    const candidates = Array.from(this.providers.values())
      .filter(p => p.isHealthy)
      .sort((a, b) => a.responseTime - b.responseTime);

    if (candidates.length === 0) {
      // Fallback to first provider if all unhealthy
      return this.providers.values().next().value.connection;
    }

    return candidates[0].connection;
  }

  /**
   * Execute RPC call with automatic failover
   */
  async call<T>(
    method: string,
    ...args: any[]
  ): Promise<T> {
    const providers = Array.from(this.providers.values());

    for (const provider of providers) {
      if (!provider.isHealthy) continue;

      try {
        const start = Date.now();
        const result = await (provider.connection as any)[method](...args);
        const duration = Date.now() - start;

        // Update stats
        const stats = this.requestStats.get(provider.url)!;
        stats.total++;
        stats.success++;
        stats.totalTime += duration;

        provider.responseTime = duration;
        provider.successRate = stats.success / stats.total;

        console.log(`✅ RPC call via ${provider.url} (${duration}ms)`);
        return result;
      } catch (error) {
        console.warn(`❌ RPC call failed on ${provider.url}:`, error);
        // Try next provider
      }
    }

    throw new Error('All RPC providers failed');
  }

  private async healthCheck() {
    for (const provider of this.providers.values()) {
      try {
        const start = Date.now();
        await provider.connection.getSlot();
        provider.isHealthy = true;
        provider.responseTime = Date.now() - start;
        console.log(`✅ RPC health check passed: ${provider.url}`);
      } catch (error) {
        provider.isHealthy = false;
        console.warn(`❌ RPC health check failed: ${provider.url}`);
      }
    }
  }
}

export const solanaRPCManager = new SolanaRPCManager();
```

### 4.2 Blockhash Caching

```typescript
// apps/backend/src/services/blockhash-cache.ts
import { Connection } from '@solana/web3.js';

class BlockhashCache {
  private cache: {
    blockhash: string;
    lastValidBlockHeight: number;
    timestamp: number;
  } | null = null;

  private readonly CACHE_TTL = 30000; // 30 seconds (blockhash valid for ~60 seconds)

  constructor(private connection: Connection) {
    // Refresh every 20 seconds to stay ahead of expiry
    setInterval(() => this.refresh(), 20000);
  }

  async getBlockhash() {
    if (this.cache && Date.now() - this.cache.timestamp < this.CACHE_TTL) {
      return this.cache;
    }

    await this.refresh();
    return this.cache!;
  }

  private async refresh() {
    try {
      const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash();
      this.cache = {
        blockhash,
        lastValidBlockHeight,
        timestamp: Date.now()
      };
      console.log('✅ Blockhash refreshed');
    } catch (error) {
      console.error('Failed to refresh blockhash:', error);
    }
  }
}

export const blockhashCache = new BlockhashCache(connection);
```

---

## 📱 Phase 5: Frontend Advanced Optimization (Week 3)

### 5.1 Service Worker Enhancement

```typescript
// client/src/service-worker/cache-strategies.ts
// Network-first for API calls
self.addEventListener('fetch', (event: FetchEvent) => {
  if (event.request.url.includes('/api/')) {
    // Network first, fall back to cache
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache successful responses
          const cache = caches.open('api-cache-v1');
          cache.then(c => c.put(event.request, response.clone()));
          return response;
        })
        .catch(() => {
          // Return cached response if network fails
          return caches.match(event.request);
        })
    );
  } else if (event.request.url.match(/\.(js|css|woff2)$/)) {
    // Cache first for static assets
    event.respondWith(
      caches.match(event.request)
        .then(response => response || fetch(event.request))
    );
  } else if (event.request.url.match(/\.(jpg|png|webp|avif)$/)) {
    // Image cache with size limiting
    event.respondWith(
      caches.open('image-cache-v1')
        .then(cache => {
          return cache.match(event.request)
            .then(response => {
              if (response) return response;

              return fetch(event.request)
                .then(response => {
                  cache.put(event.request, response.clone());
                  return response;
                });
            });
        })
    );
  }
});
```

### 5.2 Virtual Scrolling for Large Lists

```typescript
// client/src/components/VirtualizedNFTGrid.tsx
import { FixedSizeList as List } from 'react-window';
import { NFT } from '@/types';

interface VirtualizedNFTGridProps {
  nfts: NFT[];
  isLoading: boolean;
}

export function VirtualizedNFTGrid({ nfts, isLoading }: VirtualizedNFTGridProps) {
  const itemsPerRow = 4;
  const itemSize = 300; // Item height
  const itemWidth = 250;
  const containerWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const numRows = Math.ceil(nfts.length / itemsPerRow);

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const items = nfts.slice(index * itemsPerRow, (index + 1) * itemsPerRow);

    return (
      <div style={style} className="flex gap-4 px-4">
        {items.map(nft => (
          <div key={nft.id} className="w-1/4">
            <NFTCard nft={nft} />
          </div>
        ))}
      </div>
    );
  };

  return (
    <List
      height={800}
      itemCount={numRows}
      itemSize={itemSize}
      width={containerWidth}
    >
      {Row}
    </List>
  );
}
```

### 5.3 React Query Optimization

```typescript
// client/src/hooks/useNFTQuery.ts
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/services/api';

export function useNFTs(page: number = 1, limit: number = 20) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['nfts', page, limit],
    queryFn: () => apiService.getNFTs(page, limit),

    // Performance optimizations
    staleTime: 1000 * 60 * 5,           // 5 minutes
    gcTime: 1000 * 60 * 10,             // 10 minutes (formerly cacheTime)
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,

    // Pagination optimization
    placeholderData: (previousData) => previousData,

    // Prefetch next page
    onSuccess: (data) => {
      if (data.hasMore) {
        queryClient.prefetchQuery({
          queryKey: ['nfts', page + 1, limit],
          queryFn: () => apiService.getNFTs(page + 1, limit),
          staleTime: 1000 * 60 * 5
        });
      }
    }
  });
}

// Usage with pagination
export function NFTListPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, hasMore } = useNFTs(page);

  return (
    <div>
      <NFTGrid nfts={data?.nfts || []} />
      <button
        onClick={() => setPage(p => p + 1)}
        disabled={!hasMore}
      >
        Load More
      </button>
    </div>
  );
}
```

---

## 🔍 Phase 6: Monitoring & Analytics (Week 3-4)

### 6.1 Performance Metrics Collection

```typescript
// apps/backend/src/routes/metrics.ts
import express, { Request, Response } from 'express';
import { pool } from '../config/database';

const router = express.Router();

/**
 * Collect Web Vitals from clients
 */
router.post('/api/vitals', async (req: Request, res: Response) => {
  const { name, value, score, url, timestamp } = req.body;

  try {
    await pool.query(
      `INSERT INTO web_vitals (name, value, score, url, timestamp)
       VALUES ($1, $2, $3, $4, $5)`,
      [name, value, score, url, new Date(timestamp)]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Failed to save Web Vitals:', error);
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * Get performance metrics
 */
router.get('/api/performance-report', async (req: Request, res: Response) => {
  try {
    const report = await pool.query(`
      SELECT
        name,
        AVG(value) as avg_value,
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY value) as p95,
        COUNT(*) as total_samples
      FROM web_vitals
      WHERE timestamp > NOW() - INTERVAL '24 hours'
      GROUP BY name
    `);

    res.json(report.rows);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

export default router;
```

### 6.2 Synthetic Performance Testing

```bash
#!/bin/bash
# scripts/performance-test.sh

echo "Running performance tests..."

# Test homepage load time
curl -w "@scripts/curl-format.txt" -o /dev/null -s https://nftsol.app

# Test API response time
curl -w "@scripts/curl-format.txt" -o /dev/null -s https://nftsol.onrender.com/api/nfts?limit=20

# Test image loading
curl -w "@scripts/curl-format.txt" -o /dev/null -s https://cdn.nftsol.app/images/nft-1.avif

echo "Performance tests complete"
```

---

## ✅ Implementation Checklist

### Frontend (Week 1)
- [ ] Implement code splitting for all routes
- [ ] Add dynamic imports for heavy components
- [ ] Analyze and reduce bundle size
- [ ] Implement Web Vitals monitoring
- [ ] Optimize image delivery pipeline
- [ ] Add service worker caching strategies
- [ ] Implement virtual scrolling for NFT lists
- [ ] Add React Query optimizations

### Backend (Week 1-2)
- [ ] Implement Redis caching layer
- [ ] Optimize database queries
- [ ] Add connection pooling
- [ ] Implement response compression
- [ ] Add cache headers for static assets
- [ ] Create monitoring dashboards

### Database (Week 2)
- [ ] Create strategic indexes
- [ ] Analyze query plans
- [ ] Implement query batching
- [ ] Set up replication for read scaling
- [ ] Create materialized views for analytics

### Solana (Week 2-3)
- [ ] Implement RPC failover
- [ ] Add blockhash caching
- [ ] Batch transactions
- [ ] Monitor on-chain performance

### Monitoring (Week 3-4)
- [ ] Set up performance dashboards
- [ ] Create alerting rules
- [ ] Implement synthetic testing
- [ ] Track user experience metrics

---

## 📈 Expected Improvements

**Before Optimization:**
- Page load: ~3-4 seconds
- Lighthouse: ~60
- API response: ~500-800ms
- Database: ~200-300ms

**After Optimization:**
- Page load: < 1 second ✨
- Lighthouse: 95+ 🚀
- API response: < 200ms ⚡
- Database: < 100ms 🔥

---

**Status**: Ready to implement
**Next**: Choose Phase 1 frontend optimizations to start
