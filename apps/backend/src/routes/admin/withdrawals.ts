// src/routes/admin/withdrawals.ts
import express from 'express';
import { withClient } from '../../lib/db';
import { sendSolFromPlatform } from '../../lib/solana';

const router = express.Router();

function adminOnly(req: any, res: any, next: any) {
  const user = (req as any).user;
  if (!user || !user.isAdmin) return res.status(403).json({ error: 'forbidden' });
  next();
}
router.use(adminOnly);

// list (by status)
router.get('/', async (req, res) => {
  const status = (req.query.status as string) ?? 'pending';
  const q = await (await import('../../lib/db')).pool.query('SELECT * FROM withdrawals WHERE status=$1 ORDER BY created_at ASC LIMIT 200', [status]);
  return res.json(q.rows);
});

// approve
router.post('/:id/approve', async (req, res) => {
  const adminId = (req as any).user.id;
  const id = req.params.id;
  try {
    await withClient(async client => {
      await client.query('BEGIN');
      const r = await client.query('SELECT * FROM withdrawals WHERE id=$1 FOR UPDATE', [id]);
      if (!r.rowCount) throw new Error('not_found');
      const w = r.rows[0];
      if (w.status !== 'pending') throw new Error('invalid_status');
      await client.query('UPDATE withdrawals SET status=$1, admin_id=$2, approved_at=now(), updated_at=now() WHERE id=$3', ['approved', adminId, id]);
      await client.query('COMMIT');
      res.json({ status: 'approved' });
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'internal_error', detail: err.message });
  }
  return; // Explicit return for TypeScript
});

// process -> sends on-chain and finalizes ledger
router.post('/:id/process', async (req, res) => {
  const adminId = (req as any).user.id;
  const id = req.params.id;
  try {
    let withdrawalRow: any = null;

    // mark processing and pull row
    await withClient(async client => {
      await client.query('BEGIN');
      const r = await client.query('SELECT * FROM withdrawals WHERE id=$1 FOR UPDATE', [id]);
      if (!r.rowCount) throw new Error('not_found');
      const w = r.rows[0];
      if (!['approved','pending'].includes(w.status)) throw new Error('invalid_status');
      await client.query('UPDATE withdrawals SET status=$1, admin_id=$2, updated_at=now() WHERE id=$3', ['processing', adminId, id]);
      await client.query('COMMIT');
      withdrawalRow = w;
    });

    // send on-chain
    const sig = await sendSolFromPlatform(withdrawalRow.to_address, BigInt(withdrawalRow.amount_lamports));

    // finalize DB
    await withClient(async client => {
      await client.query('BEGIN');
      await client.query('UPDATE withdrawals SET status=$1, processed_tx_sig=$2, updated_at=now() WHERE id=$3', ['completed', sig, id]);
      await client.query('UPDATE wallets SET pending_withdrawal_lamports = pending_withdrawal_lamports - $1 WHERE user_id = $2', [withdrawalRow.amount_lamports, withdrawalRow.user_id]);
      await client.query('COMMIT');
    });

    return res.json({ status: 'completed', txSig: sig });
  } catch (err: any) {
    console.error('process error', err);
    // rollback: mark failed and return funds
    try {
      await withClient(async client => {
        await client.query('BEGIN');
        const r = await client.query('SELECT * FROM withdrawals WHERE id=$1 FOR UPDATE', [id]);
        if (r.rowCount) {
          const w = r.rows[0];
          await client.query('UPDATE withdrawals SET status=$1, failure_reason=$2, updated_at=now() WHERE id=$3', ['failed', err.message ?? 'error', id]);
          await client.query('UPDATE wallets SET pending_withdrawal_lamports = pending_withdrawal_lamports - $1, available_lamports = available_lamports + $1 WHERE user_id = $2', [w.amount_lamports, w.user_id]);
        }
        await client.query('COMMIT');
      });
    } catch (e) {
      console.error('rollback error', e);
    }
    return res.status(500).json({ error: 'processing_failed', detail: err.message });
  }
});

// reject (return funds)
router.post('/:id/reject', async (req, res) => {
  const adminId = (req as any).user.id;
  const id = req.params.id;
  const { reason } = req.body;
  try {
    await withClient(async client => {
      await client.query('BEGIN');
      const r = await client.query('SELECT * FROM withdrawals WHERE id=$1 FOR UPDATE', [id]);
      if (!r.rowCount) throw new Error('not_found');
      const w = r.rows[0];
      if (!['pending','approved'].includes(w.status)) throw new Error('invalid_status');
      await client.query('UPDATE withdrawals SET status=$1, failure_reason=$2, admin_id=$3, updated_at=now() WHERE id=$4', ['rejected', reason ?? 'rejected', adminId, id]);
      await client.query('UPDATE wallets SET pending_withdrawal_lamports = pending_withdrawal_lamports - $1, available_lamports = available_lamports + $1 WHERE user_id=$2', [w.amount_lamports, w.user_id]);
      await client.query('COMMIT');
    });
    return res.json({ status: 'rejected' });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'internal_error', detail: err.message });
  }
  return; // Explicit return for TypeScript
});

export default router;
