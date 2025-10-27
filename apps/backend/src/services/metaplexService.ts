/**
 * 🚀 Metaplex Service - DEPRECATED
 * This service is deprecated and replaced by UmiMetaplexService
 * All functionality has been moved to the modern Umi-based service
 */

import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { 
  createMint, 
  getOrCreateAssociatedTokenAccount, 
  mintTo,
  getAccount,
  TOKEN_PROGRAM_ID
} from '@solana/spl-token';
import { getHeliusConfig } from '../config/environment';
import { UmiMetaplexService, NFT2026Metadata } from './umiMetaplexService';

// Temporary constants for basic NFT operations
const TOKEN_METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

// 2026 NFT Metadata Interface (re-exported from UmiMetaplexService)
export interface NFT2026Metadata {
  name: string;
  symbol: string;
  description: string;
  image: string;
  external_url?: string;
  twitter?: string;
  discord?: string;
  properties: {
    files: Array<{
      uri: string;
      type: string;
      cdn?: boolean;
    }>;
    category: string;
    creators: Array<{
      address: string;
      share: number;
      verified: boolean;
    }>;
  };
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
  seller_fee_basis_points: number;
}

export interface CollectionInfo {
  name: string;
  symbol: string;
  description: string;
  image: string;
  external_url?: string;
  twitter?: string;
  discord?: string;
  collectionDetails?: any;
}

export class MetaplexService {
  private connection: Connection;
  private heliusConfig: any;
  private umiService: UmiMetaplexService;

  constructor() {
    this.heliusConfig = getHeliusConfig();
    this.connection = new Connection(this.heliusConfig.rpcUrl, 'confirmed');
    this.umiService = new UmiMetaplexService(this.connection, this.heliusConfig.rpcUrl);
    
    // Set up a default signer
    const defaultKeypair = Keypair.generate();
    this.umiService.setSigner(defaultKeypair);
  }

  /**
   * Create NFT with Umi framework (redirects to UmiMetaplexService)
   */
  async createNFT(
    payer: Keypair,
    metadata: NFT2026Metadata,
    collectionMint?: PublicKey
  ): Promise<{ mint: PublicKey; metadata: PublicKey; tokenAccount: PublicKey; signature: string }> {
    console.log('⚠️ Using deprecated MetaplexService - redirecting to UmiMetaplexService');
    
    // Redirect to Umi service
    return await this.umiService.createNFT(metadata, collectionMint);
  }

  /**
   * Create collection (simplified placeholder)
   */
  async createCollection(
    payer: Keypair,
    collectionData: CollectionInfo
  ): Promise<{ mint: PublicKey; metadata: PublicKey; masterEdition: PublicKey }> {
    console.log('⚠️ Collection creation not implemented in deprecated service');
    console.log('💡 Use UmiMetaplexService for full collection support');
    
    throw new Error('Collection creation not available in deprecated service. Use UmiMetaplexService instead.');
  }

  /**
   * Verify collection (simplified placeholder)
   */
  async verifyCollection(
    payer: Keypair,
    nftMint: PublicKey,
    collectionMint: PublicKey
  ): Promise<string> {
    console.log('⚠️ Collection verification not implemented in deprecated service');
    console.log('💡 Use UmiMetaplexService for full collection support');
    
    throw new Error('Collection verification not available in deprecated service. Use UmiMetaplexService instead.');
  }

  /**
   * Get NFT metadata (simplified implementation)
   */
  async getNFTMetadata(mintAddress: PublicKey): Promise<NFT2026Metadata | null> {
    try {
      const [metadataPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('metadata'), TOKEN_METADATA_PROGRAM_ID.toBuffer(), mintAddress.toBuffer()],
        TOKEN_METADATA_PROGRAM_ID
      );

      const accountInfo = await this.connection.getAccountInfo(metadataPDA);
      if (!accountInfo) return null;

      // Simplified metadata parsing
      // In production, use proper deserialization
      return {
        name: 'Unknown NFT',
        symbol: 'UNK',
        description: 'Metadata not available',
        image: '',
        properties: {
          files: [],
          category: 'image',
          creators: []
        },
        attributes: [],
        seller_fee_basis_points: 0
      };
    } catch (error) {
      console.error('Error fetching NFT metadata:', error);
      return null;
    }
  }

  /**
   * Get collection info (simplified placeholder)
   */
  async getCollectionInfo(collectionAddress: string): Promise<CollectionInfo | null> {
    console.log('⚠️ Collection info not implemented in deprecated service');
    console.log('💡 Use UmiMetaplexService for full collection support');
    
    return null;
  }

  /**
   * Upload metadata to IPFS (redirects to Umi service)
   */
  async uploadMetadata(metadata: NFT2026Metadata): Promise<string> {
    return await this.umiService.uploadMetadata(metadata);
  }
}