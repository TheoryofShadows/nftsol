// src/routes/admin/withdrawals.ts
import express from 'express';
import { withClient } from '../../lib/db';
import { sendSOL } from '../../lib/solana';
import { ApiResponse } from '../../types';
import { auditLogger, securityLogger } from '../../utils/logger';

const router = express.Router();

function adminOnly(req: any, res: any, next: any) {
  const user = (req as any).user;
  if (!user || !user.isAdmin) {
    const response: ApiResponse = {
      success: false,
      error: 'Admin access required',
      code: 'FORBIDDEN'
    };
    return res.status(403).json(response);
  }
  next();
}
router.use(adminOnly);

// GET /api/admin/withdrawals - List withdrawals by status
router.get('/', async (req, res) => {
  try {
    // Validate status parameter to prevent SQL injection
    const allowedStatuses = ['pending', 'approved', 'processing', 'completed', 'failed', 'rejected'];
    const status = allowedStatuses.includes(req.query.status as string) ? req.query.status as string : 'pending';
    
    // Validate and limit pagination parameters
    const limit = Math.min(parseInt(req.query.limit as string) || 200, 1000); // Cap at 1000
    const offset = Math.max(parseInt(req.query.offset as string) || 0, 0);
    
    const q = await (await import('../../lib/db')).pool.query(
      'SELECT * FROM withdrawals WHERE status=$1 ORDER BY created_at ASC LIMIT $2 OFFSET $3', 
      [status, limit, offset]
    );
    
    const response: ApiResponse = {
      success: true,
      data: q.rows
    };
    return res.json(response);
  } catch (err) {
    console.error('Get withdrawals error:', err);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to get withdrawals',
      code: 'GET_WITHDRAWALS_FAILED'
    };
    return res.status(500).json(response);
  }
});

// POST /api/admin/withdrawals/:id/approve - Approve withdrawal
router.post('/:id/approve', async (req, res) => {
  const adminId = (req as any).user.id;
  const id = req.params.id;
  const { reason } = req.body;
  
  try {
    await withClient(async client => {
      await client.query('BEGIN');
      const r = await client.query('SELECT * FROM withdrawals WHERE id=$1 FOR UPDATE', [id]);
      if (!r.rowCount) throw new Error('not_found');
      const w = r.rows[0];
      if (w.status !== 'pending') throw new Error('invalid_status');
      await client.query(
        'UPDATE withdrawals SET status=$1, admin_id=$2, approved_at=now(), updated_at=now(), admin_reason=$3 WHERE id=$4', 
        ['approved', adminId, reason || 'Approved by admin', id]
      );
      await client.query('COMMIT');
    });
    
    const response: ApiResponse = {
      success: true,
      data: { withdrawalId: id, status: 'approved' },
      message: 'Withdrawal approved successfully'
    };
    return res.json(response);
  } catch (err: any) {
    console.error('Approval error:', err);
    const response: ApiResponse = {
      success: false,
      error: err.message === 'not_found' ? 'Withdrawal not found' : 
             err.message === 'invalid_status' ? 'Invalid withdrawal status' : 'Internal server error',
      code: err.message === 'not_found' ? 'WITHDRAWAL_NOT_FOUND' :
            err.message === 'invalid_status' ? 'INVALID_STATUS' : 'INTERNAL_ERROR'
    };
    return res.status(500).json(response);
  }
});

