-- Marketplace tables for NFT buy/sell functionality

-- NFT Listings table
CREATE TABLE IF NOT EXISTS nft_listings (
  id SERIAL PRIMARY KEY,
  mint_address VARCHAR(44) UNIQUE NOT NULL,
  seller VARCHAR(44) NOT NULL,
  price DECIMAL(20, 9) NOT NULL,
  listed BOOLEAN DEFAULT true,
  listed_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_listings_seller ON nft_listings(seller);
CREATE INDEX IF NOT EXISTS idx_listings_listed ON nft_listings(listed);
CREATE INDEX IF NOT EXISTS idx_listings_price ON nft_listings(price);

-- NFT Sales history table
CREATE TABLE IF NOT EXISTS nft_sales (
  id SERIAL PRIMARY KEY,
  mint_address VARCHAR(44) NOT NULL,
  seller VARCHAR(44) NOT NULL,
  buyer VARCHAR(44) NOT NULL,
  price DECIMAL(20, 9) NOT NULL,
  signature VARCHAR(88) NOT NULL,
  sold_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_seller ON nft_sales(seller);
CREATE INDEX IF NOT EXISTS idx_sales_buyer ON nft_sales(buyer);
CREATE INDEX IF NOT EXISTS idx_sales_mint ON nft_sales(mint_address);
CREATE INDEX IF NOT EXISTS idx_sales_sold_at ON nft_sales(sold_at);

-- Add marketplace columns to existing nfts table if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='nfts' AND column_name='listed') THEN
    ALTER TABLE nfts ADD COLUMN listed BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='nfts' AND column_name='price') THEN
    ALTER TABLE nfts ADD COLUMN price DECIMAL(20, 9);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='nfts' AND column_name='status') THEN
    ALTER TABLE nfts ADD COLUMN status VARCHAR(20) DEFAULT 'active';
  END IF;
END $$;

-- Create view for marketplace with NFT details
CREATE OR REPLACE VIEW marketplace_view AS
SELECT 
  l.id,
  l.mint_address,
  l.seller,
  l.price,
  l.listed_at,
  n.name,
  n.description,
  n.image_url,
  n.creator,
  n.metadata_uri
FROM nft_listings l
LEFT JOIN nfts n ON l.mint_address = n.mint_address
WHERE l.listed = true
ORDER BY l.listed_at DESC;

