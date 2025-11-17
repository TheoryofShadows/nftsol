import { Router } from 'express';
import { getWebSocketService } from '../services/websocket.service';
import logger from '../utils/logger';

const router = Router();

/**
 * GET /api/v1/activity/feed
 * Get paginated activity feed
 */
router.get('/feed', (req, res) => {
  try {
    const { limit = 50, offset = 0, type } = req.query;
    const wsService = getWebSocketService();

    let history = wsService.getActivityHistory(parseInt(limit as string) + parseInt(offset as string));

    // Filter by type if specified
    if (type) {
      history = history.filter(h => h.type === type);
    }

    const paginated = history.slice(
      Math.max(0, history.length - parseInt(offset as string) - parseInt(limit as string)),
      history.length - parseInt(offset as string)
    );

    res.json({
      data: paginated.reverse(),
      total: history.length,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });
  } catch (error) {
    logger.error('Error fetching activity feed:', error);
    res.status(500).json({ error: 'Failed to fetch activity feed' });
  }
});

/**
 * GET /api/v1/activity/nft/:nftMint
 * Get activity for specific NFT
 */
router.get('/nft/:nftMint', (req, res) => {
  try {
    const { nftMint } = req.params;
    const { limit = 50 } = req.query;
    const wsService = getWebSocketService();

    const history = wsService
      .getActivityHistory(parseInt(limit as string))
      .filter(h => h.data?.nftMint === nftMint || h.data?.mint === nftMint)
      .reverse();

    res.json({
      data: history,
      nftMint,
      total: history.length,
    });
  } catch (error) {
    logger.error('Error fetching NFT activity:', error);
    res.status(500).json({ error: 'Failed to fetch NFT activity' });
  }
});

/**
 * GET /api/v1/activity/user/:userId
 * Get activity by specific user
 */
router.get('/user/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50 } = req.query;
    const wsService = getWebSocketService();

    const history = wsService
      .getActivityHistory(parseInt(limit as string))
      .filter(h => h.userId === userId)
      .reverse();

    res.json({
      data: history,
      userId,
      total: history.length,
    });
  } catch (error) {
    logger.error('Error fetching user activity:', error);
    res.status(500).json({ error: 'Failed to fetch user activity' });
  }
});

/**
 * GET /api/v1/activity/stats
 * Get real-time marketplace stats
 */
router.get('/stats', (req, res) => {
  try {
    const wsService = getWebSocketService();
    const history = wsService.getActivityHistory(1000);

    const stats = {
      activeUsers: wsService.getActiveUsersCount(),
      totalEvents: history.length,
      eventsByType: {
        nft_created: history.filter(h => h.type === 'nft_created').length,
        nft_sold: history.filter(h => h.type === 'nft_sold').length,
        offer_made: history.filter(h => h.type === 'offer_made').length,
        user_followed: history.filter(h => h.type === 'user_followed').length,
        collection_created: history.filter(h => h.type === 'collection_created').length,
        clout_earned: history.filter(h => h.type === 'clout_earned').length,
      },
      recentActivity: history.slice(-20).reverse(),
    };

    res.json(stats);
  } catch (error) {
    logger.error('Error fetching activity stats:', error);
    res.status(500).json({ error: 'Failed to fetch activity stats' });
  }
});

/**
 * GET /api/v1/activity/trending
 * Get trending NFTs and collections based on recent activity
 */
router.get('/trending', (req, res) => {
  try {
    const { timeframe = '24h' } = req.query;
    const wsService = getWebSocketService();

    // For now, return based on activity history
    // In production, this would query a database with proper time filtering
    const history = wsService.getActivityHistory(500);

    const trendingNFTs = new Map<string, number>();
    const trendingCollections = new Map<string, number>();

    history.forEach(event => {
      if (event.data?.nftMint) {
        trendingNFTs.set(event.data.nftMint, (trendingNFTs.get(event.data.nftMint) || 0) + 1);
      }
      if (event.data?.collectionId) {
        trendingCollections.set(
          event.data.collectionId,
          (trendingCollections.get(event.data.collectionId) || 0) + 1
        );
      }
    });

    const topNFTs = Array.from(trendingNFTs.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([mint, count]) => ({ mint, activityCount: count }));

    const topCollections = Array.from(trendingCollections.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id, count]) => ({ id, activityCount: count }));

    res.json({
      timeframe,
      trendingNFTs,
      trendingCollections,
    });
  } catch (error) {
    logger.error('Error fetching trending:', error);
    res.status(500).json({ error: 'Failed to fetch trending data' });
  }
});

export default router;
