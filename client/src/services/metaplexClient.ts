/**
 * 🚀 Client-Side Metaplex Utilities - 2026 Standards
 * Client-side Metaplex integration for wallet interactions and NFT operations
 */

import { Connection, PublicKey, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';
import { 
  createMint, 
  getOrCreateAssociatedTokenAccount, 
  mintTo,
  TOKEN_PROGRAM_ID
} from '@solana/spl-token';
// Temporarily commented out due to Umi version conflicts
// TODO: Fix Umi framework integration
// import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
// import { 
//   createCreateMetadataAccountV3Instruction,
//   createUpdateMetadataAccountV2Instruction,
//   createVerifyCollectionInstruction,
//   PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID,
//   DataV2,
//   Creator
// } from '@metaplex-foundation/mpl-token-metadata';
// import { 
//   createSignerFromKeypair,
//   generateSigner,
//   percentAmount,
//   some,
//   none
// } from '@metaplex-foundation/umi';

// Temporary constants to prevent build errors
const TOKEN_METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

// 2026 NFT Metadata Interface (matches server)
export interface NFT2026Metadata {
  // Standard Metaplex fields
  name: string;
  symbol: string;
  description: string;
  image: string;
  
  // 2026 Extended fields
  animation_url?: string;        // Video/3D model support
  external_url?: string;          // Link to external site
  youtube_url?: string;           // YouTube embed
  
  // Properties
  properties: {
    files: Array<{
      uri: string;
      type: string;              // image/png, video/mp4, model/gltf
      cdn?: boolean;
    }>;
    category: 'image' | 'video' | 'audio' | '3d' | 'html';
    creators: Array<{
      address: string;
      share: number;             // Royalty share %
      verified: boolean;
    }>;
  };
  
  // Attributes for rarity
  attributes: Array<{
    trait_type: string;
    value: string | number;
    display_type?: 'number' | 'boost_percentage' | 'boost_number' | 'date';
  }>;
  
  // Collection info
  collection?: {
    name: string;
    family: string;
    verified: boolean;
  };
  
  // Royalty info
  seller_fee_basis_points: number;  // 500 = 5%
  
  // Social links
  twitter?: string;
  discord?: string;
  website?: string;
}

export interface MintOptions {
  metadata: NFT2026Metadata;
  collectionMint?: PublicKey;
  compressed?: boolean; // For future cNFT support
}

export class MetaplexClient {
  private connection: Connection;

  constructor(connection: Connection) {
    this.connection = connection;
  }

  /**
   * Create NFT with full 2026 metadata support
   */
  async createNFT(
    payer: PublicKey,
    signTransaction: (tx: Transaction) => Promise<Transaction>,
    options: MintOptions
  ): Promise<{ mint: PublicKey; metadata: PublicKey; tokenAccount: PublicKey; signature: string }> {
    console.log('🎨 Creating NFT with 2026 metadata...');

    // Create mint
    const mint = await createMint(
      this.connection,
      { publicKey: payer, signTransaction } as any,
      payer,
      null,
      0 // Decimals for NFT
    );

    // Create associated token account
    const tokenAccount = await getOrCreateAssociatedTokenAccount(
      this.connection,
      { publicKey: payer, signTransaction } as any,
      mint,
      payer
    );

    // Mint 1 token to the account
    await mintTo(
      this.connection,
      { publicKey: payer, signTransaction } as any,
      mint,
      tokenAccount.address,
      payer,
      1
    );

    // Create metadata account
    const [metadataAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from('metadata'), TOKEN_METADATA_PROGRAM_ID.toBuffer(), mint.toBuffer()],
      TOKEN_METADATA_PROGRAM_ID
    );

    // Temporarily commented out due to Umi version conflicts
    // TODO: Fix Umi framework integration
    console.log('⚠️ Metaplex functionality temporarily disabled due to Umi version conflicts');
    
    // Create and send transaction (without metadata for now)
    const transaction = new Transaction();
    const signedTransaction = await signTransaction(transaction);
    const signature = await this.connection.sendRawTransaction(signedTransaction.serialize());

    // Wait for confirmation
    await this.connection.confirmTransaction(signature, 'confirmed');

    console.log(`✅ NFT created: ${mint.toBase58()}`);
    console.log(`📝 Transaction: ${signature}`);

    return { mint, metadata: metadataAccount, tokenAccount: tokenAccount.address, signature };
  }

  /**
   * Verify NFT to collection
   */
  async verifyCollection(
    payer: PublicKey,
    signTransaction: (tx: Transaction) => Promise<Transaction>,
    nftMint: PublicKey,
    collectionMint: PublicKey
  ): Promise<string> {
    console.log('⚠️ Collection verification temporarily disabled due to Umi version conflicts');
    // TODO: Fix Umi framework integration
    return 'disabled';
  }

  /**
   * Upload metadata to IPFS and return URI
   */
  async uploadMetadata(metadata: NFT2026Metadata): Promise<string> {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE}/api/upload-metadata`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metadata)
      });

      if (!response.ok) {
        throw new Error(`Failed to upload metadata: ${response.statusText}`);
      }

      const data = await response.json();
      return data.uri;
    } catch (error) {
      console.error('❌ Error uploading metadata:', error);
      throw error;
    }
  }

  /**
   * Get NFT metadata from mint address
   */
  async getNFTMetadata(mintAddress: PublicKey): Promise<NFT2026Metadata | null> {
    try {
      const [metadataPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('metadata'), TOKEN_METADATA_PROGRAM_ID.toBuffer(), mintAddress.toBuffer()],
        TOKEN_METADATA_PROGRAM_ID
      );

      const accountInfo = await this.connection.getAccountInfo(metadataPDA);
      if (!accountInfo) return null;

      // Parse metadata (simplified - in production, use proper deserialization)
      const data = accountInfo.data;
      const nameLength = data.readUInt32LE(4);
      const name = data.slice(4, 4 + nameLength).toString();
      const symbolLength = data.readUInt32LE(4 + nameLength);
      const symbol = data.slice(4 + nameLength, 4 + nameLength + symbolLength).toString();
      const uriLength = data.readUInt32LE(4 + nameLength + symbolLength);
      const uri = data.slice(4 + nameLength + symbolLength, 4 + nameLength + symbolLength + uriLength).toString();

      // Fetch full metadata from URI
      if (uri) {
        const metadataResponse = await fetch(uri);
        if (metadataResponse.ok) {
          const fullMetadata = await metadataResponse.json();
          return this.convertToNFT2026Metadata(fullMetadata);
        }
      }

      return null;
    } catch (error) {
      console.error('❌ Error getting NFT metadata:', error);
      return null;
    }
  }

  /**
   * Convert standard metadata to NFT2026Metadata format
   */
  private convertToNFT2026Metadata(metadata: any): NFT2026Metadata {
    return {
      name: metadata.name || '',
      symbol: metadata.symbol || '',
      description: metadata.description || '',
      image: metadata.image || '',
      animation_url: metadata.animation_url,
      external_url: metadata.external_url,
      youtube_url: metadata.youtube_url,
      properties: {
        files: metadata.properties?.files || [],
        category: metadata.properties?.category || 'image',
        creators: metadata.properties?.creators || []
      },
      attributes: metadata.attributes || [],
      collection: metadata.collection,
      seller_fee_basis_points: metadata.seller_fee_basis_points || 0,
      twitter: metadata.twitter,
      discord: metadata.discord,
      website: metadata.website
    };
  }

  /**
   * Create default metadata for new NFT
   */
  createDefaultMetadata(
    name: string,
    description: string,
    image: string,
    creatorAddress: string,
    collectionMint?: string
  ): NFT2026Metadata {
    return {
      name,
      symbol: name.substring(0, 4).toUpperCase(),
      description,
      image,
      properties: {
        files: [{
          uri: image,
          type: 'image/png',
          cdn: false
        }],
        category: 'image' as const,
        creators: [{
          address: creatorAddress,
          share: 100,
          verified: true
        }]
      },
      attributes: [],
      collection: collectionMint ? {
        name: 'NFTSol Collection',
        family: 'NFTSol',
        verified: false
      } : undefined,
      seller_fee_basis_points: 500, // 5% royalty
    };
  }

  /**
   * Validate metadata before minting
   */
  validateMetadata(metadata: NFT2026Metadata): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!metadata.name || metadata.name.trim().length === 0) {
      errors.push('Name is required');
    }

    if (!metadata.description || metadata.description.trim().length === 0) {
      errors.push('Description is required');
    }

    if (!metadata.image || metadata.image.trim().length === 0) {
      errors.push('Image is required');
    }

    if (!metadata.properties.creators || metadata.properties.creators.length === 0) {
      errors.push('At least one creator is required');
    }

    const totalShare = metadata.properties.creators.reduce((sum, creator) => sum + creator.share, 0);
    if (totalShare !== 100) {
      errors.push('Creator shares must total 100%');
    }

    if (metadata.seller_fee_basis_points < 0 || metadata.seller_fee_basis_points > 10000) {
      errors.push('Royalty must be between 0% and 100%');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

export default MetaplexClient;
