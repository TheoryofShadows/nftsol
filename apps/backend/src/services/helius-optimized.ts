/**
 * 🚀 Helius Optimized Service
 * Best practices for Solana development with Helius DAS API
 * - Efficient asset indexing
 * - Proper error handling and retry logic
 * - Connection pooling and caching
 * - Rate limit awareness
 */

import logger from '../utils/logger';
import axios, { AxiosInstance } from 'axios';
import { PublicKey, Connection, Commitment as _Commitment } from '@solana/web3.js';

interface HeliusConfig {
  apiKey: string;
  rpcUrl?: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

interface DASAsset {
  interface: string;
  id: string;
  content?: {
    $schema: string;
    json_uri: string;
    metadata: {
      name?: string;
      symbol?: string;
      description?: string;
      image?: string;
      attributes?: Array<{ trait_type: string; value: string }>;
    };
    links?: {
      image?: string;
      external_url?: string;
    };
    files?: Array<{ uri?: string; mime?: string; cdn_uri?: string }>;
  };
  authorities?: Array<{ address: string; scopes: string[] }>;
  compression?: {
    eligible: boolean;
    compressed: boolean;
    data_hash: string;
    creator_hash: string;
    asset_hash: string;
    tree: string;
    seq: number;
    leaf_id: number;
  };
  grouping?: Array<{ group_key: string; group_value: string }>;
  mutable?: boolean;
  burnt?: boolean;
  ownership?: {
    frozen: boolean;
    delegated: boolean;
    delegate: string | null;
    owner: string;
    percentage: number;
  };
  supply?: {
    print_max_supply: number;
    print_current_supply: number;
    edition_nonce: number | null;
  };
  creators?: Array<{ address: string; share: number; verified: boolean }>;
  royalty?: {
    royalty_model: string;
    target: string | null;
    percent: number;
    basis_points: number;
    primary_sale_happened: boolean;
    locked: boolean;
  };
  uses?: {
    use_method: string;
    remaining: number;
    total: number;
  };
}

interface SearchAssetsOptions {
  page?: number;
  limit?: number;
  sortBy?: 'recent' | 'verified_collection' | 'watched_count';
  sortDirection?: 'asc' | 'desc';
}

class HeliusOptimizedService {
  private apiKey: string;
  private rpcUrl: string;
  private connection: Connection;
  private client: AxiosInstance;
  private retryAttempts: number;
  private retryDelay: number;
  private requestCache: Map<string, { data: any; timestamp: number }>;
  private cacheTTL: number = 5 * 60 * 1000; // 5 minutes

  constructor(config: HeliusConfig) {
    if (!config.apiKey) {
      throw new Error('Helius API key is required');
    }

    this.apiKey = config.apiKey;
    this.rpcUrl =
      config.rpcUrl ||
      `https://mainnet.helius-rpc.com/?api-key=${this.apiKey}`;
    this.retryAttempts = config.retryAttempts || 3;
    this.retryDelay = config.retryDelay || 1000;
    this.requestCache = new Map();

    // Initialize Solana connection
    this.connection = new Connection(this.rpcUrl, 'confirmed');

    // Initialize HTTP client with best practices
    this.client = axios.create({
      baseURL: 'https://api.helius.xyz/v0',
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add response interceptor for rate limit handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 429) {
          logger.warn('⚠️ Rate limit hit, backing off...');
          const retryAfter =
            parseInt(error.response.headers['retry-after'] || '60', 10) * 1000;
          await this.delay(retryAfter);
        }
        throw error;
      }
    );
  }

  /**
   * Get assets by owner with proper pagination and caching
   */
  async getAssetsByOwner(
    owner: string,
    options: SearchAssetsOptions = {}
  ): Promise<{ items: DASAsset[]; total: number; cursor?: string }> {
    const cacheKey = `owner:${owner}:${JSON.stringify(options)}`;

    // Check cache
    const cached = this.requestCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }

