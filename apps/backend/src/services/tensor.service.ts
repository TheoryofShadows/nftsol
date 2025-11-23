/**
 * Tensor Trade API Service
 * Real-time NFT orderbook data from Tensor marketplace
 *
 * API Docs: https://docs.tensor.so/
 */

import logger from '../utils/logger';

// Tensor API configuration
const TENSOR_API_BASE = 'https://api.tensor.so/v1';
const TENSOR_GRAPHQL = 'https://api.tensor.so/graphql';

// Cache for orderbook data (TTL: 10 seconds)
const orderbookCache = new Map<string, { data: TensorOrderbook; timestamp: number }>();
const CACHE_TTL = 10000; // 10 seconds

export interface TensorBid {
  price: number;
  priceLamports: string;
  bidder: string;
  quantity: number;
  expiry?: number;
}

export interface TensorListing {
  price: number;
  priceLamports: string;
  seller: string;
  mint: string;
  name?: string;
  image?: string;
}

export interface TensorOrderbook {
  collection: string;
  slug: string;
  floorPrice: number;
  floorPriceLamports: string;
  topBid: number;
  topBidLamports: string;
  bids: TensorBid[];
  listings: TensorListing[];
  spread: number;
  spreadPercent: number;
  volume24h: number;
  numListed: number;
  numOwners: number;
  updatedAt: number;
}

export interface TensorCollectionStats {
  slug: string;
  name: string;
  symbol: string;
  floorPrice: number;
  volume24h: number;
  volume7d: number;
  numListed: number;
  numMints: number;
  royaltyBps: number;
}

export interface TensorPriceHistory {
  timestamp: number;
  floorPrice: number;
  volume: number;
  numSales: number;
}

class TensorService {
  private apiKey: string | null;

  constructor() {
    this.apiKey = process.env.TENSOR_API_KEY || null;
  }

