import {
  ApiResponse,
  NFT,
  Collection,
  WalletInfo,
  ProgramConfig,
  MintRequest,
  MintResponse,
  MarketData,
} from '../types';

import { API_BASE, API_ENDPOINTS } from '../config/api';

// CSRF token management
let csrfToken: string | null = null;

// Get CSRF token from cookies
const getCSRFToken = (): string | null => {
  if (csrfToken) return csrfToken;
  
  // Extract from cookies
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'csrf-token') {
      csrfToken = decodeURIComponent(value);
      return csrfToken;
    }
  }
  
  return null;
};

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    // Endpoint might already be a full URL from API_ENDPOINTS, or a relative path
    let url: string;
    if (endpoint.startsWith('http')) {
      // Already a full URL
      url = endpoint;
    } else {
      // Relative path - prepend API_BASE
      url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    }

    // Add CSRF token for POST/PUT/DELETE requests
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    };
    
    if (options.method && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method)) {
      const token = getCSRFToken();
      if (token) {
        headers['X-CSRF-Token'] = token;
      }
    }
    
    const defaultOptions: RequestInit = {
      headers,
      ...options,
    };

    try {
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch(url, {
        ...defaultOptions,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      // Log error in development only
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.error(`API Error (${endpoint}):`, error);
      }

      // Return user-friendly error message
      let errorMessage = 'Network error. Please check your connection and try again.';
      if (error instanceof Error) {
        if (error.message.includes('fetch')) {
          errorMessage = 'Unable to reach server. Please check your internet connection.';
        } else {
          errorMessage = error.message;
        }
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<any>> {
    return this.request(API_ENDPOINTS.health);
  }

  // Get CSRF token from server
  async getCSRFToken(): Promise<string> {
    try {
      const response = await fetch(`${API_BASE}/api/v1/csrf-token`, {
        method: 'GET',
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.csrfToken) {
          csrfToken = data.csrfToken;
          return csrfToken;
        }
      }
    } catch (error) {
      console.warn('Failed to get CSRF token:', error);
    }
    
    return '';
  }

  // Get program configuration
  async getPrograms(): Promise<ApiResponse<ProgramConfig>> {
    return this.request(API_ENDPOINTS.programs);
  }

  // Get Solana status
  async getSolanaStatus(): Promise<ApiResponse<any>> {
    return this.request(API_ENDPOINTS.solanaStatus);
  }

  // Mint NFT
  async mintNFT(request: MintRequest): Promise<ApiResponse<MintResponse>> {
    // Ensure we have a CSRF token
    await this.getCSRFToken();
    
    const formData = new FormData();
    formData.append('name', request.name);
    formData.append('description', request.description);
    formData.append('creatorWallet', request.creatorWallet);

    if (request.file) {
      formData.append('file', request.file);
    } else if (request.imageUrl) {
      formData.append('imageUrl', request.imageUrl);
    }

    // Get CSRF token for FormData requests
    const token = getCSRFToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['X-CSRF-Token'] = token;
    }

    return this.request(API_ENDPOINTS.mint, {
      method: 'POST',
      headers, // Add CSRF token, let browser set Content-Type for FormData
      body: formData,
    });
  }

  // Get NFT metadata
  async getNFTMetadata(mintAddress: string): Promise<ApiResponse<NFT>> {
    return this.request(API_ENDPOINTS.nft(mintAddress));
  }

  // Get NFTs by owner
  async getNFTsByOwner(owner: string): Promise<ApiResponse<NFT[]>> {
    return this.request(API_ENDPOINTS.nfts(owner));
  }

  // Get marketplace data
  async getMarketplace(): Promise<ApiResponse<MarketData>> {
    return this.request(API_ENDPOINTS.marketplace);
  }

  // Get collections
  async getCollections(): Promise<ApiResponse<Collection[]>> {
    return this.request(API_ENDPOINTS.collections);
  }

  // Get wallet info
  async getWalletInfo(address: string): Promise<ApiResponse<WalletInfo>> {
    return this.request(API_ENDPOINTS.wallet(address));
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

export const apiService = new ApiService();
export default apiService;