    try {
      // Validate owner address
      new PublicKey(owner);

      const result = await this.retryRequest(async () => {
        const response = await this.client.post('/searchAssets', {
          ownerAddress: owner,
          page: options.page || 1,
          limit: Math.min(options.limit || 1000, 1000),
          sortBy: options.sortBy || 'recent',
          sortDirection: options.sortDirection || 'desc',
          displayOptions: {
            showFungible: false,
            showNativeBalance: false,
          },
        });
        return response.data;
      });

      // Cache the result
      this.requestCache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
      });

      return result;
    } catch (error) {
      logger.error('Error fetching assets by owner:', error);
      throw error;
    }
  }

  /**
   * Get assets by collection with proper filtering
   */
  async getAssetsByCollection(
    collection: string,
    options: SearchAssetsOptions = {}
  ): Promise<{ items: DASAsset[]; total: number; cursor?: string }> {
    const cacheKey = `collection:${collection}:${JSON.stringify(options)}`;

    const cached = this.requestCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }

    try {
      // Validate collection address
      new PublicKey(collection);

      const result = await this.retryRequest(async () => {
        const response = await this.client.post('/searchAssets', {
          grouping: [
            {
              grouping_type: 'collection',
              group_value: collection,
            },
          ],
          page: options.page || 1,
          limit: Math.min(options.limit || 1000, 1000),
          sortBy: options.sortBy || 'recent',
          sortDirection: options.sortDirection || 'desc',
        });
        return response.data;
      });

      this.requestCache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
      });

      return result;
    } catch (error) {
      logger.error('Error fetching assets by collection:', error);
      throw error;
    }
  }

  /**
   * Get single asset with full metadata
   */
  async getAsset(assetId: string): Promise<DASAsset> {
    const cacheKey = `asset:${assetId}`;

    const cached = this.requestCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }

    try {
      // Validate asset ID (should be a valid Solana address)
      new PublicKey(assetId);

      const result = await this.retryRequest(async () => {
        const response = await this.client.post('/getAsset', {
          id: assetId,
        });
        return response.data;
      });

      this.requestCache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
      });

      return result;
    } catch (error) {
      logger.error('Error fetching asset:', error);
      throw error;
    }
  }

  /**
   * Get multiple assets efficiently (batch request)
   */
  async getAssets(assetIds: string[]): Promise<DASAsset[]> {
    if (assetIds.length === 0) return [];

    // Validate all IDs
    assetIds.forEach((id) => {
      try {
        new PublicKey(id);
      } catch {
        throw new Error(`Invalid asset ID: ${id}`);
      }
    });

    try {
      const results = await this.retryRequest(async () => {
        const response = await this.client.post('/getAssetBatch', {
          ids: assetIds,
        });
        return response.data;
      });

      return results;
    } catch (error) {
      logger.error('Error fetching assets batch:', error);
      throw error;
    }
  }

  /**
   * Search assets with advanced filtering
   */
  async searchAssets(
    filters: {
      creator?: string;
      owner?: string;
      collection?: string;
      burnt?: boolean;
    },
    options: SearchAssetsOptions = {}
  ): Promise<{ items: DASAsset[]; total: number; cursor?: string }> {
    const cacheKey = `search:${JSON.stringify(filters)}:${JSON.stringify(options)}`;

    const cached = this.requestCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }

    try {
      const searchPayload: any = {
        page: options.page || 1,
        limit: Math.min(options.limit || 1000, 1000),
        sortBy: options.sortBy || 'recent',
        sortDirection: options.sortDirection || 'desc',
      };

      // Add optional filters
      if (filters.creator) {
        searchPayload.creatorAddress = filters.creator;
      }
      if (filters.owner) {
        searchPayload.ownerAddress = filters.owner;
      }
      if (filters.collection) {
        searchPayload.grouping = [
          {
            grouping_type: 'collection',
            group_value: filters.collection,
          },
        ];
      }
      if (filters.burnt !== undefined) {
        searchPayload.burnt = filters.burnt;
      }

      const result = await this.retryRequest(async () => {
        const response = await this.client.post('/searchAssets', searchPayload);
        return response.data;
      });

      this.requestCache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
      });

      return result;
    } catch (error) {
      logger.error('Error searching assets:', error);
      throw error;
    }
  }

  /**
   * Get NFT metadata with full details
   */
  async getNFTMetadata(
    mint: string
  ): Promise<DASAsset & { historical_data?: any }> {
    const asset = await this.getAsset(mint);

    // Enrich with additional data if available
    return {
      ...asset,
      historical_data: null, // Can be enhanced with historical pricing data
    };
  }

  /**
   * Health check for Helius API and connection
   */
  async healthCheck(): Promise<{
    helius: boolean;
    solana: boolean;
    latency: number;
  }> {
    const startTime = Date.now();

    try {
      // Check Helius API
      const heliusHealth = await Promise.race([
        this.client.post('/searchAssets', {
          page: 1,
          limit: 1,
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Helius timeout')), 10000)
        ),
      ]);

      // Check Solana RPC
      const slot = await Promise.race([
        this.connection.getSlot('confirmed'),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Solana timeout')), 10000)
        ),
      ]);

      const latency = Date.now() - startTime;

      return {
        helius: !!heliusHealth,
        solana: !!slot,
        latency,
      };
    } catch (error) {
      logger.error('Health check failed:', error);
      return {
        helius: false,
        solana: false,
        latency: Date.now() - startTime,
      };
    }
  }

  /**
   * Retry logic with exponential backoff
   */
  private async retryRequest<T>(
    fn: () => Promise<T>,
    attempt: number = 0
  ): Promise<T> {
    try {
      return await fn();
    } catch (error: any) {
      if (
        attempt < this.retryAttempts &&
        (error.response?.status === 429 ||
          error.response?.status === 500 ||
          error.code === 'ECONNRESET' ||
          error.code === 'ETIMEDOUT')
      ) {
        const delay = this.retryDelay * Math.pow(2, attempt);
        logger.warn(
          `Retrying after ${delay}ms (attempt ${attempt + 1}/${this.retryAttempts})`
        );
        await this.delay(delay);
        return this.retryRequest(fn, attempt + 1);
      }
      throw error;
    }
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Clear cache (useful for forced refresh)
   */
  clearCache(): void {
    this.requestCache.clear();
  }

  /**
   * Get cache stats
   */
  getCacheStats(): { size: number; ttl: number } {
    return {
      size: this.requestCache.size,
      ttl: this.cacheTTL,
    };
  }

  /**
   * Close connection
   */
  async close(): Promise<void> {
    // Cleanup if needed
    this.requestCache.clear();
  }
}

// Factory function for singleton
let heliusInstance: HeliusOptimizedService;

export function initializeHelius(config: HeliusConfig): HeliusOptimizedService {
  if (!heliusInstance) {
    heliusInstance = new HeliusOptimizedService(config);
  }
  return heliusInstance;
}

export function getHelius(): HeliusOptimizedService {
  if (!heliusInstance) {
    const apiKey = process.env.HELIUS_API_KEY;
    if (!apiKey) {
      throw new Error(
        'Helius API key not found in environment variables. Initialize with initializeHelius() first.'
      );
    }
    heliusInstance = new HeliusOptimizedService({ apiKey });
  }
  return heliusInstance;
}

export default HeliusOptimizedService;
export { DASAsset, HeliusConfig, SearchAssetsOptions };
