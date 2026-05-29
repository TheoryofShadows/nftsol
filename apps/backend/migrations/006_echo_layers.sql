-- Eternal Echoes layers
-- Persists collaborative Echo layers that were previously held only in an
-- in-memory Map (lost on every restart).

CREATE TABLE IF NOT EXISTS echo_layers (
  id VARCHAR(128) PRIMARY KEY,
  ledger_id VARCHAR(128) NOT NULL,
  echo_data TEXT NOT NULL,
  echo_type VARCHAR(16) NOT NULL,
  video_uri TEXT,
  data_hash JSONB NOT NULL DEFAULT '[]'::jsonb,
  contributor VARCHAR(44) NOT NULL,
  grok_verified BOOLEAN NOT NULL DEFAULT false,
  verification_score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_echo_layers_ledger ON echo_layers(ledger_id);
CREATE INDEX IF NOT EXISTS idx_echo_layers_created ON echo_layers(created_at);
CREATE INDEX IF NOT EXISTS idx_echo_layers_contributor ON echo_layers(contributor);
