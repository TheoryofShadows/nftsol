/**
 * Portfolio PnL (Profit & Loss) Tracking Service
 * Tracks NFT portfolio value changes and maintains leaderboards
 */

import { pool } from '../lib/db';
import logger from '../utils/logger';
import { heliusService } from './helius';
import { getTensorService } from './tensor.service';

export interface PortfolioSnapshot {
  wallet: string;
  totalValue: number;
  nftCount: number;
  timestamp: number;
}

export interface PnLRecord {
  wallet: string;
  pnl24h: number;
  pnl7d: number;
  pnl30d: number;
  pnlPercent24h: number;
  pnlPercent7d: number;
  pnlPercent30d: number;
  currentValue: number;
  nftCount: number;
  topHoldings: Array<{
    mint: string;
    name: string;
    collection: string;
    value: number;
    pnl: number;
  }>;
  lastUpdated: number;
}

export interface LeaderboardEntry {
  rank: number;
  wallet: string;
  displayName?: string;
  pnl: number;
  pnlPercent: number;
  currentValue: number;
  nftCount: number;
  streak?: number;
  lastUpdated: number;
}

// In-memory cache for leaderboard (refreshed every 5 minutes)
const leaderboardCache: {
  daily: LeaderboardEntry[];
  weekly: LeaderboardEntry[];
  monthly: LeaderboardEntry[];
  lastUpdated: number;
} = {
  daily: [],
  weekly: [],
  monthly: [],
  lastUpdated: 0,
};

const LEADERBOARD_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

class PnLService {
  /**
   * Initialize database tables for PnL tracking
   */
  async initializeTables(): Promise<void> {
    try {
      // Portfolio snapshots table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS portfolio_snapshots (
          id SERIAL PRIMARY KEY,
          wallet VARCHAR(44) NOT NULL,
          total_value DECIMAL(20, 9) NOT NULL,
          nft_count INTEGER NOT NULL,
          snapshot_type VARCHAR(20) DEFAULT 'daily',
          created_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(wallet, snapshot_type, DATE(created_at))
        )
      `);

      // Create index for faster queries
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_wallet
        ON portfolio_snapshots(wallet, created_at DESC)
      `);

      // User PnL cache table for fast leaderboard queries
      await pool.query(`
        CREATE TABLE IF NOT EXISTS user_pnl_cache (
          wallet VARCHAR(44) PRIMARY KEY,
          display_name VARCHAR(100),
          pnl_24h DECIMAL(20, 9) DEFAULT 0,
          pnl_7d DECIMAL(20, 9) DEFAULT 0,
          pnl_30d DECIMAL(20, 9) DEFAULT 0,
          pnl_percent_24h DECIMAL(10, 4) DEFAULT 0,
          pnl_percent_7d DECIMAL(10, 4) DEFAULT 0,
          pnl_percent_30d DECIMAL(10, 4) DEFAULT 0,
          current_value DECIMAL(20, 9) DEFAULT 0,
          nft_count INTEGER DEFAULT 0,
          streak INTEGER DEFAULT 0,
          last_updated TIMESTAMP DEFAULT NOW()
        )
      `);

