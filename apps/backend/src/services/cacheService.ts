import { createClient, RedisClientType } from 'redis';
import { gzip, gunzip } from 'zlib';
import { promisify } from 'util';

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string;
  compress?: boolean; // Enable compression for large values
  tags?: string[]; // Tags for cache invalidation
}

export class CacheService {
  private client: RedisClientType | null = null;
  private isConnected = false;
  private defaultTTL = 300; // 5 minutes
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    compressions: 0,
    totalSize: 0
  };
  private tagIndex: Map<string, Set<string>> = new Map();
  private readonly COMPRESSION_THRESHOLD = 1024; // Compress values larger than 1KB

  constructor() {
    this.initializeRedis();
  }

  private async initializeRedis() {
    try {
      if (process.env.REDIS_URL) {
        this.client = createClient({
          url: process.env.REDIS_URL,
          socket: {
            reconnectStrategy: (retries) => {
              if (retries > 10) {
                console.error('❌ Redis: Max reconnection attempts reached');
                return new Error('Max reconnection attempts reached');
              }
              return Math.min(retries * 100, 3000);
            }
          }
        });

        this.client.on('error', (err) => {
          console.error('❌ Redis Client Error:', err);
          this.isConnected = false;
        });

        this.client.on('connect', () => {
          console.log('✅ Redis: Connected');
          this.isConnected = true;
        });

        this.client.on('disconnect', () => {
          console.log('⚠️ Redis: Disconnected');
          this.isConnected = false;
        });

        await this.client.connect();
      } else {
        console.log('⚠️ Redis: No REDIS_URL provided, caching disabled');
      }
    } catch (error) {
      console.error('❌ Redis: Failed to initialize:', error);
      this.isConnected = false;
    }
  }

  private getKey(key: string, prefix?: string): string {
    const keyPrefix = prefix || 'nftsol';
    return `${keyPrefix}:${key}`;
  }

  async get<T>(key: string, options?: CacheOptions): Promise<T | null> {
    if (!this.client || !this.isConnected) {
      return null;
    }

    try {
      const fullKey = this.getKey(key, options?.prefix);
      const value = await this.client.get(fullKey);
      
      if (value) {
        this.stats.hits++;
        
        // Check if value is compressed
        if (typeof value === 'string' && value.startsWith('COMPRESSED:')) {
          const compressedData = value.substring(11);
          const buffer = Buffer.from(compressedData, 'base64');
          const decompressed = await gunzipAsync(buffer);
          const jsonString = decompressed.toString();
          return JSON.parse(jsonString) as T;
        } else {
          return JSON.parse(value as string) as T;
        }
      }
      
      this.stats.misses++;
      return null;
    } catch (error) {
      console.error('❌ Cache GET error:', error);
      this.stats.misses++;
      return null;
    }
  }

  async set<T>(key: string, value: T, options?: CacheOptions): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      const fullKey = this.getKey(key, options?.prefix);
      const ttl = options?.ttl || this.defaultTTL;
      const serializedValue = JSON.stringify(value);
      
      // Determine if we should compress
      const shouldCompress = options?.compress !== false && 
        (options?.compress === true || serializedValue.length > this.COMPRESSION_THRESHOLD);
      
      let finalValue: string;
      if (shouldCompress) {
        const compressed = await gzipAsync(Buffer.from(serializedValue));
        finalValue = `COMPRESSED:${compressed.toString('base64')}`;
        this.stats.compressions++;
      } else {
        finalValue = serializedValue;
      }
      
      await this.client.setEx(fullKey, ttl, finalValue);
      
      // Update tag index
      if (options?.tags) {
        this.updateTagIndex(key, options.tags);
      }
      
      this.stats.sets++;
      this.stats.totalSize += finalValue.length;
      return true;
    } catch (error) {
      console.error('❌ Cache SET error:', error);
      return false;
    }
  }

  async del(key: string, options?: CacheOptions): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      const fullKey = this.getKey(key, options?.prefix);
      await this.client.del(fullKey);
      return true;
    } catch (error) {
      console.error('❌ Cache DEL error:', error);
      return false;
    }
  }

  async exists(key: string, options?: CacheOptions): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      const fullKey = this.getKey(key, options?.prefix);
      const result = await this.client.exists(fullKey);
      return result === 1;
    } catch (error) {
      console.error('❌ Cache EXISTS error:', error);
      return false;
    }
  }

  async invalidatePattern(pattern: string, prefix?: string): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      const fullPattern = this.getKey(pattern, prefix);
      const keys = await this.client.keys(fullPattern);
      
      if (keys.length > 0) {
        await this.client.del(keys);
      }
      return true;
    } catch (error) {
      console.error('❌ Cache INVALIDATE PATTERN error:', error);
      return false;
    }
  }

  async getOrSet<T>(
    key: string, 
    fetchFn: () => Promise<T>, 
    options?: CacheOptions
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key, options);
    if (cached !== null) {
      return cached;
    }

    // If not in cache, fetch and store
    try {
      const value = await fetchFn();
      await this.set(key, value, options);
      return value;
    } catch (error) {
      console.error('❌ Cache GET_OR_SET error:', error);
      throw error;
    }
  }

  // Cache invalidation helpers
  async invalidateUserCache(userId: string): Promise<void> {
    await this.invalidatePattern(`user:${userId}:*`);
    await this.invalidatePattern(`clout:${userId}:*`);
  }

  async invalidateNFTCache(nftId: string): Promise<void> {
    await this.invalidatePattern(`nft:${nftId}:*`);
    await this.invalidatePattern(`marketplace:*`);
  }

  async invalidateMarketplaceCache(): Promise<void> {
    await this.invalidatePattern('marketplace:*');
    await this.invalidatePattern('nfts:*');
  }

  async invalidateCloutCache(): Promise<void> {
    await this.invalidatePattern('clout:*');
    await this.invalidatePattern('leaderboard:*');
  }

  // Health check
  async isHealthy(): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      await this.client.ping();
      return true;
    } catch (error) {
      return false;
    }
  }

  // Tag management methods
  private updateTagIndex(key: string, tags: string[]): void {
    tags.forEach(tag => {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag)!.add(key);
    });
  }

  async invalidateByTag(tag: string): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      const keys = this.tagIndex.get(tag);
      if (keys && keys.size > 0) {
        const fullKeys = Array.from(keys).map(key => this.getKey(key));
        await this.client.del(fullKeys);
        
        // Remove from tag index
        this.tagIndex.delete(tag);
        this.stats.deletes += keys.size;
      }
      return true;
    } catch (error) {
      console.error('❌ Cache INVALIDATE BY TAG error:', error);
      return false;
    }
  }

  async invalidateByTags(tags: string[]): Promise<boolean> {
    const promises = tags.map(tag => this.invalidateByTag(tag));
    const results = await Promise.allSettled(promises);
    return results.every(result => result.status === 'fulfilled' && result.value);
  }

  // Enhanced cache statistics
  async getStats(): Promise<{ 
    connected: boolean; 
    memory?: any; 
    performance: typeof this.stats;
    tagCount: number;
  }> {
    if (!this.client || !this.isConnected) {
      return { 
        connected: false, 
        performance: this.stats,
        tagCount: this.tagIndex.size
      };
    }

    try {
      // Redis doesn't have memoryUsage method, use info instead
      const info = await this.client.info('memory');
      return { 
        connected: true, 
        memory: info,
        performance: { ...this.stats },
        tagCount: this.tagIndex.size
      };
    } catch (error) {
      return { 
        connected: true,
        performance: { ...this.stats },
        tagCount: this.tagIndex.size
      };
    }
  }

  // Reset statistics
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      compressions: 0,
      totalSize: 0
    };
  }

  // Close connection
  async close(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
    }
  }
}

// Singleton instance
export const cacheService = new CacheService();