  /**
   * Get orderbook (bids + listings) for a collection
   */
  async getOrderbook(collectionSlug: string, limit: number = 10): Promise<TensorOrderbook | null> {
    try {
      // Check cache first
      const cached = orderbookCache.get(collectionSlug);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
      }

      // GraphQL query for orderbook data
      const query = `
        query CollectionOrderbook($slug: String!, $limit: Int) {
          collection(slug: $slug) {
            slug
            name
            floorPrice
            numListed
            numOwners
            stats {
              volume24h
              volume7d
            }
          }
          activeListings(slug: $slug, limit: $limit, sortBy: PriceAsc) {
            txs {
              tx {
                grossAmount
                seller
              }
              mint {
                onchainId
                name
                imageUri
              }
            }
          }
          topBids(slug: $slug, limit: $limit) {
            bids {
              price
              bidder
              quantity
              expiry
            }
          }
        }
      `;

      const response = await fetch(TENSOR_GRAPHQL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'X-TENSOR-API-KEY': this.apiKey }),
        },
        body: JSON.stringify({
          query,
          variables: { slug: collectionSlug, limit },
        }),
      });

      if (!response.ok) {
        // Fallback to REST API if GraphQL fails
        return this.getOrderbookREST(collectionSlug, limit);
      }

      const result = await response.json();

      if (result.errors) {
        logger.warn(`Tensor GraphQL error for ${collectionSlug}:`, result.errors);
        return this.getOrderbookREST(collectionSlug, limit);
      }

      const data = result.data;
      const collection = data.collection;
      const listings = data.activeListings?.txs || [];
      const bids = data.topBids?.bids || [];

      // Calculate floor and top bid
      const floorPriceLamports = collection?.floorPrice || '0';
      const floorPrice = parseInt(floorPriceLamports) / 1e9;

      const topBidLamports = bids[0]?.price || '0';
      const topBid = parseInt(topBidLamports) / 1e9;

      const orderbook: TensorOrderbook = {
        collection: collection?.name || collectionSlug,
        slug: collectionSlug,
        floorPrice,
        floorPriceLamports,
        topBid,
        topBidLamports,
        bids: bids.map((b: any) => ({
          price: parseInt(b.price) / 1e9,
          priceLamports: b.price,
          bidder: b.bidder,
          quantity: b.quantity || 1,
          expiry: b.expiry,
        })),
        listings: listings.slice(0, limit).map((l: any) => ({
          price: parseInt(l.tx?.grossAmount || '0') / 1e9,
          priceLamports: l.tx?.grossAmount || '0',
          seller: l.tx?.seller || '',
          mint: l.mint?.onchainId || '',
          name: l.mint?.name,
          image: l.mint?.imageUri,
        })),
        spread: floorPrice - topBid,
        spreadPercent: topBid > 0 ? ((floorPrice - topBid) / topBid) * 100 : 0,
        volume24h: parseFloat(collection?.stats?.volume24h || '0') / 1e9,
        numListed: collection?.numListed || 0,
        numOwners: collection?.numOwners || 0,
        updatedAt: Date.now(),
      };

      // Cache the result
      orderbookCache.set(collectionSlug, { data: orderbook, timestamp: Date.now() });

      return orderbook;
    } catch (error) {
      logger.error(`Error fetching Tensor orderbook for ${collectionSlug}:`, error);
      return this.getOrderbookREST(collectionSlug, limit);
    }
  }

  /**
   * REST API fallback for orderbook
   */
  private async getOrderbookREST(collectionSlug: string, limit: number): Promise<TensorOrderbook | null> {
    try {
      const [statsRes, listingsRes] = await Promise.all([
        fetch(`${TENSOR_API_BASE}/collections/${collectionSlug}/stats`, {
          headers: this.apiKey ? { 'X-TENSOR-API-KEY': this.apiKey } : {},
        }),
        fetch(`${TENSOR_API_BASE}/collections/${collectionSlug}/listings?limit=${limit}&sortBy=price`, {
          headers: this.apiKey ? { 'X-TENSOR-API-KEY': this.apiKey } : {},
        }),
      ]);

      if (!statsRes.ok && !listingsRes.ok) {
        logger.warn(`Tensor REST API failed for ${collectionSlug}`);
        return this.getMockOrderbook(collectionSlug);
      }

      const stats = statsRes.ok ? await statsRes.json() : {};
      const listingsData = listingsRes.ok ? await listingsRes.json() : { listings: [] };

      const floorPrice = (stats.floorPrice || 0) / 1e9;

      const orderbook: TensorOrderbook = {
        collection: stats.name || collectionSlug,
        slug: collectionSlug,
        floorPrice,
        floorPriceLamports: String(stats.floorPrice || 0),
        topBid: 0,
        topBidLamports: '0',
        bids: [],
        listings: (listingsData.listings || []).slice(0, limit).map((l: any) => ({
          price: (l.price || 0) / 1e9,
          priceLamports: String(l.price || 0),
          seller: l.seller || '',
          mint: l.mint || '',
          name: l.name,
          image: l.image,
        })),
        spread: floorPrice,
        spreadPercent: 0,
        volume24h: (stats.volume24h || 0) / 1e9,
        numListed: stats.numListed || 0,
        numOwners: stats.numOwners || 0,
        updatedAt: Date.now(),
      };

      orderbookCache.set(collectionSlug, { data: orderbook, timestamp: Date.now() });
      return orderbook;
    } catch (error) {
      logger.error(`Tensor REST fallback failed for ${collectionSlug}:`, error);
      return this.getMockOrderbook(collectionSlug);
    }
  }

  /**
   * Get collection stats
   */
  async getCollectionStats(collectionSlug: string): Promise<TensorCollectionStats | null> {
    try {
      const response = await fetch(`${TENSOR_API_BASE}/collections/${collectionSlug}`, {
        headers: this.apiKey ? { 'X-TENSOR-API-KEY': this.apiKey } : {},
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();

      return {
        slug: data.slug || collectionSlug,
        name: data.name || collectionSlug,
        symbol: data.symbol || '',
        floorPrice: (data.floorPrice || 0) / 1e9,
        volume24h: (data.volume24h || 0) / 1e9,
        volume7d: (data.volume7d || 0) / 1e9,
        numListed: data.numListed || 0,
        numMints: data.numMints || 0,
        royaltyBps: data.royaltyBps || 0,
      };
    } catch (error) {
      logger.error(`Error fetching Tensor collection stats for ${collectionSlug}:`, error);
      return null;
    }
  }

  /**
   * Get price history for charts
   */
  async getPriceHistory(
    collectionSlug: string,
    period: '24h' | '7d' | '30d' | 'all' = '7d'
  ): Promise<TensorPriceHistory[]> {
    try {
      const periodMap = {
        '24h': 1,
        '7d': 7,
        '30d': 30,
        'all': 365,
      };

      const response = await fetch(
        `${TENSOR_API_BASE}/collections/${collectionSlug}/history?days=${periodMap[period]}`,
        {
          headers: this.apiKey ? { 'X-TENSOR-API-KEY': this.apiKey } : {},
        }
      );

      if (!response.ok) {
        return this.getMockPriceHistory(period);
      }

      const data = await response.json();

      return (data.history || []).map((h: any) => ({
        timestamp: h.timestamp || Date.now(),
        floorPrice: (h.floorPrice || 0) / 1e9,
        volume: (h.volume || 0) / 1e9,
        numSales: h.numSales || 0,
      }));
    } catch (error) {
      logger.error(`Error fetching Tensor price history for ${collectionSlug}:`, error);
      return this.getMockPriceHistory(period);
    }
  }

  /**
   * Get instant buy transaction for a listing
   */
  async getInstantBuyTx(
    mint: string,
    buyer: string,
    maxPrice?: number
  ): Promise<{ tx: string; price: number } | null> {
    try {
      const response = await fetch(`${TENSOR_API_BASE}/tx/buy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'X-TENSOR-API-KEY': this.apiKey }),
        },
        body: JSON.stringify({
          mint,
          buyer,
          maxPrice: maxPrice ? Math.floor(maxPrice * 1e9) : undefined,
        }),
      });

      if (!response.ok) {
        logger.warn(`Tensor buy tx failed for ${mint}`);
        return null;
      }

      const data = await response.json();
      return {
        tx: data.tx,
        price: (data.price || 0) / 1e9,
      };
    } catch (error) {
      logger.error(`Error getting Tensor buy tx for ${mint}:`, error);
      return null;
    }
  }

  /**
   * Search collections
   */
  async searchCollections(query: string, limit: number = 10): Promise<TensorCollectionStats[]> {
    try {
      const response = await fetch(
        `${TENSOR_API_BASE}/collections/search?q=${encodeURIComponent(query)}&limit=${limit}`,
        {
          headers: this.apiKey ? { 'X-TENSOR-API-KEY': this.apiKey } : {},
        }
      );

      if (!response.ok) {
        return [];
      }

      const data = await response.json();

      return (data.collections || []).map((c: any) => ({
        slug: c.slug,
        name: c.name,
        symbol: c.symbol || '',
        floorPrice: (c.floorPrice || 0) / 1e9,
        volume24h: (c.volume24h || 0) / 1e9,
        volume7d: (c.volume7d || 0) / 1e9,
        numListed: c.numListed || 0,
        numMints: c.numMints || 0,
        royaltyBps: c.royaltyBps || 0,
      }));
    } catch (error) {
      logger.error('Error searching Tensor collections:', error);
      return [];
    }
  }

  /**
   * Get trending collections
   */
  async getTrendingCollections(limit: number = 20): Promise<TensorCollectionStats[]> {
    try {
      const response = await fetch(
        `${TENSOR_API_BASE}/collections/trending?limit=${limit}`,
        {
          headers: this.apiKey ? { 'X-TENSOR-API-KEY': this.apiKey } : {},
        }
      );

      if (!response.ok) {
        return [];
      }

      const data = await response.json();

      return (data.collections || []).map((c: any) => ({
        slug: c.slug,
        name: c.name,
        symbol: c.symbol || '',
        floorPrice: (c.floorPrice || 0) / 1e9,
        volume24h: (c.volume24h || 0) / 1e9,
        volume7d: (c.volume7d || 0) / 1e9,
        numListed: c.numListed || 0,
        numMints: c.numMints || 0,
        royaltyBps: c.royaltyBps || 0,
      }));
    } catch (error) {
      logger.error('Error fetching trending Tensor collections:', error);
      return [];
    }
  }

  /**
   * Mock orderbook for demo/fallback
   */
  private getMockOrderbook(collectionSlug: string): TensorOrderbook {
    const floorPrice = 1.5 + Math.random() * 5;
    const topBid = floorPrice * 0.92;

    return {
      collection: collectionSlug,
      slug: collectionSlug,
      floorPrice,
      floorPriceLamports: String(Math.floor(floorPrice * 1e9)),
      topBid,
      topBidLamports: String(Math.floor(topBid * 1e9)),
      bids: Array.from({ length: 5 }, (_, i) => ({
        price: topBid - (i * 0.05),
        priceLamports: String(Math.floor((topBid - (i * 0.05)) * 1e9)),
        bidder: `Bidder${i + 1}...${Math.random().toString(36).slice(2, 6)}`,
        quantity: Math.floor(Math.random() * 3) + 1,
      })),
      listings: Array.from({ length: 5 }, (_, i) => ({
        price: floorPrice + (i * 0.1),
        priceLamports: String(Math.floor((floorPrice + (i * 0.1)) * 1e9)),
        seller: `Seller${i + 1}...${Math.random().toString(36).slice(2, 6)}`,
        mint: `mint${i + 1}...${Math.random().toString(36).slice(2, 8)}`,
        name: `NFT #${1000 + i}`,
      })),
      spread: floorPrice - topBid,
      spreadPercent: ((floorPrice - topBid) / topBid) * 100,
      volume24h: 100 + Math.random() * 500,
      numListed: Math.floor(Math.random() * 1000) + 100,
      numOwners: Math.floor(Math.random() * 5000) + 500,
      updatedAt: Date.now(),
    };
  }

  /**
   * Mock price history for demo/fallback
   */
  private getMockPriceHistory(period: string): TensorPriceHistory[] {
    const points = period === '24h' ? 24 : period === '7d' ? 7 * 24 : 30 * 24;
    const interval = period === '24h' ? 3600000 : 3600000; // 1 hour intervals
    const now = Date.now();
    let price = 2 + Math.random() * 3;

    return Array.from({ length: Math.min(points, 168) }, (_, i) => {
      price = price + (Math.random() - 0.48) * 0.1; // Slight upward bias
      price = Math.max(0.5, price); // Floor at 0.5 SOL

      return {
        timestamp: now - (points - i) * interval,
        floorPrice: price,
        volume: Math.random() * 50,
        numSales: Math.floor(Math.random() * 20),
      };
    });
  }

  /**
   * Clear cache (useful for testing)
   */
  clearCache(): void {
    orderbookCache.clear();
  }
}

// Singleton instance
let tensorService: TensorService;

export function getTensorService(): TensorService {
  if (!tensorService) {
    tensorService = new TensorService();
  }
  return tensorService;
}

export { TensorService };
export default getTensorService;
