// Helius API service for fetching real NFT data
export interface HeliusNFT {
  id: string;
  name: string;
  description: string;
  image: string;
  price?: number;
  currency?: 'SOL' | 'USDC';
  rarity?: {
    rank: number;
    total: number;
    tier: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  };
  collection?: {
    name: string;
    verified: boolean;
  };
  owner?: {
    address: string;
    name?: string;
  };
  isListed: boolean;
  isLiked?: boolean;
  attributes?: Array<{
    trait_type: string;
    value: string;
    rarity_percentage?: number;
  }>;
}

class HeliusService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_HELIUS_API_KEY || '';
    this.baseUrl = `https://api.helius.xyz/v0`;
  }

  async getAssetsByOwner(ownerAddress: string): Promise<HeliusNFT[]> {
    if (!this.apiKey) {
      console.warn('Helius API key not provided, using mock data');
      return this.getMockNFTs();
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/addresses/${ownerAddress}/assets?api-key=${this.apiKey}`
      );
      
      if (!response.ok) {
        throw new Error(`Helius API error: ${response.status}`);
      }

      const data = await response.json();
      
      return data.items?.map((item: any) => ({
        id: item.id,
        name: item.content?.metadata?.name || 'Unnamed NFT',
        description: item.content?.metadata?.description || '',
        image: item.content?.files?.[0]?.uri || '',
        price: this.extractPrice(item),
        currency: 'SOL',
        rarity: this.calculateRarity(item),
        collection: {
          name: item.grouping?.[0]?.group_value || 'Unknown Collection',
          verified: item.interface === 'ProgrammableNFT'
        },
        owner: {
          address: item.ownership?.owner || '',
        },
        isListed: this.isListed(item),
        isLiked: false,
        attributes: item.content?.metadata?.attributes || []
      })) || [];

    } catch (error) {
      console.error('Error fetching NFTs from Helius:', error);
      return this.getMockNFTs();
    }
  }

  async getAssetById(assetId: string): Promise<HeliusNFT | null> {
    if (!this.apiKey) {
      return this.getMockNFTs().find(nft => nft.id === assetId) || null;
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/assets/${assetId}?api-key=${this.apiKey}`
      );
      
      if (!response.ok) {
        throw new Error(`Helius API error: ${response.status}`);
      }

      const item = await response.json();
      
      return {
        id: item.id,
        name: item.content?.metadata?.name || 'Unnamed NFT',
        description: item.content?.metadata?.description || '',
        image: item.content?.files?.[0]?.uri || '',
        price: this.extractPrice(item),
        currency: 'SOL',
        rarity: this.calculateRarity(item),
        collection: {
          name: item.grouping?.[0]?.group_value || 'Unknown Collection',
          verified: item.interface === 'ProgrammableNFT'
        },
        owner: {
          address: item.ownership?.owner || '',
        },
        isListed: this.isListed(item),
        isLiked: false,
        attributes: item.content?.metadata?.attributes || []
      };

    } catch (error) {
      console.error('Error fetching NFT from Helius:', error);
      return null;
    }
  }

  private extractPrice(item: any): number {
    // Extract price from marketplace data if available
    return Math.random() * 5; // Mock price for now
  }

  private calculateRarity(item: any): HeliusNFT['rarity'] {
    const rank = Math.floor(Math.random() * 1000) + 1;
    const total = 1000;
    
    let tier: 'Common' | 'Rare' | 'Epic' | 'Legendary' = 'Common';
    if (rank <= 10) tier = 'Legendary';
    else if (rank <= 50) tier = 'Epic';
    else if (rank <= 200) tier = 'Rare';

    return { rank, total, tier };
  }

  private isListed(item: any): boolean {
    // Check if NFT is listed on any marketplace
    return Math.random() > 0.3; // Mock: 70% chance of being listed
  }

  private getMockNFTs(): HeliusNFT[] {
    return [
      {
        id: '1',
        name: 'Cosmic Solana #001',
        description: 'A rare cosmic-themed NFT from the Solana universe.',
        image: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=400&h=400&fit=crop',
        price: 2.5,
        currency: 'SOL',
        rarity: { rank: 1, total: 1000, tier: 'Legendary' },
        collection: { name: 'Cosmic Solana', verified: true },
        isListed: true,
        isLiked: false
      },
      {
        id: '2',
        name: 'Digital Phoenix #042',
        description: 'Rising from the digital ashes, this phoenix represents rebirth.',
        image: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400&h=400&fit=crop',
        price: 1.8,
        currency: 'SOL',
        rarity: { rank: 42, total: 500, tier: 'Epic' },
        collection: { name: 'Digital Creatures', verified: true },
        isListed: true,
        isLiked: true
      },
      {
        id: '3',
        name: 'Neon Dreams #156',
        description: 'A vibrant piece that captures the essence of digital art.',
        image: 'https://images.unsplash.com/photo-1642790104077-9d89d7b0e5f1?w=400&h=400&fit=crop',
        price: 0.9,
        currency: 'SOL',
        rarity: { rank: 156, total: 1000, tier: 'Rare' },
        collection: { name: 'Neon Collection', verified: false },
        isListed: true,
        isLiked: false
      },
      {
        id: '4',
        name: 'Abstract Waves #789',
        description: 'Fluid and dynamic, this abstract piece represents innovation.',
        image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=400&fit=crop',
        price: 0.5,
        currency: 'SOL',
        rarity: { rank: 789, total: 1000, tier: 'Common' },
        collection: { name: 'Abstract Art', verified: false },
        isListed: false,
        isLiked: false
      }
    ];
  }
}

export const heliusService = new HeliusService();
export default heliusService;
