import { ApiResponse, NFT, Collection, WalletInfo, ProgramConfig, MintRequest, MintResponse, MarketData } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE || 'https://nftsol-dev.onrender.com';

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, defaultOptions);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<any>> {
    return this.request('/healthz');
  }

  // Get program configuration
  async getPrograms(): Promise<ApiResponse<ProgramConfig>> {
    return this.request('/api/programs');
  }

  // Get Solana status
  async getSolanaStatus(): Promise<ApiResponse<any>> {
    return this.request('/api/solana/status');
  }

  // Mint NFT
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

    return this.request('/api/simple-mint', {
      method: 'POST',
      headers: {}, // Let browser set Content-Type for FormData
      body: formData,
    });
  }

  // Get NFT metadata
  async getNFTMetadata(mintAddress: string): Promise<ApiResponse<NFT>> {
    return this.request(`/api/nft/${mintAddress}`);
  }

  // Get NFTs by owner
  async getNFTsByOwner(owner: string): Promise<ApiResponse<NFT[]>> {
    return this.request(`/api/nfts/${owner}`);
  }

  // Get marketplace data
  async getMarketplace(): Promise<ApiResponse<MarketData>> {
    return this.request('/api/market');
  }

  // Get collections
  async getCollections(): Promise<ApiResponse<Collection[]>> {
    return this.request('/api/collections');
  }

  // Get wallet info
  async getWalletInfo(address: string): Promise<ApiResponse<WalletInfo>> {
    return this.request(`/api/wallet/${address}`);
  }

  // Batch API calls
  async batchRequest<T>(
    requests: Array<() => Promise<ApiResponse<T>>>
  ): Promise<ApiResponse<T[]>> {
    try {
      const results = await Promise.allSettled(
        requests.map(request => request())
      );

      const successfulResults = results
        .filter((result): result is PromiseFulfilledResult<ApiResponse<T>> => 
          result.status === 'fulfilled' && result.value.success
        )
        .map(result => result.value.data)
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
