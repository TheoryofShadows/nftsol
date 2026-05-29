/**
 * 🚀 Transaction History Routes
 * Using Helius' new getTransactionsForAddress API (Nov 2025)
 */

import logger from '../utils/logger';
import { Router, Request, Response } from 'express';
import { heliusService } from '../services/helius';

const router = Router();

/**
 * GET /api/transactions/:address
 * Get paginated transaction history for an address
 * 
 * Query params:
 * - cursor: Pagination cursor
 * - limit: Number of transactions (1-1000, default: 100)
 * - type: Filter by type (all|nft|token|sol)
 * - source: Filter by program ID
 * - beforeTime: Unix timestamp
 * - afterTime: Unix timestamp
 */
router.get('/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const {
      cursor,
      limit = '100',
      type = 'all',
      source,
      beforeTime,
      afterTime,
    } = req.query;

    // Validate address
    if (!address || address.length < 32) {
      return res.status(400).json({
        success: false,
        error: 'Invalid address',
      });
    }

    // Parse options
    const options: any = {
      limit: Math.min(parseInt(limit as string, 10) || 100, 1000),
    };

    if (cursor) options.cursor = cursor as string;
    if (type && type !== 'all') options.type = type as 'nft' | 'token' | 'sol';
    if (source) options.source = source as string;
    if (beforeTime) options.beforeTime = parseInt(beforeTime as string, 10);
    if (afterTime) options.afterTime = parseInt(afterTime as string, 10);

    // Ensure Helius is configured
    if (!heliusService.isConfigured()) {
      return res.status(503).json({
        success: false,
        error: 'Helius API key not configured',
      });
    }

    // Fetch transactions using Helius' new API
    const result = await heliusService.getTransactionsForAddress(address, options);

    res.json({
      success: true,
      data: result,
      meta: {
        address,
        count: result.transactions.length,
        hasMore: result.hasMore,
        cursor: result.cursor,
      },
    });
  } catch (error) {
    logger.error('[Transactions API] Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch transactions',
    });
  }
});

/**
 * GET /api/transactions/:address/all
 * Get complete transaction history (auto-paginated)
 * 
 * Query params:
 * - max: Maximum transactions to fetch (default: 10000)
 */
router.get('/:address/all', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const { max = '10000' } = req.query;

    // Validate address
    if (!address || address.length < 32) {
      return res.status(400).json({
        success: false,
        error: 'Invalid address',
      });
    }

    const maxTransactions = Math.min(parseInt(max as string, 10) || 10000, 50000);

    // Ensure Helius is configured
    if (!heliusService.isConfigured()) {
      return res.status(503).json({
        success: false,
        error: 'Helius API key not configured',
      });
    }

    // Fetch ALL transactions (auto-paginated)
    const transactions = await heliusService.getAllTransactionsForAddress(
      address,
      maxTransactions
    );

    res.json({
      success: true,
      data: {
        transactions,
        total: transactions.length,
      },
      meta: {
        address,
        complete: true,
      },
    });
  } catch (error) {
    logger.error('[Transactions API] Error (all):', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch all transactions',
    });
  }
});

/**
 * GET /api/transactions/:address/summary
 * Get transaction summary statistics
 */
router.get('/:address/summary', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;

    if (!address || address.length < 32) {
      return res.status(400).json({
        success: false,
        error: 'Invalid address',
      });
    }

    // Ensure Helius is configured
    if (!heliusService.isConfigured()) {
      return res.status(503).json({
        success: false,
        error: 'Helius API key not configured',
      });
    }

    // Fetch recent transactions
    const result = await heliusService.getTransactionsForAddress(address, {
      limit: 1000,
    });

    const transactions = result.transactions;

    // Calculate summary stats
    const summary = {
      total: transactions.length,
      successful: transactions.filter(tx => tx.status === 'success').length,
      failed: transactions.filter(tx => tx.status === 'failed').length,
      totalFees: transactions.reduce((sum, tx) => sum + (tx.fee || 0), 0),
      types: {
        nft: transactions.filter(tx => tx.type === 'nft').length,
        token: transactions.filter(tx => tx.type === 'token').length,
        sol: transactions.filter(tx => tx.type === 'sol').length,
        other: transactions.filter(tx => !['nft', 'token', 'sol'].includes(tx.type)).length,
      },
      recentActivity: transactions.slice(0, 10).map(tx => ({
        signature: tx.signature,
        type: tx.type,
        timestamp: tx.timestamp,
        status: tx.status,
      })),
    };

    res.json({
      success: true,
      data: summary,
      meta: {
        address,
        analyzed: transactions.length,
      },
    });
  } catch (error) {
    logger.error('[Transactions API] Error (summary):', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate summary',
    });
  }
});

export default router;

