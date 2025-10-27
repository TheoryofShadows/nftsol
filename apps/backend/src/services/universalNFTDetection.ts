/**
 * 🌐 Universal NFT Detection Service - 2026 Standards
 * Detects and aggregates NFTs from all Solana platforms using Metaplex v3 and DAS API
 */

import { Connection, PublicKey, ParsedAccountData } from '@solana/web3.js';
import { getAccount, getAssociatedTokenAddress } from '@solana/spl-token';
import { getHeliusConfig } from '../config/environment';
import { MetaplexService, NFT2026Metadata as DASAsset } from './metaplexService';

export interface UniversalNFT {
  mint: string;
  name: string;
  description: string;
  image: string;
  collection: string;
  owner: string;
  price?: number;
  status: 'listed' | 'available' | 'sold';
  platform: 'nftsol' | 'magic-eden' | 'opensea' | 'metaplex' | 'compressed' | 'unknown';
  metadata: any;
  attributes?: any[];
  rarity?: number;
  lastUpdated: number;
  compressed?: boolean;
  royalty?: number;
  creators?: Array<{ address: string; share: number; verified: boolean }>;
  verified?: boolean;
  animation_url?: string;
  external_url?: string;
  youtube_url?: string;
  properties?: {
    files: Array<{ uri: string; type: string; cdn?: boolean }>;
    category: 'image' | 'video' | 'audio' | '3d' | 'html';
  };
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
}

export class UniversalNFTDetectionService {
  private connection: Connection;
  private heliusConfig: any;
  private metaplexService: MetaplexService;

  constructor() {
    this.heliusConfig = getHeliusConfig();
    this.connection = new Connection(this.heliusConfig.rpcUrl, 'confirmed');
    this.metaplexService = new MetaplexService();
  }

  /**
   * Get all NFTs for a wallet across all platforms using DAS API
   */
  async getAllNFTsForWallet(walletAddress: string): Promise<UniversalNFT[]> {
    console.log(`🔍 Detecting NFTs for wallet: ${walletAddress} using DAS API`);
    
    const allNFTs: UniversalNFT[] = [];
    
    try {
      // Get NFTs from all platforms in parallel
      const [
        nftsolNFTs,
        magicEdenNFTs,
        dasAssets
      ] = await Promise.allSettled([
        this.getNFTSolNFTs(walletAddress),
        this.getMagicEdenNFTs(walletAddress),
        this.getDASAssets(walletAddress)
      ]);

      // Combine results
      if (nftsolNFTs.status === 'fulfilled') {
        allNFTs.push(...nftsolNFTs.value);
      }
      if (magicEdenNFTs.status === 'fulfilled') {
        allNFTs.push(...magicEdenNFTs.value);
      }
      if (dasAssets.status === 'fulfilled') {
        allNFTs.push(...dasAssets.value);
      }

      // Remove duplicates based on mint address
      const uniqueNFTs = this.removeDuplicates(allNFTs);
      
      console.log(`✅ Found ${uniqueNFTs.length} unique NFTs across all platforms`);
      console.log(`📊 Platform breakdown:`, this.getPlatformBreakdown(uniqueNFTs));
      return uniqueNFTs;
      
    } catch (error) {
      console.error('❌ Error detecting NFTs:', error);
      throw new Error(`Failed to detect NFTs: ${error}`);
    }
  }

  /**
   * Get NFTs from NFTSol platform
   */
  private async getNFTSolNFTs(walletAddress: string): Promise<UniversalNFT[]> {
    try {
      // Query NFTSol database for user's NFTs
      const response = await fetch(`${process.env.API_BASE || 'http://localhost:3000'}/api/nfts/user/${walletAddress}`);
      const data = await response.json();
      
      return data.nfts?.map((nft: any) => ({
        mint: nft.mint,
        name: nft.name,
        description: nft.description,
        image: nft.image,
        collection: nft.collection || 'Unknown Collection',
        owner: nft.owner,
        price: nft.price,
        status: nft.listed ? 'listed' as const : 'available' as const,
        platform: 'nftsol' as const,
        metadata: nft.metadata,
        attributes: nft.attributes,
        lastUpdated: Date.now()
      })) || [];
    } catch (error) {
      console.error('❌ Error fetching NFTSol NFTs:', error);
      return [];
    }
  }

