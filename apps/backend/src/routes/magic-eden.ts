/**
 * Magic Eden Diamond Routes
 * Track Diamond points, rewards, and quest progress
 */

import { Router } from 'express';
import { getMagicEdenService } from '../services/magic-eden.service';
import logger from '../utils/logger';

const router = Router();

// Utility: Validate Solana wallet address (base58, 32-44 chars, excludes 0, O, I, l)
function isValidWallet(wallet: string): boolean {
  return typeof wallet === 'string' && /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(wallet);
}

/**
 * GET /api/magic-eden/diamonds/:wallet
 * Get Diamond status for a wallet
 */
router.get('/diamonds/:wallet', async (req, res) => {
  try {
    const { wallet } = req.params;

    if (!isValidWallet(wallet)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address',
      });
    }

    const meService = getMagicEdenService();
    const status = await meService.getDiamondStatus(wallet);

    if (!status) {
      return res.status(404).json({
        success: false,
        error: 'Could not fetch Diamond status',
      });
    }

    res.json({ success: true, data: status });
  } catch (error) {
    logger.error('Error fetching Diamond status:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch Diamond status' });
  }
});

/**
 * GET /api/magic-eden/quests/:wallet
 * Get available quests for a wallet
 */
router.get('/quests/:wallet', async (req, res) => {
  try {
    const { wallet } = req.params;

    if (!isValidWallet(wallet)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address',
      });
    }

    const meService = getMagicEdenService();
    const quests = await meService.getQuests(wallet);

    res.json({ success: true, data: quests, total: quests.length });
  } catch (error) {
    logger.error('Error fetching quests:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch quests' });
  }
});

/**
 * GET /api/magic-eden/tiers
 * Get all Diamond tiers info
 */
router.get('/tiers', (req, res) => {
  try {
    const meService = getMagicEdenService();
    const tiers = meService.getAllTiers();

    res.json({ success: true, data: tiers });
  } catch (error) {
    logger.error('Error fetching tiers:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch tiers' });
  }
});

/**
 * GET /api/magic-eden/collection/:symbol
 * Get collection stats from Magic Eden
 */
router.get('/collection/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;

    const meService = getMagicEdenService();
    const stats = await meService.getCollectionStats(symbol);

    if (!stats) {
      return res.status(404).json({
        success: false,
        error: 'Collection not found',
      });
    }

    res.json({ success: true, data: stats });
  } catch (error) {
    logger.error('Error fetching collection stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch collection' });
  }
});

export default router;
