import { Connection, PublicKey } from '@solana/web3.js';
import { getHeliusConfig } from '../config/environment';
import { getAssetsByOwner } from '../helius-api';

export interface UniversalNFT {
  mint: string;
  name: string;
  description: string;
  image: string;
  collection: string;
  owner: string;
  price?: number;
  status: 'available' | 'listed' | 'sold';
  source: 'platform' | 'helius' | 'magic-eden' | 'solana-rpc';
  metadata?: any;
  attributes?: any[];
}

export class CrossPlatformNFTService {
  private connection: Connection;
  private heliusConfig: any;

  constructor() {
    this.heliusConfig = getHeliusConfig();
    this.connection = new Connection(this.heliusConfig.rpcUrl, 'confirmed');
  }

  // Get ALL Solana NFTs from multiple sources
  async getAllSolanaNFTs(filters: {
    owner?: string;
    collection?: string;
    limit?: number;
    offset?: number;
    sources?: string[];
  } = {}): Promise<UniversalNFT[]> {
    try {
      const sources = filters.sources || ['platform', 'helius', 'magic-eden'];
      const limit = filters.limit || 50;
      const offset = filters.offset || 0;

      // Fetch from multiple sources in parallel
      const sourcePromises = sources.map(source => {
        switch (source) {
          case 'platform':
            return this.getPlatformNFTs(filters);
          case 'helius':
            return this.getHeliusNFTs(filters);
          case 'magic-eden':
            return this.getMagicEdenNFTs(filters);
          case 'solana-rpc':
            return this.getSolanaRPCNFTs(filters);
          default:
            return Promise.resolve([]);
        }
      });

      const results = await Promise.all(sourcePromises);
      
      // Merge and deduplicate NFTs
      const allNFTs = results.flat();
      const uniqueNFTs = this.deduplicateNFTs(allNFTs);
      
      // Apply pagination
      return uniqueNFTs.slice(offset, offset + limit);

    } catch (error) {
      console.error('Failed to fetch cross-platform NFTs:', error);
      return [];
    }
  }

  // Get NFTs from your platform database
  private async getPlatformNFTs(filters: any): Promise<UniversalNFT[]> {
    try {
      // This would query your database
      // For now, return empty array
      return [];
    } catch (error) {
      console.error('Failed to fetch platform NFTs:', error);
      return [];
    }
  }

  // Get NFTs from Helius API
  private async getHeliusNFTs(filters: any): Promise<UniversalNFT[]> {
    try {
      if (!filters.owner) return [];

      const heliusNFTs = await getAssetsByOwner(filters.owner);
      
      return heliusNFTs.map(nft => ({
        mint: nft.mint,
        name: nft.name,
        description: '',
        image: nft.image,
        collection: nft.collection,
        owner: filters.owner,
        status: 'available' as const,
        source: 'helius' as const,
        metadata: {},
        attributes: []
      }));

    } catch (error) {
      console.error('Failed to fetch Helius NFTs:', error);
      return [];
    }
  }

  // Get NFTs from Magic Eden API
  private async getMagicEdenNFTs(filters: any): Promise<UniversalNFT[]> {
    try {
      // Magic Eden API integration
      const magicEdenUrl = 'https://api-mainnet.magiceden.io/v2';
      const params = new URLSearchParams();
      
      if (filters.owner) {
        params.append('owner', filters.owner);
      }
      if (filters.collection) {
        params.append('collection', filters.collection);
      }
      if (filters.limit) {
        params.append('limit', filters.limit.toString());
      }

      const response = await fetch(`${magicEdenUrl}/wallets/${filters.owner}/tokens?${params}`);
      
      if (!response.ok) {
        throw new Error(`Magic Eden API error: ${response.status}`);
      }

      const data = await response.json();
      
      return data.tokens?.map((token: any) => ({
        mint: token.mint,
        name: token.name || 'Unknown',
        description: token.description || '',
        image: token.image || '',
        collection: token.collection || 'Unknown Collection',
        owner: filters.owner,
        price: token.price ? token.price / 1e9 : undefined, // Convert lamports to SOL
        status: token.listed ? 'listed' as const : 'available' as const,
        source: 'magic-eden' as const,
        metadata: token.metadata,
        attributes: token.attributes
      })) || [];

    } catch (error) {
      console.error('Failed to fetch Magic Eden NFTs:', error);
      return [];
    }
  }

