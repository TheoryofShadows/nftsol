/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck - Legacy code, type checking disabled
/**
 * NFT Service
 * Read operations use Helius DAS API directly (no backend).
 * Mint operations still route through the backend.
 */

import { NFT, MintRequest, MintResponse } from '@shared/types';
import { heliusService, HeliusNFT } from './heliusService';
import { apiService } from './api';
import { logger } from '@shared/utils/logger';
import { ValidationError, NetworkError } from '@shared/utils/errors';
import { mintRequestSchema } from '@shared/validation/schemas';

function heliusToNft(h: HeliusNFT): NFT {
  return {
    mintAddress: h.id,
    name: h.content?.metadata?.name ?? 'Untitled',
    description: h.content?.metadata?.description ?? '',
    imageUrl: h.content?.links?.image ?? h.content?.files?.[0]?.uri ?? '',
    creator: h.creators?.[0]?.address ?? 'Unknown',
    owner: h.ownership?.owner ?? '',
    attributes: h.content?.metadata?.attributes ?? [],
    compressed: h.compression?.compressed ?? false,
    collection: h.grouping?.find(g => g.group_key === 'collection')?.group_value,
  } as unknown as NFT;
}

export class NftService {
  /**
   * Get NFTs owned by a wallet via Helius DAS.
   */
  async getByOwner(ownerAddress: string): Promise<NFT[]> {
    try {
      const page = await heliusService.getNFTsByOwner(ownerAddress, 1, 50);
      logger.info('NFTs fetched for owner via Helius', { owner: ownerAddress, count: page.total });
      return page.items.map(heliusToNft);
    } catch (error) {
      logger.error('Failed to fetch NFTs by owner', error, { ownerAddress });
      throw error instanceof Error ? error : new NetworkError('Failed to fetch NFTs');
    }
  }

  /**
   * Get NFT by mint address via Helius DAS.
   */
  async getByMintAddress(mintAddress: string): Promise<NFT | null> {
    try {
      const asset = await heliusService.getAsset(mintAddress);
      return heliusToNft(asset);
    } catch (error) {
      logger.error('Failed to fetch NFT', error, { mintAddress });
      return null;
    }
  }

  /**
   * Get marketplace NFTs — uses Magic Eden public API (no key needed for basic listings).
   * Falls back to an empty array if unavailable so the UI doesn't crash.
   */
  async getMarketplace(filters?: {
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<NFT[]> {
    try {
      const limit = filters?.limit ?? 20;
      const offset = ((filters?.page ?? 1) - 1) * limit;
      const res = await fetch(
        `https://api-mainnet.magiceden.dev/v2/marketplace/popular_collections?limit=${limit}&offset=${offset}`,
        { signal: AbortSignal.timeout(10000) }
      );
      if (!res.ok) return [];
      const collections = await res.json() as Array<Record<string, unknown>>;
      return collections.map(c => ({
        mintAddress: String(c.symbol ?? ''),
        name: String(c.name ?? 'Unknown Collection'),
        description: String(c.description ?? ''),
        imageUrl: String(c.image ?? ''),
        creator: String(c.symbol ?? ''),
        owner: '',
        floorPrice: Number(c.floorPrice ?? 0),
        volume24h: Number(c.volume24h ?? 0),
      })) as unknown as NFT[];
    } catch (error) {
      logger.error('Failed to fetch marketplace', error);
      return [];
    }
  }

  /**
   * Get collections — Magic Eden public API.
   */
  async getCollections(): Promise<any[]> {
    try {
      const res = await fetch(
        'https://api-mainnet.magiceden.dev/v2/marketplace/popular_collections?limit=20',
        { signal: AbortSignal.timeout(10000) }
      );
      if (!res.ok) return [];
      return res.json();
    } catch (error) {
      logger.error('Failed to fetch collections', error);
      return [];
    }
  }

  /**
   * Mint a new NFT — still requires backend.
   */
  async mint(request: MintRequest): Promise<MintResponse> {
    try {
      const validated = mintRequestSchema.parse(request);
      logger.info('Minting NFT', { name: validated.name, creator: validated.creatorWallet });
      const response = await apiService.mintNFT(validated);
      if (!response.success || !response.data) {
        throw new NetworkError(response.error || 'Failed to mint NFT');
      }
      logger.info('NFT minted successfully', { mintAddress: response.data.mintAddress });
      return response.data;
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        throw new ValidationError('Invalid mint request', error);
      }
      logger.error('Failed to mint NFT', error);
      throw error instanceof Error ? error : new NetworkError('Failed to mint NFT');
    }
  }
}

export const nftService = new NftService();
