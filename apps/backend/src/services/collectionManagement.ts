/**
 * 🏗️ Collection Management Service
 * Tools for NFT projects to build and manage collections
 */

import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { getHeliusConfig } from '../config/environment';

export interface Collection {
  id: string;
  name: string;
  symbol: string;
  description: string;
  image: string;
  bannerImage?: string;
  website?: string;
  twitter?: string;
  discord?: string;
  creator: string;
  totalSupply: number;
  minted: number;
  floorPrice: number;
  volume24h: number;
  marketCap: number;
  verified: boolean;
  featured: boolean;
  createdAt: number;
  updatedAt: number;
  socialLinks: {
    website?: string;
    twitter?: string;
    discord?: string;
    telegram?: string;
    instagram?: string;
  };
  launchConfig: {
    launchDate?: number;
    price: number;
    currency: 'SOL' | 'CLOUT';
    maxPerWallet: number;
    whitelistRequired: boolean;
    timeCapsuleEnabled: boolean;
  };
  metadata: {
    attributes: any[];
    rarity: any;
    traits: any[];
  };
}

export interface CollectionLaunch {
  id: string;
  collectionId: string;
  launchDate: number;
  price: number;
  currency: 'SOL' | 'CLOUT';
  maxPerWallet: number;
  whitelistRequired: boolean;
  timeCapsuleEnabled: boolean;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  participants: string[];
  minted: number;
  maxSupply: number;
}

export interface BatchMintRequest {
  collectionId: string;
  assets: {
    name: string;
    description: string;
    image: string;
    attributes: any[];
    rarity: number;
  }[];
  metadata: {
    name: string;
    description: string;
    image: string;
    attributes: any[];
  };
}

export class CollectionManagementService {
  private connection: Connection;
  private heliusConfig: any;
  private collections: Map<string, Collection> = new Map();
  private launches: Map<string, CollectionLaunch> = new Map();

  constructor() {
    this.heliusConfig = getHeliusConfig();
    this.connection = new Connection(this.heliusConfig.rpcUrl, 'confirmed');
  }

  /**
   * Create a new collection
   */
  async createCollection(collectionData: {
    name: string;
    symbol: string;
    description: string;
    image: string;
    bannerImage?: string;
    creator: string;
    website?: string;
    twitter?: string;
    discord?: string;
    socialLinks?: {
      website?: string;
      twitter?: string;
      discord?: string;
      telegram?: string;
      instagram?: string;
    };
  }): Promise<Collection> {
    console.log(`🏗️ Creating collection: ${collectionData.name}`);
    
    const collectionId = this.generateCollectionId();
    const now = Date.now();
    
    const collection: Collection = {
      id: collectionId,
      name: collectionData.name,
      symbol: collectionData.symbol,
      description: collectionData.description,
      image: collectionData.image,
      bannerImage: collectionData.bannerImage,
      website: collectionData.website,
      twitter: collectionData.twitter,
      discord: collectionData.discord,
      creator: collectionData.creator,
      totalSupply: 0,
      minted: 0,
      floorPrice: 0,
      volume24h: 0,
      marketCap: 0,
      verified: false,
      featured: false,
      createdAt: now,
      updatedAt: now,
      socialLinks: collectionData.socialLinks || {},
      launchConfig: {
        price: 0,
        currency: 'SOL',
        maxPerWallet: 1,
        whitelistRequired: false,
        timeCapsuleEnabled: false
      },
      metadata: {
        attributes: [],
        rarity: {},
        traits: []
      }
    };
    
    this.collections.set(collectionId, collection);
    
    console.log(`✅ Collection created: ${collectionId}`);
    console.log(`👤 Creator: ${collectionData.creator}`);
    console.log(`📝 Name: ${collectionData.name}`);
    console.log(`🔖 Symbol: ${collectionData.symbol}`);
    
    return collection;
  }