  /**
   * Get NFTs from Magic Eden
   */
  private async getMagicEdenNFTs(walletAddress: string): Promise<UniversalNFT[]> {
    try {
      const magicEdenUrl = 'https://api-mainnet.magiceden.io/v2';
      const response = await fetch(`${magicEdenUrl}/wallets/${walletAddress}/tokens`);
      const data = await response.json();
      
      return data.tokens?.map((token: any) => ({
        mint: token.mint,
        name: token.name || 'Unknown',
        description: token.description || '',
        image: token.image || '',
        collection: token.collection || 'Unknown Collection',
        owner: walletAddress,
        price: token.price ? token.price / 1e9 : undefined,
        status: token.listed ? 'listed' as const : 'available' as const,
        platform: 'magic-eden' as const,
        metadata: token.metadata,
        attributes: token.attributes,
        lastUpdated: Date.now()
      })) || [];
    } catch (error) {
      console.error('❌ Error fetching Magic Eden NFTs:', error);
      return [];
    }
  }

  /**
   * Get NFTs using Helius DAS API (includes both regular and compressed NFTs)
   */
  private async getDASAssets(walletAddress: string): Promise<UniversalNFT[]> {
    try {
      console.log(`🔍 Fetching DAS assets for wallet: ${walletAddress}`);
      
      // Get all assets using DAS API
      const dasAssets = await this.metaplexService.getAssetsByOwner(walletAddress, 1000);
      
      // Convert DAS assets to Universal NFT format
      const nfts: UniversalNFT[] = dasAssets.map(asset => {
        const universalNFT = this.metaplexService.convertDASAssetToUniversalNFT(asset);
        
        // Add 2026 metadata fields
        const metadata = asset.content?.metadata || {};
        const files = asset.content?.files || [];
        
        return {
          ...universalNFT,
          animation_url: metadata.animation_url,
          external_url: metadata.external_url,
          youtube_url: metadata.youtube_url,
          properties: {
            files: files.map(file => ({
              uri: file.uri,
              type: file.mime,
              cdn: !!file.cdn_uri
            })),
            category: this.determineCategory(files)
          }
        };
      });

      console.log(`✅ Found ${nfts.length} DAS assets (${nfts.filter(n => n.compressed).length} compressed)`);
      return nfts;
    } catch (error) {
      console.error('❌ Error fetching DAS assets:', error);
      return [];
    }
  }

  /**
   * Determine content category based on files
   */
  private determineCategory(files: Array<{ mime: string }>): 'image' | 'video' | 'audio' | '3d' | 'html' {
    if (!files || files.length === 0) return 'image';
    
    const mimeTypes = files.map(f => f.mime);
    
    if (mimeTypes.some(m => m.startsWith('video/'))) return 'video';
    if (mimeTypes.some(m => m.startsWith('audio/'))) return 'audio';
    if (mimeTypes.some(m => m.includes('gltf') || m.includes('glb'))) return '3d';
    if (mimeTypes.some(m => m.includes('html'))) return 'html';
    
    return 'image';
  }

