
import fetch from 'node-fetch';

interface QuickNodeNFT {
  mint: string;
  name: string;
  symbol: string;
  description: string;
  image: string;
  attributes: Array<{ trait_type: string; value: string | number }>;
  collection: {
    name: string;
    verified: boolean;
  };
  owner: string;
  price?: number;
}

interface QuickNodeNFTListResponse {
  result?: {
    nfts: QuickNodeNFT[];
  };
}

interface QuickNodeNFTResponse {
  result?: QuickNodeNFT;
}

class QuickNodeNFTService {
  private apiKey: string;
  private endpoint: string;

  constructor() {
    this.apiKey = process.env.QUICKNODE_API_KEY || '';
    this.endpoint = process.env.QUICKNODE_ENDPOINT || 'https://api.quicknode.com/v1/solana/mainnet';
  }

  async fetchNFTsByCollection(collection: string, limit: number = 50): Promise<QuickNodeNFT[]> {
    try {
      const query = new URLSearchParams({ limit: limit.toString() });
      const response = await fetch(
        `${this.endpoint}/nft/collection/${collection}?${query.toString()}`,
        {
          method: 'GET',
          headers: {
            'X-API-KEY': this.apiKey,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`QuickNode API error: ${response.status}`);
      }

      const data = (await response.json()) as QuickNodeNFTListResponse;
      return data.result?.nfts || [];
    } catch (error) {
      console.error('QuickNode NFT fetch error:', error);
      return [];
    }
  }

  async fetchNFTMetadata(mintAddress: string): Promise<QuickNodeNFT | null> {
    try {
      const response = await fetch(`${this.endpoint}/nft/${mintAddress}`, {
        method: 'GET',
        headers: {
          'X-API-KEY': this.apiKey,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`QuickNode API error: ${response.status}`);
      }

      const data = (await response.json()) as QuickNodeNFTResponse;
      return data.result || null;
    } catch (error) {
      console.error('QuickNode metadata fetch error:', error);
      return null;
    }
  }

  async fetchWalletNFTs(walletAddress: string): Promise<QuickNodeNFT[]> {
    try {
      const response = await fetch(`${this.endpoint}/wallet/${walletAddress}/nfts`, {
        method: 'GET',
        headers: {
          'X-API-KEY': this.apiKey,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`QuickNode API error: ${response.status}`);
      }

      const data = (await response.json()) as QuickNodeNFTListResponse;
      return data.result?.nfts || [];
    } catch (error) {
      console.error('QuickNode wallet NFTs fetch error:', error);
      return [];
    }
  }
}

export const quickNodeService = new QuickNodeNFTService();
