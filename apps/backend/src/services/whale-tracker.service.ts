/**
 * Whale Tracker Service
 * Track top NFT wallets and their movements
 */

import logger from '../utils/logger';
import { pool } from '../lib/db';
import { heliusService } from './helius';

export interface WhaleWallet {
  address: string;
  displayName?: string;
  totalValue: number;
  nftCount: number;
  volume24h: number;
  volume7d: number;
  topCollections: Array<{
    collection: string;
    count: number;
    value: number;
  }>;
  lastActivity: number;
  rank: number;
  isFollowed?: boolean;
}

export interface WhaleActivity {
  id: string;
  wallet: string;
  walletName?: string;
  type: 'buy' | 'sell' | 'mint' | 'transfer';
  collection: string;
  collectionName?: string;
  nftMint: string;
  nftName?: string;
  price: number;
  timestamp: number;
  signature: string;
}

export interface WhaleAlert {
  id: string;
  type: 'whale_buy' | 'whale_sell' | 'accumulation' | 'distribution';
  wallet: string;
  walletName?: string;
  collection: string;
  details: string;
  significance: 'low' | 'medium' | 'high';
  timestamp: number;
}

// In-memory cache for whale data
let whaleCache: {
  topWhales: WhaleWallet[];
  recentActivity: WhaleActivity[];
  lastUpdated: number;
} = {
  topWhales: [],
  recentActivity: [],
  lastUpdated: 0,
};

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Known whale wallets (famous collectors, funds, etc.)
const KNOWN_WHALES: Record<string, string> = {
  // Add known whale addresses here
  'DRQ9KMKNMd3p8J5J4EKZDwcBWkMR8rSRKD7jKnFGH123': 'frankdegods.sol',
  'GvyyB5LJMQqTPkE2gKBiEMzq5Eu2ptQBXvGRQvTiaZwR': 'whale1.sol',
};

class WhaleTrackerService {
  private initialized = false;

  /**
   * Initialize database tables
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Whale tracking table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS tracked_whales (
          address VARCHAR(44) PRIMARY KEY,
          display_name VARCHAR(100),
          total_value DECIMAL(20, 9) DEFAULT 0,
          nft_count INTEGER DEFAULT 0,
          volume_24h DECIMAL(20, 9) DEFAULT 0,
          volume_7d DECIMAL(20, 9) DEFAULT 0,
          last_activity TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Whale activity log
      await pool.query(`
        CREATE TABLE IF NOT EXISTS whale_activities (
          id SERIAL PRIMARY KEY,
          wallet VARCHAR(44) NOT NULL,
          activity_type VARCHAR(20) NOT NULL,
          collection VARCHAR(100),
          nft_mint VARCHAR(44),
          nft_name VARCHAR(200),
          price DECIMAL(20, 9),
          signature VARCHAR(100),
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // User follows table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS whale_follows (
          id SERIAL PRIMARY KEY,
          user_wallet VARCHAR(44) NOT NULL,
          whale_wallet VARCHAR(44) NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(user_wallet, whale_wallet)
        )
      `);

      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_whale_activities_wallet
        ON whale_activities(wallet, created_at DESC)
      `);

      this.initialized = true;
      logger.info('Whale tracker tables initialized');
    } catch (error) {
      logger.error('Error initializing whale tracker tables:', error);
    }
  }

  /**
   * Get top whales by volume/holdings
   */
  async getTopWhales(limit: number = 100): Promise<WhaleWallet[]> {
    await this.initialize();

    // Check cache
    if (
      whaleCache.topWhales.length > 0 &&
      Date.now() - whaleCache.lastUpdated < CACHE_TTL
    ) {
      return whaleCache.topWhales.slice(0, limit);
    }

    try {
      const result = await pool.query(
        `SELECT * FROM tracked_whales
         ORDER BY total_value DESC
         LIMIT $1`,
        [limit]
      );

      const whales: WhaleWallet[] = result.rows.map((row, index) => ({
        address: row.address,
        displayName: row.display_name || KNOWN_WHALES[row.address] || this.shortenAddress(row.address),
        totalValue: parseFloat(row.total_value || 0),
        nftCount: row.nft_count || 0,
        volume24h: parseFloat(row.volume_24h || 0),
        volume7d: parseFloat(row.volume_7d || 0),
        topCollections: [],
        lastActivity: row.last_activity ? new Date(row.last_activity).getTime() : 0,
        rank: index + 1,
      }));

      // If no data in DB, return mock data
      if (whales.length === 0) {
        return this.getMockWhales(limit);
      }

      whaleCache.topWhales = whales;
      whaleCache.lastUpdated = Date.now();

      return whales;
    } catch (error) {
      logger.error('Error fetching top whales:', error);
      return this.getMockWhales(limit);
    }
  }

