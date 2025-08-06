
import Moralis from 'moralis';
import { EvmChain } from '@moralisweb3/common-evm-utils';

interface MoralisNFT {
  tokenAddress: string;
  tokenId: string;
  name: string;
  symbol: string;
  metadata: {
    name: string;
    description: string;
    image: string;
    attributes: Array<{ trait_type: string; value: string | number }>;
  };
  contractType: string;
  ownerOf: string;
  blockNumber: string;
  blockNumberMinted: string;
  tokenUri: string;
  amount: string;
}

class MoralisService {
  private initialized = false;

  async initialize() {
    if (!this.initialized) {
      await Moralis.start({
        apiKey: process.env.MORALIS_API_KEY || '',
      });
      this.initialized = true;
    }
  }

  async fetchWalletNFTs(walletAddress: string): Promise<MoralisNFT[]> {
    try {
      await this.initialize();

      const response = await Moralis.SolApi.account.getSPLs({
        address: walletAddress,
        network: 'mainnet',
      });

      return response.toJSON() as MoralisNFT[];
    } catch (error) {
      console.error('Moralis wallet NFTs fetch error:', error);
      return [];
    }
  }

  async fetchNFTMetadata(mintAddress: string): Promise<MoralisNFT | null> {
    try {
      await this.initialize();

      const response = await Moralis.SolApi.nft.getNFTMetadata({
        address: mintAddress,
        network: 'mainnet',
      });

      return response.toJSON() as MoralisNFT;
    } catch (error) {
      console.error('Moralis NFT metadata fetch error:', error);
      return null;
    }
  }

  async fetchTokenBalances(walletAddress: string) {
    try {
      await this.initialize();

      const response = await Moralis.SolApi.account.getSPLs({
        address: walletAddress,
        network: 'mainnet',
      });

      return response.toJSON();
    } catch (error) {
      console.error('Moralis token balances fetch error:', error);
      return [];
    }
  }

  async fetchTokenPrice(tokenAddress: string) {
    try {
      await this.initialize();

      const response = await Moralis.SolApi.token.getTokenPrice({
        address: tokenAddress,
        network: 'mainnet',
      });

      return response.toJSON();
    } catch (error) {
      console.error('Moralis token price fetch error:', error);
      return null;
    }
  }
}

export const moralisService = new MoralisService();