// POST /api/admin/withdrawals/:id/process - Process withdrawal (send SOL)
router.post('/:id/process', async (req, res) => {
  const adminId = (req as any).user.id;
  const id = req.params.id;
  
  auditLogger('WITHDRAWAL_PROCESS_START', { withdrawalId: id, adminId }, req);
  
  try {
    let withdrawalRow: any = null;

    // Mark as processing and get withdrawal details
    await withClient(async client => {
      await client.query('BEGIN');
      const r = await client.query('SELECT * FROM withdrawals WHERE id=$1 FOR UPDATE', [id]);
      if (!r.rowCount) throw new Error('not_found');
      const w = r.rows[0];
      if (!['approved','pending'].includes(w.status)) throw new Error('invalid_status');
      
      // Check for duplicate processing
      if (w.processed_tx_sig) {
        throw new Error('already_processed');
      }
      
      // Validate withdrawal amount limits
      const MAX_SINGLE_WITHDRAWAL = parseInt(process.env.MAX_SINGLE_WITHDRAWAL_LAMPORTS || '10000000000', 10);
      if (Number(w.amount_lamports) > MAX_SINGLE_WITHDRAWAL) {
        throw new Error('amount_exceeds_limit');
      }
      
      await client.query('UPDATE withdrawals SET status=$1, admin_id=$2, updated_at=now() WHERE id=$3', ['processing', adminId, id]);
      await client.query('COMMIT');
      withdrawalRow = w;
    });

    // Send SOL on blockchain
    const amountSol = Number(withdrawalRow.amount_lamports) / 1e9;
    const result = await sendSOL(withdrawalRow.to_address, amountSol);
    
    if (!result.success) {
      throw new Error(result.error || 'SOL transfer failed');
    }

    // Finalize database
    await withClient(async client => {
      await client.query('BEGIN');
      await client.query(
        'UPDATE withdrawals SET status=$1, processed_tx_sig=$2, updated_at=now() WHERE id=$3', 
        ['completed', result.txSig, id]
      );
      await client.query(
        'UPDATE wallets SET pending_withdrawal_lamports = pending_withdrawal_lamports - $1 WHERE user_id = $2', 
        [withdrawalRow.amount_lamports, withdrawalRow.user_id]
      );
      await client.query('COMMIT');
    });

    auditLogger('WITHDRAWAL_PROCESS_SUCCESS', { 
      withdrawalId: id, 
      adminId, 
      amountSol, 
      txSig: result.txSig 
    }, req);
    
    const response: ApiResponse = {
      success: true,
      data: { 
        withdrawalId: id, 
        status: 'completed', 
        transactionSignature: result.txSig,
        amountSol: amountSol
      },
      message: 'Withdrawal processed successfully'
    };
    return res.json(response);
  } catch (err: any) {
    console.error('Process error:', err);
    
    securityLogger('WITHDRAWAL_PROCESS_FAILED', { 
      withdrawalId: id, 
      adminId, 
      error: err.message 
    }, req);
    
    // Rollback: mark as failed and return funds
    try {
      await withClient(async client => {
        await client.query('BEGIN');
        const r = await client.query('SELECT * FROM withdrawals WHERE id=$1 FOR UPDATE', [id]);
        if (r.rowCount) {
          const w = r.rows[0];
          await client.query(
            'UPDATE withdrawals SET status=$1, failure_reason=$2, updated_at=now() WHERE id=$3', 
            ['failed', err.message ?? 'Processing failed', id]
          );
          await client.query(
            'UPDATE wallets SET pending_withdrawal_lamports = pending_withdrawal_lamports - $1, available_lamports = available_lamports + $1 WHERE user_id = $2', 
            [w.amount_lamports, w.user_id]
          );
        }
        await client.query('COMMIT');
      });
    } catch (rollbackErr) {
      console.error('Rollback error:', rollbackErr);
    }
    
    const response: ApiResponse = {
      success: false,
      error: err.message === 'not_found' ? 'Withdrawal not found' : 
             err.message === 'invalid_status' ? 'Invalid withdrawal status' :
             err.message === 'already_processed' ? 'Withdrawal already processed' :
             err.message === 'amount_exceeds_limit' ? 'Withdrawal amount exceeds limit' : 'Processing failed',
      code: err.message === 'not_found' ? 'WITHDRAWAL_NOT_FOUND' :
            err.message === 'invalid_status' ? 'INVALID_STATUS' :
            err.message === 'already_processed' ? 'ALREADY_PROCESSED' :
            err.message === 'amount_exceeds_limit' ? 'AMOUNT_EXCEEDS_LIMIT' : 'PROCESSING_FAILED'
    };
    return res.status(500).json(response);
  }
});

// POST /api/admin/withdrawals/:id/reject - Reject withdrawal (return funds)
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
      await client.query(
        'UPDATE withdrawals SET status=$1, failure_reason=$2, admin_id=$3, updated_at=now() WHERE id=$4', 
        ['rejected', reason ?? 'Rejected by admin', adminId, id]
      );
      await client.query(
        'UPDATE wallets SET pending_withdrawal_lamports = pending_withdrawal_lamports - $1, available_lamports = available_lamports + $1 WHERE user_id=$2', 
        [w.amount_lamports, w.user_id]
      );
      await client.query('COMMIT');
    });
    
    const response: ApiResponse = {
      success: true,
      data: { withdrawalId: id, status: 'rejected' },
      message: 'Withdrawal rejected successfully'
    };
    return res.json(response);
  } catch (err: any) {
    console.error('Rejection error:', err);
    const response: ApiResponse = {
      success: false,
      error: err.message === 'not_found' ? 'Withdrawal not found' : 
             err.message === 'invalid_status' ? 'Invalid withdrawal status' : 'Internal server error',
      code: err.message === 'not_found' ? 'WITHDRAWAL_NOT_FOUND' :
            err.message === 'invalid_status' ? 'INVALID_STATUS' : 'INTERNAL_ERROR'
    };
    return res.status(500).json(response);
  }
});

export default router;
