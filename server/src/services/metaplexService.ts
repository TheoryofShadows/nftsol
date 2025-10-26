/**
 * 🚀 Metaplex Service - 2026 Standards
 * Comprehensive Metaplex integration with Token Metadata v3, DAS API, and compressed NFTs
 */

import { Connection, PublicKey, Keypair, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';
import { 
  createMint, 
  getOrCreateAssociatedTokenAccount, 
  mintTo,
  getAccount,
  TOKEN_PROGRAM_ID
} from '@solana/spl-token';
import { 
  createCreateMetadataAccountV3Instruction,
  createUpdateMetadataAccountV2Instruction,
  createCreateCollectionInstruction,
  createVerifyCollectionInstruction,
  createSetCollectionSizeInstruction,
  PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID,
  DataV2,
  Collection,
  Creator,
  Uses,
  CollectionDetails
} from '@metaplex-foundation/mpl-token-metadata';
import { getHeliusConfig } from '../config/environment';

// 2026 NFT Metadata Interface
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

export interface CollectionInfo {
  name: string;
  symbol: string;
  description: string;
  image: string;
  totalSupply: number;
  floorPrice: number;
  volume24h: number;
  marketCap: number;
  verified: boolean;
  socialLinks: {
    website?: string;
    twitter?: string;
    discord?: string;
  };
  collectionDetails?: CollectionDetails;
}

export interface DASAsset {
  id: string;
  interface: 'V1_NFT' | 'V1_PRINT' | 'V1_EDITION' | 'LEGACY_NFT' | 'V2_NFT' | 'V2_PRINT' | 'V2_EDITION' | 'COMPRESSED_NFT';
  content?: {
    schema: string;
    json_uri: string;
    files?: Array<{
      uri: string;
      mime: string;
      cdn_uri?: string;
    }>;
    metadata: {
      name: string;
      symbol: string;
      description: string;
      attributes?: Array<{
        value: string | number;
        trait_type: string;
      }>;
    };
  };
  authorities?: Array<{
    address: string;
    scopes: string[];
  }>;
  compression?: {
    eligible: boolean;
    compressed: boolean;
    data_hash: string;
    creator_hash: string;
    asset_hash: string;
    tree: string;
    seq: number;
    leaf_id: number;
  };
  ownership: {
    frozen: boolean;
    delegated: boolean;
    delegate?: string;
    ownership_model: 'single' | 'token';
    owner: string;
  };
  supply?: {
    print_max_supply?: number;
    print_current_supply?: number;
    edition_nonce?: number;
  };
  mutable: boolean;
  burnt: boolean;
  token_info?: {
    symbol: string;
    balance: number;
    supply: number;
    decimals: number;
    token_program: string;
    associated_token_address: string;
  };
  grouping?: Array<{
    group_key: string;
    group_value: string;
  }>;
  royalty?: {
    royalty_model: 'creators' | 'fanout' | 'single';
    target?: string;
    percent: number;
    basis_points: number;
    primary_sale_happened: boolean;
    locked: boolean;
  };
  creators?: Array<{
    address: string;
    share: number;
    verified: boolean;
  }>;
  ownership_model: 'single' | 'token';
  delegate?: string;
}

export class MetaplexService {
  private connection: Connection;
  private heliusConfig: any;

  constructor() {
    this.heliusConfig = getHeliusConfig();
    this.connection = new Connection(this.heliusConfig.rpcUrl, 'confirmed');
  }

  /**
   * Create a collection NFT using Metaplex v3
   */
  async createCollection(
    payer: Keypair,
    collectionData: {
      name: string;
      symbol: string;
      description: string;
      image: string;
      externalUrl?: string;
      sellerFeeBasisPoints?: number;
      creators?: Array<{ address: string; share: number; verified: boolean }>;
    }
  ): Promise<{ mint: PublicKey; metadata: PublicKey; masterEdition: PublicKey }> {
    console.log('🏗️ Creating collection NFT...');

    // Create mint
    const mint = await createMint(
      this.connection,
      payer,
      payer.publicKey,
      null,
      0 // Decimals for NFT
    );

    // Create metadata account
    const [metadata] = PublicKey.findProgramAddressSync(
      [Buffer.from('metadata'), TOKEN_METADATA_PROGRAM_ID.toBuffer(), mint.toBuffer()],
      TOKEN_METADATA_PROGRAM_ID
    );

    // Create master edition account
    const [masterEdition] = PublicKey.findProgramAddressSync(
      [Buffer.from('metadata'), TOKEN_METADATA_PROGRAM_ID.toBuffer(), mint.toBuffer(), Buffer.from('edition')],
      TOKEN_METADATA_PROGRAM_ID
    );

    // Prepare metadata
    const metadataData: DataV2 = {
      name: collectionData.name,
      symbol: collectionData.symbol,
      uri: '', // Will be set after uploading to IPFS
      sellerFeeBasisPoints: collectionData.sellerFeeBasisPoints || 500, // 5%
      creators: collectionData.creators?.map(c => ({
        address: new PublicKey(c.address),
        verified: c.verified,
        share: c.share
      })) || [{
        address: payer.publicKey,
        verified: true,
        share: 100
      }],
      collection: null,
      uses: null
    };

    // Create metadata instruction
    const createMetadataInstruction = createCreateMetadataAccountV3Instruction(
      {
        metadata,
        mint,
        mintAuthority: payer.publicKey,
        payer: payer.publicKey,
        updateAuthority: payer.publicKey,
      },
      {
        createMetadataAccountArgsV3: {
          data: metadataData,
          isMutable: true,
          collectionDetails: null
        }
      }
    );

    // Create master edition instruction
    const createMasterEditionInstruction = createCreateCollectionInstruction({
      collection: mint,
      collectionAuthority: payer.publicKey,
      collectionMint: mint,
      collectionMetadata: metadata,
      collectionUpdateAuthority: payer.publicKey,
      payer: payer.publicKey,
    });

    // Execute transaction
    const transaction = new Transaction()
      .add(createMetadataInstruction)
      .add(createMasterEditionInstruction);

    const signature = await sendAndConfirmTransaction(
      this.connection,
      transaction,
      [payer],
      { commitment: 'confirmed' }
    );

    console.log(`✅ Collection created: ${mint.toBase58()}`);
    console.log(`📝 Transaction: ${signature}`);

    return { mint, metadata, masterEdition };
  }

  /**
   * Create NFT with full 2026 metadata support
   */
  async createNFT(
    payer: Keypair,
    metadata: NFT2026Metadata,
    collectionMint?: PublicKey
  ): Promise<{ mint: PublicKey; metadata: PublicKey; tokenAccount: PublicKey }> {
    console.log('🎨 Creating NFT with 2026 metadata...');

    // Create mint
    const mint = await createMint(
      this.connection,
      payer,
      payer.publicKey,
      null,
      0 // Decimals for NFT
    );

    // Create associated token account
    const tokenAccount = await getOrCreateAssociatedTokenAccount(
      this.connection,
      payer,
      mint,
      payer.publicKey
    );

    // Mint 1 token to the account
    await mintTo(
      this.connection,
      payer,
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

    // Prepare metadata for Metaplex
    const metadataData: DataV2 = {
      name: metadata.name,
      symbol: metadata.symbol,
      uri: '', // Will be set after uploading to IPFS
      sellerFeeBasisPoints: metadata.seller_fee_basis_points,
      creators: metadata.properties.creators.map(c => ({
        address: new PublicKey(c.address),
        verified: c.verified,
        share: c.share
      })),
      collection: collectionMint ? {
        key: collectionMint,
        verified: false // Will be verified separately
      } : null,
      uses: null
    };

    // Create metadata instruction
    const createMetadataInstruction = createCreateMetadataAccountV3Instruction(
      {
        metadata: metadataAccount,
        mint,
        mintAuthority: payer.publicKey,
        payer: payer.publicKey,
        updateAuthority: payer.publicKey,
      },
      {
        createMetadataAccountArgsV3: {
          data: metadataData,
          isMutable: true,
          collectionDetails: null
        }
      }
    );

    // Execute transaction
    const transaction = new Transaction().add(createMetadataInstruction);
    const signature = await sendAndConfirmTransaction(
      this.connection,
      transaction,
      [payer],
      { commitment: 'confirmed' }
    );

    console.log(`✅ NFT created: ${mint.toBase58()}`);
    console.log(`📝 Transaction: ${signature}`);

    return { mint, metadata: metadataAccount, tokenAccount: tokenAccount.address };
  }

  /**
   * Verify NFT to collection
   */
  async verifyCollection(
    payer: Keypair,
    nftMint: PublicKey,
    collectionMint: PublicKey
  ): Promise<string> {
    console.log('✅ Verifying NFT to collection...');

    const [nftMetadata] = PublicKey.findProgramAddressSync(
      [Buffer.from('metadata'), TOKEN_METADATA_PROGRAM_ID.toBuffer(), nftMint.toBuffer()],
      TOKEN_METADATA_PROGRAM_ID
    );

    const [collectionMetadata] = PublicKey.findProgramAddressSync(
      [Buffer.from('metadata'), TOKEN_METADATA_PROGRAM_ID.toBuffer(), collectionMint.toBuffer()],
      TOKEN_METADATA_PROGRAM_ID
    );

    const verifyInstruction = createVerifyCollectionInstruction({
      metadata: nftMetadata,
      collectionAuthority: payer.publicKey,
      collectionMint,
      collection: collectionMint,
      collectionMasterEditionAccount: collectionMint, // Simplified for now
      collectionMetadata,
    });

    const transaction = new Transaction().add(verifyInstruction);
    const signature = await sendAndConfirmTransaction(
      this.connection,
      transaction,
      [payer],
      { commitment: 'confirmed' }
    );

    console.log(`✅ Collection verified: ${signature}`);
    return signature;
  }

  /**
   * Get assets by owner using Helius DAS API
   */
  async getAssetsByOwner(ownerAddress: string, limit: number = 1000): Promise<DASAsset[]> {
    try {
      const response = await fetch(`${this.heliusConfig.restUrl}getAssetsByOwner`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.heliusConfig.apiKey}`
        },
        body: JSON.stringify({
          ownerAddress,
          page: 1,
          limit
        })
      });

      if (!response.ok) {
        throw new Error(`Helius API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.items || [];
    } catch (error) {
      console.error('❌ Error fetching assets by owner:', error);
      throw error;
    }
  }

  /**
   * Get single asset by ID using Helius DAS API
   */
  async getAsset(assetId: string): Promise<DASAsset | null> {
    try {
      const response = await fetch(`${this.heliusConfig.restUrl}getAsset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.heliusConfig.apiKey}`
        },
        body: JSON.stringify({ id: assetId })
      });

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`Helius API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ Error fetching asset:', error);
      throw error;
    }
  }

  /**
   * Search assets using Helius DAS API
   */
  async searchAssets(query: {
    ownerAddress?: string;
    creatorAddress?: string;
    groupBy?: string;
    groupValue?: string;
    limit?: number;
    page?: number;
  }): Promise<{ items: DASAsset[]; total: number }> {
    try {
      const response = await fetch(`${this.heliusConfig.restUrl}searchAssets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.heliusConfig.apiKey}`
        },
        body: JSON.stringify(query)
      });

      if (!response.ok) {
        throw new Error(`Helius API error: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        items: data.items || [],
        total: data.total || 0
      };
    } catch (error) {
      console.error('❌ Error searching assets:', error);
      throw error;
    }
  }

  /**
   * Convert DAS Asset to Universal NFT format
   */
  convertDASAssetToUniversalNFT(asset: DASAsset): any {
    const metadata = asset.content?.metadata || {};
    const grouping = asset.grouping?.[0];
    
    return {
      mint: asset.id,
      name: metadata.name || 'Unknown NFT',
      description: metadata.description || '',
      image: asset.content?.files?.[0]?.uri || '',
      collection: grouping?.group_value || 'Unknown Collection',
      owner: asset.ownership.owner,
      price: undefined, // Would need to check marketplace listings
      status: 'available' as const,
      platform: asset.interface === 'COMPRESSED_NFT' ? 'compressed' : 'metaplex',
      metadata: asset,
      attributes: metadata.attributes || [],
      rarity: this.calculateRarity(metadata.attributes || []),
      lastUpdated: Date.now(),
      compressed: asset.interface === 'COMPRESSED_NFT',
      royalty: asset.royalty?.basis_points || 0,
      creators: asset.creators || [],
      verified: asset.creators?.some(c => c.verified) || false
    };
  }

  /**
   * Calculate rarity score based on attributes
   */
  private calculateRarity(attributes: Array<{ trait_type: string; value: string | number }>): number {
    // Simple rarity calculation - in production, this would be more sophisticated
    if (!attributes || attributes.length === 0) return 0;
    
    const traitCount = attributes.length;
    const uniqueTraits = new Set(attributes.map(a => `${a.trait_type}:${a.value}`)).size;
    
    return Math.min(100, (uniqueTraits / traitCount) * 100);
  }

  /**
   * Get collection info using DAS API
   */
  async getCollectionInfo(collectionAddress: string): Promise<CollectionInfo | null> {
    try {
      // Search for assets in this collection
      const { items } = await this.searchAssets({
        groupBy: 'collection',
        groupValue: collectionAddress,
        limit: 1
      });

      if (items.length === 0) return null;

      const sampleAsset = items[0];
      const grouping = sampleAsset.grouping?.[0];
      
      // Get all assets in collection for stats
      const { items: allItems, total } = await this.searchAssets({
        groupBy: 'collection',
        groupValue: collectionAddress,
        limit: 1000
      });

      // Calculate floor price (simplified)
      const floorPrice = 0; // Would need marketplace integration
      const volume24h = 0; // Would need marketplace integration
      const marketCap = floorPrice * total;

      return {
        name: grouping?.group_value || 'Unknown Collection',
        symbol: sampleAsset.content?.metadata?.symbol || 'UNK',
        description: sampleAsset.content?.metadata?.description || '',
        image: sampleAsset.content?.files?.[0]?.uri || '',
        totalSupply: total,
        floorPrice,
        volume24h,
        marketCap,
        verified: sampleAsset.creators?.some(c => c.verified) || false,
        socialLinks: {
          website: sampleAsset.content?.metadata?.external_url,
          twitter: sampleAsset.content?.metadata?.twitter,
          discord: sampleAsset.content?.metadata?.discord
        }
      };
    } catch (error) {
      console.error('❌ Error getting collection info:', error);
      return null;
    }
  }
}

export default MetaplexService;