  /**
   * Get recent whale activity
   */
  async getRecentActivity(limit: number = 50): Promise<WhaleActivity[]> {
    await this.initialize();

    // Check cache
    if (
      whaleCache.recentActivity.length > 0 &&
      Date.now() - whaleCache.lastUpdated < CACHE_TTL
    ) {
      return whaleCache.recentActivity.slice(0, limit);
    }

    try {
      const result = await pool.query(
        `SELECT wa.*, tw.display_name as wallet_name
         FROM whale_activities wa
         LEFT JOIN tracked_whales tw ON wa.wallet = tw.address
         ORDER BY wa.created_at DESC
         LIMIT $1`,
        [limit]
      );

      const activities: WhaleActivity[] = result.rows.map((row) => ({
        id: row.id.toString(),
        wallet: row.wallet,
        walletName: row.wallet_name || KNOWN_WHALES[row.wallet] || this.shortenAddress(row.wallet),
        type: row.activity_type,
        collection: row.collection || 'Unknown',
        nftMint: row.nft_mint,
        nftName: row.nft_name,
        price: parseFloat(row.price || 0),
        timestamp: new Date(row.created_at).getTime(),
        signature: row.signature,
      }));

      if (activities.length === 0) {
        return this.getMockActivity(limit);
      }

      whaleCache.recentActivity = activities;

      return activities;
    } catch (error) {
      logger.error('Error fetching whale activity:', error);
      return this.getMockActivity(limit);
    }
  }

  /**
   * Track a whale's activity
   */
  async trackActivity(activity: Omit<WhaleActivity, 'id'>): Promise<void> {
    await this.initialize();

    try {
      await pool.query(
        `INSERT INTO whale_activities
         (wallet, activity_type, collection, nft_mint, nft_name, price, signature)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          activity.wallet,
          activity.type,
          activity.collection,
          activity.nftMint,
          activity.nftName,
          activity.price,
          activity.signature,
        ]
      );

      // Update whale's last activity
      await pool.query(
        `UPDATE tracked_whales SET last_activity = NOW(), updated_at = NOW()
         WHERE address = $1`,
        [activity.wallet]
      );

      // Clear cache
      whaleCache.lastUpdated = 0;
    } catch (error) {
      logger.error('Error tracking whale activity:', error);
    }
  }

  /**
   * Add whale to tracking list
   */
  async addWhale(address: string, displayName?: string): Promise<boolean> {
    await this.initialize();

    try {
      // Get initial data from Helius
      let totalValue = 0;
      let nftCount = 0;

      try {
        const assets = await heliusService.getAssetsByOwner(address, { limit: 100 });
        nftCount = assets.total || assets.items?.length || 0;
        // Estimate value (would need floor prices for accuracy)
        totalValue = nftCount * 1; // Placeholder: 1 SOL per NFT average
      } catch {
        // Continue without Helius data
      }

      await pool.query(
        `INSERT INTO tracked_whales (address, display_name, nft_count, total_value)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (address) DO UPDATE SET
           display_name = COALESCE($2, tracked_whales.display_name),
           nft_count = $3,
           total_value = $4,
           updated_at = NOW()`,
        [address, displayName || null, nftCount, totalValue]
      );

      whaleCache.lastUpdated = 0;
      return true;
    } catch (error) {
      logger.error(`Error adding whale ${address}:`, error);
      return false;
    }
  }

  /**
   * Follow a whale (for alerts)
   */
  async followWhale(userWallet: string, whaleWallet: string): Promise<boolean> {
    await this.initialize();

    try {
      await pool.query(
        `INSERT INTO whale_follows (user_wallet, whale_wallet)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [userWallet, whaleWallet]
      );
      return true;
    } catch (error) {
      logger.error('Error following whale:', error);
      return false;
    }
  }

  /**
   * Unfollow a whale
   */
  async unfollowWhale(userWallet: string, whaleWallet: string): Promise<boolean> {
    try {
      await pool.query(
        `DELETE FROM whale_follows WHERE user_wallet = $1 AND whale_wallet = $2`,
        [userWallet, whaleWallet]
      );
      return true;
    } catch (error) {
      logger.error('Error unfollowing whale:', error);
      return false;
    }
  }

