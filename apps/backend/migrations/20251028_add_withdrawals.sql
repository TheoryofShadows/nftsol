-- migrations/20251028_add_withdrawals.sql
BEGIN;

-- Add pending columns to wallets if missing
ALTER TABLE wallets
  ADD COLUMN IF NOT EXISTS available_lamports numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pending_withdrawal_lamports numeric DEFAULT 0;

-- Create withdrawals table
CREATE TABLE IF NOT EXISTS withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount_lamports numeric NOT NULL,
  to_address varchar(64) NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'pending',
  request_ip inet,
  request_user_agent text,
  request_token varchar(128),
  admin_id uuid,
  approved_at timestamptz,
  processed_tx_sig varchar(128),
  failure_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals (user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals (status);

COMMIT;
