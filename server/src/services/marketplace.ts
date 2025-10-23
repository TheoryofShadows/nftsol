import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { db } from '../db';
import { nfts, nftTransactions } from '../schema';
import { eq, and, SQL } from 'drizzle-orm';

export class MarketplaceService {
  private connection: Connection;

  constructor() {
    this.connection = new Connection(process.env.HELIUS_RPC_URL || 'https://api.devnet.solana.com');
  }

  async listNFT(mintAddress: string, price: number, sellerWallet: string) {
    try {
      // Verify ownership
      const [nft] = await db
        .select()
        .from(nfts)
        .where(and(
          eq(nfts.mintAddress, mintAddress),
          eq(nfts.owner, sellerWallet)
        ));

      if (!nft) {
        throw new Error('NFT not found or not owned by seller');
      }

      // Update NFT status
      const [updatedNFT] = await db
        .update(nfts)
        .set({
          price: price.toString(),
          status: 'listed',
          listedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(nfts.mintAddress, mintAddress))
        .returning();

      return {
        success: true,
        nft: updatedNFT
      };

    } catch (error) {
      console.error('Failed to list NFT:', error);
      throw error;
    }
  }

  async buyNFT(mintAddress: string, buyerWallet: string, price: number) {
    try {
      // Get NFT details
      const [nft] = await db
        .select()
        .from(nfts)
        .where(and(
          eq(nfts.mintAddress, mintAddress),
          eq(nfts.status, 'listed')
        ));

      if (!nft) {
        throw new Error('NFT not found or not for sale');
      }

      // Simulate the purchase (you'll implement real Solana transaction here)
      const transactionSignature = `tx_${Date.now()}`;

      // Update NFT ownership
      const [updatedNFT] = await db
        .update(nfts)
        .set({
          owner: buyerWallet,
          status: 'sold',
          soldAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(nfts.mintAddress, mintAddress))
        .returning();

      // Record transaction
      await db.insert(nftTransactions).values({
        nftId: nft.id,
        mintAddress,
        fromWallet: nft.owner,
        toWallet: buyerWallet,
        transactionType: 'sale',
        price: price.toString(),
        platformFee: (price * 0.025).toString(), // 2.5% platform fee
        creatorRoyalty: (price * 0.025).toString(), // 2.5% creator royalty
        signature: transactionSignature,
        blockTime: new Date()
      });

      return {
        success: true,
        nft: updatedNFT,
        signature: transactionSignature
      };

    } catch (error) {
      console.error('Failed to buy NFT:', error);
      throw error;
    }
  }

  async getNFTs(filters: {
    owner?: string;
    status?: string;
    collection?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    try {
      const conditions: SQL[] = [];
      
      if (filters.owner) {
        conditions.push(eq(nfts.owner, filters.owner));
      }

      if (filters.status) {
        conditions.push(eq(nfts.status, filters.status));
      }

      if (filters.collection) {
        conditions.push(eq(nfts.collection, filters.collection));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      
      const results = await db
        .select()
        .from(nfts)
        .where(whereClause)
        .limit(filters.limit || 50)
        .offset(filters.offset || 0);

      return results;

    } catch (error) {
      console.error('Failed to get NFTs:', error);
      throw error;
    }
  }
}