  // Get NFTs directly from Solana RPC
  private async getSolanaRPCNFTs(filters: any): Promise<UniversalNFT[]> {
    try {
      if (!filters.owner) return [];

      const ownerPubkey = new PublicKey(filters.owner);
      
      // Get token accounts for the owner
      const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(
        ownerPubkey,
        { programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') }
      );

      const nfts: UniversalNFT[] = [];

      for (const account of tokenAccounts.value) {
        const tokenData = account.account.data.parsed.info;
        
        // Check if it's an NFT (amount = 1, decimals = 0)
        if (tokenData.tokenAmount.amount === '1' && tokenData.tokenAmount.decimals === 0) {
          try {
            // Get metadata for the NFT
            const metadata = await this.getNFTMetadata(new PublicKey(tokenData.mint));
            
            nfts.push({
              mint: tokenData.mint,
              name: metadata.name || 'Unknown NFT',
              description: metadata.description || '',
              image: metadata.image || '',
              collection: metadata.collection || 'Unknown Collection',
              owner: filters.owner,
              status: 'available' as const,
              source: 'solana-rpc' as const,
              metadata: metadata,
              attributes: metadata.attributes
            });
          } catch (metadataError) {
            console.warn(`Failed to get metadata for ${tokenData.mint}:`, metadataError);
          }
        }
      }

      return nfts;

    } catch (error) {
      console.error('Failed to fetch Solana RPC NFTs:', error);
      return [];
    }
  }

  // Get NFT metadata from blockchain
  private async getNFTMetadata(mint: PublicKey): Promise<any> {
    try {
      // This would fetch metadata from the blockchain
      // For now, return basic info
      return {
        name: `NFT ${mint.toBase58().slice(0, 8)}`,
        description: 'NFT from Solana blockchain',
        image: 'https://placehold.co/400x400?text=NFT',
        collection: 'Unknown Collection',
        attributes: []
      };
    } catch (error) {
      console.error('Failed to get NFT metadata:', error);
      return {};
    }
  }

  // Import external NFT to your platform
  async importExternalNFT(mintAddress: string, ownerWallet: string): Promise<{
    success: boolean;
    nft?: UniversalNFT;
    error?: string;
  }> {
    try {
      // 1. Verify ownership on blockchain
      const isOwner = await this.verifyOwnership(mintAddress, ownerWallet);
      if (!isOwner) {
        return { success: false, error: 'User does not own this NFT' };
      }

      // 2. Fetch NFT metadata
      const metadata = await this.getNFTMetadata(new PublicKey(mintAddress));
      
      // 3. Create UniversalNFT object
      const nft: UniversalNFT = {
        mint: mintAddress,
        name: metadata.name || 'Imported NFT',
        description: metadata.description || '',
        image: metadata.image || '',
        collection: metadata.collection || 'Imported Collection',
        owner: ownerWallet,
        status: 'available',
        source: 'platform',
        metadata: metadata,
        attributes: metadata.attributes || []
      };

      // 4. Add to your platform database
      // This would save to your database
      console.log('NFT imported to platform:', nft);

      return { success: true, nft };

    } catch (error: any) {
      console.error('Failed to import external NFT:', error);
      return { success: false, error: error.message };
    }
  }

  // Verify NFT ownership on blockchain
  private async verifyOwnership(mintAddress: string, ownerWallet: string): Promise<boolean> {
    try {
      const mint = new PublicKey(mintAddress);
      const owner = new PublicKey(ownerWallet);

      // Get token accounts for the owner
      const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(
        owner,
        { 
          programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
        }
      );

      // Check if any account holds this specific NFT
      for (const account of tokenAccounts.value) {
        const tokenData = account.account.data.parsed.info;
        if (tokenData.mint === mintAddress && tokenData.tokenAmount.amount === '1') {
          return true;
        }
      }

      return false;

    } catch (error) {
      console.error('Failed to verify ownership:', error);
      return false;
    }
  }

  // Deduplicate NFTs from multiple sources
  private deduplicateNFTs(nfts: UniversalNFT[]): UniversalNFT[] {
    const seen = new Set<string>();
    const unique: UniversalNFT[] = [];

    for (const nft of nfts) {
      if (!seen.has(nft.mint)) {
        seen.add(nft.mint);
        unique.push(nft);
      }
    }

    return unique;
  }

  // Search NFTs across all platforms
  async searchNFTs(query: string, filters: any = {}): Promise<UniversalNFT[]> {
    try {
      const allNFTs = await this.getAllSolanaNFTs(filters);
      
      // Simple text search (in production, use proper search indexing)
      return allNFTs.filter(nft => 
        nft.name.toLowerCase().includes(query.toLowerCase()) ||
        nft.description.toLowerCase().includes(query.toLowerCase()) ||
        nft.collection.toLowerCase().includes(query.toLowerCase())
      );

    } catch (error) {
      console.error('Failed to search NFTs:', error);
      return [];
    }
  }

  // Get trending NFTs across platforms
  async getTrendingNFTs(limit: number = 20): Promise<UniversalNFT[]> {
    try {
      // This would analyze trading volume, sales, etc.
      // For now, return a sample of NFTs
      const allNFTs = await this.getAllSolanaNFTs({ limit: 100 });
      
      // Simple "trending" algorithm (in production, use real metrics)
      return allNFTs
        .filter(nft => nft.status === 'listed')
        .sort((a, b) => (b.price || 0) - (a.price || 0))
        .slice(0, limit);

    } catch (error) {
      console.error('Failed to get trending NFTs:', error);
      return [];
    }
  }
}
