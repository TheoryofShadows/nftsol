/**
 * Tensor Trade API Routes
 * Real-time orderbook data from Tensor marketplace
 */

import { Router } from 'express';
import { getTensorService } from '../services/tensor.service';
import logger from '../utils/logger';

const router = Router();

/**
 * GET /api/tensor/orderbook/:collection
 * Get real-time orderbook (bids + listings) for a collection
 */
router.get('/orderbook/:collection', async (req, res) => {
  try {
    const { collection } = req.params;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

    if (!collection) {
      return res.status(400).json({
        success: false,
        error: 'Collection slug is required',
        code: 'MISSING_COLLECTION',
      });
    }

    const tensorService = getTensorService();
    const orderbook = await tensorService.getOrderbook(collection, limit);

    if (!orderbook) {
      return res.status(404).json({
        success: false,
        error: 'Collection not found or Tensor API unavailable',
        code: 'COLLECTION_NOT_FOUND',
      });
    }

    res.json({
      success: true,
      data: orderbook,
      source: 'tensor',
    });
  } catch (error) {
    logger.error('Error fetching Tensor orderbook:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch orderbook',
      code: 'TENSOR_ERROR',
    });
  }
});

/**
 * GET /api/tensor/stats/:collection
 * Get collection statistics
 */
router.get('/stats/:collection', async (req, res) => {
  try {
    const { collection } = req.params;

    if (!collection) {
      return res.status(400).json({
        success: false,
        error: 'Collection slug is required',
        code: 'MISSING_COLLECTION',
      });
    }

    const tensorService = getTensorService();
    const stats = await tensorService.getCollectionStats(collection);

    if (!stats) {
      return res.status(404).json({
        success: false,
        error: 'Collection not found',
        code: 'COLLECTION_NOT_FOUND',
      });
    }

    res.json({
      success: true,
      data: stats,
      source: 'tensor',
    });
  } catch (error) {
    logger.error('Error fetching Tensor stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch collection stats',
      code: 'TENSOR_ERROR',
    });
  }
});

/**
 * GET /api/tensor/history/:collection
 * Get price history for charts
 */
router.get('/history/:collection', async (req, res) => {
  try {
    const { collection } = req.params;
    const period = (req.query.period as '24h' | '7d' | '30d' | 'all') || '7d';

    if (!collection) {
      return res.status(400).json({
        success: false,
        error: 'Collection slug is required',
        code: 'MISSING_COLLECTION',
      });
    }

    const validPeriods = ['24h', '7d', '30d', 'all'];
    if (!validPeriods.includes(period)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid period. Use: 24h, 7d, 30d, or all',
        code: 'INVALID_PERIOD',
      });
    }

    const tensorService = getTensorService();
    const history = await tensorService.getPriceHistory(collection, period);

    res.json({
      success: true,
      data: {
        collection,
        period,
        history,
        points: history.length,
      },
      source: 'tensor',
    });
  } catch (error) {
    logger.error('Error fetching Tensor price history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch price history',
      code: 'TENSOR_ERROR',
    });
  }
});

/**
 * GET /api/tensor/trending
 * Get trending collections
 */
router.get('/trending', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

    const tensorService = getTensorService();
    const collections = await tensorService.getTrendingCollections(limit);

    res.json({
      success: true,
      data: collections,
      total: collections.length,
      source: 'tensor',
    });
  } catch (error) {
    logger.error('Error fetching trending collections:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trending collections',
      code: 'TENSOR_ERROR',
    });
  }
});

/**
 * GET /api/tensor/search
 * Search collections
 */
router.get('/search', async (req, res) => {
  try {
    const query = req.query.q as string;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

    if (!query || query.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Search query must be at least 2 characters',
        code: 'INVALID_QUERY',
      });
    }

    const tensorService = getTensorService();
    const results = await tensorService.searchCollections(query, limit);

    res.json({
      success: true,
      data: results,
      total: results.length,
      query,
      source: 'tensor',
    });
  } catch (error) {
    logger.error('Error searching Tensor collections:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search collections',
      code: 'TENSOR_ERROR',
    });
  }
});

/**
 * POST /api/tensor/buy-tx
 * Get instant buy transaction (requires buyer wallet)
 */
router.post('/buy-tx', async (req, res) => {
  try {
    const { mint, buyer, maxPrice } = req.body;

    if (!mint || !buyer) {
      return res.status(400).json({
        success: false,
        error: 'mint and buyer are required',
        code: 'MISSING_FIELDS',
      });
    }

    const tensorService = getTensorService();
    const txData = await tensorService.getInstantBuyTx(mint, buyer, maxPrice);

    if (!txData) {
      return res.status(400).json({
        success: false,
        error: 'Failed to generate buy transaction. NFT may be unlisted or sold.',
        code: 'TX_GENERATION_FAILED',
      });
    }

    res.json({
      success: true,
      data: txData,
      source: 'tensor',
    });
  } catch (error) {
    logger.error('Error generating Tensor buy tx:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate buy transaction',
      code: 'TENSOR_ERROR',
    });
  }
});

/**
 * GET /api/tensor/floor/:collection
 * Quick floor price lookup
 */
router.get('/floor/:collection', async (req, res) => {
  try {
    const { collection } = req.params;

    const tensorService = getTensorService();
    const orderbook = await tensorService.getOrderbook(collection, 1);

    if (!orderbook) {
      return res.status(404).json({
        success: false,
        error: 'Collection not found',
        code: 'COLLECTION_NOT_FOUND',
      });
    }

    res.json({
      success: true,
      data: {
        collection: orderbook.collection,
        slug: orderbook.slug,
        floorPrice: orderbook.floorPrice,
        floorPriceLamports: orderbook.floorPriceLamports,
        topBid: orderbook.topBid,
        spread: orderbook.spread,
        spreadPercent: orderbook.spreadPercent,
        numListed: orderbook.numListed,
        updatedAt: orderbook.updatedAt,
      },
      source: 'tensor',
    });
  } catch (error) {
    logger.error('Error fetching floor price:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch floor price',
      code: 'TENSOR_ERROR',
    });
  }
});

export default router;
