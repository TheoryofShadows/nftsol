/**
 * 🏪 NFT Marketplace Service
 * Complete buy/sell/list functionality with Solana transactions
 */

import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { 
  getAssociatedTokenAddress, 
  createTransferInstruction,
  TOKEN_PROGRAM_ID
} from '@solana/spl-token';
import { solanaConfig } from '../config';
import { pool } from '../lib/db';

interface ListNFTParams {
  mintAddress: string;
  seller: string;
  price: number; // In SOL
}

interface BuyNFTParams {
  mintAddress: string;
  buyer: string;
  seller: string;
  price: number; // In SOL
}

interface MarketplaceListing {
  id: number;
  mint_address: string;
  seller: string;
  price: number;
  listed: boolean;
  listed_at: Date;
}

export class MarketplaceService {
  private connection: Connection;

  constructor() {
    this.connection = new Connection(solanaConfig.rpcUrl, solanaConfig.commitment);
  }

  /**
   * List NFT for sale
   */
  async listNFT(params: ListNFTParams): Promise<{ success: boolean; listing?: MarketplaceListing; error?: string }> {
    const { mintAddress, seller, price } = params;

    try {
      // Verify NFT ownership (check if seller owns the NFT)
      const mintPubkey = new PublicKey(mintAddress);
      const sellerPubkey = new PublicKey(seller);

      // Get token account
      const tokenAccount = await getAssociatedTokenAddress(
        mintPubkey,
        sellerPubkey
      );

      const tokenAccountInfo = await this.connection.getAccountInfo(tokenAccount);
      if (!tokenAccountInfo) {
        return { success: false, error: 'Seller does not own this NFT' };
      }

      // Update database
      const result = await pool.query(
        `INSERT INTO nft_listings (mint_address, seller, price, listed, listed_at)
         VALUES ($1, $2, $3, true, NOW())
         ON CONFLICT (mint_address) 
         DO UPDATE SET seller = $2, price = $3, listed = true, listed_at = NOW()
         RETURNING *`,
        [mintAddress, seller, price]
      );

      return {
        success: true,
        listing: result.rows[0]
      };
    } catch (error) {
      console.error('[Marketplace] List NFT error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list NFT'
      };
    }
  }

  /**
   * Delist NFT from marketplace
   */
  async delistNFT(mintAddress: string, seller: string): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await pool.query(
        `UPDATE nft_listings 
         SET listed = false 
         WHERE mint_address = $1 AND seller = $2
         RETURNING *`,
        [mintAddress, seller]
      );

      if (result.rows.length === 0) {
        return { success: false, error: 'Listing not found' };
      }