  /**
   * Update collection information
   */
  async updateCollection(collectionId: string, updates: Partial<Collection>, requester: string): Promise<Collection> {
    console.log(`📝 Updating collection: ${collectionId}`);
    
    const collection = this.collections.get(collectionId);
    if (!collection) {
      throw new Error('Collection not found');
    }
    
    if (collection.creator !== requester) {
      throw new Error('Only the creator can update the collection');
    }
    
    // Update collection with new data
    const updatedCollection = {
      ...collection,
      ...updates,
      updatedAt: Date.now()
    };
    
    this.collections.set(collectionId, updatedCollection);
    
    console.log(`✅ Collection updated: ${collectionId}`);
    return updatedCollection;
  }

  /**
   * Configure collection launch
   */
  async configureLaunch(collectionId: string, launchConfig: {
    launchDate?: number;
    price: number;
    currency: 'SOL' | 'CLOUT';
    maxPerWallet: number;
    whitelistRequired: boolean;
    timeCapsuleEnabled: boolean;
  }, requester: string): Promise<CollectionLaunch> {
    console.log(`🚀 Configuring launch for collection: ${collectionId}`);
    
    const collection = this.collections.get(collectionId);
    if (!collection) {
      throw new Error('Collection not found');
    }
    
    if (collection.creator !== requester) {
      throw new Error('Only the creator can configure the launch');
    }
    
    const launchId = this.generateLaunchId();
    const now = Date.now();
    
    const launch: CollectionLaunch = {
      id: launchId,
      collectionId: collectionId,
      launchDate: launchConfig.launchDate || now,
      price: launchConfig.price,
      currency: launchConfig.currency,
      maxPerWallet: launchConfig.maxPerWallet,
      whitelistRequired: launchConfig.whitelistRequired,
      timeCapsuleEnabled: launchConfig.timeCapsuleEnabled,
      status: 'scheduled',
      participants: [],
      minted: 0,
      maxSupply: collection.totalSupply
    };
    
    // Update collection launch config
    collection.launchConfig = {
      launchDate: launchConfig.launchDate,
      price: launchConfig.price,
      currency: launchConfig.currency,
      maxPerWallet: launchConfig.maxPerWallet,
      whitelistRequired: launchConfig.whitelistRequired,
      timeCapsuleEnabled: launchConfig.timeCapsuleEnabled
    };
    
    this.launches.set(launchId, launch);
    this.collections.set(collectionId, collection);
    
    console.log(`✅ Launch configured: ${launchId}`);
    console.log(`📅 Launch date: ${new Date(launchConfig.launchDate || now).toISOString()}`);
    console.log(`💰 Price: ${launchConfig.price} ${launchConfig.currency}`);
    console.log(`👥 Max per wallet: ${launchConfig.maxPerWallet}`);
    console.log(`⏰ Time capsule enabled: ${launchConfig.timeCapsuleEnabled}`);
    
    return launch;
  }

  /**
   * Batch mint NFTs for a collection
   */
  async batchMintNFTs(collectionId: string, mintRequest: BatchMintRequest, requester: string): Promise<{
    success: boolean;
    minted: number;
    failed: number;
    errors: string[];
  }> {
    console.log(`🎨 Batch minting NFTs for collection: ${collectionId}`);
    
    const collection = this.collections.get(collectionId);
    if (!collection) {
      throw new Error('Collection not found');
    }
    
    if (collection.creator !== requester) {
      throw new Error('Only the creator can mint NFTs for the collection');
    }
    
    let minted = 0;
    let failed = 0;
    const errors: string[] = [];
    
    for (const asset of mintRequest.assets) {
      try {
        // Simulate NFT minting
        const nftId = this.generateNFTId();
        
        // Update collection stats
        collection.minted += 1;
        collection.updatedAt = Date.now();
        
        minted++;
        console.log(`✅ Minted NFT: ${nftId} for collection ${collectionId}`);
      } catch (error) {
        failed++;
        errors.push(`Failed to mint NFT: ${error}`);
        console.error(`❌ Failed to mint NFT for collection ${collectionId}:`, error);
      }
    }
    
    this.collections.set(collectionId, collection);
    
    console.log(`📊 Batch minting complete:`);
    console.log(`   ✅ Minted: ${minted}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   📝 Errors: ${errors.length}`);
    
    return {
      success: minted > 0,
      minted,
      failed,
      errors
    };
  }

