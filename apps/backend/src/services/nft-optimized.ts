/**
 * Optimized NFT service with caching and query optimization
 */

import { solanaService as _solanaService } from './solana';
import { nftService } from './nft';
import { cache, cached, cacheKeys } from '../utils/cache';
import { withRetry, requestDeduplicator } from '../utils/retry';
import { MintRequest, MintResponse, NFTMetadata as _NFTMetadata } from '../types';
import { pool } from '../lib/db';

class OptimizedNFTService {
  /**
   * Get NFT metadata with intelligent caching
   */
  async getNFTMetadata(mintAddress: string) {
    return requestDeduplicator.dedupe(
      cacheKeys.nft(mintAddress),
      () =>
        cached(
          cacheKeys.nft(mintAddress),
          async () => {
            // Try database first (faster)
            try {
              const dbResult = await pool.query(
                'SELECT * FROM nfts WHERE mint_address = $1 LIMIT 1',
                [mintAddress]
              );

              if (dbResult.rows.length > 0) {
                return {
                  success: true,
                  data: dbResult.rows[0],
                };
              }
            } catch (error) {
              // Database error, fall through to blockchain query
            }

            // Fallback to blockchain query
            return withRetry(async () => {
              return await nftService.getNFTMetadata(mintAddress);
            });
          },
          10 * 60 * 1000 // 10 minute cache
        )
    );
  }

  /**
   * Get NFTs by owner with pagination and caching
   */
  async getNFTsByOwner(owner: string, page = 1, limit = 20) {
    const cacheKey = `${cacheKeys.nftsByOwner(owner)}:${page}:${limit}`;

    return cached(
      cacheKey,
      async () => {
        // Try database first
        try {
          const offset = (page - 1) * limit;
          const dbResult = await pool.query(
            `SELECT * FROM nfts 
             WHERE owner_address = $1 
             ORDER BY created_at DESC 
             LIMIT $2 OFFSET $3`,
            [owner, limit, offset]
          );

          if (dbResult.rows.length > 0) {
            return {
              success: true,
              data: dbResult.rows,
              pagination: {
                page,
                limit,
                total: dbResult.rowCount || 0,
              },
            };
          }
        } catch (error) {
          // Fall through to blockchain query
        }

        // Fallback to blockchain
        return withRetry(async () => {
          return await nftService.getNFTsByOwner(owner);
        });
      },
      2 * 60 * 1000 // 2 minute cache
    );
  }

  /**
   * Get marketplace with pagination and caching
   */
  async getMarketplace(page = 1, limit = 20) {
    const cacheKey = cacheKeys.marketplace(page, limit);

    return cached(
      cacheKey,
      async () => {
        try {
          const offset = (page - 1) * limit;
          const dbResult = await pool.query(
            `SELECT * FROM nfts 
             WHERE listed = true 
             ORDER BY created_at DESC 
             LIMIT $1 OFFSET $2`,
            [limit, offset]
          );

          const countResult = await pool.query('SELECT COUNT(*) FROM nfts WHERE listed = true');

          return {
            success: true,
            data: {
              nfts: dbResult.rows,
              pagination: {
                page,
                limit,
                total: parseInt(countResult.rows[0]?.count || '0', 10),
              },
            },
          };
        } catch (error) {
          return {
            success: true,
            data: {
              nfts: [],
              pagination: {
                page,
                limit,
                total: 0,
              },
            },
          };
        }
      },
      1 * 60 * 1000 // 1 minute cache (marketplace updates frequently)
    );
  }

  /**
   * Mint NFT with validation and optimization
   */
  async mintNFT(request: MintRequest): Promise<MintResponse> {
    // Validate request
    const validation = this.validateMintRequest(request);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.errors.join(', '),
      };
    }

    // Create mint (with retry logic)
    const result = await withRetry(
      () => nftService.createRealMint(request),
      {
        maxRetries: 2,
        retryable: (error: any) => {
          // Retry on network errors or 5xx
          return error?.code === 'ECONNRESET' || error?.status >= 500;
        },
      }
    );

    // Invalidate cache on successful mint
    if (result.success) {
      cache.delete(cacheKeys.marketplace(1, 20));
      // Could also add to database cache here
    }

    return result;
  }

  /**
   * Validate mint request
   */
  validateMintRequest(request: MintRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!request.name || request.name.trim().length === 0) {
      errors.push('Name is required');
    }

    if (!request.creatorWallet || !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(request.creatorWallet)) {
      errors.push('Valid creator wallet address is required');
    }

    if (!request.file && !request.imageUrl) {
      errors.push('Either file or imageUrl is required');
    }

    if (request.name && request.name.length > 100) {
      errors.push('Name must be less than 100 characters');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export const optimizedNFTService = new OptimizedNFTService();
export default optimizedNFTService;