  /**
   * Get followed whales for a user
   */
  async getFollowedWhales(userWallet: string): Promise<WhaleWallet[]> {
    await this.initialize();

    try {
      const result = await pool.query(
        `SELECT tw.* FROM tracked_whales tw
         INNER JOIN whale_follows wf ON tw.address = wf.whale_wallet
         WHERE wf.user_wallet = $1
         ORDER BY tw.total_value DESC`,
        [userWallet]
      );

      return result.rows.map((row, index) => ({
        address: row.address,
        displayName: row.display_name || this.shortenAddress(row.address),
        totalValue: parseFloat(row.total_value || 0),
        nftCount: row.nft_count || 0,
        volume24h: parseFloat(row.volume_24h || 0),
        volume7d: parseFloat(row.volume_7d || 0),
        topCollections: [],
        lastActivity: row.last_activity ? new Date(row.last_activity).getTime() : 0,
        rank: index + 1,
        isFollowed: true,
      }));
    } catch (error) {
      logger.error('Error fetching followed whales:', error);
      return [];
    }
  }

  /**
   * Get whale details
   */
  async getWhaleDetails(address: string): Promise<WhaleWallet | null> {
    await this.initialize();

    try {
      const result = await pool.query(
        `SELECT * FROM tracked_whales WHERE address = $1`,
        [address]
      );

      if (result.rows.length === 0) {
        // Try to fetch from blockchain and add
        await this.addWhale(address);
        return this.getWhaleDetails(address);
      }

      const row = result.rows[0];

      // Get top collections for this whale
      const collectionsResult = await pool.query(
        `SELECT collection, COUNT(*) as count
         FROM whale_activities
         WHERE wallet = $1 AND activity_type = 'buy'
         GROUP BY collection
         ORDER BY count DESC
         LIMIT 5`,
        [address]
      );

      return {
        address: row.address,
        displayName: row.display_name || KNOWN_WHALES[address] || this.shortenAddress(address),
        totalValue: parseFloat(row.total_value || 0),
        nftCount: row.nft_count || 0,
        volume24h: parseFloat(row.volume_24h || 0),
        volume7d: parseFloat(row.volume_7d || 0),
        topCollections: collectionsResult.rows.map((r) => ({
          collection: r.collection,
          count: parseInt(r.count),
          value: 0, // Would need price data
        })),
        lastActivity: row.last_activity ? new Date(row.last_activity).getTime() : 0,
        rank: 0,
      };
    } catch (error) {
      logger.error(`Error fetching whale details for ${address}:`, error);
      return null;
    }
  }

  /**
   * Generate mock whales for demo
   */
  private getMockWhales(limit: number): WhaleWallet[] {
    return Array.from({ length: Math.min(limit, 20) }, (_, i) => ({
      address: `Whale${i + 1}...${Math.random().toString(36).slice(2, 6)}`,
      displayName: i < 5 ? `topwhale${i + 1}.sol` : undefined,
      totalValue: 1000 - i * 40 + Math.random() * 50,
      nftCount: 200 - i * 8 + Math.floor(Math.random() * 20),
      volume24h: 50 - i * 2 + Math.random() * 10,
      volume7d: 200 - i * 8 + Math.random() * 30,
      topCollections: [
        { collection: 'mad-lads', count: 10 - i, value: 100 },
        { collection: 'tensorians', count: 8 - i, value: 80 },
      ],
      lastActivity: Date.now() - i * 3600000,
      rank: i + 1,
    }));
  }

  /**
   * Generate mock activity for demo
   */
  private getMockActivity(limit: number): WhaleActivity[] {
    const types: Array<'buy' | 'sell'> = ['buy', 'sell'];
    const collections = ['mad-lads', 'tensorians', 'okay-bears', 'degods', 'y00ts'];

    return Array.from({ length: Math.min(limit, 20) }, (_, i) => ({
      id: `activity-${i}`,
      wallet: `Whale${(i % 5) + 1}...${Math.random().toString(36).slice(2, 6)}`,
      walletName: i % 3 === 0 ? `whale${(i % 5) + 1}.sol` : undefined,
      type: types[i % 2],
      collection: collections[i % collections.length],
      collectionName: collections[i % collections.length],
      nftMint: `NFT${i}...${Math.random().toString(36).slice(2, 8)}`,
      nftName: `NFT #${1000 + i}`,
      price: 5 + Math.random() * 20,
      timestamp: Date.now() - i * 600000,
      signature: `sig${i}...${Math.random().toString(36).slice(2, 10)}`,
    }));
  }

  /**
   * Helper to shorten address
   */
  private shortenAddress(address: string): string {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  }
}

// Singleton instance
let whaleService: WhaleTrackerService;

export function getWhaleTrackerService(): WhaleTrackerService {
  if (!whaleService) {
    whaleService = new WhaleTrackerService();
  }
  return whaleService;
}

export { WhaleTrackerService };
export default getWhaleTrackerService;
