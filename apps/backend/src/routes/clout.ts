/**
 * CLOUT Token Routes
 * API endpoints for CLOUT token operations
 * 
 * @module routes/clout
 */

import express from 'express';
import { CloutTokenService } from '../services/cloutToken';
import { validateWallet } from '../utils/validation';
import { ApiResponse } from '../types/index';
import { sanitizeInput } from '../utils/validation';

const router = express.Router();
const cloutService = new CloutTokenService();

/**
 * POST /api/clout/reward
 * Send CLOUT tokens to a user
 * 
 * Body: {
 *   recipientAddress: string (required),
 *   amount: number (required),
 *   multiplier?: number (optional, default: 1.0)
 * }
 */
router.post('/reward', sanitizeInput, validateWallet, async (req, res) => {
  try {
    const { recipientAddress, amount, multiplier = 1.0 } = req.body;

    if (!recipientAddress) {
      const response: ApiResponse = {
        success: false,
        error: 'recipientAddress is required',
        code: 'VALIDATION_ERROR'
      };
      return res.status(400).json(response);
    }

    if (!amount || !Number.isFinite(amount) || amount <= 0) {
      const response: ApiResponse = {
        success: false,
        error: 'amount must be a positive number',
        code: 'VALIDATION_ERROR'
      };
      return res.status(400).json(response);
    }

    if (multiplier !== undefined && (!Number.isFinite(multiplier) || multiplier <= 0)) {
      const response: ApiResponse = {
        success: false,
        error: 'multiplier must be a positive number',
        code: 'VALIDATION_ERROR'
      };
      return res.status(400).json(response);
    }

    const result = await cloutService.distributeCloutRewards(
      recipientAddress,
      amount,
      multiplier
    );

    if (result.success && result.txSignature) {
      const totalAmount = Math.floor(amount * multiplier);
      const response: ApiResponse = {
        success: true,
        data: {
          txSignature: result.txSignature,
          recipient: recipientAddress,
          amount,
          multiplier,
          totalAmount,
          token: 'CLOUT'
        },
        message: `Successfully sent ${totalAmount} CLOUT to ${recipientAddress.slice(0, 8)}...`
      };
      res.json(response);
    } else {
      const response: ApiResponse = {
        success: false,
        error: result.error || 'Failed to send CLOUT reward',
        code: 'REWARD_FAILED'
      };
      res.status(500).json(response);
    }
  } catch (error) {
    const err = error as Error;
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('CLOUT reward endpoint error:', err);
    }
    
    const response: ApiResponse = {
      success: false,
      error: process.env.NODE_ENV === 'production'
        ? 'Failed to process request. Please try again later.'
        : err.message || 'Internal server error',
      code: 'INTERNAL_ERROR'
    };
    res.status(500).json(response);
  }
});

/**
 * GET /api/clout/balance/:address
 * Get CLOUT balance for a wallet
 */
router.get('/balance/:address', sanitizeInput, async (req, res) => {
  try {
    const { address } = req.params;

    if (!address || typeof address !== 'string') {
      const response: ApiResponse = {
        success: false,
        error: 'Invalid address parameter',
        code: 'VALIDATION_ERROR'
      };
      return res.status(400).json(response);
    }

    const balance = await cloutService.getCloutBalance(address);

    const response: ApiResponse = {
      success: true,
      data: {
        address,
        balance,
        token: 'CLOUT'
      }
    };
    res.json(response);
  } catch (error) {
    console.error('CLOUT balance endpoint error:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to get CLOUT balance',
      code: 'INTERNAL_ERROR'
    };
    res.status(500).json(response);
  }
});

/**
 * GET /api/clout/vault-balance
 * Get rewards vault CLOUT balance
 */
router.get('/vault-balance', async (req, res) => {
  try {
    const balance = await cloutService.getVaultBalance();

    const response: ApiResponse = {
      success: true,
      data: {
        balance,
        token: 'CLOUT',
        vaultAddress: process.env.REWARDS_VAULT || 'Not configured'
      }
    };
    res.json(response);
  } catch (error) {
    console.error('CLOUT vault balance endpoint error:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to get vault balance',
      code: 'INTERNAL_ERROR'
    };
    res.status(500).json(response);
  }
});

export default router;

