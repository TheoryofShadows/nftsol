/**
 * 💎 Ultra-Cheap Minting Routes
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import { ultraCheapMintService } from '../services/ultra-cheap-mint';
import { validateWallet } from '../utils/validation';
import { ApiResponse } from '../types';

const router = Router();

/**
 * GET /api/mint/estimate
 * Get minting cost estimate
 */
router.get('/estimate', async (_req: Request, res: Response) => {
  try {
    const estimate = await ultraCheapMintService.estimateCost();
    
    const response: ApiResponse = {
      success: true,
      data: {
        solCost: estimate.solCost,
        usdCost: estimate.usdCost,
        network: 'Solana',
        message: `Only $${estimate.usdCost.toFixed(4)} to mint!`,
      },
    };
    
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to estimate cost',
      code: 'ESTIMATE_FAILED',
    };
    res.status(500).json(response);
  }
});

/**
 * GET /api/mint/compare
 * Get cost comparison with other platforms
 */
router.get('/compare', async (_req: Request, res: Response) => {
  try {
    const comparison = await ultraCheapMintService.getComparisonData();
    
    const response: ApiResponse = {
      success: true,
      data: comparison,
    };
    
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get comparison',
      code: 'COMPARISON_FAILED',
    };
    res.status(500).json(response);
  }
});

/**
 * POST /api/mint/ultra-cheap
 * Mint NFT with ultra-low cost optimization
 */
router.post('/ultra-cheap', validateWallet, async (req: Request, res: Response) => {
  try {
    const { toAddress, name, symbol, description, imageUrl, externalUrl } = req.body;

    if (!toAddress || !name || !imageUrl) {
      const response: ApiResponse = {
        success: false,
        error: 'Missing required fields: toAddress, name, imageUrl',
        code: 'MISSING_FIELDS',
      };
      return res.status(400).json(response);
    }

    const result = await ultraCheapMintService.mint({
      toAddress,
      name,
      symbol,
      description,
      imageUrl,
      externalUrl,
    });

    if (result.success) {
      const response: ApiResponse = {
        success: true,
        data: {
          mintAddress: result.mintAddress,
          signature: result.signature,
          cost: result.cost,
          costUSD: result.costUSD,
          name,
          imageUrl,
        },
        message: `NFT minted for only $${result.costUSD?.toFixed(4)}!`,
      };
      return res.json(response);
    } else {
      const response: ApiResponse = {
        success: false,
        error: result.error || 'Minting failed',
        code: 'MINT_FAILED',
      };
      return res.status(500).json(response);
    }
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      code: 'INTERNAL_ERROR',
    };
    return res.status(500).json(response);
  }
});

export default router;

