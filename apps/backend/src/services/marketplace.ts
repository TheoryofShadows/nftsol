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
}

export const marketplaceService = new MarketplaceService();

