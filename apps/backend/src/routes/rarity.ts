import { Router } from 'express';
import { getRarityService } from '../services/rarity.service';
import logger from '../utils/logger';
import { standardLimiter } from '../middleware/rate-limiting';

const router = Router();

/**
 * POST /api/v1/rarity/index-collection
 * Index collection for rarity calculations
 */
router.post('/index-collection', standardLimiter, (req, res) => {
  try {
    const { collectionId, nfts, floorPrice = 0, averagePrice = 0 } = req.body;

    if (!collectionId || !nfts || !Array.isArray(nfts)) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const rarityService = getRarityService();
    const stats = rarityService.indexCollection(collectionId, nfts, floorPrice, averagePrice);

    res.json({ stats });
  } catch (error) {
    logger.error('Error indexing collection:', error);
    res.status(500).json({ error: 'Failed to index collection' });
  }
});

/**
 * GET /api/v1/rarity/:nftMint
 * Get rarity score for NFT
 */
router.get('/:nftMint', (req, res) => {
  try {
    const { nftMint } = req.params;
    const rarityService = getRarityService();
    const rarity = rarityService.getRarity(nftMint);

    if (!rarity) {
      return res.status(404).json({ error: 'NFT rarity not found' });
    }

    res.json({ rarity });
  } catch (error) {
    logger.error('Error fetching rarity:', error);
    res.status(500).json({ error: 'Failed to fetch rarity' });
  }
});

/**
 * GET /api/v1/rarity/collection/:collectionId/top
 * Get top rarest NFTs in collection
 */
router.get('/collection/:collectionId/top', (req, res) => {
  try {
    const { collectionId } = req.params;
    const { limit = 10 } = req.query;

    const rarityService = getRarityService();
    const nfts = rarityService.getTopRareNFTs(collectionId, parseInt(limit as string));

    res.json({ nfts, total: nfts.length });
  } catch (error) {
    logger.error('Error fetching top rare NFTs:', error);
    res.status(500).json({ error: 'Failed to fetch top rare NFTs' });
  }
});

/**
 * GET /api/v1/rarity/collection/:collectionId/distribution
 * Get rarity distribution in collection
 */
router.get('/collection/:collectionId/distribution', (req, res) => {
  try {
    const { collectionId } = req.params;
    const rarityService = getRarityService();
    const distribution = rarityService.getRarityDistribution(collectionId);

    res.json({ distribution });
  } catch (error) {
    logger.error('Error fetching rarity distribution:', error);
    res.status(500).json({ error: 'Failed to fetch rarity distribution' });
  }
});

/**
 * GET /api/v1/rarity/collection/:collectionId/stats
 * Get collection rarity statistics
 */
router.get('/collection/:collectionId/stats', (req, res) => {
  try {
    const { collectionId } = req.params;
    const rarityService = getRarityService();
    const stats = rarityService.getCollectionStats(collectionId);

    if (!stats) {
      return res.status(404).json({ error: 'Collection stats not found' });
    }

    res.json({ stats });
  } catch (error) {
    logger.error('Error fetching collection stats:', error);
    res.status(500).json({ error: 'Failed to fetch collection stats' });
  }
});

/**
 * GET /api/v1/rarity/collection/:collectionId/by-percentile
 * Get NFTs by rarity percentile
 */
router.get('/collection/:collectionId/by-percentile', (req, res) => {
  try {
    const { collectionId } = req.params;
    const { minPercentile = 0, maxPercentile = 100, limit = 50 } = req.query;

    const rarityService = getRarityService();
    const nfts = rarityService.getNFTsByPercentile(
      collectionId,
      parseInt(minPercentile as string),
      parseInt(maxPercentile as string),
      parseInt(limit as string)
    );

    res.json({ nfts, total: nfts.length });
  } catch (error) {
    logger.error('Error fetching NFTs by percentile:', error);
    res.status(500).json({ error: 'Failed to fetch NFTs by percentile' });
  }
});

/**
 * POST /api/v1/rarity/find-by-traits
 * Find NFTs with specific traits
 */
router.post('/find-by-traits', standardLimiter, (req, res) => {
  try {
    const { collectionId, traits, limit = 50 } = req.body;

    if (!collectionId || !traits) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const rarityService = getRarityService();
    const nfts = rarityService.findByTraits(collectionId, traits, parseInt(limit as string));

    res.json({ nfts, total: nfts.length });
  } catch (error) {
    logger.error('Error finding NFTs by traits:', error);
    res.status(500).json({ error: 'Failed to find NFTs by traits' });
  }
});

/**
 * POST /api/v1/rarity/price-prediction
 * Predict NFT price based on rarity
 */
router.post('/price-prediction', standardLimiter, (req, res) => {
  try {
    const { nftMint, collectionFloorPrice, recentSalePrices = [] } = req.body;

    if (!nftMint || collectionFloorPrice === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const rarityService = getRarityService();
    const prediction = rarityService.predictPrice(nftMint, collectionFloorPrice, recentSalePrices);

    res.json({ prediction });
  } catch (error) {
    logger.error('Error predicting price:', error);
    res.status(500).json({ error: 'Failed to predict price' });
  }
});

export default router;
