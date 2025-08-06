
// Enhanced Public API Client - No API Keys Required

export interface MarketOverview {
  solPrice: {
    jupiter: number | null;
    coinGecko: number | null;
    current: number;
  };
  marketChange24h: number;
  topCollections: any[];
  networkStatus: string;
  lastUpdated: string;
}

export interface NFTTrends {
  totalCollections: number;
  averageFloorPrice: number;
  solPriceUSD: number;
  trending: Array<{
    name: string;
    symbol: string;
    floorPrice: number;
    volume24h: number;
  }>;
  lastUpdated: string;
}

export interface SolanaAccount {
  address: string;
  exists: boolean;
  lamports: number;
  solBalance: number;
  owner: string | null;
  verified: boolean;
  provider: string;
  timestamp: string;
}

class EnhancedPublicAPI {
  private baseUrl: string;

  constructor() {
    this.baseUrl = '/api/public';
  }

  async getMarketOverview(): Promise<MarketOverview> {
    try {
      const response = await fetch(`${this.baseUrl}/market-overview`);
      if (!response.ok) throw new Error('Market overview fetch failed');
      return await response.json();
    } catch (error) {
      console.error('Market overview error:', error);
      // Return fallback data
      return {
        solPrice: { jupiter: null, coinGecko: null, current: 100 },
        marketChange24h: 0,
        topCollections: [],
        networkStatus: 'operational',
        lastUpdated: new Date().toISOString()
      };
    }
  }

  async getNFTTrends(): Promise<NFTTrends> {
    try {
      const response = await fetch(`${this.baseUrl}/nft-trends`);
      if (!response.ok) throw new Error('NFT trends fetch failed');
      return await response.json();
    } catch (error) {
      console.error('NFT trends error:', error);
      return {
        totalCollections: 0,
        averageFloorPrice: 0,
        solPriceUSD: 100,
        trending: [],
        lastUpdated: new Date().toISOString()
      };
    }
  }

  async getCurrentSOLPrice(): Promise<number> {
    try {
      const response = await fetch(`${this.baseUrl}/jupiter/price`);
      if (!response.ok) throw new Error('SOL price fetch failed');
      const data = await response.json();
      return data.solPrice || 100;
    } catch (error) {
      console.error('SOL price error:', error);
      return 100; // Fallback price
    }
  }

  async verifyAccount(address: string): Promise<SolanaAccount> {
    try {
      const response = await fetch(`${this.baseUrl}/solana/account/${address}`);
      if (!response.ok) throw new Error('Account verification failed');
      return await response.json();
    } catch (error) {
      console.error('Account verification error:', error);
      return {
        address,
        exists: false,
        lamports: 0,
        solBalance: 0,
        owner: null,
        verified: false,
        provider: 'Fallback',
        timestamp: new Date().toISOString()
      };
    }
  }

  async getMagicEdenCollections(): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/magiceden/collections`);
      if (!response.ok) throw new Error('Magic Eden collections fetch failed');
      const data = await response.json();
      return data.collections || [];
    } catch (error) {
      console.error('Magic Eden collections error:', error);
      return [];
    }
  }

  async checkAPIHealth(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/health-check`);
      if (!response.ok) throw new Error('Health check failed');
      return await response.json();
    } catch (error) {
      console.error('API health check error:', error);
      return {
        overall: 'error',
        services: {},
        timestamp: new Date().toISOString()
      };
    }
  }

  // Real-time price monitoring with caching
  private priceCache: { price: number; timestamp: number } | null = null;
  private readonly CACHE_DURATION = 30000; // 30 seconds

  async getCachedSOLPrice(): Promise<number> {
    const now = Date.now();
    
    if (this.priceCache && (now - this.priceCache.timestamp) < this.CACHE_DURATION) {
      return this.priceCache.price;
    }

    const price = await this.getCurrentSOLPrice();
    this.priceCache = { price, timestamp: now };
    return price;
  }

  // Enhanced market data for NFT pricing
  async getEnhancedMarketData(): Promise<{
    solPrice: number;
    change24h: number;
    collections: any[];
    trends: NFTTrends;
    networkHealth: string;
  }> {
    try {
      const [marketOverview, trends, collections] = await Promise.all([
        this.getMarketOverview(),
        this.getNFTTrends(),
        this.getMagicEdenCollections()
      ]);

      return {
        solPrice: marketOverview.solPrice.current,
        change24h: marketOverview.marketChange24h,
        collections: collections.slice(0, 5),
        trends,
        networkHealth: marketOverview.networkStatus
      };
    } catch (error) {
      console.error('Enhanced market data error:', error);
      return {
        solPrice: 100,
        change24h: 0,
        collections: [],
        trends: {
          totalCollections: 0,
          averageFloorPrice: 0,
          solPriceUSD: 100,
          trending: [],
          lastUpdated: new Date().toISOString()
        },
        networkHealth: 'operational'
      };
    }
  }
}

// Export singleton instance
export const enhancedPublicAPI = new EnhancedPublicAPI();

// Utility functions for React components
export async function useLiveSOLPrice(): Promise<number> {
  return enhancedPublicAPI.getCachedSOLPrice();
}

export async function useMarketData() {
  return enhancedPublicAPI.getEnhancedMarketData();
}

export async function useNFTCollections() {
  return enhancedPublicAPI.getMagicEdenCollections();
}

export default enhancedPublicAPI;
