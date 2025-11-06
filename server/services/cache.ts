/**
 * Cache Service
 * Redis-based caching layer
 */

import { logger } from '@shared/utils/logger';
import { envConfig } from '@shared/config/environment';

// Redis client (will be initialized based on provider)
let redisClient: any = null;

// Initialize Redis client
async function getRedisClient() {
  if (redisClient) return redisClient;

  try {
    // Use Upstash Redis (serverless) - recommended
    if (process.env.UPSTASH_REDIS_URL && process.env.UPSTASH_REDIS_TOKEN) {
      try {
        const { Redis } = await import('@upstash/redis');
        redisClient = new Redis({
          url: process.env.UPSTASH_REDIS_URL,
          token: process.env.UPSTASH_REDIS_TOKEN,
        });
        logger.info('Redis client initialized (Upstash)');
        return redisClient;
      } catch (error) {
        logger.warn('Failed to load @upstash/redis, falling back', error);
      }
    }

    // Use standard Redis
    if (process.env.REDIS_URL) {
      try {
        const Redis = (await import('ioredis')).default;
        redisClient = new Redis(process.env.REDIS_URL, {
          maxRetriesPerRequest: 3,
          retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
          },
        });
        logger.info('Redis client initialized (standard)');
        return redisClient;
      } catch (error) {
        logger.warn('Failed to load ioredis, falling back', error);
      }
    }

    // Fallback to in-memory cache for development
    logger.warn('Redis not configured, using in-memory cache (not recommended for production)');
    return new Map();
  } catch (error) {
    logger.error('Failed to initialize Redis', error);
    return new Map(); // Fallback to in-memory
  }
}

export class CacheService {
  private client: any = null;
  private isRedis: boolean = false;

  async initialize() {
    this.client = await getRedisClient();
    this.isRedis = !(this.client instanceof Map);
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      if (!this.client) await this.initialize();

      if (this.isRedis) {
        const value = await this.client.get(key);
        return value ? JSON.parse(value) : null;
      } else {
        // In-memory cache
        return (this.client as Map<string, any>).get(key) || null;
      }
    } catch (error) {
      logger.error('Cache get error', error, { key });
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
    try {
      if (!this.client) await this.initialize();

      const serialized = JSON.stringify(value);

      if (this.isRedis) {
        if (ttlSeconds) {
          await this.client.setex(key, ttlSeconds, serialized);
        } else {
          await this.client.set(key, serialized);
        }
      } else {
        // In-memory cache
        (this.client as Map<string, any>).set(key, value);
        if (ttlSeconds) {
          setTimeout(() => {
            (this.client as Map<string, any>).delete(key);
          }, ttlSeconds * 1000);
        }
      }

      return true;
    } catch (error) {
      logger.error('Cache set error', error, { key });
      return false;
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<boolean> {
    try {
      if (!this.client) await this.initialize();

      if (this.isRedis) {
        await this.client.del(key);
      } else {
        (this.client as Map<string, any>).delete(key);
      }

      return true;
    } catch (error) {
      logger.error('Cache delete error', error, { key });
      return false;
    }
  }

  /**
   * Clear all cache (use with caution)
   */
  async clear(): Promise<boolean> {
    try {
      if (!this.client) await this.initialize();

      if (this.isRedis) {
        await this.client.flushdb();
      } else {
        (this.client as Map<string, any>).clear();
      }

      return true;
    } catch (error) {
      logger.error('Cache clear error', error);
      return false;
    }
  }

  /**
   * Get or set pattern (cache-aside)
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlSeconds?: number
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await fetchFn();
    await this.set(key, value, ttlSeconds);
    return value;
  }
}

export const cacheService = new CacheService();

