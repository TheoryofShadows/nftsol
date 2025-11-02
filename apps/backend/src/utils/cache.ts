/**
 * Intelligent caching layer with TTL, stale-while-revalidate, and memory management
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  staleAt: number;
}

class MemoryCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private maxSize: number;
  private defaultTTL: number;

  constructor(maxSize = 1000, defaultTTL = 5 * 60 * 1000) {
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
  }

  set<T>(key: string, data: T, ttl?: number): void {
    // Evict oldest entries if cache is full (LRU-like)
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const oldestKey = this.findOldestKey();
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    const now = Date.now();
    const entryTTL = ttl || this.defaultTTL;
    
    this.cache.set(key, {
      data,
      timestamp: now,
      ttl: entryTTL,
      staleAt: now + entryTTL,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    const now = Date.now();
    
    // Check if expired
    if (now > entry.staleAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  getStale<T>(key: string): { data: T; stale: boolean } | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    const now = Date.now();
    const stale = now > entry.staleAt;

    return {
      data: entry.data as T,
      stale,
    };
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    const now = Date.now();
    if (now > entry.staleAt) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private findOldestKey(): string | null {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    return oldestKey;
  }

  // Clean up expired entries
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.staleAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }

  // Get cache stats
  stats() {
    const now = Date.now();
    let fresh = 0;
    let stale = 0;
    let expired = 0;

    for (const entry of this.cache.values()) {
      if (now > entry.staleAt) {
        expired++;
      } else if (now > entry.staleAt - entry.ttl * 0.5) {
        stale++;
      } else {
        fresh++;
      }
    }

    return {
      size: this.cache.size,
      fresh,
      stale,
      expired,
      maxSize: this.maxSize,
    };
  }
}

// Singleton instance
export const cache = new MemoryCache(1000, 5 * 60 * 1000); // 1000 entries, 5min default TTL

// Cleanup expired entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    cache.cleanup();
  }, 5 * 60 * 1000);
}

/**
 * Cache wrapper for async functions with stale-while-revalidate
 */
export async function cached<T>(
  key: string,
  fn: () => Promise<T>,
  ttl?: number
): Promise<T> {
  // Check for stale data first (stale-while-revalidate)
  const staleEntry = cache.getStale<T>(key);
  if (staleEntry && !staleEntry.stale) {
    return staleEntry.data;
  }

  // If stale, return stale data but refresh in background
  if (staleEntry?.stale) {
    // Fire and forget refresh
    fn()
      .then((data) => cache.set(key, data, ttl))
      .catch(() => {
        // Silently fail - we have stale data to return
      });
    return staleEntry.data;
  }

  // No cache, fetch and cache
  const data = await fn();
  cache.set(key, data, ttl);
  return data;
}

/**
 * Cache key generators
 */
export const cacheKeys = {
  nft: (mintAddress: string) => `nft:${mintAddress}`,
  nftsByOwner: (owner: string) => `nfts:owner:${owner}`,
  marketplace: (page: number, limit: number) => `marketplace:${page}:${limit}`,
  wallet: (address: string) => `wallet:${address}`,
  cloutBalance: (address: string) => `clout:balance:${address}`,
  programs: () => 'programs:config',
};

