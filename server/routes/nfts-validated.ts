/**
 * NFT Routes with Validation
 * Updated routes with validation middleware and proper error handling
 */

import { Router, Request, Response, NextFunction } from 'express';
import { validateQuery, validateParams } from '../middleware/validation';
import { nftQuerySchema, walletAddressSchema } from '@shared/validation/schemas';
import { z } from 'zod';
import { logger } from '@shared/utils/logger';
import { NotFoundError } from '@shared/utils/errors';
import { asyncHandler } from '../security-middleware';

const router = Router();

// Validate query parameters for NFT marketplace
const marketplaceQuerySchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

router.get(
  '/marketplace',
  validateQuery(marketplaceQuerySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { category, search, page, limit } = req.query;
    
    // Import services here to avoid circular dependencies
    const { enhancedSolanaNFTService } = await import('../enhanced-solana-api');
    
    logger.info('Fetching NFT marketplace', { category, search, page, limit });
    
    let nfts = await enhancedSolanaNFTService.fetchAllEnhancedNFTs();
    
    // Apply filters
    if (category && category !== 'all') {
      nfts = enhancedSolanaNFTService.filterByCategory(nfts, category as string);
    }
    
    if (search) {
      nfts = enhancedSolanaNFTService.searchNFTs(nfts, search as string);
    }
    
    logger.info('NFT marketplace fetched', { count: nfts.length });
    
    res.set({
      'Cache-Control': 'public, max-age=300',
      'ETag': `"nfts-${Date.now()}"`,
      'Vary': 'Accept-Encoding'
    });
    
    res.json(nfts);
  })
);

// Validate wallet address parameter
const walletParamSchema = z.object({
  address: walletAddressSchema,
});

router.get(
  '/:address',
  validateParams(walletParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { address } = req.params;
    
    logger.info('Fetching NFTs for wallet', { address });
    
    // Your NFT fetching logic here
    // const nfts = await getNFTsByOwner(address);
    
    res.json({ nfts: [] });
  })
);

export default router;

