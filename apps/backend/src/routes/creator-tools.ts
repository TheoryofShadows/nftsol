import { Router } from 'express';
import { getCreatorToolsService } from '../services/creator-tools.service';
import { createLogger } from '../lib/logger';
import { verifyAuth } from '../middleware/auth';

const router = Router();
const logger = createLogger('creator-tools-route');

/**
 * POST /api/v1/creators/profile/init
 * Initialize creator profile
 */
router.post('/profile/init', verifyAuth, (req, res) => {
  try {
    const userId = req.user?.id;
    const username = req.user?.username || userId;

    const creatorService = getCreatorToolsService();
    const profile = creatorService.initializeCreator(userId, username);

    res.json({ profile });
  } catch (error) {
    logger.error('Error initializing creator profile:', error);
    res.status(500).json({ error: 'Failed to initialize creator profile' });
  }
});

/**
 * GET /api/v1/creators/profile
 * Get creator's profile
 */
router.get('/profile', verifyAuth, (req, res) => {
  try {
    const userId = req.user?.id;
    const creatorService = getCreatorToolsService();
    const profile = creatorService.getCreatorProfile(userId);

    if (!profile) {
      return res.status(404).json({ error: 'Creator profile not found' });
    }

    res.json({ profile });
  } catch (error) {
    logger.error('Error fetching creator profile:', error);
    res.status(500).json({ error: 'Failed to fetch creator profile' });
  }
});

/**
 * PATCH /api/v1/creators/profile
 * Update creator profile
 */
router.patch('/profile', verifyAuth, (req, res) => {
  try {
    const userId = req.user?.id;
    const updates = req.body;

    const creatorService = getCreatorToolsService();
    const profile = creatorService.updateCreatorProfile(userId, updates);

    if (!profile) {
      return res.status(404).json({ error: 'Creator profile not found' });
    }

    res.json({ profile });
  } catch (error) {
    logger.error('Error updating creator profile:', error);
    res.status(500).json({ error: 'Failed to update creator profile' });
  }
});

/**
 * POST /api/v1/creators/royalties/configure
 * Configure royalty settings
 */
router.post('/royalties/configure', verifyAuth, (req, res) => {
  try {
    const userId = req.user?.id;
    const { royaltyPercentage, recipients, minPriceThreshold = 0.1 } = req.body;

    if (!royaltyPercentage || !recipients || !Array.isArray(recipients)) {
      return res.status(400).json({ error: 'Invalid royalty configuration' });
    }

    const creatorService = getCreatorToolsService();
    const config = creatorService.configureRoyalties(
      userId,
      royaltyPercentage,
      recipients,
      minPriceThreshold
    );

    res.json({ config });
  } catch (error) {
    logger.error('Error configuring royalties:', error);
    res.status(500).json({ error: 'Failed to configure royalties' });
  }
});

/**
 * GET /api/v1/creators/royalties/config
 * Get creator's royalty configuration
 */
router.get('/royalties/config', verifyAuth, (req, res) => {
  try {
    const userId = req.user?.id;
    const creatorService = getCreatorToolsService();
    const config = creatorService.getRoyaltyConfig(userId);

    if (!config) {
      return res.json({ message: 'No royalty configuration set' });
    }

    res.json({ config });
  } catch (error) {
    logger.error('Error fetching royalty config:', error);
    res.status(500).json({ error: 'Failed to fetch royalty config' });
  }
});

/**
 * POST /api/v1/creators/metadata/generate
 * Generate NFT metadata template
 */
router.post('/metadata/generate', (req, res) => {
  try {
    const { name, description, imageUrl, attributes = {}, externalUrl } = req.body;

    if (!name || !description || !imageUrl) {
      return res.status(400).json({ error: 'Missing required metadata fields' });
    }

    const creatorService = getCreatorToolsService();
    const metadata = creatorService.generateNFTMetadata(
      name,
      description,
      imageUrl,
      attributes,
      externalUrl
    );

    res.json({ metadata });
  } catch (error) {
    logger.error('Error generating metadata:', error);
    res.status(500).json({ error: 'Failed to generate metadata' });
  }
});

/**
 * GET /api/v1/creators/analytics
 * Get creator analytics
 */
router.get('/analytics', verifyAuth, (req, res) => {
  try {
    const userId = req.user?.id;
    const { period = 'monthly' } = req.query;

    const creatorService = getCreatorToolsService();
    const analytics = creatorService.getCreatorAnalytics(userId, period as 'daily' | 'weekly' | 'monthly');

    res.json({ data: analytics, period });
  } catch (error) {
    logger.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

/**
 * GET /api/v1/creators/dashboard
 * Get creator dashboard summary
 */
router.get('/dashboard', verifyAuth, (req, res) => {
  try {
    const userId = req.user?.id;
    const creatorService = getCreatorToolsService();
    const dashboard = creatorService.getCreatorDashboard(userId);

    res.json(dashboard);
  } catch (error) {
    logger.error('Error fetching dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard' });
  }
});

/**
 * GET /api/v1/creators/verify/:creatorId
 * Verify a creator (admin only)
 */
router.get('/verify/:creatorId', verifyAuth, (req, res) => {
  try {
    const { creatorId } = req.params;
    const { badgeLevel = 'silver' } = req.query;

    // TODO: Check if user is admin

    const creatorService = getCreatorToolsService();
    const success = creatorService.verifyCreator(creatorId, badgeLevel as 'silver' | 'gold' | 'platinum');

    if (!success) {
      return res.status(404).json({ error: 'Creator not found' });
    }

    res.json({ success: true, message: `Creator verified with ${badgeLevel} badge` });
  } catch (error) {
    logger.error('Error verifying creator:', error);
    res.status(500).json({ error: 'Failed to verify creator' });
  }
});

/**
 * GET /api/v1/creators/top
 * Get top creators by volume or followers
 */
router.get('/top', (req, res) => {
  try {
    const { limit = 10, sort = 'volume' } = req.query;

    const creatorService = getCreatorToolsService();
    const creators =
      sort === 'followers'
        ? creatorService.getTopCreatorsByFollowers(parseInt(limit as string))
        : creatorService.getTopCreators(parseInt(limit as string));

    res.json({ data: creators, sort, limit });
  } catch (error) {
    logger.error('Error fetching top creators:', error);
    res.status(500).json({ error: 'Failed to fetch top creators' });
  }
});

/**
 * POST /api/v1/creators/:creatorId/follow
 * Follow a creator
 */
router.post('/:creatorId/follow', verifyAuth, (req, res) => {
  try {
    const { creatorId } = req.params;

    const creatorService = getCreatorToolsService();
    const success = creatorService.followCreator(creatorId);

    if (!success) {
      return res.status(404).json({ error: 'Creator not found' });
    }

    res.json({ success: true, message: 'Following creator' });
  } catch (error) {
    logger.error('Error following creator:', error);
    res.status(500).json({ error: 'Failed to follow creator' });
  }
});

/**
 * POST /api/v1/creators/metadata/batch-update
 * Batch update NFT metadata
 */
router.post('/metadata/batch-update', verifyAuth, (req, res) => {
  try {
    const { nfts } = req.body;

    if (!nfts || !Array.isArray(nfts)) {
      return res.status(400).json({ error: 'Invalid nfts data' });
    }

    const creatorService = getCreatorToolsService();
    const result = creatorService.batchUpdateMetadata(nfts);

    res.json(result);
  } catch (error) {
    logger.error('Error batch updating metadata:', error);
    res.status(500).json({ error: 'Failed to batch update metadata' });
  }
});

export default router;
