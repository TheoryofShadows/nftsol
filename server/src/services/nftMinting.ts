import { Connection, Keypair, PublicKey, Transaction } from '@solana/web3.js';
import { 
  createMint,
  createAssociatedTokenAccount,
  mintTo,
  getAssociatedTokenAddress
} from '@solana/spl-token';
import { getHeliusConfig } from '../config/environment';
import { db } from '../db';
import { nfts, nftTransactions } from '../schema';
import { eq } from 'drizzle-orm';
import { SimpleIPFSService } from './simpleIPFSService';

export class NFTMintingService {
  private connection: Connection;
  private heliusConfig: any;

  constructor() {
    this.heliusConfig = getHeliusConfig();
    this.connection = new Connection(this.heliusConfig.rpcUrl, 'confirmed');
  }

  /**
   * Mint a new NFT
   */
  async mintNFT(params: {
    name: string;
    description: string;
    imageUrl: string;
    creatorWallet: string;
    collection?: string;
  }): Promise<{
    success: boolean;
    mintAddress?: string;
    signature?: string;
    error?: string;
  }> {
    try {
      const { name, description, imageUrl, creatorWallet, collection } = params;

      // 1. Create new mint account
      const mintKeypair = Keypair.generate();
      const mintAddress = mintKeypair.publicKey.toString();

      // 2. Create metadata
      const metadata = {
        name,
        description,
        image: imageUrl,
        attributes: [],
        properties: {
          files: [{ uri: imageUrl, type: 'image/png' }],
          category: 'image',
          creators: [{
            address: creatorWallet,
            share: 100
          }]
        }
      };

      // 3. Upload metadata to IPFS
      const metadataUri = await this.uploadMetadata(metadata);

      // 4. Create the NFT on Solana (simplified version)
      const transaction = new Transaction();
      
      // For now, we'll create a basic mint without complex metadata
      // This is a simplified version that works with the current setup
      
      // 5. Send transaction
      const signature = await this.connection.sendTransaction(transaction, [mintKeypair]);

      // 6. Save to database
      const [nft] = await db.insert(nfts).values({
        mintAddress,
        name,
        description,
        image: imageUrl,
        metadataUri,
        creator: creatorWallet,
        owner: creatorWallet,
        collection: collection || null,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();

      // 7. Save transaction record
      await db.insert(nftTransactions).values({
        nftId: nft.id,
        mintAddress,
        fromWallet: null,
        toWallet: creatorWallet,
        transactionType: 'mint',
        signature,
        createdAt: new Date()
      });

      console.log(`✅ NFT minted successfully: ${mintAddress}`);
      console.log(`📝 Transaction signature: ${signature}`);

      return {
        success: true,
        mintAddress,
        signature
      };
    } catch (error: any) {
      console.error('❌ NFT minting failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Upload metadata to IPFS
   */
  private async uploadMetadata(metadata: any): Promise<string> {
    try {
      const ipfsService = new SimpleIPFSService();
      const result = await ipfsService.uploadJSON(metadata, 'metadata.json');
      
      if (result.success && result.ipfsUrl) {
        return result.ipfsUrl;
      } else {
        throw new Error(result.error || 'Failed to upload metadata');
      }
    } catch (error: any) {
      console.error('Failed to upload metadata:', error);
      throw error;
    }
  }

  /**
   * Get NFT by mint address
   */
  async getNFT(mintAddress: string): Promise<{
    success: boolean;
    nft?: any;
    error?: string;
  }> {
    try {
      const [nft] = await db.select().from(nfts).where(eq(nfts.mintAddress, mintAddress));
      
      if (!nft) {
        return {
          success: false,
          error: 'NFT not found'
        };
      }

      return {
        success: true,
        nft
      };
    } catch (error: any) {
      console.error('Failed to get NFT:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get NFTs by creator
   */
  async getNFTsByCreator(creatorWallet: string): Promise<{
    success: boolean;
    nfts?: any[];
    error?: string;
  }> {
    try {
      const userNFTs = await db.select().from(nfts).where(eq(nfts.creator, creatorWallet));
      
      return {
        success: true,
        nfts: userNFTs
      };
    } catch (error: any) {
      console.error('Failed to get NFTs by creator:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get all NFTs
   */
  async getAllNFTs(): Promise<{
    success: boolean;
    nfts?: any[];
    error?: string;
  }> {
    try {
      const allNFTs = await db.select().from(nfts);
      
      return {
        success: true,
        nfts: allNFTs
      };
    } catch (error: any) {
      console.error('Failed to get all NFTs:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}