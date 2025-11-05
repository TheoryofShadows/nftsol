import { heliusService } from './helius';
import logger from '../utils/logger';
import { MintRequest, MintResponse, NFTMetadata } from '../types';
import { ApiResponse } from '../types';
import { mintNFT, accountExists } from '../lib/solana';

class NFTService {
  // Generate unique NFT metadata
  generateMetadata(request: MintRequest): NFTMetadata {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substr(2, 9);

    return {
      name: request.name,
      description: request.description || `NFT created by ${request.creatorWallet.slice(0, 8)}...`,
      image:
        request.imageUrl ||
        `https://via.placeholder.com/300x300/667eea/ffffff?text=${encodeURIComponent(request.name)}`,
      attributes: [
        {
          trait_type: 'Creator',
          value: request.creatorWallet.slice(0, 8) + '...',
        },
        {
          trait_type: 'Created',
          value: new Date().toISOString(),
        },
        {
          trait_type: 'Unique ID',
          value: `${timestamp}_${randomId}`,
        },
      ],
      properties: {
        files: [
          {
            uri:
              request.imageUrl ||
              `https://via.placeholder.com/300x300/667eea/ffffff?text=${encodeURIComponent(request.name)}`,
            type: 'image/png',
          },
        ],
        category: 'image',
      },
    };
  }

  // Create mock mint response (for testing)
  async createMockMint(request: MintRequest): Promise<MintResponse> {
    try {
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substr(2, 9);

      // Generate mock mint address
      const mintAddress = `MOCK_MINT_${timestamp}_${randomId}`;
      const signature = `sig_${timestamp}_${randomId}`;
      const uri = `https://nftstorage.link/ipfs/mock_${timestamp}`;

      // Log the mint operation
      logger.info('Mock NFT minted', {
        name: request.name,
        creator: request.creatorWallet,
        mintAddress,
        timestamp,
      });

      return {
        success: true,
        mint: mintAddress,
        uri,
        mintAddress,
        signature,
        message: 'NFT minted successfully (mock)',
      };
    } catch (error) {
      logger.error('Error creating mock mint', { error, request });
      return {
        success: false,
        error: 'Failed to create mock mint',
      };
    }
  }

  // Create real NFT mint using Solana blockchain
  async createRealMint(request: MintRequest): Promise<MintResponse> {
    try {
      // Validate wallet address exists
      const walletExists = await accountExists(request.creatorWallet);
      if (!walletExists) {
        return {
          success: false,
          error: 'Invalid wallet address or wallet does not exist',
        };
      }

      // Calculate fees (2.5% of mint cost)
      const MINT_COST_SOL = 0.01; // Base mint cost
      const FEE_PERCENTAGE = 0.025; // 2.5%
      const feeAmount = MINT_COST_SOL * FEE_PERCENTAGE;
      const totalCost = MINT_COST_SOL + feeAmount;

      logger.info('Fee calculation', {
        baseCost: MINT_COST_SOL,
        feePercentage: FEE_PERCENTAGE,
        feeAmount,
        totalCost,
        creator: request.creatorWallet,
      });

      // Generate metadata URI (for now using placeholder)
      const metadataUri = request.imageUrl || `https://nftsol.app/metadata/${Date.now()}`;

      // Mint NFT on blockchain
      const result = await mintNFT(
        request.creatorWallet,
        metadataUri,
        request.name,
        request.description
      );

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'NFT minting failed',
        };
      }

      // Log the mint operation
      logger.info('Real NFT minted', {
        name: request.name,
        creator: request.creatorWallet,
        mintAddress: result.mintAddress,
        signature: result.txSig,
        timestamp: Date.now(),
      });

      return {
        success: true,
        mint: result.mintAddress,
        uri: metadataUri,
        mintAddress: result.mintAddress,
        signature: result.txSig,
        message: 'NFT minted successfully on Solana blockchain',
      };
    } catch (error) {
      logger.error('Error creating real mint', { error, request });
      return {
        success: false,
        error: 'Failed to create real mint: ' + (error as Error).message,
      };
    }
  }

  // Validate mint request
  validateMintRequest(request: MintRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!request.name || request.name.trim().length === 0) {
      errors.push('NFT name is required');
    }

    if (request.name && request.name.length > 100) {
      errors.push('NFT name must be less than 100 characters');
    }

    if (request.description && request.description.length > 1000) {
      errors.push('Description must be less than 1000 characters');
    }

    if (!request.creatorWallet) {
      errors.push('Creator wallet is required');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // Get NFT metadata by mint address (via Helius DAS)
  async getNFTMetadata(mintAddress: string): Promise<ApiResponse<NFTMetadata>> {
    try {
      const asset = await heliusService.getAsset(mintAddress);
      if (!asset) {
        return { success: false, error: 'NFT not found' };
      }
      const metadata: NFTMetadata = {
        name: asset.content?.metadata?.name || 'Unnamed NFT',
        description: asset.content?.metadata?.description || '',
        image: asset.content?.links?.image || '',
        attributes: [],
      };
      return { success: true, data: metadata };
    } catch (error) {
      logger.error('Error getting NFT metadata', { mintAddress, error });
      return { success: false, error: 'Failed to get NFT metadata' };
    }
  }

  // List NFTs by owner (via Helius DAS)
  async getNFTsByOwner(owner: string): Promise<ApiResponse<any[]>> {
    try {
      const { items } = await heliusService.getAssetsByOwner(owner, { limit: 200 });
      const mapped = items.map((nft: any) => ({
        id: nft.id,
        mint: nft.id,
        mintAddress: nft.id,
        owner,
        name: nft.content?.metadata?.name || 'Unnamed NFT',
        description: nft.content?.metadata?.description || '',
        image: nft.content?.links?.image || '',
        collection: nft.grouping?.find((g: any) => g.group_key === 'collection')?.group_value || 'Unknown',
        compressed: nft.compression?.compressed || false,
        onChain: true,
        source: 'blockchain',
      }));
      return { success: true, data: mapped };
    } catch (error) {
      logger.error('Error getting NFTs by owner', { owner, error });
      return { success: false, error: 'Failed to get NFTs by owner' };
    }
  }
}

export const nftService = new NFTService();
export default nftService;