      // Create indexes for leaderboard queries
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_user_pnl_24h ON user_pnl_cache(pnl_24h DESC)
      `);
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_user_pnl_7d ON user_pnl_cache(pnl_7d DESC)
      `);

      logger.info('PnL tables initialized successfully');
    } catch (error) {
      logger.error('Error initializing PnL tables:', error);
      throw error;
    }
  }

  /**
   * Calculate current portfolio value for a wallet
   */
  async calculatePortfolioValue(wallet: string): Promise<{
    totalValue: number;
    nftCount: number;
    holdings: Array<{ mint: string; name: string; collection: string; value: number }>;
  }> {
    try {
      // Get all NFTs owned by wallet from Helius
      const assets = await heliusService.getAssetsByOwner(wallet, { limit: 1000 });

      if (!assets.items || assets.items.length === 0) {
        return { totalValue: 0, nftCount: 0, holdings: [] };
      }

      const tensorService = getTensorService();

      // Group NFTs by collection
      const collectionGroups = new Map<string, any[]>();
      for (const asset of assets.items) {
        const collection = asset.grouping?.find((g: any) => g.group_key === 'collection')?.group_value;
        if (collection) {
          if (!collectionGroups.has(collection)) {
            collectionGroups.set(collection, []);
          }
          collectionGroups.get(collection)!.push(asset);
        }
      }

      // Get floor prices for each collection
      const holdings: Array<{ mint: string; name: string; collection: string; value: number }> = [];
      let totalValue = 0;

      for (const [collectionId, nfts] of collectionGroups) {
        // Try to get floor price from Tensor
        const orderbook = await tensorService.getOrderbook(collectionId, 1);
        const floorPrice = orderbook?.floorPrice || 0;

        for (const nft of nfts) {
          const value = floorPrice;
          totalValue += value;
          holdings.push({
            mint: nft.id,
            name: nft.content?.metadata?.name || 'Unknown',
            collection: collectionId,
            value,
          });
        }
      }

      // Handle NFTs without collection (use estimated value)
      const uncollectedNfts = assets.items.filter(
        (a: any) => !a.grouping?.find((g: any) => g.group_key === 'collection')
      );
      for (const nft of uncollectedNfts) {
        const estimatedValue = 0.1; // Default 0.1 SOL for uncategorized NFTs
        totalValue += estimatedValue;
        holdings.push({
          mint: nft.id,
          name: nft.content?.metadata?.name || 'Unknown',
          collection: 'unknown',
          value: estimatedValue,
        });
      }

      return {
        totalValue,
        nftCount: assets.items.length,
        holdings: holdings.sort((a, b) => b.value - a.value).slice(0, 20), // Top 20
      };
    } catch (error) {
      logger.error(`Error calculating portfolio value for ${wallet}:`, error);
      return { totalValue: 0, nftCount: 0, holdings: [] };
    }
  }

  /**
   * Take a snapshot of portfolio value
   */
  async takeSnapshot(wallet: string): Promise<PortfolioSnapshot | null> {
    try {
      const { totalValue, nftCount } = await this.calculatePortfolioValue(wallet);

      // Store snapshot
      await pool.query(
        `INSERT INTO portfolio_snapshots (wallet, total_value, nft_count, snapshot_type)
         VALUES ($1, $2, $3, 'daily')
         ON CONFLICT (wallet, snapshot_type, (created_at::date))
         DO UPDATE SET total_value = $2, nft_count = $3`,
        [wallet, totalValue, nftCount]
      );

      const snapshot: PortfolioSnapshot = {
        wallet,
        totalValue,
        nftCount,
        timestamp: Date.now(),
      };

      // Update PnL cache
      await this.updatePnLCache(wallet);

      return snapshot;
    } catch (error) {
      logger.error(`Error taking snapshot for ${wallet}:`, error);
      return null;
    }
  }

  /**
   * Update the PnL cache for a wallet
   */
  async updatePnLCache(wallet: string): Promise<void> {
    try {
      const { totalValue, nftCount } = await this.calculatePortfolioValue(wallet);

      // Get historical snapshots
      const snapshots = await pool.query(
        `SELECT total_value, created_at
         FROM portfolio_snapshots
         WHERE wallet = $1
         ORDER BY created_at DESC
         LIMIT 30`,
        [wallet]
      );

      const now = Date.now();
      const day = 24 * 60 * 60 * 1000;

      // Find values at different points in time
      let value24h = totalValue;
      let value7d = totalValue;
      let value30d = totalValue;

      for (const row of snapshots.rows) {
        const age = now - new Date(row.created_at).getTime();
        if (age >= day && age < 2 * day && value24h === totalValue) {
          value24h = parseFloat(row.total_value);
        }
        if (age >= 7 * day && age < 8 * day && value7d === totalValue) {
          value7d = parseFloat(row.total_value);
        }
        if (age >= 30 * day && age < 31 * day && value30d === totalValue) {
          value30d = parseFloat(row.total_value);
        }
      }

      // Calculate PnL
      const pnl24h = totalValue - value24h;
      const pnl7d = totalValue - value7d;
      const pnl30d = totalValue - value30d;

      const pnlPercent24h = value24h > 0 ? (pnl24h / value24h) * 100 : 0;
      const pnlPercent7d = value7d > 0 ? (pnl7d / value7d) * 100 : 0;
      const pnlPercent30d = value30d > 0 ? (pnl30d / value30d) * 100 : 0;

      // Calculate streak (consecutive positive days)
      let streak = 0;
      for (let i = 0; i < snapshots.rows.length - 1; i++) {
        const current = parseFloat(snapshots.rows[i].total_value);
        const previous = parseFloat(snapshots.rows[i + 1].total_value);
        if (current >= previous) {
          streak++;
        } else {
          break;
        }
      }

      // Update cache
      await pool.query(
        `INSERT INTO user_pnl_cache
         (wallet, pnl_24h, pnl_7d, pnl_30d, pnl_percent_24h, pnl_percent_7d, pnl_percent_30d, current_value, nft_count, streak, last_updated)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
         ON CONFLICT (wallet) DO UPDATE SET
           pnl_24h = $2, pnl_7d = $3, pnl_30d = $4,
           pnl_percent_24h = $5, pnl_percent_7d = $6, pnl_percent_30d = $7,
           current_value = $8, nft_count = $9, streak = $10,
           last_updated = NOW()`,
        [wallet, pnl24h, pnl7d, pnl30d, pnlPercent24h, pnlPercent7d, pnlPercent30d, totalValue, nftCount, streak]
      );
    } catch (error) {
      logger.error(`Error updating PnL cache for ${wallet}:`, error);
    }
  }

  /**
   * Get PnL record for a wallet
   */
  async getPnL(wallet: string): Promise<PnLRecord | null> {
    try {
      // Check if we have recent cache
      const cached = await pool.query(
        `SELECT * FROM user_pnl_cache WHERE wallet = $1`,
        [wallet]
      );

      if (cached.rows.length > 0) {
        const row = cached.rows[0];
        const { holdings } = await this.calculatePortfolioValue(wallet);

        return {
          wallet,
          pnl24h: parseFloat(row.pnl_24h),
          pnl7d: parseFloat(row.pnl_7d),
          pnl30d: parseFloat(row.pnl_30d),
          pnlPercent24h: parseFloat(row.pnl_percent_24h),
          pnlPercent7d: parseFloat(row.pnl_percent_7d),
          pnlPercent30d: parseFloat(row.pnl_percent_30d),
          currentValue: parseFloat(row.current_value),
          nftCount: row.nft_count,
          topHoldings: holdings.map((h) => ({ ...h, pnl: 0 })),
          lastUpdated: new Date(row.last_updated).getTime(),
        };
      }

      // No cache - calculate fresh
      await this.takeSnapshot(wallet);
      return this.getPnL(wallet);
    } catch (error) {
      logger.error(`Error getting PnL for ${wallet}:`, error);
      return null;
    }
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(
    period: 'daily' | 'weekly' | 'monthly' = 'daily',
    limit: number = 50,
    offset: number = 0
  ): Promise<LeaderboardEntry[]> {
    try {
      // Check cache
      const cacheKey = period === 'daily' ? 'daily' : period === 'weekly' ? 'weekly' : 'monthly';
      if (
        leaderboardCache[cacheKey].length > 0 &&
        Date.now() - leaderboardCache.lastUpdated < LEADERBOARD_CACHE_TTL
      ) {
        return leaderboardCache[cacheKey].slice(offset, offset + limit);
      }

      // Query database
      const pnlColumn = period === 'daily' ? 'pnl_24h' : period === 'weekly' ? 'pnl_7d' : 'pnl_30d';
      const percentColumn =
        period === 'daily'
          ? 'pnl_percent_24h'
          : period === 'weekly'
          ? 'pnl_percent_7d'
          : 'pnl_percent_30d';

      const result = await pool.query(
        `SELECT wallet, display_name, ${pnlColumn} as pnl, ${percentColumn} as pnl_percent,
                current_value, nft_count, streak, last_updated
         FROM user_pnl_cache
         WHERE current_value > 0
         ORDER BY ${pnlColumn} DESC
         LIMIT 100`,
        []
      );

      const entries: LeaderboardEntry[] = result.rows.map((row, index) => ({
        rank: index + 1,
        wallet: row.wallet,
        displayName: row.display_name || this.shortenWallet(row.wallet),
        pnl: parseFloat(row.pnl),
        pnlPercent: parseFloat(row.pnl_percent),
        currentValue: parseFloat(row.current_value),
        nftCount: row.nft_count,
        streak: row.streak,
        lastUpdated: new Date(row.last_updated).getTime(),
      }));

      // Update cache
      leaderboardCache[cacheKey] = entries;
      leaderboardCache.lastUpdated = Date.now();

      return entries.slice(offset, offset + limit);
    } catch (error) {
      logger.error('Error getting leaderboard:', error);
      return [];
    }
  }

  /**
   * Get user's rank on leaderboard
   */
  async getUserRank(
    wallet: string,
    period: 'daily' | 'weekly' | 'monthly' = 'daily'
  ): Promise<number> {
    try {
      const pnlColumn = period === 'daily' ? 'pnl_24h' : period === 'weekly' ? 'pnl_7d' : 'pnl_30d';

      const result = await pool.query(
        `SELECT COUNT(*) + 1 as rank
         FROM user_pnl_cache
         WHERE ${pnlColumn} > (SELECT ${pnlColumn} FROM user_pnl_cache WHERE wallet = $1)`,
        [wallet]
      );

      return parseInt(result.rows[0]?.rank || '0');
    } catch (error) {
      logger.error(`Error getting rank for ${wallet}:`, error);
      return 0;
    }
  }

  /**
   * Set display name for leaderboard
   */
  async setDisplayName(wallet: string, displayName: string): Promise<boolean> {
    try {
      // Sanitize display name
      const sanitized = displayName.replace(/[^a-zA-Z0-9_.-]/g, '').slice(0, 20);

      await pool.query(
        `UPDATE user_pnl_cache SET display_name = $2 WHERE wallet = $1`,
        [wallet, sanitized]
      );

      return true;
    } catch (error) {
      logger.error(`Error setting display name for ${wallet}:`, error);
      return false;
    }
  }

  /**
   * Helper to shorten wallet address
   */
  private shortenWallet(wallet: string): string {
    return `${wallet.slice(0, 4)}...${wallet.slice(-4)}`;
  }

  /**
   * Batch update all tracked wallets (for cron job)
   */
  async batchUpdateAllWallets(): Promise<number> {
    try {
      const result = await pool.query(
        `SELECT DISTINCT wallet FROM user_pnl_cache LIMIT 1000`
      );

      let updated = 0;
      for (const row of result.rows) {
        await this.takeSnapshot(row.wallet);
        updated++;
      }

      logger.info(`Batch updated ${updated} wallet PnL records`);
      return updated;
    } catch (error) {
      logger.error('Error in batch update:', error);
      return 0;
    }
  }
}

// Singleton instance
let pnlService: PnLService;

export function getPnLService(): PnLService {
  if (!pnlService) {
    pnlService = new PnLService();
  }
  return pnlService;
}

// Initialize tables on module load
getPnLService()
  .initializeTables()
  .catch((err) => logger.warn('PnL tables initialization deferred:', err.message));

export { PnLService };
export default getPnLService;
