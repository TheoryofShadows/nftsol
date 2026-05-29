/**
 * 🏪 Marketplace Browse Routes
 * Browse ALL NFTs available on Solana using Helius DAS API
 */

import logger from '../utils/logger';
import { Router, Request, Response } from 'express';
import { heliusService } from '../services/helius';
import { marketplaceService } from '../services/marketplace';

const router = Router();

/**
 * GET /api/marketplace/browse
 * Browse all available NFTs on Solana
 * Query params:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 50, max: 100)
 * - collection: Filter by collection address
 * - minPrice: Minimum price in SOL
 * - maxPrice: Maximum price in SOL
 * - sortBy: 'price_asc', 'price_desc', 'recent', 'popular'
 */
router.get('/browse', async (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      limit = '50',
      collection,
      minPrice,
      maxPrice,
      sortBy = 'recent',
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = Math.min(parseInt(limit as string, 10), 100);

    // Fetch all listings from our database
    const listings = await marketplaceService.getAllListings({
      page: pageNum,
      limit: limitNum,
      collection: collection as string | undefined,
      minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
      sortBy: sortBy as string,
    });

    res.json({
      success: true,
      data: {
        items: listings.items,
        total: listings.total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(listings.total / limitNum),
      },
    });
  } catch (error) {
    logger.error('[MarketplaceBrowse] Error fetching listings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch NFT listings',
    });
  }
});

/**
 * GET /api/marketplace/browse/collections
 * Get all available collections with stats
 */
router.get('/browse/collections', async (req: Request, res: Response) => {
  try {
    const collections = await marketplaceService.getAllCollections();

    res.json({
      success: true,
      data: collections,
    });
  } catch (error) {
    logger.error('[MarketplaceBrowse] Error fetching collections:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch collections',
    });
  }
});

/**
 * GET /api/marketplace/browse/collection/:address
 * Browse NFTs from a specific collection
 */
router.get('/browse/collection/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const { page = '1', limit = '50' } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = Math.min(parseInt(limit as string, 10), 100);

    // Use Helius DAS API to get all NFTs from this collection
    const heliusAssets = await heliusService.getAssetsByCollection(address, {
      page: pageNum,
      limit: limitNum,
    });

    // Transform to our NFT format
    const nfts = heliusAssets.items.map(asset => ({
      id: asset.id,
      mintAddress: asset.id,
      name: asset.content?.metadata?.name || 'Unknown',
      symbol: asset.content?.metadata?.symbol || '',
      description: asset.content?.metadata?.description || '',
      imageUrl: asset.content?.links?.image || '',
      externalUrl: asset.content?.links?.external_url || '',
      owner: asset.ownership?.owner || '',
      price: null, // Will be filled if listed
      listed: false,
      compressed: asset.compression?.compressed || false,
      collection: address,
    }));

    res.json({
      success: true,
      data: {
        items: nfts,
        total: heliusAssets.total,
        page: pageNum,
        limit: limitNum,
        collection: address,
      },
    });
  } catch (error) {
    logger.error('[MarketplaceBrowse] Error fetching collection:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch collection NFTs',
    });
  }
});

/**
 * GET /api/marketplace/browse/search
 * Search NFTs across all collections
 */
router.get('/browse/search', async (req: Request, res: Response) => {
  try {
    const { query, page = '1', limit = '50' } = req.query;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Search query is required',
      });
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = Math.min(parseInt(limit as string, 10), 100);

    // Search in our database first
    const results = await marketplaceService.searchNFTs(query, {
      page: pageNum,
      limit: limitNum,
    });

    res.json({
      success: true,
      data: {
        items: results.items,
        total: results.total,
        page: pageNum,
        limit: limitNum,
        query,
      },
    });
  } catch (error) {
    logger.error('[MarketplaceBrowse] Error searching NFTs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search NFTs',
    });
  }
});

/**
 * GET /api/marketplace/browse/trending
 * Get trending NFTs (most views/sales in last 24h)
 */
router.get('/browse/trending', async (req: Request, res: Response) => {
  try {
    const { limit = '20' } = req.query;
    const limitNum = Math.min(parseInt(limit as string, 10), 100);

    const trending = await marketplaceService.getTrendingNFTs(limitNum);

    res.json({
      success: true,
      data: trending,
    });
  } catch (error) {
    logger.error('[MarketplaceBrowse] Error fetching trending:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trending NFTs',
    });
  }
});

/**
 * GET /api/marketplace/browse/featured
 * Get featured NFTs (manually curated or high quality)
 */
router.get('/browse/featured', async (req: Request, res: Response) => {
  try {
    const { limit = '10' } = req.query;
    const limitNum = Math.min(parseInt(limit as string, 10), 50);

    const featured = await marketplaceService.getFeaturedNFTs(limitNum);

    res.json({
      success: true,
      data: featured,
    });
  } catch (error) {
    logger.error('[MarketplaceBrowse] Error fetching featured:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch featured NFTs',
    });
  }
});

export default router;

