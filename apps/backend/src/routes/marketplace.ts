/**
 * 🏪 Marketplace API Routes
 * Buy, sell, and list NFTs
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import { marketplaceService } from '../services/marketplace';
import { crossPlatformMarketplace } from '../services/cross-platform-marketplace';
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

/**
 * GET /api/marketplace/all
 * Get listings from ALL platforms (local + Magic Eden + Tensor)
 * 🌐 Cross-Platform Marketplace - Shows NFTs from entire Solana ecosystem!
 */
router.get('/all', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined;
    const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined;
    const collection = req.query.collection as string | undefined;

    console.log('[Marketplace] Fetching cross-platform listings...');

    const result = await crossPlatformMarketplace.getAllListings({
      limit,
      minPrice,
      maxPrice,
      collection,
    });

    if (result.success) {
      const response: ApiResponse = {
        success: true,
        data: {
          listings: result.listings || [],
          total: result.total || 0,
          platforms: ['local', 'magic-eden', 'tensor'],
        },
        message: `Found ${result.total || 0} listings across all platforms`,
      };
      return res.json(response);
    } else {
      const response: ApiResponse = {
        success: false,
        error: result.error || 'Failed to fetch cross-platform listings',
        code: 'CROSS_PLATFORM_FETCH_FAILED',
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
 * GET /api/marketplace/search
 * Search NFTs across ALL platforms
 * 🔍 Universal NFT Search!
 */
router.get('/search', async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;

    if (!query || query.trim().length === 0) {
      const response: ApiResponse = {
        success: false,
        error: 'Search query is required',
        code: 'MISSING_QUERY',
      };
      return res.status(400).json(response);
    }

    const limit = parseInt(req.query.limit as string) || 50;

    console.log(`[Marketplace] Searching for: "${query}"`);

    const result = await crossPlatformMarketplace.searchNFTs(query, { limit });

    if (result.success) {
      const response: ApiResponse = {
        success: true,
        data: {
          results: result.results || [],
          total: result.results?.length || 0,
          query,
        },
        message: `Found ${result.results?.length || 0} results for "${query}"`,
      };
      return res.json(response);
    } else {
      const response: ApiResponse = {
        success: false,
        error: result.error || 'Search failed',
        code: 'SEARCH_FAILED',
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

