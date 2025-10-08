import Moralis from "moralis";
import { SolNative } from "@moralisweb3/common-sol-utils";
import type {
  GetNFTsResponse,
  GetNFTMetadataResponse,
  GetPortfolioResponse,
  GetTokenPriceOperationResponse,
} from "@moralisweb3/common-sol-utils";

class MoralisService {
  private initialized = false;

  async initialize() {
    if (!this.initialized) {
      await Moralis.start({
        apiKey: process.env.MORALIS_API_KEY || "",
      });
      this.initialized = true;
    }
  }

  async fetchWalletNFTs(walletAddress: string): Promise<GetNFTsResponse> {
    try {
      await this.initialize();

      const response = await Moralis.SolApi.account.getNFTs({
        address: walletAddress,
        network: "mainnet",
      });

      return response.result;
    } catch (error) {
      console.error("Moralis wallet NFTs fetch error:", error);
      return [];
    }
  }

  async fetchNFTMetadata(
    mintAddress: string,
  ): Promise<GetNFTMetadataResponse | null> {
    try {
      await this.initialize();

      const response = await Moralis.SolApi.nft.getNFTMetadata({
        address: mintAddress,
        network: "mainnet",
      });

      return response.result;
    } catch (error) {
      console.error("Moralis NFT metadata fetch error:", error);
      return null;
    }
  }

  async fetchTokenBalances(walletAddress: string): Promise<GetPortfolioResponse> {
    try {
      await this.initialize();

      const response = await Moralis.SolApi.account.getPortfolio({
        address: walletAddress,
        network: "mainnet",
      });

      return response.result;
    } catch (error) {
      console.error("Moralis token balances fetch error:", error);
      return { nativeBalance: SolNative.create(0), nfts: [], tokens: [] };
    }
  }

  async fetchTokenPrice(
    tokenAddress: string,
  ): Promise<GetTokenPriceOperationResponse | null> {
    try {
      await this.initialize();

      const response = await Moralis.SolApi.token.getTokenPrice({
        address: tokenAddress,
        network: "mainnet",
      });

      return response.result;
    } catch (error) {
      console.error("Moralis token price fetch error:", error);
      return null;
    }
  }
}

export const moralisService = new MoralisService();
