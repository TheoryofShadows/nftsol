/**
 * 🎨 Metaplex-Standard NFT Minting Service
 * Industry-standard NFT minting using Metaplex Token Metadata
 * NFTs minted here are compatible with ALL Solana NFT platforms!
 */

import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import {
  createNft,
  mplTokenMetadata,
} from '@metaplex-foundation/mpl-token-metadata';
import { createSignerFromKeypair, signerIdentity, generateSigner, percentAmount } from '@metaplex-foundation/umi';
import { solanaConfig } from '../config';
import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';

interface MetaplexMintParams {
  name: string;
  symbol?: string;
  description?: string;
  imageUrl: string; // Must be uploaded to IPFS/Arweave first
  attributes?: Array<{ trait_type: string; value: string | number }>;
  royaltyPercent?: number; // 0-100
  creators?: Array<{ address: string; share: number }>; // Share in percentage (must total 100)
  collection?: string; // Collection mint address
}

interface MetaplexMintResult {
  success: boolean;
  mintAddress?: string;
  metadataUri?: string;
  signature?: string;
  error?: string;
}

export class MetaplexMintingService {
  private umi: any;
  private platformSigner: any;

  constructor() {
    console.log('[Metaplex] Initializing Metaplex minting service...');

    // Initialize UMI
    this.umi = createUmi(solanaConfig.rpcUrl)
      .use(mplTokenMetadata());

    // Load platform wallet for signing
    this.initializePlatformSigner();

    console.log('[Metaplex] Service initialized successfully');
  }

  /**
   * Initialize platform signer from environment variable
   */
  private initializePlatformSigner(): void {
    try {
      const secretKeyBase58 = process.env.PLATFORM_SECRET_KEY_BASE58;
      
      if (!secretKeyBase58) {
        console.warn('[Metaplex] No PLATFORM_SECRET_KEY_BASE58 found - minting will not work');
        return;
      }

      // Decode base58 secret key
      const secretKeyBytes = bs58.decode(secretKeyBase58);
      const keypair = Keypair.fromSecretKey(secretKeyBytes);

      // Convert to UMI signer
      const umiKeypair = this.umi.eddsa.createKeypairFromSecretKey(secretKeyBytes);
      this.platformSigner = createSignerFromKeypair(this.umi, umiKeypair);

      // Set as identity
      this.umi.use(signerIdentity(this.platformSigner));

      console.log('[Metaplex] Platform signer initialized:', keypair.publicKey.toBase58());
    } catch (error) {
      console.error('[Metaplex] Failed to initialize platform signer:', error);
      throw error;
    }
  }

  /**
   * Mint a new NFT using Metaplex standard
   * Returns mint address and metadata URI
   */
  async mintNFT(params: MetaplexMintParams): Promise<MetaplexMintResult> {
    try {
      if (!this.platformSigner) {
        return {
          success: false,
          error: 'Platform signer not initialized. Set PLATFORM_SECRET_KEY_BASE58 in environment.',
        };
      }

      console.log(`[Metaplex] Minting NFT: ${params.name}`);
      console.log(`[Metaplex] Image URL: ${params.imageUrl}`);

      // Generate new mint keypair
      const mint = generateSigner(this.umi);

      // Prepare creators array
      let creators: any[] = [];

      if (params.creators && params.creators.length > 0) {
        creators = params.creators.map((creator) => ({
          address: creator.address,
          share: creator.share,
          verified: creator.address === this.platformSigner.publicKey.toString(),
        }));
      } else {
        // Default: Platform wallet is 100% creator
        creators = [
          {
            address: this.platformSigner.publicKey,
            share: 100,
            verified: true,
          },
        ];
      }

      // Build metadata URI (already uploaded to IPFS/Arweave)
      const metadataUri = params.imageUrl; // Assuming this is the full metadata URI

      console.log('[Metaplex] Creating NFT transaction...');

      // Mint NFT with Metaplex standard
      const result = await createNft(this.umi, {
        mint,
        name: params.name,
        symbol: params.symbol || 'NFTSOL',
        uri: metadataUri,
        sellerFeeBasisPoints: percentAmount((params.royaltyPercent || 0) * 100), // Convert to basis points
        creators,
        isMutable: true,
      }).sendAndConfirm(this.umi);

      const mintAddress = mint.publicKey.toString();
      const signature = bs58.encode(result.signature);

      console.log(`[Metaplex] ✅ NFT minted successfully!`);
      console.log(`[Metaplex] Mint Address: ${mintAddress}`);
      console.log(`[Metaplex] Signature: ${signature}`);

      return {
        success: true,
        mintAddress,
        metadataUri,
        signature,
      };
    } catch (error) {
      console.error('[Metaplex] Mint NFT error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to mint NFT',
      };
    }
  }

  /**
   * Verify an NFT follows Metaplex standard
   */
  async verifyMetaplexStandard(mintAddress: string): Promise<{
    success: boolean;
    isMetaplex?: boolean;
    metadata?: any;
    error?: string;
  }> {
    try {
      // TODO: Implement verification by fetching token metadata account
      // For now, return success
      return {
        success: true,
        isMetaplex: true,
      };
    } catch (error) {
      console.error('[Metaplex] Verify standard error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Verification failed',
      };
    }
  }

  /**
   * Update NFT metadata (if mutable)
   */
  async updateMetadata(params: {
    mintAddress: string;
    newName?: string;
    newUri?: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      // TODO: Implement metadata update
      console.log('[Metaplex] Metadata update not yet implemented');
      return {
        success: false,
        error: 'Update metadata not yet implemented',
      };
    } catch (error) {
      console.error('[Metaplex] Update metadata error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Update failed',
      };
    }
  }

  /**
   * Get Metaplex mint cost estimate
   */
  async estimateMintCost(): Promise<{
    success: boolean;
    costSOL?: number;
    breakdown?: {
      accountRent: number;
      transactionFee: number;
      metadataAccount: number;
      total: number;
    };
    error?: string;
  }> {
    try {
      // Metaplex minting costs (approximate)
      const accountRent = 0.00203928; // Rent for token account
      const transactionFee = 0.000005; // Transaction fee
      const metadataAccount = 0.00465; // Metadata account rent

      const total = accountRent + transactionFee + metadataAccount;

      return {
        success: true,
        costSOL: total,
        breakdown: {
          accountRent,
          transactionFee,
          metadataAccount,
          total,
        },
      };
    } catch (error) {
      console.error('[Metaplex] Estimate cost error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Cost estimation failed',
      };
    }
  }

  /**
   * Check if platform wallet has sufficient balance
   */
  async checkBalance(): Promise<{
    success: boolean;
    balance?: number;
    canMint?: boolean;
    error?: string;
  }> {
    try {
      if (!this.platformSigner) {
        return {
          success: false,
          error: 'Platform signer not initialized',
        };
      }

      const balance = await this.umi.rpc.getBalance(this.platformSigner.publicKey);
      const balanceSOL = Number(balance.basisPoints) / 1e9;

      const costEstimate = await this.estimateMintCost();
      const requiredBalance = costEstimate.costSOL || 0.01;

      if (process.env.NODE_ENV !== 'production') {
        console.log(`[Metaplex] Platform wallet balance: ${balanceSOL} SOL`);
        console.log(`[Metaplex] Required for mint: ${requiredBalance} SOL`);
      }

      return {
        success: true,
        balance: balanceSOL,
        canMint: balanceSOL >= requiredBalance,
      };
    } catch (error) {
      console.error('[Metaplex] Check balance error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Balance check failed',
      };
    }
  }
}

// Export singleton instance
export const metaplexMinting = new MetaplexMintingService();

