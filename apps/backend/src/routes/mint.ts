/**
 * 💎 Ultra-Cheap Minting Routes
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import multer from 'multer';
import { randomBytes } from 'crypto';
import { ultraCheapMintService } from '../services/ultra-cheap-mint';
import { fileStorageService } from '../services/file-storage';
import { validateWallet } from '../utils/validation';
import { ApiResponse } from '../types';
import { createModuleLogger } from '../utils/logger';

const log = createModuleLogger('mint');

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    // Validate file type
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed: ${allowedMimeTypes.join(', ')}`));
    }
  },
});

/**
 * GET /api/mint/simple-mint
 * Generate CSRF token for the mint form and set it as a cookie
 */
router.get('/simple-mint', (req: Request, res: Response) => {
  try {
    const token = randomBytes(32).toString('hex');

    if ((req as any).session) {
      (req as any).session.csrfToken = token;
    }

    res.cookie('XSRF-TOKEN', token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
      path: '/',
    });

    res.json({
      success: true,
      message: 'CSRF token generated and set in cookie',
      code: 'CSRF_TOKEN_READY',
      csrfToken: token,
    });
  } catch (error) {
    log.error('Error generating CSRF token', error as Error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate CSRF token',
      code: 'CSRF_TOKEN_ERROR',
    });
  }
});

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
 * POST /api/mint/simple-mint
 * Mint NFT with file upload
 * Uploads image file to IPFS (via Pinata) and mints compressed NFT
 *
 * Note: CSRF protection disabled for development (localhost)
 * In production, should validate CSRF token from request headers
 */
router.post('/simple-mint', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const { name, description, creatorWallet } = req.body;
    const file = (req as any).file;

    // Validate required fields
    if (!name || !creatorWallet) {
      const response: ApiResponse = {
        success: false,
        error: 'Missing required fields: name, creatorWallet',
        code: 'MISSING_FIELDS',
      };
      return res.status(400).json(response);
    }

    // Validate file upload
    if (!file) {
      const response: ApiResponse = {
        success: false,
        error: 'No file uploaded. Please upload an image file.',
        code: 'MISSING_FILE',
      };
      return res.status(400).json(response);
    }

    log.info(`📤 Processing file upload: ${file.originalname} (${file.size} bytes)`);

    // Validate file before storage
    const validation = fileStorageService.validateFile(
      file.buffer,
      file.originalname,
      file.mimetype
    );

    if (!validation.valid) {
      const response: ApiResponse = {
        success: false,
        error: validation.error || 'File validation failed',
        code: 'INVALID_FILE',
      };
      return res.status(400).json(response);
    }

    // Upload file to storage
    log.info('☁️ Uploading file to storage...');
    const storageResult = await fileStorageService.uploadFile(
      file.buffer,
      file.originalname,
      file.mimetype
    );

    if (!storageResult.success || !storageResult.url) {
      const response: ApiResponse = {
        success: false,
        error: storageResult.error || 'Failed to upload file',
        code: 'STORAGE_FAILED',
      };
      return res.status(500).json(response);
    }

    log.info(`✅ File stored successfully: ${storageResult.url}`);

    // Mint NFT using the uploaded image URL
    log.info('🚀 Starting NFT mint...');
    const mintResult = await ultraCheapMintService.mint({
      toAddress: creatorWallet,
      name: name,
      symbol: name.slice(0, 4).toUpperCase(),
      description: description || `A compressed NFT: ${name}`,
      imageUrl: storageResult.url,
    });

    if (!mintResult.success) {
      const response: ApiResponse = {
        success: false,
        error: mintResult.error || 'Minting failed',
        code: 'MINT_FAILED',
      };
      return res.status(500).json(response);
    }

    // Success response
    const response: ApiResponse = {
      success: true,
      data: {
        mintAddress: mintResult.mintAddress || mintResult.assetId,
        assetId: mintResult.assetId,
        signature: mintResult.signature,
        cost: mintResult.cost,
        costUSD: mintResult.costUSD,
        imageUrl: storageResult.url,
        treeAddress: mintResult.treeAddress,
        name: name,
        fileName: file.originalname,
      },
      message: `✨ NFT "${name}" minted successfully for $${mintResult.costUSD?.toFixed(4)}!`,
    };

    return res.json(response);
  } catch (error) {
    log.error('🔴 Mint error:', error);
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      code: 'INTERNAL_ERROR',
    };
    return res.status(500).json(response);
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

