// src/routes/withdrawals.ts
import express from 'express';
import { withClient } from '../lib/db';

const router = express.Router();
const LAMPORTS_PER_SOL = 1_000_000_000;

function validateAddress(a?: string) {
  return typeof a === 'string' && /^[A-Za-z0-9]{32,44}$/.test(a);
}

// POST /api/wallets/withdraw
router.post('/', async (req, res) => {
  const userId = (req as any).user?.id;
  if (!userId) return res.status(401).json({ error: 'not_authenticated' });

  const { amount_sol, to_address, request_token } = req.body;
  if (!amount_sol || !to_address) return res.status(400).json({ error: 'missing_params' });
  if (!validateAddress(to_address)) return res.status(400).json({ error: 'invalid_address' });

  const lamports = Math.floor(Number(amount_sol) * LAMPORTS_PER_SOL);
  if (!Number.isFinite(lamports) || lamports <= 0) return res.status(400).json({ error: 'invalid_amount' });

  try {
    const result = await withClient(async (client) => {
      await client.query('BEGIN');
      const wRes = await client.query('SELECT available_lamports, pending_withdrawal_lamports FROM wallets WHERE user_id = $1 FOR UPDATE', [userId]);
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
        `INSERT INTO withdrawals (user_id, amount_lamports, to_address, request_ip, request_user_agent, request_token)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, created_at`,
        [userId, lamports, to_address, req.ip, req.headers['user-agent'], request_token ?? null]
      );

      await client.query(
        `UPDATE wallets SET available_lamports = available_lamports - $1, pending_withdrawal_lamports = pending_withdrawal_lamports + $1 WHERE user_id = $2`,
        [lamports, userId]
      );

      await client.query('COMMIT');
      return insert.rows[0];
    });
    
    res.json({ status: 'pending', withdrawal: result });
  } catch (err: any) {
    console.error('create withdrawal error', err);
    return res.status(500).json({ error: 'internal_error' });
  }
  return; // Explicit return for TypeScript
});

// GET /api/wallets/withdrawals
router.get('/', async (req, res) => {
  const userId = (req as any).user?.id;
  if (!userId) return res.status(401).json({ error: 'not_authenticated' });
  try {
    const q = await (await import('../lib/db')).pool.query('SELECT * FROM withdrawals WHERE user_id=$1 ORDER BY created_at DESC LIMIT 100', [userId]);
    return res.json(q.rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'internal_error' });
  }
  return; // Explicit return for TypeScript
});

export default router;