  /**
   * Get NFTs from cross-platform sources
   */
  private async getCrossPlatformNFTs(walletAddress: string): Promise<UniversalNFT[]> {
    try {
      // Use Helius API for comprehensive NFT detection
      const heliusUrl = `${this.heliusConfig.restUrl}getAssetsByOwner`;
      const response = await fetch(heliusUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.heliusConfig.apiKey}`
        },
        body: JSON.stringify({
          ownerAddress: walletAddress,
          page: 1,
          limit: 1000
        })
      });

      const data = await response.json();
      
      return data.items?.map((item: any) => ({
        mint: item.id,
        name: item.content?.metadata?.name || 'Unknown',
        description: item.content?.metadata?.description || '',
        image: item.content?.files?.[0]?.uri || '',
        collection: item.grouping?.[0]?.group_value || 'Unknown Collection',
        owner: walletAddress,
        status: 'available' as const,
        platform: 'unknown' as const,
        metadata: item,
        attributes: item.content?.metadata?.attributes,
        lastUpdated: Date.now()
      })) || [];
    } catch (error) {
      console.error('❌ Error fetching cross-platform NFTs:', error);
      return [];
    }
  }

  /**
   * Get NFT metadata
   */
  private async getNFTMetadata(mintAddress: PublicKey): Promise<any> {
    try {
      // Get metadata account
      const [metadataPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('metadata'),
          new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s').toBuffer(),
          mintAddress.toBuffer(),
        ],
        new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s')
      );

      const accountInfo = await this.connection.getAccountInfo(metadataPDA);
      if (!accountInfo) return {};

      // Parse metadata (simplified)
      const data = accountInfo.data;
      const nameLength = data.readUInt32LE(4);
      const name = data.slice(4, 4 + nameLength).toString();
      const symbolLength = data.readUInt32LE(4 + nameLength);
      const symbol = data.slice(4 + nameLength, 4 + nameLength + symbolLength).toString();
      const uriLength = data.readUInt32LE(4 + nameLength + symbolLength);
      const uri = data.slice(4 + nameLength + symbolLength, 4 + nameLength + symbolLength + uriLength).toString();

      return {
        name,
        symbol,
        uri,
        // Additional metadata would be fetched from the URI
      };
    } catch (error) {
      console.error('❌ Error getting NFT metadata:', error);
      return {};
    }
  }

  /**
   * Remove duplicate NFTs based on mint address
   */
  private removeDuplicates(nfts: UniversalNFT[]): UniversalNFT[] {
    const seen = new Set();
    return nfts.filter(nft => {
      if (seen.has(nft.mint)) {
        return false;
      }
      seen.add(nft.mint);
      return true;
    });
  }

  /**
   * Get platform breakdown for analytics
   */
  private getPlatformBreakdown(nfts: UniversalNFT[]): Record<string, number> {
    const breakdown: Record<string, number> = {};
    nfts.forEach(nft => {
      breakdown[nft.platform] = (breakdown[nft.platform] || 0) + 1;
    });
    return breakdown;
  }

  /**
   * Get collection information using DAS API
   */
  async getCollectionInfo(collectionAddress: string): Promise<CollectionInfo | null> {
    try {
      console.log(`📊 Getting collection info for: ${collectionAddress}`);
      
      // Use MetaplexService to get collection info via DAS API
      const collectionInfo = await this.metaplexService.getCollectionInfo(collectionAddress);
      
      if (!collectionInfo) {
        console.log(`❌ Collection not found: ${collectionAddress}`);
        return null;
      }

      console.log(`✅ Collection info retrieved: ${collectionInfo.name}`);
      return collectionInfo;
    } catch (error) {
      console.error('❌ Error getting collection info:', error);
      return null;
    }
  }

  /**
   * Search NFTs across all platforms using DAS API
   */
  async searchNFTs(query: string, filters?: {
    collection?: string;
    minPrice?: number;
    maxPrice?: number;
    platform?: string;
    ownerAddress?: string;
  }): Promise<UniversalNFT[]> {
    try {
      console.log(`🔍 Searching NFTs with query: ${query}`);
      
      // Use DAS API for search
      const searchParams: any = {
        limit: 100
      };

      if (filters?.ownerAddress) {
        searchParams.ownerAddress = filters.ownerAddress;
      }

      if (filters?.collection) {
        searchParams.groupBy = 'collection';
        searchParams.groupValue = filters.collection;
      }

      const { items } = await this.metaplexService.searchAssets(searchParams);
      
      // Convert DAS assets to Universal NFT format
      const nfts: UniversalNFT[] = items.map(asset => {
        const universalNFT = this.metaplexService.convertDASAssetToUniversalNFT(asset);
        
        // Add 2026 metadata fields
        const metadata = asset.content?.metadata || {};
        const files = asset.content?.files || [];
        
        return {
          ...universalNFT,
          animation_url: metadata.animation_url,
          external_url: metadata.external_url,
          youtube_url: metadata.youtube_url,
          properties: {
            files: files.map(file => ({
              uri: file.uri,
              type: file.mime,
              cdn: !!file.cdn_uri
            })),
            category: this.determineCategory(files)
          }
        };
      });

      // Apply additional filters
      let filteredNFTs = nfts;

      if (filters?.platform) {
        filteredNFTs = filteredNFTs.filter(nft => nft.platform === filters.platform);
      }

      // Note: Price filtering would need marketplace integration
      // For now, we'll skip minPrice/maxPrice filtering

      console.log(`✅ Found ${filteredNFTs.length} NFTs matching search criteria`);
      return filteredNFTs;
    } catch (error) {
      console.error('❌ Error searching NFTs:', error);
      return [];
    }
  }
}
