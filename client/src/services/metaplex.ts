import { Metaplex, keypairIdentity, bundlrStorage } from '@metaplex-foundation/js';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { WalletContextState } from '@solana/wallet-adapter-react';

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
    
    this.metaplex = Metaplex.make(this.connection)
      .use(bundlrStorage({
        address: 'https://devnet.bundlr.network',
        providerUrl: rpcUrl,
        timeout: 60000,
      }));
  }

  async mintNFT(
    wallet: WalletContextState,
    params: MintNFTParams
  ): Promise<MintResult> {
    if (!this.metaplex || !wallet.publicKey) {
      return {
        success: false,
        error: 'Metaplex not initialized or wallet not connected'
      };
    }

    try {
      // Set the identity to the connected wallet
      this.metaplex.use(keypairIdentity(wallet as any));

      // Create the NFT metadata
      const { uri } = await this.metaplex.nfts().uploadMetadata({
        name: params.name,
        symbol: params.symbol,
        description: params.description,
        image: params.image,
        attributes: params.attributes || [],
        properties: {
          files: [
            {
              uri: params.image,
              type: 'image/png',
            },
          ],
          category: 'image',
        },
      });

      // Create the NFT
      const { nft, response } = await this.metaplex.nfts().create({
        uri,
        name: params.name,
        symbol: params.symbol,
        sellerFeeBasisPoints: 500, // 5% royalty
        useExistingMint: undefined,
        useNewMint: undefined,
        tokenOwner: wallet.publicKey,
        updateAuthority: wallet,
        mintAuthority: wallet,
        isMutable: true,
        isCollection: false,
        collection: undefined,
        collectionAuthority: undefined,
        collectionIsSized: false,
        collectionIsDelegated: false,
        collectionUpdateAuthority: undefined,
        collectionDetails: undefined,
        uses: undefined,
        tokenStandard: undefined,
        ruleSet: undefined,
        creators: [
          {
            address: wallet.publicKey,
            verified: true,
            share: 100,
          },
        ],
      });

      return {
        success: true,
        mintAddress: nft.address.toString(),
        transactionSignature: response.signature,
      };

    } catch (error) {
      console.error('Minting error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to mint NFT'
      };
    }
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
        description: nft.description || '',
        image: nft.json?.image || '',
        mintAddress: nft.address.toString(),
        updateAuthority: nft.updateAuthorityAddress.toString(),
        collection: nft.collection ? {
          address: nft.collection.address.toString(),
          verified: nft.collection.verified,
        } : undefined,
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
        description: nft.description || '',
        image: nft.json?.image || '',
        mintAddress: nft.address.toString(),
        updateAuthority: nft.updateAuthorityAddress.toString(),
        collection: nft.collection ? {
          address: nft.collection.address.toString(),
          verified: nft.collection.verified,
        } : undefined,
        attributes: nft.json?.attributes || [],
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
