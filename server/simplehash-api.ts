
import fetch from 'node-fetch';

interface SimpleHashNFT {
  nft_id: string;
  chain: string;
  contract_address: string;
  token_id: string;
  name: string;
  description: string;
  image_url: string;
  metadata: {
    name: string;
    description: string;
    image: string;
    attributes: Array<{ trait_type: string; value: string | number }>;
  };
  collection: {
    name: string;
    verified: boolean;
    floor_price: number;
  };
  owners: Array<{ owner_address: string; quantity: number }>;
  rarity: {
    rank: number;
    score: number;
  };
  last_sale: {
    price: number;
    timestamp: string;
  };
}

class SimpleHashService {
  private apiKey: string;
  private baseUrl = 'https://api.simplehash.com/api/v0';

  constructor() {
    this.apiKey = process.env.SIMPLEHASH_API_KEY || '';
  }

  async fetchNFTsByCollection(contractAddress: string, limit: number = 50): Promise<SimpleHashNFT[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/nfts/solana/${contractAddress}?limit=${limit}`,
        {
          headers: {
            'X-API-KEY': this.apiKey,
            'accept': 'application/json',
          }
        }
      );

      if (!response.ok) {
        throw new Error(`SimpleHash API error: ${response.status}`);
      }

      const data = await response.json();
      return data.nfts || [];
    } catch (error) {
      console.error('SimpleHash collection fetch error:', error);
      return [];
    }
  }

  async fetchNFTMetadata(contractAddress: string, tokenId: string): Promise<SimpleHashNFT | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/nfts/solana/${contractAddress}/${tokenId}`,
        {
          headers: {
            'X-API-KEY': this.apiKey,
            'accept': 'application/json',
          }
        }
      );

      if (!response.ok) {
        throw new Error(`SimpleHash API error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('SimpleHash metadata fetch error:', error);
      return null;
    }
  }

  async fetchWalletNFTs(walletAddress: string): Promise<SimpleHashNFT[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/nfts/owners?chains=solana&wallet_addresses=${walletAddress}&limit=50`,
        {
          headers: {
            'X-API-KEY': this.apiKey,
            'accept': 'application/json',
          }
        }
      );

      if (!response.ok) {
        throw new Error(`SimpleHash API error: ${response.status}`);
      }

      const data = await response.json();
      return data.nfts || [];
    } catch (error) {
      console.error('SimpleHash wallet NFTs fetch error:', error);
      return [];
    }
  }

  // Webhook handler for real-time updates
  async handleWebhook(webhookData: any) {
    try {
      const { event_type, data } = webhookData;
      
      switch (event_type) {
        case 'nft.transfer':
          console.log('NFT transferred:', data);
          // Update ownership in your database
          break;
        case 'nft.sale':
          console.log('NFT sold:', data);
          // Update price history and market data
          break;
        case 'nft.listing':
          console.log('NFT listed:', data);
          // Update marketplace listings
          break;
      }
    } catch (error) {
      console.error('Webhook processing error:', error);
    }
  }
}

export const simpleHashService = new SimpleHashService();
