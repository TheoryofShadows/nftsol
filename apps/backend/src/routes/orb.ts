/**
 * Helius Orb API Routes
 * Transaction exploration and visualization endpoints
 */

import logger from '../utils/logger';
import { Router, Request, Response } from 'express';
import { OrbService } from '../services/orbService';
import expressRateLimit from 'express-rate-limit';

const router = Router();
const orbService = new OrbService(process.env.HELIUS_API_KEY);

// Rate limiting for Orb endpoints
const orbLimiter = expressRateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: 'Too many Orb requests, please try again later',
});

/**
 * GET /api/orb/history/:ledgerId
 * Get AI-explained transaction history for echo ledger
 */
router.get('/history/:ledgerId', orbLimiter, async (req: Request, res: Response) => {
  try {
    const { ledgerId } = req.params;

    if (!ledgerId) {
      return res.status(400).json({
        success: false,
        error: 'Ledger ID required',
      });
    }

    const history = await orbService.getEchoTxHistory(ledgerId);

    res.json({
      success: true,
      ...history,
    });
  } catch (error: any) {
    logger.error('Orb history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch transaction history',
      message: error.message,
    });
  }
});

/**
 * GET /api/orb/embed/:ledgerId
 * Get Orb embed URL for iframe
 */
router.get('/embed/:ledgerId', orbLimiter, async (req: Request, res: Response) => {
  try {
    const { ledgerId } = req.params;

    const embedUrl = orbService.getOrbEmbed(ledgerId);

    res.json({
      success: true,
      embedUrl,
    });
  } catch (error: any) {
    logger.error('Orb embed error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate embed URL',
    });
  }
});

/**
 * GET /api/orb/explain/:signature
 * Get AI explanation for a transaction
 */
router.get('/explain/:signature', orbLimiter, async (req: Request, res: Response) => {
  try {
    const { signature } = req.params;

    const explanation = await orbService.explainTransaction(signature);

    res.json({
      success: true,
      explanation,
    });
  } catch (error: any) {
    logger.error('Orb explain error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to explain transaction',
    });
  }
});

/**
 * GET /api/orb/heatmap/:ledgerId
 * Get heatmap data for echo contributions
 */
router.get('/heatmap/:ledgerId', orbLimiter, async (req: Request, res: Response) => {
  try {
    const { ledgerId } = req.params;

    const heatmap = await orbService.generateHeatmap(ledgerId);

    res.json({
      success: true,
      heatmap,
    });
  } catch (error: any) {
    logger.error('Orb heatmap error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate heatmap',
    });
  }
});

/**
 * GET /api/orb/timeline/:ledgerId
 * Get historical timeline for echo ledger
 */
router.get('/timeline/:ledgerId', orbLimiter, async (req: Request, res: Response) => {
  try {
    const { ledgerId } = req.params;
    const { from, to } = req.query;

    const timeline = await orbService.getTimeline(ledgerId, {
      from: from as string,
      to: to as string,
    });

    res.json({
      success: true,
      timeline,
    });
  } catch (error: any) {
    logger.error('Orb timeline error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch timeline',
    });
  }
});

export default router;
