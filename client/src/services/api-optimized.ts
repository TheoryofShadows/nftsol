/**
 * Optimized API service with intelligent caching, retry logic, and request deduplication
 */

import { ApiResponse, NFT, Collection, WalletInfo, ProgramConfig, MintRequest, MintResponse, MarketData } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

// Request deduplication map
const pendingRequests = new Map<string, Promise<any>>();

// Simple in-memory cache with TTL
interface CacheEntry<T> {
  data: T;
  expires: number;
}

const cache = new Map<string, CacheEntry<any>>();
const DEFAULT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCacheKey(endpoint: string, params?: Record<string, any>): string {
  if (!params) return endpoint;
  const sortedParams = Object.keys(params).sort().reduce((acc, key) => {
    acc[key] = params[key];
    return acc;
  }, {} as Record<string, any>);
  return `${endpoint}:${JSON.stringify(sortedParams)}`;
}

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  
  if (Date.now() > entry.expires) {
    cache.delete(key);
    return null;
  }
  
  return entry.data as T;
}

function setCache<T>(key: string, data: T, ttl = DEFAULT_CACHE_TTL): void {
  cache.set(key, {
    data,
    expires: Date.now() + ttl,
  });
}

// Retry logic with exponential backoff
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 3,
  delay = 1000
): Promise<Response> {
  try {
    const response = await fetch(url, options);
    
    // Retry on 5xx errors
    if (response.status >= 500 && retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, delay * 2);
    }
    
    return response;
  } catch (error) {
    // Retry on network errors
    if (retries > 0 && (error as any)?.name !== 'AbortError') {
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, delay * 2);
    }
    throw error;
  }
}

class OptimizedApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    cacheOptions?: { ttl?: number; skipCache?: boolean }
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE}${endpoint}`;
    const cacheKey = getCacheKey(endpoint, options.body ? undefined : undefined);
    const method = options.method || 'GET';

    // Check cache for GET requests
    if (method === 'GET' && !cacheOptions?.skipCache) {
      const cached = getCached<ApiResponse<T>>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Deduplicate concurrent requests
    const requestKey = `${method}:${endpoint}`;
    if (pendingRequests.has(requestKey)) {
      return pendingRequests.get(requestKey)!;
    }

    const requestPromise = (async () => {
      try {
        const defaultOptions: RequestInit = {
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
          ...options,
        };

        // Add request timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

        const response = await fetchWithRetry(url, {
          ...defaultOptions,
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);

        // Handle non-JSON responses
        const contentType = response.headers.get('content-type');
        if (!contentType?.includes('application/json')) {
          const text = await response.text();
          throw new Error(text || `HTTP ${response.status}`);
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || `HTTP ${response.status}`);
        }

        const result: ApiResponse<T> = {
          success: true,
          data: data.data || data,
        };

        // Cache successful GET requests
        if (method === 'GET' && !cacheOptions?.skipCache) {
          setCache(cacheKey, result, cacheOptions?.ttl);
        }

        return result;
      } catch (error) {
        // Return user-friendly error
        let errorMessage = 'Network error. Please check your connection.';
        
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            errorMessage = 'Request timed out. Please try again.';
          } else if (error.message.includes('fetch')) {
            errorMessage = 'Unable to reach server. Please check your connection.';
          } else {
            errorMessage = error.message;
          }
        }

        return {
          success: false,
          error: errorMessage,
        } as ApiResponse<T>;
      } finally {
        // Clean up pending request
        pendingRequests.delete(requestKey);
      }
    })();

    // Store pending request
    pendingRequests.set(requestKey, requestPromise);
    return requestPromise;
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<any>> {
    return this.request('/healthz', {}, { skipCache: true });
  }

  // Get program configuration (long cache)
  async getPrograms(): Promise<ApiResponse<ProgramConfig>> {
    return this.request('/api/v1/programs', {}, { ttl: 60 * 60 * 1000 }); // 1 hour
  }

  // Get Solana status
  async getSolanaStatus(): Promise<ApiResponse<any>> {
    return this.request('/api/v1/solana/status', {}, { ttl: 30 * 1000 }); // 30 seconds
  }

  // Mint NFT (no cache, mutation)
  async mintNFT(request: MintRequest): Promise<ApiResponse<MintResponse>> {
    const formData = new FormData();
    formData.append('name', request.name);
    formData.append('description', request.description);
    formData.append('creatorWallet', request.creatorWallet);

    if (request.file) {
      formData.append('file', request.file);
    } else if (request.imageUrl) {
      formData.append('imageUrl', request.imageUrl);
    }

    return this.request('/api/v1/simple-mint', {
      method: 'POST',
      headers: {}, // Let browser set Content-Type for FormData
      body: formData,
    }, { skipCache: true });
  }

  // Get NFT metadata (long cache)
  async getNFTMetadata(mintAddress: string): Promise<ApiResponse<NFT>> {
    return this.request(`/api/v1/nft/${mintAddress}`, {}, { ttl: 10 * 60 * 1000 }); // 10 minutes
  }

  // Get NFTs by owner
  async getNFTsByOwner(owner: string): Promise<ApiResponse<NFT[]>> {
    return this.request(`/api/v1/nfts/${owner}`, {}, { ttl: 2 * 60 * 1000 }); // 2 minutes
  }

  // Get marketplace (frequent updates)
  async getMarketplace(): Promise<ApiResponse<MarketData>> {
    return this.request('/api/v1/market', {}, { ttl: 1 * 60 * 1000 }); // 1 minute
  }

  // Get collections
  async getCollections(): Promise<ApiResponse<Collection[]>> {
    return this.request('/api/v1/collections', {}, { ttl: 5 * 60 * 1000 }); // 5 minutes
  }

  // Get wallet info (short cache, frequent updates)
  async getWalletInfo(address: string): Promise<ApiResponse<WalletInfo>> {
    return this.request(`/api/v1/wallet/${address}`, {}, { ttl: 30 * 1000 }); // 30 seconds
  }

  // Clear cache for specific endpoint
  clearCache(endpoint: string): void {
    const keys = Array.from(cache.keys()).filter((key) => key.startsWith(endpoint));
    keys.forEach((key) => cache.delete(key));
  }

  // Clear all cache
  clearAllCache(): void {
    cache.clear();
  }

  // Batch API calls
  async batchRequest<T>(requests: Array<() => Promise<ApiResponse<T>>>): Promise<ApiResponse<T[]>> {
    try {
      const results = await Promise.allSettled(requests.map((request) => request()));
      const successfulResults = results
        .filter(
          (result): result is PromiseFulfilledResult<ApiResponse<T>> =>
            result.status === 'fulfilled' && result.value.success
        )
        .map((result) => result.value.data)
        .filter((data): data is T => data !== undefined);

      return {
        success: true,
        data: successfulResults,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Batch request failed',
      };
    }
  }
}

export const apiServiceOptimized = new OptimizedApiService();
export default apiServiceOptimized;

