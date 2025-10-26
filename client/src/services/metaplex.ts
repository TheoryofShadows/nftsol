import { Metaplex } from '@metaplex-foundation/js';
import { Connection, PublicKey } from '@solana/web3.js';

// Types
export interface MintNFTParams {
  name: string;
  symbol: string;
  description: string;
  image: string;
  attributes?: Array<{
    trait_type: string;
    value: string;
  }>;
}

export interface MintResult {
  success: boolean;
  mintAddress?: string;
  transactionSignature?: string;
  error?: string;
}

class MetaplexService {
  private metaplex: Metaplex | null = null;
  private connection: Connection | null = null;

  constructor() {
    this.initializeConnection();
  }

  private initializeConnection() {
    // Use Helius or your preferred RPC endpoint
    const rpcUrl = import.meta.env.VITE_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
    this.connection = new Connection(rpcUrl, 'confirmed');
    this.metaplex = Metaplex.make(this.connection);
  }

  async mintNFT(
    walletPublicKey: PublicKey,
    params: MintNFTParams
  ): Promise<MintResult> {
    // For now, return mock data
    // Real implementation requires wallet adapter integration
    console.log('Mint NFT called with:', { walletPublicKey: walletPublicKey.toString(), params });
    
    return {
      success: false,
      error: 'Real minting not implemented yet. Connect wallet and implement signing.'
    };
  }

  async getNFTsByOwner(ownerAddress: PublicKey) {
    if (!this.metaplex) {
      throw new Error('Metaplex not initialized');
    }

    try {
      const nfts = await this.metaplex.nfts().findAllByOwner({
        owner: ownerAddress,
      });

      return nfts.map(nft => ({
        id: nft.address.toString(),
        name: nft.name,
        mintAddress: nft.address.toString(),
        updateAuthority: nft.updateAuthorityAddress.toString(),
      }));
    } catch (error) {
      console.error('Error fetching NFTs:', error);
      throw error;
    }
  }

  async getNFTByMintAddress(mintAddress: string) {
    if (!this.metaplex) {
      throw new Error('Metaplex not initialized');
    }

    try {
      const nft = await this.metaplex.nfts().findByMint({
        mintAddress: new PublicKey(mintAddress),
      });

      return {
        id: nft.address.toString(),
        name: nft.name,
        mintAddress: nft.address.toString(),
        updateAuthority: nft.updateAuthorityAddress.toString(),
      };
    } catch (error) {
      console.error('Error fetching NFT:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const metaplexService = new MetaplexService();
export default metaplexService;
