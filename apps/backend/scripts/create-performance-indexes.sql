-- NFTSol Performance Optimization Indexes
-- Run these on your production database to significantly improve query performance

-- 1. NFT listing page (most common query)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_nfts_created_at
  ON nfts(created_at DESC)
  WHERE deleted_at IS NULL;

-- 2. User profile pages
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_nfts_creator_id
  ON nfts(creator_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- 3. Search functionality (if using full-text search)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_nfts_name
  ON nfts(name)
  WHERE deleted_at IS NULL;

-- 4. Popular NFTs (likes/views)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_nfts_popularity
  ON nfts(likes_count DESC, views_count DESC)
  WHERE deleted_at IS NULL;

-- 5. User lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_wallet_address
  ON users(wallet_address)
  WHERE deleted_at IS NULL;

-- 6. Transaction history
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_user_date
  ON transactions(user_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- 7. Comments
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comments_nft_date
  ON comments(nft_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- 8. Marketplace filters
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_nfts_price_category
  ON nfts(category, price)
  WHERE deleted_at IS NULL AND price > 0;

-- Monitor index usage
-- SELECT
--   schemaname,
--   tablename,
--   indexname,
--   idx_scan,
--   idx_tup_read,
--   idx_tup_fetch
-- FROM pg_stat_user_indexes
-- ORDER BY idx_scan DESC;
