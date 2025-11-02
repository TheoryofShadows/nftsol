/**
 * Optimized NFT routes with caching and query optimization
 */

import { Router, Request, Response } from 'express';
import { cacheMiddleware, clearCache } from '../middleware/cache';
import { optimizedNFTService } from '../services/nft-optimized';
import { validateWallet, sanitizeInput } from '../utils/validation';
import { ApiResponse } from '../types';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Apply caching middleware to GET routes
router.use('/:mintAddress', cacheMiddleware(10 * 60 * 1000)); // 10 min cache
router.use('/owner/:owner', cacheMiddleware(2 * 60 * 1000)); // 2 min cache

// GET /api/nfts/:mintAddress - Get NFT metadata (cached)
router.get('/:mintAddress', async (req: Request, res: Response) => {
  try {
    const { mintAddress } = req.params;
    const result = await optimizedNFTService.getNFTMetadata(mintAddress);

    if (result.success) {
      return res.json(result);
    } else {
      return res.status(404).json({
        success: false,
        error: ('error' in result ? result.error : 'NFT not found') || 'NFT not found',
        code: 'NOT_FOUND',
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to get NFT metadata',
      code: 'INTERNAL_ERROR',
    });
  }
});

// GET /api/nfts/owner/:owner - Get NFTs by owner (cached, paginated)
router.get('/owner/:owner', async (req: Request, res: Response) => {
  try {
    const { owner } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await optimizedNFTService.getNFTsByOwner(owner, page, limit);

    if (result.success) {
      return res.json(result);
    } else {
      return res.status(500).json({
        success: false,
        error: ('error' in result ? result.error : 'Failed to get NFTs') || 'Failed to get NFTs',
        code: 'INTERNAL_ERROR',
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to get NFTs by owner',
      code: 'INTERNAL_ERROR',
    });
  }
});

// POST /api/nfts/mint - Mint NFT (no cache, invalidates cache)
router.post(
  '/mint',
  sanitizeInput,
  validateWallet,
  upload.single('file'),
  async (req: Request, res: Response) => {
    try {
      const mintRequest = {
        name: req.body.name,
        description: req.body.description,
        imageUrl: req.body.imageUrl,
        creatorWallet: req.body.creatorWallet || req.body.toAddress,
        file: req.file,
      };

      const result = await optimizedNFTService.mintNFT(mintRequest);

      // Clear cache on successful mint
      if (result.success) {
        clearCache('/api/nfts');
        clearCache('/api/v1/market');
      }

      if (result.success) {
        return res.json({
          success: true,
          data: result,
          message: 'NFT minted successfully',
        });
      } else {
        return res.status(400).json({
          success: false,
          error: result.error || 'Minting failed',
          code: 'MINT_FAILED',
        });
      }
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      });
    }
  }
);

export default router;

