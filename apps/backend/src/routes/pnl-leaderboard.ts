/**
 * PnL Leaderboard Routes
 * Portfolio profit/loss tracking and competitive leaderboards
 */

import { Router } from 'express';
import { getPnLService } from '../services/pnl.service';
import logger from '../utils/logger';

const router = Router();

/**
 * GET /api/pnl/leaderboard
 * Get the PnL leaderboard
 */
router.get('/leaderboard', async (req, res) => {
  try {
    const period = (req.query.period as 'daily' | 'weekly' | 'monthly') || 'daily';
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    const validPeriods = ['daily', 'weekly', 'monthly'];
    if (!validPeriods.includes(period)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid period. Use: daily, weekly, or monthly',
        code: 'INVALID_PERIOD',
      });
    }

    const pnlService = getPnLService();
    const leaderboard = await pnlService.getLeaderboard(period, limit, offset);

    res.json({
      success: true,
      data: {
        period,
        entries: leaderboard,
        total: leaderboard.length,
        limit,
        offset,
      },
    });
  } catch (error) {
    logger.error('Error fetching PnL leaderboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch leaderboard',
      code: 'PNL_ERROR',
    });
  }
});

/**
 * GET /api/pnl/wallet/:address
 * Get PnL for a specific wallet
 */
router.get('/wallet/:address', async (req, res) => {
  try {
    const { address } = req.params;

    if (!address || address.length < 32 || address.length > 44) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address',
        code: 'INVALID_ADDRESS',
      });
    }

    const pnlService = getPnLService();
    const pnl = await pnlService.getPnL(address);

    if (!pnl) {
      return res.status(404).json({
        success: false,
        error: 'No PnL data found for this wallet',
        code: 'NOT_FOUND',
      });
    }

    // Also get rank
    const rank = await pnlService.getUserRank(address, 'daily');

    res.json({
      success: true,
      data: {
        ...pnl,
        rank,
      },
    });
  } catch (error) {
    logger.error('Error fetching wallet PnL:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch PnL data',
      code: 'PNL_ERROR',
    });
  }
});

/**
 * POST /api/pnl/snapshot
 * Take a portfolio snapshot (track wallet)
 */
router.post('/snapshot', async (req, res) => {
  try {
    const { wallet } = req.body;

    if (!wallet || wallet.length < 32 || wallet.length > 44) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address',
        code: 'INVALID_ADDRESS',
      });
    }

    const pnlService = getPnLService();
    const snapshot = await pnlService.takeSnapshot(wallet);

    if (!snapshot) {
      return res.status(500).json({
        success: false,
        error: 'Failed to take snapshot',
        code: 'SNAPSHOT_FAILED',
      });
    }

    res.json({
      success: true,
      data: snapshot,
      message: 'Portfolio snapshot recorded successfully',
    });
  } catch (error) {
    logger.error('Error taking snapshot:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to take snapshot',
      code: 'PNL_ERROR',
    });
  }
});

/**
 * GET /api/pnl/rank/:address
 * Get user's rank on leaderboard
 */
router.get('/rank/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const period = (req.query.period as 'daily' | 'weekly' | 'monthly') || 'daily';

    if (!address || address.length < 32 || address.length > 44) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address',
        code: 'INVALID_ADDRESS',
      });
    }

    const pnlService = getPnLService();
    const rank = await pnlService.getUserRank(address, period);

    res.json({
      success: true,
      data: {
        wallet: address,
        rank,
        period,
      },
    });
  } catch (error) {
    logger.error('Error fetching rank:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch rank',
      code: 'PNL_ERROR',
    });
  }
});

/**
 * POST /api/pnl/display-name
 * Set display name for leaderboard
 */
router.post('/display-name', async (req, res) => {
  try {
    const { wallet, displayName } = req.body;

    if (!wallet || wallet.length < 32 || wallet.length > 44) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address',
        code: 'INVALID_ADDRESS',
      });
    }

    if (!displayName || displayName.length < 2 || displayName.length > 20) {
      return res.status(400).json({
        success: false,
        error: 'Display name must be 2-20 characters',
        code: 'INVALID_NAME',
      });
    }

    const pnlService = getPnLService();
    const success = await pnlService.setDisplayName(wallet, displayName);

    if (!success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to set display name',
        code: 'UPDATE_FAILED',
      });
    }

    res.json({
      success: true,
      message: 'Display name updated successfully',
    });
  } catch (error) {
    logger.error('Error setting display name:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to set display name',
      code: 'PNL_ERROR',
    });
  }
});

/**
 * GET /api/pnl/portfolio/:address
 * Get detailed portfolio breakdown
 */
router.get('/portfolio/:address', async (req, res) => {
  try {
    const { address } = req.params;

    if (!address || address.length < 32 || address.length > 44) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address',
        code: 'INVALID_ADDRESS',
      });
    }

    const pnlService = getPnLService();
    const pnl = await pnlService.getPnL(address);

    if (!pnl) {
      return res.status(404).json({
        success: false,
        error: 'No portfolio data found',
        code: 'NOT_FOUND',
      });
    }

    res.json({
      success: true,
      data: {
        wallet: address,
        currentValue: pnl.currentValue,
        nftCount: pnl.nftCount,
        topHoldings: pnl.topHoldings,
        pnl: {
          '24h': { value: pnl.pnl24h, percent: pnl.pnlPercent24h },
          '7d': { value: pnl.pnl7d, percent: pnl.pnlPercent7d },
          '30d': { value: pnl.pnl30d, percent: pnl.pnlPercent30d },
        },
        lastUpdated: pnl.lastUpdated,
      },
    });
  } catch (error) {
    logger.error('Error fetching portfolio:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch portfolio',
      code: 'PNL_ERROR',
    });
  }
});

/**
 * GET /api/pnl/stats
 * Get global PnL stats
 */
router.get('/stats', async (req, res) => {
  try {
    // Simple stats endpoint
    res.json({
      success: true,
      data: {
        totalTrackedWallets: 0, // Would query from DB
        totalValueTracked: 0,
        averagePnl24h: 0,
        topGainer24h: null,
        topLoser24h: null,
        updatedAt: Date.now(),
      },
    });
  } catch (error) {
    logger.error('Error fetching PnL stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stats',
      code: 'PNL_ERROR',
    });
  }
});

export default router;
