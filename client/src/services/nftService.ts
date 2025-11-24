/**
 * NFT Service
 * Service layer for NFT-related operations
 * Separates business logic from components
 * @ts-nocheck
 */

import { NFT, MintRequest, MintResponse, MarketData } from '@shared/types';
import { apiService } from './api';
import { logger } from '@shared/utils/logger';
import { ValidationError, NetworkError } from '@shared/utils/errors';
import { mintRequestSchema } from '@shared/validation/schemas';

export class NftService {
  /**
   * Get all NFTs from marketplace
   */
  async getMarketplace(filters?: {
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<NFT[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.category) params.append('category', filters.category);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const queryString = params.toString();
      const endpoint = queryString ? `/api/nfts/marketplace?${queryString}` : '/api/nfts/marketplace';
      
      const response = await apiService.request<MarketData>(endpoint);
      
      if (!response.success || !response.data) {
        throw new NetworkError(response.error || 'Failed to fetch marketplace');
      }

      logger.info('Marketplace fetched', { count: response.data.nfts?.length || 0 });
      return response.data.nfts || [];
    } catch (error) {
      logger.error('Failed to fetch marketplace', error);
      throw error instanceof Error ? error : new NetworkError('Failed to fetch marketplace');
    }
  }

  /**
   * Get NFT by mint address
   */
  async getByMintAddress(mintAddress: string): Promise<NFT | null> {
    try {
      const response = await apiService.getNFTMetadata(mintAddress);
      
      if (!response.success || !response.data) {
        if (response.error?.includes('not found')) {
          return null;
        }
        throw new NetworkError(response.error || 'Failed to fetch NFT');
      }

      return response.data;
    } catch (error) {
      logger.error('Failed to fetch NFT', error, { mintAddress });
      throw error instanceof Error ? error : new NetworkError('Failed to fetch NFT');
    }
  }

  /**
   * Get NFTs by owner
   */
  async getByOwner(ownerAddress: string): Promise<NFT[]> {
    try {
      const response = await apiService.getNFTsByOwner(ownerAddress);
      
      if (!response.success || !response.data) {
        throw new NetworkError(response.error || 'Failed to fetch NFTs');
      }

      logger.info('NFTs fetched for owner', { owner: ownerAddress, count: response.data.length });
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch NFTs by owner', error, { ownerAddress });
      throw error instanceof Error ? error : new NetworkError('Failed to fetch NFTs');
    }
  }

  /**
   * Mint a new NFT
   */
  async mint(request: MintRequest): Promise<MintResponse> {
    try {
      // Validate request
      const validated = mintRequestSchema.parse(request);
      
      logger.info('Minting NFT', { name: validated.name, creator: validated.creatorWallet });
      
      const response = await apiService.mintNFT(validated);
      
      if (!response.success || !response.data) {
        throw new NetworkError(response.error || 'Failed to mint NFT');
      }

      logger.info('NFT minted successfully', { 
        mintAddress: response.data.mintAddress,
        signature: response.data.signature 
      });

      return response.data;
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        throw new ValidationError('Invalid mint request', error);
      }
      logger.error('Failed to mint NFT', error);
      throw error instanceof Error ? error : new NetworkError('Failed to mint NFT');
    }
  }

  /**
   * Get collections
   */
  async getCollections(): Promise<any[]> {
    try {
      const response = await apiService.getCollections();
      
      if (!response.success || !response.data) {
        throw new NetworkError(response.error || 'Failed to fetch collections');
      }

      return response.data;
    } catch (error) {
      logger.error('Failed to fetch collections', error);
      throw error instanceof Error ? error : new NetworkError('Failed to fetch collections');
    }
  }
}

// Export singleton instance
export const nftService = new NftService();

