// src/routes/withdrawals.ts
import express from 'express';
import { withClient } from '../lib/db';
import { getWalletBalance as _getWalletBalance, accountExists } from '../lib/solana';
import { ApiResponse } from '../types';
import { isValidSolanaAddress } from '../utils/validation';

const router = express.Router();
const LAMPORTS_PER_SOL = 1_000_000_000;

// Use centralized validation function
function validateAddress(a?: string) {
  return isValidSolanaAddress(a || '');
}

// POST /api/wallets/withdraw - Create withdrawal request
router.post('/', async (req, res) => {
  const userId = (req as any).user?.id;
  if (!userId) {
    const response: ApiResponse = {
      success: false,
      error: 'User not authenticated',
      code: 'NOT_AUTHENTICATED',
    };
    return res.status(401).json(response);
  }

  const { amount_sol, to_address, request_token, idempotency_key } = req.body;

  // Check for idempotency key to prevent duplicate requests
  if (idempotency_key) {
    try {
      const existing = await (
        await import('../lib/db')
      ).pool.query('SELECT id FROM withdrawals WHERE idempotency_key = $1 AND user_id = $2', [
        idempotency_key,
        userId,
      ]);
      if (existing && existing.rowCount && existing.rowCount > 0) {
        const response: ApiResponse = {
          success: false,
          error: 'Duplicate withdrawal request',
          code: 'DUPLICATE_REQUEST',
        };
        return res.status(409).json(response);
      }
    } catch (err) {
      console.error('Idempotency check error:', err);
    }
  }
  if (!amount_sol || !to_address) {
    const response: ApiResponse = {
      success: false,
      error: 'Missing required parameters: amount_sol, to_address',
      code: 'MISSING_PARAMETERS',
    };
    return res.status(400).json(response);
  }

  if (!validateAddress(to_address)) {
    const response: ApiResponse = {
      success: false,
      error: 'Invalid wallet address format',
      code: 'INVALID_ADDRESS',
    };
    return res.status(400).json(response);
  }

  const lamports = Math.floor(Number(amount_sol) * LAMPORTS_PER_SOL);
  if (!Number.isFinite(lamports) || lamports <= 0) {
    const response: ApiResponse = {
      success: false,
      error: 'Invalid withdrawal amount',
      code: 'INVALID_AMOUNT',
    };
    return res.status(400).json(response);
  }

  // Check if destination wallet exists on Solana
  try {
    const walletExists = await accountExists(to_address);
    if (!walletExists) {
      const response: ApiResponse = {
        success: false,
        error: 'Destination wallet does not exist on Solana network',
        code: 'WALLET_NOT_FOUND',
      };
      return res.status(400).json(response);
    }
  } catch (error) {
    console.error('Wallet validation error:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to validate destination wallet',
      code: 'WALLET_VALIDATION_FAILED',
    };
    return res.status(500).json(response);
  }

  try {
    const result = await withClient(async (client) => {
      await client.query('BEGIN');
      const wRes = await client.query(
        'SELECT available_lamports, pending_withdrawal_lamports FROM wallets WHERE user_id = $1 FOR UPDATE',
        [userId]
      );
      if (!wRes.rowCount) {
        await client.query('ROLLBACK');
        throw new Error('wallet_not_found');
      }
      const wallet = wRes.rows[0];
      if (BigInt(wallet.available_lamports) < BigInt(lamports)) {
        await client.query('ROLLBACK');
        throw new Error('insufficient_balance');
      }

      const insert = await client.query(
        `INSERT INTO withdrawals (user_id, amount_lamports, to_address, request_ip, request_user_agent, request_token, idempotency_key)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id, created_at`,
        [
          userId,
          lamports,
          to_address,
          req.ip,
          req.headers['user-agent'],
          request_token ?? null,
          idempotency_key ?? null,
        ]
      );

      await client.query(
        `UPDATE wallets SET available_lamports = available_lamports - $1, pending_withdrawal_lamports = pending_withdrawal_lamports + $1 WHERE user_id = $2`,
        [lamports, userId]
      );

      await client.query('COMMIT');
      return insert.rows[0];
    });

    const response: ApiResponse = {
      success: true,
      data: {
        status: 'pending',
        withdrawal: result,
        amount_sol: amount_sol,
        to_address: to_address,
      },
      message: 'Withdrawal request created successfully',
    };
    return res.json(response);
  } catch (err: any) {
    console.error('create withdrawal error', err);
    const response: ApiResponse = {
      success: false,
      error:
        err.message === 'insufficient_balance' ? 'Insufficient balance' : 'Internal server error',
      code: err.message === 'insufficient_balance' ? 'INSUFFICIENT_BALANCE' : 'INTERNAL_ERROR',
    };
    return res.status(500).json(response);
  }
});

// GET /api/wallets/withdraw - List user withdrawals
router.get('/', async (req, res) => {
  const userId = (req as any).user?.id;
  if (!userId) {
    const response: ApiResponse = {
      success: false,
      error: 'User not authenticated',
      code: 'NOT_AUTHENTICATED',
    };
    return res.status(401).json(response);
  }

  try {
    const q = await (
      await import('../lib/db')
    ).pool.query('SELECT * FROM withdrawals WHERE user_id=$1 ORDER BY created_at DESC LIMIT 100', [
      userId,
    ]);

    const response: ApiResponse = {
      success: true,
      data: q.rows,
    };
    return res.json(response);
  } catch (err) {
    console.error('Get withdrawals error:', err);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to get withdrawals',
      code: 'GET_WITHDRAWALS_FAILED',
    };
    return res.status(500).json(response);
  }
});

// GET /api/wallets/withdraw/:id - Get specific withdrawal
router.get('/:id', async (req, res) => {
  const userId = (req as any).user?.id;
  const { id } = req.params;

  if (!userId) {
    const response: ApiResponse = {
      success: false,
      error: 'User not authenticated',
      code: 'NOT_AUTHENTICATED',
    };
    return res.status(401).json(response);
  }

  try {
    const q = await (
      await import('../lib/db')
    ).pool.query('SELECT * FROM withdrawals WHERE id=$1 AND user_id=$2', [id, userId]);

    if (!q.rows.length) {
      const response: ApiResponse = {
        success: false,
        error: 'Withdrawal not found',
        code: 'WITHDRAWAL_NOT_FOUND',
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse = {
      success: true,
      data: q.rows[0],
    };
    return res.json(response);
  } catch (err) {
    console.error('Get withdrawal error:', err);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to get withdrawal',
      code: 'GET_WITHDRAWAL_FAILED',
    };
    return res.status(500).json(response);
  }
});

export default router;
