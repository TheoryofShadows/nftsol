/**
 * 🏪 Marketplace API Routes
 * Buy, sell, and list NFTs
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import { marketplaceService } from '../services/marketplace';
import { validateWallet, sanitizeInput } from '../utils/validation';
import { ApiResponse } from '../types';

const router = Router();

/**
 * POST /api/marketplace/list
 * List an NFT for sale
 */
router.post('/list', sanitizeInput, validateWallet, async (req: Request, res: Response) => {
  try {
    const { mintAddress, seller, price } = req.body;

    if (!mintAddress || !seller || !price) {
      const response: ApiResponse = {
        success: false,
        error: 'Missing required fields: mintAddress, seller, price',
        code: 'MISSING_FIELDS',
      };
      return res.status(400).json(response);
    }

    if (price <= 0) {
      const response: ApiResponse = {
        success: false,
        error: 'Price must be greater than 0',
        code: 'INVALID_PRICE',
      };
      return res.status(400).json(response);
    }

    const result = await marketplaceService.listNFT({ mintAddress, seller, price });

    if (result.success) {
      const response: ApiResponse = {
        success: true,
        data: result.listing,
        message: 'NFT listed successfully',
      };
      return res.json(response);
    } else {
      const response: ApiResponse = {
        success: false,
        error: result.error || 'Failed to list NFT',
        code: 'LIST_FAILED',
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

/**
 * POST /api/marketplace/delist
 * Remove NFT from marketplace
 */
router.post('/delist', sanitizeInput, validateWallet, async (req: Request, res: Response) => {
  try {
    const { mintAddress, seller } = req.body;

    if (!mintAddress || !seller) {
      const response: ApiResponse = {
        success: false,
        error: 'Missing required fields: mintAddress, seller',
        code: 'MISSING_FIELDS',
      };
      return res.status(400).json(response);
    }

    const result = await marketplaceService.delistNFT(mintAddress, seller);

    if (result.success) {
      const response: ApiResponse = {
        success: true,
        message: 'NFT delisted successfully',
      };
      return res.json(response);
    } else {
      const response: ApiResponse = {
        success: false,
        error: result.error || 'Failed to delist NFT',
        code: 'DELIST_FAILED',
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

/**
 * GET /api/marketplace/listings
 * Get all active listings
 */
router.get('/listings', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await marketplaceService.getActiveListings(limit, offset);

    if (result.success) {
      const response: ApiResponse = {
        success: true,
        data: {
          listings: result.listings,
          total: result.total,
          limit,
          offset,
        },
      };
      return res.json(response);
    } else {
      const response: ApiResponse = {
        success: false,
        error: result.error || 'Failed to get listings',
        code: 'GET_LISTINGS_FAILED',
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

/**
 * GET /api/marketplace/listing/:mintAddress
 * Get specific listing
 */
router.get('/listing/:mintAddress', async (req: Request, res: Response) => {
  try {
    const { mintAddress } = req.params;

    const result = await marketplaceService.getListing(mintAddress);

    if (result.success) {
      const response: ApiResponse = {
        success: true,
        data: result.listing,
      };
      return res.json(response);
    } else {
      const response: ApiResponse = {
        success: false,
        error: result.error || 'Listing not found',
        code: 'LISTING_NOT_FOUND',
      };
      return res.status(404).json(response);
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

/**
 * POST /api/marketplace/buy/prepare
 * Create unsigned transaction for buyer to sign
 */
router.post('/buy/prepare', sanitizeInput, validateWallet, async (req: Request, res: Response) => {
  try {
    const { mintAddress, buyer, seller, price } = req.body;

    if (!mintAddress || !buyer || !seller || !price) {
      const response: ApiResponse = {
        success: false,
        error: 'Missing required fields: mintAddress, buyer, seller, price',
        code: 'MISSING_FIELDS',
      };
      return res.status(400).json(response);
    }

    const result = await marketplaceService.createBuyTransaction({ 
      mintAddress, 
      buyer, 
      seller, 
      price 
    });

    if (result.success) {
      const response: ApiResponse = {
        success: true,
        data: {
          transaction: result.transaction,
        },
        message: 'Transaction created. Please sign and submit.',
      };
      return res.json(response);
    } else {
      const response: ApiResponse = {
        success: false,
        error: result.error || 'Failed to create transaction',
        code: 'CREATE_TX_FAILED',
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

/**
 * POST /api/marketplace/buy/confirm
 * Record successful purchase after transaction is confirmed
 */
router.post('/buy/confirm', sanitizeInput, async (req: Request, res: Response) => {
  try {
    const { mintAddress, buyer, seller, price, signature } = req.body;

    if (!mintAddress || !buyer || !seller || !price || !signature) {
      const response: ApiResponse = {
        success: false,
        error: 'Missing required fields: mintAddress, buyer, seller, price, signature',
        code: 'MISSING_FIELDS',
      };
      return res.status(400).json(response);
    }

    const result = await marketplaceService.recordSale({ 
      mintAddress, 
      buyer, 
      seller, 
      price, 
      signature 
    });

    if (result.success) {
      const response: ApiResponse = {
        success: true,
        message: 'Purchase recorded successfully',
      };
      return res.json(response);
    } else {
      const response: ApiResponse = {
        success: false,
        error: result.error || 'Failed to record purchase',
        code: 'RECORD_SALE_FAILED',
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

/**
 * GET /api/marketplace/sales
 * Get recent sales history
 */
router.get('/sales', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await marketplaceService.getSalesHistory(limit);

    if (result.success) {
      const response: ApiResponse = {
        success: true,
        data: { sales: result.sales },
      };
      return res.json(response);
    } else {
      const response: ApiResponse = {
        success: false,
        error: result.error || 'Failed to get sales history',
        code: 'GET_SALES_FAILED',
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

