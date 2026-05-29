/**
 * 🔍 Real Verification Routes
 * Uses Grok AI for actual content verification (no mocks)
 */

import logger from '../utils/logger';
import { Router, Request, Response } from 'express';
import { grokRealService } from '../services/grok-real.service';

const router = Router();

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

/**
 * POST /api/verify/text
 * Verify any text content (claims, statements, etc.)
 */
router.post('/text', async (req: Request, res: Response) => {
  try {
    const { content } = req.body;

    if (!content || typeof content !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Content is required and must be a string'
      } as ApiResponse);
    }

    const result = await grokRealService.verify({
      content,
      contentType: 'text'
    });

    res.json({
      success: true,
      data: result
    } as ApiResponse);
  } catch (error) {
    logger.error('[Verification Error]:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Verification failed',
      code: 'VERIFICATION_ERROR'
    } as ApiResponse);
  }
});

/**
 * POST /api/verify/creator
 * Verify creator authenticity and credentials
 */
router.post('/creator', async (req: Request, res: Response) => {
  try {
    const { creatorAddress, portfolio, social } = req.body;

    if (!creatorAddress) {
      return res.status(400).json({
        success: false,
        error: 'Creator address is required'
      } as ApiResponse);
    }

    const result = await grokRealService.verify({
      content: creatorAddress,
      contentType: 'creator',
      metadata: {
        portfolio,
        social
      }
    });

    res.json({
      success: true,
      data: result
    } as ApiResponse);
  } catch (error) {
    logger.error('[Creator Verification Error]:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Creator verification failed',
      code: 'CREATOR_VERIFICATION_ERROR'
    } as ApiResponse);
  }
});

/**
 * POST /api/verify/collection
 * Verify NFT collection legitimacy (detect rug pulls, etc.)
 */
router.post('/collection', async (req: Request, res: Response) => {
  try {
    const { collectionMint, info, holders, volume } = req.body;

    if (!collectionMint) {
      return res.status(400).json({
        success: false,
        error: 'Collection mint is required'
      } as ApiResponse);
    }

    const result = await grokRealService.verify({
      content: collectionMint,
      contentType: 'collection',
      metadata: {
        info,
        holders,
        volume
      }
    });

    res.json({
      success: true,
      data: result
    } as ApiResponse);
  } catch (error) {
    logger.error('[Collection Verification Error]:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Collection verification failed',
      code: 'COLLECTION_VERIFICATION_ERROR'
    } as ApiResponse);
  }
});

/**
 * POST /api/verify/deal
 * Verify NFT deal fairness
 */
router.post('/deal', async (req: Request, res: Response) => {
  try {
    const { dealInfo, market, terms } = req.body;

    if (!dealInfo) {
      return res.status(400).json({
        success: false,
        error: 'Deal info is required'
      } as ApiResponse);
    }

    const result = await grokRealService.verify({
      content: dealInfo,
      contentType: 'deal',
      metadata: {
        market,
        terms
      }
    });

    res.json({
      success: true,
      data: result
    } as ApiResponse);
  } catch (error) {
    logger.error('[Deal Verification Error]:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Deal verification failed',
      code: 'DEAL_VERIFICATION_ERROR'
    } as ApiResponse);
  }
});

/**
 * POST /api/verify/community
 * Verify community authenticity (detect bots, brigading, etc.)
 */
router.post('/community', async (req: Request, res: Response) => {
  try {
    const { communityInfo, holderCount, activity, voting } = req.body;

    if (!communityInfo) {
      return res.status(400).json({
        success: false,
        error: 'Community info is required'
      } as ApiResponse);
    }

    const result = await grokRealService.verify({
      content: communityInfo,
      contentType: 'community',
      metadata: {
        holderCount,
        activity,
        voting
      }
    });

    res.json({
      success: true,
      data: result
    } as ApiResponse);
  } catch (error) {
    logger.error('[Community Verification Error]:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Community verification failed',
      code: 'COMMUNITY_VERIFICATION_ERROR'
    } as ApiResponse);
  }
});

/**
 * POST /api/verify/nft
 * Verify NFT authenticity (original art, not stolen/fake)
 */
router.post('/nft', async (req: Request, res: Response) => {
  try {
    const { nftMint, info, imageUrl, creator } = req.body;

    if (!nftMint) {
      return res.status(400).json({
        success: false,
        error: 'NFT mint is required'
      } as ApiResponse);
    }

    const result = await grokRealService.verify({
      content: nftMint,
      contentType: 'nft',
      metadata: {
        info,
        imageUrl,
        creator
      }
    });

    res.json({
      success: true,
      data: result
    } as ApiResponse);
  } catch (error) {
    logger.error('[NFT Verification Error]:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'NFT verification failed',
      code: 'NFT_VERIFICATION_ERROR'
    } as ApiResponse);
  }
});

/**
 * POST /api/verify/url
 * Verify URL/website authenticity
 */
router.post('/url', async (req: Request, res: Response) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required'
      } as ApiResponse);
    }

    const result = await grokRealService.verify({
      content: url,
      contentType: 'url'
    });

    res.json({
      success: true,
      data: result
    } as ApiResponse);
  } catch (error) {
    logger.error('[URL Verification Error]:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'URL verification failed',
      code: 'URL_VERIFICATION_ERROR'
    } as ApiResponse);
  }
});

/**
 * POST /api/verify/batch
 * Verify multiple items in batch
 */
router.post('/batch', async (req: Request, res: Response) => {
  try {
    const { verifications } = req.body;

    if (!Array.isArray(verifications) || verifications.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Verifications array is required and must not be empty'
      } as ApiResponse);
    }

    if (verifications.length > 10) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 10 verifications per batch'
      } as ApiResponse);
    }

    const results = await grokRealService.verifyBatch(verifications);

    res.json({
      success: true,
      data: {
        count: results.length,
        results
      }
    } as ApiResponse);
  } catch (error) {
    logger.error('[Batch Verification Error]:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Batch verification failed',
      code: 'BATCH_VERIFICATION_ERROR'
    } as ApiResponse);
  }
});

/**
 * GET /api/verify/health
 * Health check for verification service
 */
router.get('/health', (req: Request, res: Response) => {
  const hasApiKey = !!process.env.GROK_API_KEY;

  res.json({
    success: true,
    data: {
      status: hasApiKey ? 'ready' : 'no_api_key',
      message: hasApiKey
        ? 'Grok API verification service is ready'
        : 'GROK_API_KEY not configured. Set it in .env to use verification.',
      apiConfigured: hasApiKey,
      documentation: 'https://console.x.ai/',
      endpoints: [
        'POST /api/verify/text',
        'POST /api/verify/creator',
        'POST /api/verify/collection',
        'POST /api/verify/deal',
        'POST /api/verify/community',
        'POST /api/verify/nft',
        'POST /api/verify/url',
        'POST /api/verify/batch'
      ]
    }
  } as ApiResponse);
});

export default router;
