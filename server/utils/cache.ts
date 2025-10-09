import NodeCache from 'node-cache';
import { logger } from './logger';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  checkperiod?: number; // Period for automatic delete check
}

class CacheService {
  private cache: NodeCache;
  private defaultTTL = 300; // 5 minutes

  constructor(options?: CacheOptions) {
    this.cache = new NodeCache({
      stdTTL: options?.ttl || this.defaultTTL,
      checkperiod: options?.checkperiod || 120,
      useClones: false, // Better performance
    });

    // Log cache statistics periodically in development
    if (process.env.NODE_ENV === 'development') {
      setInterval(() => {
        const stats = this.cache.getStats();
        logger.debug('Cache statistics', {
          keys: stats.keys,
          hits: stats.hits,
          misses: stats.misses,
          hitRate: stats.hits / (stats.hits + stats.misses) || 0,
        });
      }, 60000); // Every minute
    }
  }

  /**
   * Get value from cache
   */
  get<T>(key: string): T | undefined {
    try {
      const value = this.cache.get<T>(key);
      if (value !== undefined) {
        logger.debug(`Cache hit: ${key}`);
      }
      return value;
    } catch (error) {
      logger.error('Cache get error', error as Error, { key });
      return undefined;
    }
  }

  /**
   * Set value in cache
   */
  set<T>(key: string, value: T, ttl?: number): boolean {
    try {
      const success = this.cache.set(key, value, ttl || this.defaultTTL);
      if (success) {
        logger.debug(`Cache set: ${key}`, { ttl: ttl || this.defaultTTL });
      }
      return success;
    } catch (error) {
      logger.error('Cache set error', error as Error, { key });
      return false;
    }
  }

  /**
   * Get or set value with a factory function
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }

    try {
      const value = await factory();
      this.set(key, value, ttl);
      return value;
    } catch (error) {
      logger.error('Cache getOrSet factory error', error as Error, { key });
      throw error;
    }
  }

  /**
   * Delete value from cache
   */
  del(key: string | string[]): number {
    try {
      const deleted = this.cache.del(key);
      logger.debug(`Cache delete: ${Array.isArray(key) ? key.join(', ') : key}`, {
        deleted,
      });
      return deleted;
    } catch (error) {
      logger.error('Cache delete error', error as Error, { key });
      return 0;
    }
  }

  /**
   * Clear all cache
   */
  flush(): void {
    try {
      this.cache.flushAll();
      logger.info('Cache flushed');
    } catch (error) {
      logger.error('Cache flush error', error as Error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return this.cache.getStats();
  }

  /**
   * Check if key exists
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Get all keys
   */
  keys(): string[] {
    return this.cache.keys();
  }

  /**
   * Get TTL for a key
   */
  getTtl(key: string): number | undefined {
    return this.cache.getTtl(key);
  }
}

// Export singleton instance
export const cache = new CacheService();

// Export cache middleware for Express
export function cacheMiddleware(ttl?: number) {
  return async (req: any, res: any, next: any) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const key = `route:${req.originalUrl || req.url}`;
    const cached = cache.get(key);

    if (cached !== undefined) {
      return res.json(cached);
    }

    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to cache response
    res.json = function (data: any) {
      cache.set(key, data, ttl);
      return originalJson(data);
    };

    next();
  };
}

export default cache;
