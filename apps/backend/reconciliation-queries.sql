-- NFTSol Withdrawal System Reconciliation Queries
-- Run these periodically to ensure data integrity

-- A) Wallet vs pending total (detect mismatch)
-- 1) Negative balances
SELECT 
    user_id, 
    available_lamports, 
    pending_withdrawal_lamports,
    'NEGATIVE_BALANCE' as issue_type
FROM wallets
WHERE available_lamports < 0
   OR pending_withdrawal_lamports < 0;

-- 2) Total pending from withdrawals vs wallet.pending_withdrawal_lamports
SELECT 
    w.user_id,
    COALESCE(SUM(amount_lamports) FILTER (WHERE status IN ('pending','approved','processing')),0) AS sum_withdrawals_pending,
    COALESCE(wt.pending_withdrawal_lamports,0) AS wallet_pending,
    'PENDING_MISMATCH' as issue_type
FROM (SELECT DISTINCT user_id FROM withdrawals) d
LEFT JOIN wallets wt ON wt.user_id = d.user_id
LEFT JOIN withdrawals w ON w.user_id = d.user_id
GROUP BY w.user_id, wt.pending_withdrawal_lamports
HAVING COALESCE(SUM(amount_lamports) FILTER (WHERE status IN ('pending','approved','processing')),0)
       <> COALESCE(wt.pending_withdrawal_lamports,0);

-- B) Completed withdrawal audit (find any completed withdrawal without on-chain confirmation)
SELECT 
    id, 
    user_id, 
    amount_lamports, 
    processed_tx_sig, 
    created_at, 
    updated_at,
    'MISSING_TX_SIG' as issue_type
FROM withdrawals
WHERE status = 'completed' 
  AND (processed_tx_sig IS NULL OR processed_tx_sig = '');

-- C) Orphan pending > threshold (older than 6 hours)
SELECT 
    id, 
    user_id, 
    amount_lamports, 
    status, 
    created_at,
    'STUCK_WITHDRAWAL' as issue_type
FROM withdrawals
WHERE status IN ('pending','processing','approved')
  AND created_at < now() - INTERVAL '6 hours';

-- D) Weekly reconciliation snapshot
SELECT
    'WEEKLY_SNAPSHOT' as report_type,
    (SELECT COALESCE(SUM(available_lamports),0) FROM wallets) AS total_available,
    (SELECT COALESCE(SUM(pending_withdrawal_lamports),0) FROM wallets) AS total_pending,
    (SELECT COALESCE(SUM(amount_lamports) FILTER (WHERE status='completed'),0) FROM withdrawals) AS total_withdrawn_completed,
    (SELECT COUNT(*) FROM withdrawals WHERE status='completed' AND created_at >= now() - INTERVAL '7 days') AS completed_this_week,
    (SELECT COUNT(*) FROM withdrawals WHERE status IN ('pending','approved','processing')) AS pending_count,
    now() as snapshot_time;
