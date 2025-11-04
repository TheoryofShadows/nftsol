/**
 * 🌐 Cross-Platform NFT Marketplace Service
 * Aggregates listings from Magic Eden, Tensor, and local platform
 * Provides unified NFT marketplace data across Solana ecosystem
 */

import axios, { AxiosInstance } from 'axios';
import { pool } from '../lib/db';
import { heliusService } from './helius';

interface NFTListing {
  mintAddress: string;
  name: string;
  image: string;
  price: number; // in SOL
  seller: string;
  marketplace: 'local' | 'magic-eden' | 'tensor' | 'helius';
  listingUrl?: string;
  collection?: string;
  compressed?: boolean;
}

interface MagicEdenListing {
  mintAddress: string;
  price: number;
  seller: string;
  tokenMint: string;
  collection?: string;
  img?: string;
  name?: string;
}

interface TensorListing {
  mint: string;
  price: number;
  owner: string;
  collection?: {
    slug: string;
    name: string;
  };
}

export class CrossPlatformMarketplaceService {
  private magicEdenClient: AxiosInstance;
  private tensorClient: AxiosInstance;
  private cache: Map<string, { data: NFTListing[]; timestamp: number }>;
  private CACHE_TTL = 60000; // 1 minute

  constructor() {
    this.magicEdenClient = axios.create({
      baseURL: 'https://api-mainnet.magiceden.dev/v2',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.tensorClient = axios.create({
      baseURL: 'https://api.tensor.so/graphql',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.cache = new Map();
    console.log('[CrossPlatform] Marketplace service initialized');
  }

  /**
   * Get all listings from all platforms (local + Magic Eden + Tensor)
   */
  async getAllListings(options?: {
    limit?: number;
    minPrice?: number;
    maxPrice?: number;
    collection?: string;
  }): Promise<{ success: boolean; listings?: NFTListing[]; total?: number; error?: string }> {
    try {
      console.log('[CrossPlatform] Fetching listings from all platforms...');

      // Check cache first
      const cacheKey = JSON.stringify(options || {});
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        console.log('[CrossPlatform] Returning cached listings');
        return {
          success: true,
          listings: cached.data,
          total: cached.data.length,
        };
      }

      // Fetch from all platforms in parallel
      const [localListings, magicEdenListings, tensorListings] = await Promise.allSettled([
        this.getLocalListings(options),
        this.getMagicEdenListings(options),
        this.getTensorListings(options),
      ]);

      const allListings: NFTListing[] = [];

      // Add local listings
      if (localListings.status === 'fulfilled' && localListings.value.success) {
        allListings.push(...(localListings.value.listings || []));
        console.log(`[CrossPlatform] Added ${localListings.value.listings?.length || 0} local listings`);
      }

      // Add Magic Eden listings
      if (magicEdenListings.status === 'fulfilled' && magicEdenListings.value.success) {
        allListings.push(...(magicEdenListings.value.listings || []));
        console.log(`[CrossPlatform] Added ${magicEdenListings.value.listings?.length || 0} Magic Eden listings`);
      }

      // Add Tensor listings
      if (tensorListings.status === 'fulfilled' && tensorListings.value.success) {
        allListings.push(...(tensorListings.value.listings || []));
        console.log(`[CrossPlatform] Added ${tensorListings.value.listings?.length || 0} Tensor listings`);
      }

      // Remove duplicates (same mint address)
      const uniqueListings = this.deduplicateListings(allListings);

      // Apply filters
      let filteredListings = uniqueListings;

      if (options?.minPrice) {
        filteredListings = filteredListings.filter((l) => l.price >= options.minPrice!);
      }

      if (options?.maxPrice) {
        filteredListings = filteredListings.filter((l) => l.price <= options.maxPrice!);
      }

      if (options?.collection) {
        filteredListings = filteredListings.filter(
          (l) => l.collection?.toLowerCase().includes(options.collection!.toLowerCase())
        );
      }

      // Sort by price (lowest first)
      filteredListings.sort((a, b) => a.price - b.price);

      // Apply limit
      if (options?.limit) {
        filteredListings = filteredListings.slice(0, options.limit);
      }

      // Cache results
      this.cache.set(cacheKey, { data: filteredListings, timestamp: Date.now() });

      console.log(`[CrossPlatform] Total listings: ${filteredListings.length}`);

      return {
        success: true,
        listings: filteredListings,
        total: filteredListings.length,
      };
    } catch (error) {
      console.error('[CrossPlatform] Get all listings error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch listings',
      };
    }
  }

  /**
   * Get local platform listings
   */
  private async getLocalListings(options?: {
    limit?: number;
  }): Promise<{ success: boolean; listings?: NFTListing[]; error?: string }> {
    try {
      const limit = options?.limit || 1000;

      const result = await pool.query(
        `SELECT 
          n.id, n."mintAddress", n.name, n.description, n.image, n.owner, 
          n.collection, n.category, n.attributes, n.royalty, n.status,
          nl.price, nl.seller, nl.listed_at
        FROM nfts n
        INNER JOIN nft_listings nl ON n."mintAddress" = nl.mint_address
        WHERE nl.listed = true
        ORDER BY nl.listed_at DESC
        LIMIT $1`,
        [limit]
      );

      const listings: NFTListing[] = result.rows.map((row) => ({
        mintAddress: row.mintAddress,
        name: row.name || 'Unnamed NFT',
        image: row.image || '',
        price: parseFloat(row.price),
        seller: row.seller,
        marketplace: 'local',
        collection: row.collection,
        listingUrl: `https://nftsol.app/nft/${row.mintAddress}`,
        compressed: false,
      }));

      return {
        success: true,
        listings,
      };
    } catch (error) {
      console.error('[CrossPlatform] Get local listings error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch local listings',
      };
    }
  }

  /**
   * Get Magic Eden listings
   * NOTE: Magic Eden V2 API requires collection slug, so this fetches popular collections
   */
  private async getMagicEdenListings(options?: {
    limit?: number;
  }): Promise<{ success: boolean; listings?: NFTListing[]; error?: string }> {
    try {
      // Popular Solana collections to fetch
      const collections = ['degods', 'okay_bears', 'mad_lads', 'solana_monkey_business', 'claynosaurz'];
      const limit = options?.limit || 100;
      const perCollection = Math.ceil(limit / collections.length);

      const allListings: NFTListing[] = [];

      for (const collection of collections) {
        try {
          const response = await this.magicEdenClient.get(`/collections/${collection}/listings`, {
            params: { offset: 0, limit: perCollection },
          });

          if (response.data && Array.isArray(response.data)) {
            const listings: NFTListing[] = response.data.map((item: MagicEdenListing) => ({
              mintAddress: item.tokenMint || item.mintAddress,
              name: item.name || `${collection} NFT`,
              image: item.img || '',
              price: item.price / 1e9, // Convert lamports to SOL
              seller: item.seller,
              marketplace: 'magic-eden',
              collection: item.collection || collection,
              listingUrl: `https://magiceden.io/item-details/${item.tokenMint || item.mintAddress}`,
              compressed: false,
            }));

            allListings.push(...listings);
          }
        } catch (collectionError) {
          console.warn(`[CrossPlatform] Failed to fetch Magic Eden collection ${collection}:`, collectionError);
          // Continue with other collections
        }
      }

      return {
        success: true,
        listings: allListings.slice(0, limit),
      };
    } catch (error) {
      console.error('[CrossPlatform] Get Magic Eden listings error:', error);
      // Return empty instead of error (non-critical)
      return {
        success: true,
        listings: [],
      };
    }
  }

  /**
   * Get Tensor listings
   * NOTE: Tensor uses GraphQL API
   */
  private async getTensorListings(options?: {
    limit?: number;
  }): Promise<{ success: boolean; listings?: NFTListing[]; error?: string }> {
    try {
      // Tensor GraphQL query for active listings
      const query = `
        query GetListings($limit: Int!) {
          listings(limit: $limit, orderBy: PRICE_ASC) {
            mint
            price
            owner
            collection {
              slug
              name
            }
          }
        }
      `;

      const response = await this.tensorClient.post('', {
        query,
        variables: { limit: options?.limit || 100 },
      });

      if (response.data?.data?.listings) {
        const listings: NFTListing[] = response.data.data.listings.map((item: TensorListing) => ({
          mintAddress: item.mint,
          name: `${item.collection?.name || 'Tensor'} NFT`,
          image: '', // Tensor doesn't provide direct image URLs
          price: item.price / 1e9, // Convert lamports to SOL
          seller: item.owner,
          marketplace: 'tensor',
          collection: item.collection?.name,
          listingUrl: `https://www.tensor.trade/item/${item.mint}`,
          compressed: false,
        }));

        return {
          success: true,
          listings,
        };
      }

      return {
        success: true,
        listings: [],
      };
    } catch (error) {
      console.error('[CrossPlatform] Get Tensor listings error:', error);
      // Return empty instead of error (non-critical)
      return {
        success: true,
        listings: [],
      };
    }
  }

  /**
   * Deduplicate listings by mint address (keep lowest price)
   */
  private deduplicateListings(listings: NFTListing[]): NFTListing[] {
    const mintMap = new Map<string, NFTListing>();

    for (const listing of listings) {
      const existing = mintMap.get(listing.mintAddress);

      if (!existing || listing.price < existing.price) {
        mintMap.set(listing.mintAddress, listing);
      }
    }

    return Array.from(mintMap.values());
  }

  /**
   * Search NFTs across all platforms
   */
  async searchNFTs(query: string, options?: {
    limit?: number;
  }): Promise<{ success: boolean; results?: NFTListing[]; error?: string }> {
    try {
      const allListings = await this.getAllListings({ limit: 1000 });

      if (!allListings.success || !allListings.listings) {
        return allListings;
      }

      const lowerQuery = query.toLowerCase();

      const filtered = allListings.listings.filter(
        (listing) =>
          listing.name.toLowerCase().includes(lowerQuery) ||
          listing.collection?.toLowerCase().includes(lowerQuery) ||
          listing.mintAddress.toLowerCase().includes(lowerQuery)
      );

      const limited = options?.limit ? filtered.slice(0, options.limit) : filtered;

      return {
        success: true,
        results: limited,
      };
    } catch (error) {
      console.error('[CrossPlatform] Search NFTs error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Search failed',
      };
    }
  }

  /**
   * Clear cache (call this when listings are updated)
   */
  clearCache(): void {
    this.cache.clear();
    console.log('[CrossPlatform] Cache cleared');
  }
}

// Export singleton instance
export const crossPlatformMarketplace = new CrossPlatformMarketplaceService();

