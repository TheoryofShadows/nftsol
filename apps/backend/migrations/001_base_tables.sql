-- Base tables for NFTSol
CREATE TABLE IF NOT EXISTS nfts (
  id              SERIAL PRIMARY KEY,
  mint_address    VARCHAR(44) UNIQUE NOT NULL,
  creator_address VARCHAR(44) NOT NULL,
  owner           VARCHAR(44) NOT NULL,
  name            VARCHAR(255) NOT NULL,
  description     TEXT,
  image_url       TEXT,
  metadata        JSONB,
  collection_name VARCHAR(100),
  status          VARCHAR(20) DEFAULT 'active',
  created_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wallets (
  address         VARCHAR(44) PRIMARY KEY,
  last_login      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS waitlist (
  id              SERIAL PRIMARY KEY,
  email           VARCHAR(255) NOT NULL,
  verified        BOOLEAN DEFAULT false,
  created_at      TIMESTAMP DEFAULT NOW()
);