      return { success: true };
    } catch (error) {
      console.error('[Marketplace] Delist NFT error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delist NFT'
      };
    }
  }

  /**
   * Get all active listings
   */
  async getActiveListings(limit = 50, offset = 0): Promise<{ success: boolean; listings?: MarketplaceListing[]; total?: number; error?: string }> {
    try {
      const result = await pool.query(
        `SELECT * FROM nft_listings 
         WHERE listed = true 
         ORDER BY listed_at DESC 
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );

      const countResult = await pool.query(
        `SELECT COUNT(*) FROM nft_listings WHERE listed = true`
      );

      return {
        success: true,
        listings: result.rows,
        total: parseInt(countResult.rows[0].count)
      };
    } catch (error) {
      console.error('[Marketplace] Get listings error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get listings'
      };
    }
  }

  /**
   * Get listing by mint address
   */
  async getListing(mintAddress: string): Promise<{ success: boolean; listing?: MarketplaceListing; error?: string }> {
    try {
      const result = await pool.query(
        `SELECT * FROM nft_listings WHERE mint_address = $1 AND listed = true`,
        [mintAddress]
      );

      if (result.rows.length === 0) {
        return { success: false, error: 'Listing not found' };
      }

      return {
        success: true,
        listing: result.rows[0]
      };
    } catch (error) {
      console.error('[Marketplace] Get listing error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get listing'
      };
    }
  }

  /**
   * Create buy transaction (to be signed by buyer)
   * Returns unsigned transaction that buyer needs to sign
   */
  async createBuyTransaction(params: BuyNFTParams): Promise<{ 
    success: boolean; 
    transaction?: string; // Base64 encoded transaction
    error?: string 
  }> {
    const { mintAddress, buyer, seller, price } = params;

    try {
      const mintPubkey = new PublicKey(mintAddress);
      const buyerPubkey = new PublicKey(buyer);
      const sellerPubkey = new PublicKey(seller);

      // Get latest blockhash
      const { blockhash } = await this.connection.getLatestBlockhash('finalized');

      // Create transaction
      const transaction = new Transaction();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = buyerPubkey;

      // 1. Transfer SOL from buyer to seller (95% of price)
      const sellerAmount = Math.floor(price * 0.95 * LAMPORTS_PER_SOL);
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: buyerPubkey,
          toPubkey: sellerPubkey,
          lamports: sellerAmount,
        })
      );

      // 2. Platform fee (5% of price) - transfer to platform wallet if configured
      if (process.env.PLATFORM_WALLET_ADDRESS) {
        const platformPubkey = new PublicKey(process.env.PLATFORM_WALLET_ADDRESS);
        const platformFee = Math.floor(price * 0.05 * LAMPORTS_PER_SOL);
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: buyerPubkey,
            toPubkey: platformPubkey,
            lamports: platformFee,
          })
        );
      }

      // 3. Transfer NFT from seller to buyer
      const sellerTokenAccount = await getAssociatedTokenAddress(mintPubkey, sellerPubkey);
      const buyerTokenAccount = await getAssociatedTokenAddress(mintPubkey, buyerPubkey);

      transaction.add(
        createTransferInstruction(
          sellerTokenAccount,
          buyerTokenAccount,
          sellerPubkey,
          1, // NFTs have amount of 1
          [],
          TOKEN_PROGRAM_ID
        )
      );

      // Serialize transaction to base64
      const serialized = transaction.serialize({
        requireAllSignatures: false,
        verifySignatures: false,
      });

      return {
        success: true,
        transaction: serialized.toString('base64')
      };
    } catch (error) {
      console.error('[Marketplace] Create buy transaction error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create transaction'
      };
    }
  }

  /**
   * Record successful sale in database
   */
  async recordSale(params: BuyNFTParams & { signature: string }): Promise<{ success: boolean; error?: string }> {
    const { mintAddress, buyer, seller, price, signature } = params;

    try {
      // Update listing to sold
      await pool.query(
        `UPDATE nft_listings 
         SET listed = false 
         WHERE mint_address = $1`,
        [mintAddress]
      );

      // Record sale
      await pool.query(
        `INSERT INTO nft_sales (mint_address, seller, buyer, price, signature, sold_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [mintAddress, seller, buyer, price, signature]
      );

      // Update NFT owner
      await pool.query(
        `UPDATE nfts 
         SET owner = $1, price = $2, listed = false, status = 'sold'
         WHERE mint_address = $3`,
        [buyer, price, mintAddress]
      );

      return { success: true };
    } catch (error) {
      console.error('[Marketplace] Record sale error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to record sale'
      };
    }
  }

  /**
   * Get sales history
   */
  async getSalesHistory(limit = 20): Promise<{ success: boolean; sales?: any[]; error?: string }> {
    try {
      const result = await pool.query(
        `SELECT * FROM nft_sales 
         ORDER BY sold_at DESC 
         LIMIT $1`,
        [limit]
      );

      return {
        success: true,
        sales: result.rows
      };
    } catch (error) {
      console.error('[Marketplace] Get sales history error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get sales history'
      };
    }
  }

  /**
   * Get all listings with filters
   */
  async getAllListings(options: {
    page: number;
    limit: number;
    collection?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: string;
  }): Promise<{ items: any[]; total: number }> {
    try {
      const { page, limit, collection, minPrice, maxPrice, sortBy = 'recent' } = options;
      const offset = (page - 1) * limit;

      let query = `
        SELECT 
          l.id, l.mint_address, l.seller, l.price, l.listed_at, l.listed,
          n.name, n.image_url, n.description, n.collection_id
        FROM listings l
        LEFT JOIN nfts n ON l.mint_address = n.mint_address
        WHERE l.listed = true
      `;

      const params: any[] = [];
      let paramIndex = 1;

      if (collection) {
        query += ` AND n.collection_id = $${paramIndex}`;
        params.push(collection);
        paramIndex++;
      }

      if (minPrice !== undefined) {
        query += ` AND l.price >= $${paramIndex}`;
        params.push(minPrice);
        paramIndex++;
      }

      if (maxPrice !== undefined) {
        query += ` AND l.price <= $${paramIndex}`;
        params.push(maxPrice);
        paramIndex++;
      }

      // Sorting
      if (sortBy === 'price_asc') {
        query += ' ORDER BY l.price ASC';
      } else if (sortBy === 'price_desc') {
        query += ' ORDER BY l.price DESC';
      } else {
        query += ' ORDER BY l.listed_at DESC';
      }

      query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);

      // Get total count
      let countQuery = 'SELECT COUNT(*) FROM listings l LEFT JOIN nfts n ON l.mint_address = n.mint_address WHERE l.listed = true';
      const countParams: any[] = [];
      let countParamIndex = 1;

      if (collection) {
        countQuery += ` AND n.collection_id = $${countParamIndex}`;
        countParams.push(collection);
        countParamIndex++;
      }

      if (minPrice !== undefined) {
        countQuery += ` AND l.price >= $${countParamIndex}`;
        countParams.push(minPrice);
        countParamIndex++;
      }

      if (maxPrice !== undefined) {
        countQuery += ` AND l.price <= $${countParamIndex}`;
        countParams.push(maxPrice);
      }

      const countResult = await pool.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0]?.count || '0', 10);

      return {
        items: result.rows,
        total,
      };
    } catch (error) {
      console.error('[Marketplace] Error getting all listings:', error);
      return { items: [], total: 0 };
    }
  }

  /**
   * Get all collections with stats
   */
  async getAllCollections(): Promise<any[]> {
    try {
      const query = `
        SELECT 
          c.id, c.name, c.description, c.image_url, c.verified,
          COUNT(DISTINCT n.id) as total_nfts,
          COUNT(DISTINCT l.id) as listed_count,
          MIN(l.price) as floor_price,
          SUM(CASE WHEN s.created_at >= NOW() - INTERVAL '24 hours' THEN 1 ELSE 0 END) as sales_24h
        FROM collections c
        LEFT JOIN nfts n ON c.id = n.collection_id
        LEFT JOIN listings l ON n.mint_address = l.mint_address AND l.listed = true
        LEFT JOIN sales s ON n.mint_address = s.mint_address
        GROUP BY c.id, c.name, c.description, c.image_url, c.verified
        ORDER BY c.verified DESC, sales_24h DESC, total_nfts DESC
      `;

      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('[Marketplace] Error getting collections:', error);
      return [];
    }
  }

  /**
   * Search NFTs by name or description
   */
  async searchNFTs(query: string, options: { page: number; limit: number }): Promise<{ items: any[]; total: number }> {
    try {
      const { page, limit } = options;
      const offset = (page - 1) * limit;

      const searchQuery = `
        SELECT 
          n.id, n.mint_address, n.name, n.description, n.image_url, n.owner, n.collection_id,
          l.price, l.listed, l.seller
        FROM nfts n
        LEFT JOIN listings l ON n.mint_address = l.mint_address AND l.listed = true
        WHERE 
          n.name ILIKE $1 OR 
          n.description ILIKE $1
        ORDER BY 
          CASE WHEN l.listed = true THEN 0 ELSE 1 END,
          n.created_at DESC
        LIMIT $2 OFFSET $3
      `;

      const searchPattern = `%${query}%`;
      const result = await pool.query(searchQuery, [searchPattern, limit, offset]);

      // Get total count
      const countQuery = `
        SELECT COUNT(*) 
        FROM nfts n
        WHERE n.name ILIKE $1 OR n.description ILIKE $1
      `;
      const countResult = await pool.query(countQuery, [searchPattern]);
      const total = parseInt(countResult.rows[0]?.count || '0', 10);

      return {
        items: result.rows,
        total,
      };
    } catch (error) {
      console.error('[Marketplace] Error searching NFTs:', error);
      return { items: [], total: 0 };
    }
  }

  /**
   * Get trending NFTs (most views/sales in last 24h)
   */
  async getTrendingNFTs(limit: number): Promise<any[]> {
    try {
      const query = `
        SELECT 
          n.id, n.mint_address, n.name, n.description, n.image_url, n.owner, n.collection_id,
          l.price, l.listed, l.seller,
          COUNT(DISTINCT s.id) as sales_count,
          COUNT(DISTINCT nv.id) as view_count
        FROM nfts n
        LEFT JOIN listings l ON n.mint_address = l.mint_address AND l.listed = true
        LEFT JOIN sales s ON n.mint_address = s.mint_address AND s.created_at >= NOW() - INTERVAL '24 hours'
        LEFT JOIN nft_views nv ON n.mint_address = nv.mint_address AND nv.viewed_at >= NOW() - INTERVAL '24 hours'
        GROUP BY n.id, n.mint_address, n.name, n.description, n.image_url, n.owner, n.collection_id, l.price, l.listed, l.seller
        HAVING COUNT(DISTINCT s.id) > 0 OR COUNT(DISTINCT nv.id) > 0
        ORDER BY (COUNT(DISTINCT s.id) * 3 + COUNT(DISTINCT nv.id)) DESC
        LIMIT $1
      `;

      const result = await pool.query(query, [limit]);
      return result.rows;
    } catch (error) {
      console.error('[Marketplace] Error getting trending NFTs:', error);
      // Return empty array if nft_views table doesn't exist yet
      return [];
    }
  }

  /**
   * Get featured NFTs (high quality/verified collections)
   */
  async getFeaturedNFTs(limit: number): Promise<any[]> {
    try {
      const query = `
        SELECT 
          n.id, n.mint_address, n.name, n.description, n.image_url, n.owner, n.collection_id,
          l.price, l.listed, l.seller,
          c.verified
        FROM nfts n
        LEFT JOIN listings l ON n.mint_address = l.mint_address AND l.listed = true
        LEFT JOIN collections c ON n.collection_id = c.id
        WHERE c.verified = true AND l.listed = true
        ORDER BY l.listed_at DESC
        LIMIT $1
      `;

      const result = await pool.query(query, [limit]);
      return result.rows;
    } catch (error) {
      console.error('[Marketplace] Error getting featured NFTs:', error);
      return [];
    }
  }
}

export const marketplaceService = new MarketplaceService();

