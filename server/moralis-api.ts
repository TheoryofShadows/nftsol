
import Moralis from 'moralis';

type AccountNFTsResponse = Awaited<ReturnType<typeof Moralis.SolApi.account.getNFTs>>;
export type MoralisAccountNFT = AccountNFTsResponse['result'][number];

type PortfolioResponse = Awaited<ReturnType<typeof Moralis.SolApi.account.getPortfolio>>;
type MoralisPortfolio = PortfolioResponse['result'];
export type MoralisTokenBalance = MoralisPortfolio['tokens'][number];
export type MoralisPortfolioNFT = MoralisPortfolio['nfts'][number];

type NFTMetadataResponse = Awaited<ReturnType<typeof Moralis.SolApi.nft.getNFTMetadata>>;
export type MoralisNFTMetadata = NFTMetadataResponse['result'];

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

  async fetchWalletNFTs(walletAddress: string): Promise<MoralisAccountNFT[]> {
    try {
      await this.initialize();

      const response = await Moralis.SolApi.account.getNFTs({
        address: walletAddress,
        network: 'mainnet',
      });

      return response.result;
    } catch (error) {
      console.error('Moralis wallet NFTs fetch error:', error);
      return [];
    }
  }

  async fetchNFTMetadata(mintAddress: string): Promise<MoralisNFTMetadata | null> {
    try {
      await this.initialize();

      const response = await Moralis.SolApi.nft.getNFTMetadata({
        address: mintAddress,
        network: 'mainnet',
      });

      return response.result;
    } catch (error) {
      console.error('Moralis NFT metadata fetch error:', error);
      return null;
    }
  }

  async fetchTokenBalances(walletAddress: string): Promise<MoralisTokenBalance[]> {
    try {
      await this.initialize();

      const response = await Moralis.SolApi.account.getPortfolio({
        address: walletAddress,
        network: 'mainnet',
      });

      return response.result.tokens;
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
