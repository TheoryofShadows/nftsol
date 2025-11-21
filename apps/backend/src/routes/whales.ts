/**
 * Whale Tracker Routes
 * Track top NFT wallets and their movements
 */

import { Router } from 'express';
import { getWhaleTrackerService } from '../services/whale-tracker.service';
import logger from '../utils/logger';

const router = Router();

/**
 * GET /api/whales/top
 * Get top whales by holdings/volume
 */
router.get('/top', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);

    const whaleService = getWhaleTrackerService();
    const whales = await whaleService.getTopWhales(limit);

    res.json({ success: true, data: whales, total: whales.length });
  } catch (error) {
    logger.error('Error fetching top whales:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch whales' });
  }
});

/**
 * GET /api/whales/activity
 * Get recent whale activity
 */
router.get('/activity', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);

    const whaleService = getWhaleTrackerService();
    const activity = await whaleService.getRecentActivity(limit);

    res.json({ success: true, data: activity, total: activity.length });
  } catch (error) {
    logger.error('Error fetching whale activity:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch activity' });
  }
});

/**
 * GET /api/whales/details/:address
 * Get whale details
 */
router.get('/details/:address', async (req, res) => {
  try {
    const { address } = req.params;

    if (!address || address.length < 32) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address',
      });
    }

    const whaleService = getWhaleTrackerService();
    const whale = await whaleService.getWhaleDetails(address);

    if (!whale) {
      return res.status(404).json({
        success: false,
        error: 'Whale not found',
      });
    }

    res.json({ success: true, data: whale });
  } catch (error) {
    logger.error('Error fetching whale details:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch details' });
  }
});

/**
 * POST /api/whales/follow
 * Follow a whale
 */
router.post('/follow', async (req, res) => {
  try {
    const { userWallet, whaleWallet } = req.body;

    if (!userWallet || !whaleWallet) {
      return res.status(400).json({
        success: false,
        error: 'userWallet and whaleWallet are required',
      });
    }

    const whaleService = getWhaleTrackerService();
    const success = await whaleService.followWhale(userWallet, whaleWallet);

    res.json({ success, message: success ? 'Now following whale' : 'Failed to follow' });
  } catch (error) {
    logger.error('Error following whale:', error);
    res.status(500).json({ success: false, error: 'Failed to follow whale' });
  }
});

/**
 * POST /api/whales/unfollow
 * Unfollow a whale
 */
router.post('/unfollow', async (req, res) => {
  try {
    const { userWallet, whaleWallet } = req.body;

    if (!userWallet || !whaleWallet) {
      return res.status(400).json({
        success: false,
        error: 'userWallet and whaleWallet are required',
      });
    }

    const whaleService = getWhaleTrackerService();
    const success = await whaleService.unfollowWhale(userWallet, whaleWallet);

    res.json({ success, message: success ? 'Unfollowed whale' : 'Failed to unfollow' });
  } catch (error) {
    logger.error('Error unfollowing whale:', error);
    res.status(500).json({ success: false, error: 'Failed to unfollow' });
  }
});

/**
 * GET /api/whales/following/:wallet
 * Get whales a user is following
 */
router.get('/following/:wallet', async (req, res) => {
  try {
    const { wallet } = req.params;

    const whaleService = getWhaleTrackerService();
    const whales = await whaleService.getFollowedWhales(wallet);

    res.json({ success: true, data: whales, total: whales.length });
  } catch (error) {
    logger.error('Error fetching followed whales:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch followed whales' });
  }
});

/**
 * POST /api/whales/track
 * Add a wallet to whale tracking
 */
router.post('/track', async (req, res) => {
  try {
    const { address, displayName } = req.body;

    if (!address || address.length < 32) {
      return res.status(400).json({
        success: false,
        error: 'Valid wallet address is required',
      });
    }

    const whaleService = getWhaleTrackerService();
    const success = await whaleService.addWhale(address, displayName);

    res.json({ success, message: success ? 'Whale added to tracking' : 'Failed to add whale' });
  } catch (error) {
    logger.error('Error tracking whale:', error);
    res.status(500).json({ success: false, error: 'Failed to track whale' });
  }
});

export default router;