  /**
   * Get collection by ID
   */
  async getCollection(collectionId: string): Promise<Collection | null> {
    const collection = this.collections.get(collectionId);
    return collection || null;
  }

  /**
   * Get collections by creator
   */
  async getCollectionsByCreator(creator: string): Promise<Collection[]> {
    const creatorCollections = Array.from(this.collections.values())
      .filter(collection => collection.creator === creator);
    
    console.log(`📋 Found ${creatorCollections.length} collections for creator ${creator}`);
    return creatorCollections;
  }

  /**
   * Get featured collections
   */
  async getFeaturedCollections(): Promise<Collection[]> {
    const featuredCollections = Array.from(this.collections.values())
      .filter(collection => collection.featured)
      .sort((a, b) => b.volume24h - a.volume24h);
    
    console.log(`⭐ Found ${featuredCollections.length} featured collections`);
    return featuredCollections;
  }

  /**
   * Get trending collections
   */
  async getTrendingCollections(): Promise<Collection[]> {
    const trendingCollections = Array.from(this.collections.values())
      .sort((a, b) => b.volume24h - a.volume24h)
      .slice(0, 20);
    
    console.log(`📈 Found ${trendingCollections.length} trending collections`);
    return trendingCollections;
  }

  /**
   * Search collections
   */
  async searchCollections(query: string, filters?: {
    verified?: boolean;
    featured?: boolean;
    minFloorPrice?: number;
    maxFloorPrice?: number;
  }): Promise<Collection[]> {
    let results = Array.from(this.collections.values());
    
    // Apply text search
    if (query) {
      const searchTerm = query.toLowerCase();
      results = results.filter(collection => 
        collection.name.toLowerCase().includes(searchTerm) ||
        collection.description.toLowerCase().includes(searchTerm) ||
        collection.symbol.toLowerCase().includes(searchTerm)
      );
    }
    
    // Apply filters
    if (filters?.verified !== undefined) {
      results = results.filter(collection => collection.verified === filters.verified);
    }
    
    if (filters?.featured !== undefined) {
      results = results.filter(collection => collection.featured === filters.featured);
    }
    
    if (filters?.minFloorPrice !== undefined) {
      results = results.filter(collection => collection.floorPrice >= filters.minFloorPrice!);
    }
    
    if (filters?.maxFloorPrice !== undefined) {
      results = results.filter(collection => collection.floorPrice <= filters.maxFloorPrice!);
    }
    
    console.log(`🔍 Found ${results.length} collections matching search criteria`);
    return results;
  }

  /**
   * Get collection statistics
   */
  async getCollectionStats(collectionId: string): Promise<{
    totalSupply: number;
    minted: number;
    floorPrice: number;
    volume24h: number;
    marketCap: number;
    holders: number;
    sales24h: number;
  }> {
    const collection = this.collections.get(collectionId);
    if (!collection) {
      throw new Error('Collection not found');
    }
    
    const stats = {
      totalSupply: collection.totalSupply,
      minted: collection.minted,
      floorPrice: collection.floorPrice,
      volume24h: collection.volume24h,
      marketCap: collection.marketCap,
      holders: 0, // Would be calculated from on-chain data
      sales24h: 0 // Would be calculated from transaction data
    };
    
    console.log(`📊 Collection stats for ${collectionId}:`, stats);
    return stats;
  }

  /**
   * Generate unique collection ID
   */
  private generateCollectionId(): string {
    return `col_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique launch ID
   */
  private generateLaunchId(): string {
    return `launch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique NFT ID
   */
  private generateNFTId(): string {
    return `nft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
