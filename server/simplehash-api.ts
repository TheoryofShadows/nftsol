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

type SimpleHashCollectionResponse = {
  nfts?: SimpleHashNFT[];
};

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
            accept: 'application/json',
          },
        },
      );

      if (!response.ok) {
        throw new Error(`SimpleHash API error: ${response.status}`);
      }

      const data = (await response.json()) as SimpleHashCollectionResponse;
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
            accept: 'application/json',
          },
        },
      );

      if (!response.ok) {
        throw new Error(`SimpleHash API error: ${response.status}`);
      }

      return (await response.json()) as SimpleHashNFT;
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
            accept: 'application/json',
          },
        },
      );

      if (!response.ok) {
        throw new Error(`SimpleHash API error: ${response.status}`);
      }

      const data = (await response.json()) as SimpleHashCollectionResponse;
      return data.nfts || [];
    } catch (error) {
      console.error('SimpleHash wallet NFTs fetch error:', error);
      return [];
    }
  }

  async handleWebhook(webhookData: any) {
    try {
      const { event_type, data } = webhookData;

      switch (event_type) {
        case 'nft.transfer':
          console.log('NFT transferred:', data);
          break;
        case 'nft.sale':
          console.log('NFT sold:', data);
          break;
        case 'nft.listing':
          console.log('NFT listed:', data);
          break;
        default:
          console.log('Unhandled SimpleHash webhook event:', event_type);
      }
    } catch (error) {
      console.error('Webhook processing error:', error);
    }
  }
}

export const simpleHashService = new SimpleHashService();

