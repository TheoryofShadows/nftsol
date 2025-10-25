import express from 'express';
import { Request, Response } from 'express';
import { db } from '../db';
import { nfts, nftTransactions, users } from '../schema';
import { sql } from 'drizzle-orm';

const router = express.Router();

// Real-time platform metrics
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get basic counts
    const [totalNFTs] = await db.select({ count: sql<number>`count(*)` }).from(nfts);
    const [totalUsers] = await db.select({ count: sql<number>`count(*)` }).from(users);
    const [totalTransactions] = await db.select({ count: sql<number>`count(*)` }).from(nftTransactions);

    // Get 24-hour activity
    const [nftsLast24h] = await db.select({ count: sql<number>`count(*)` })
      .from(nfts)
      .where(sql`${nfts.createdAt} >= ${last24Hours}`);
    
    const [transactionsLast24h] = await db.select({ count: sql<number>`count(*)` })
      .from(nftTransactions)
      .where(sql`${nftTransactions.createdAt} >= ${last24Hours}`);

    // Get 7-day activity
    const [nftsLast7d] = await db.select({ count: sql<number>`count(*)` })
      .from(nfts)
      .where(sql`${nfts.createdAt} >= ${last7Days}`);
    
    const [transactionsLast7d] = await db.select({ count: sql<number>`count(*)` })
      .from(nftTransactions)
      .where(sql`${nftTransactions.createdAt} >= ${last7Days}`);

    // Get revenue metrics (if price data exists)
    const [revenueLast24h] = await db.select({ 
      total: sql<number>`coalesce(sum(${nftTransactions.price}), 0)` 
    })
      .from(nftTransactions)
      .where(sql`${nftTransactions.createdAt} >= ${last24Hours} AND ${nftTransactions.price} IS NOT NULL`);

    const [revenueLast7d] = await db.select({ 
      total: sql<number>`coalesce(sum(${nftTransactions.price}), 0)` 
    })
      .from(nftTransactions)
      .where(sql`${nftTransactions.createdAt} >= ${last7Days} AND ${nftTransactions.price} IS NOT NULL`);

    // Get top creators
    const topCreators = await db.select({
      creator: nfts.creator,
      count: sql<number>`count(*)`
    })
      .from(nfts)
      .groupBy(nfts.creator)
      .orderBy(sql`count(*) DESC`)
      .limit(10);

    // Get transaction types breakdown
    const transactionTypes = await db.select({
      type: nftTransactions.transactionType,
      count: sql<number>`count(*)`
    })
      .from(nftTransactions)
      .groupBy(nftTransactions.transactionType);

    res.json({
      success: true,
      metrics: {
        totals: {
          nfts: totalNFTs.count,
          users: totalUsers.count,
          transactions: totalTransactions.count
        },
        last24Hours: {
          nfts: nftsLast24h.count,
          transactions: transactionsLast24h.count,
          revenue: revenueLast24h.total
        },
        last7Days: {
          nfts: nftsLast7d.count,
          transactions: transactionsLast7d.count,
          revenue: revenueLast7d.total
        },
        topCreators,
        transactionTypes
      }
    });
  } catch (error: any) {
    console.error('Failed to get metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve metrics'
    });
  }
});

// System health check
router.get('/health', async (req: Request, res: Response) => {
  try {
    const start = Date.now();
    
    // Test database connection
    await db.select({ count: sql<number>`count(*)` }).from(nfts);
    const dbLatency = Date.now() - start;

    // Check environment variables
    const envStatus = {
      database: !!process.env.DATABASE_URL,
      helius: !!process.env.HELIUS_API_KEY,
      pinata: !!(process.env.PINATA_API_KEY && process.env.PINATA_SECRET_KEY),
      redis: !!process.env.REDIS_URL,
      session: !!process.env.SESSION_SECRET
    };

    // Memory usage
    const memoryUsage = process.memoryUsage();
    const memoryUsageMB = {
      rss: Math.round(memoryUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      external: Math.round(memoryUsage.external / 1024 / 1024)
    };

    // Uptime
    const uptime = process.uptime();

    res.json({
      success: true,
      health: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: Math.round(uptime),
        database: {
          connected: true,
          latency: dbLatency
        },
        environment: envStatus,
        memory: memoryUsageMB,
        nodeVersion: process.version,
        platform: process.platform
      }
    });
  } catch (error: any) {
    console.error('Health check failed:', error);
    res.status(500).json({
      success: false,
      health: {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }
});

// User analytics
router.get('/users/analytics', async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // User registration trends (simplified since users table doesn't have createdAt)
    const userTrends = await db.select({
      date: sql<string>`current_date`,
      count: sql<number>`count(*)`
    })
      .from(users)
      .groupBy(sql`current_date`);

    // Active users (users with transactions in last 7 days)
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const [activeUsers] = await db.select({ 
      count: sql<number>`count(distinct ${nftTransactions.toWallet})` 
    })
      .from(nftTransactions)
      .where(sql`${nftTransactions.createdAt} >= ${last7Days}`);

    // User engagement metrics
    const [avgNFTsPerUser] = await db.select({
      avg: sql<number>`avg(nft_count)`
    }).from(
      db.select({
        creator: nfts.creator,
        nft_count: sql<number>`count(*)`
      })
        .from(nfts)
        .groupBy(nfts.creator)
        .as('user_nfts')
    );

    res.json({
      success: true,
      analytics: {
        userTrends,
        activeUsers: activeUsers.count,
        avgNFTsPerUser: avgNFTsPerUser.avg || 0
      }
    });
  } catch (error: any) {
    console.error('Failed to get user analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve user analytics'
    });
  }
});

// NFT analytics
router.get('/nfts/analytics', async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // NFT creation trends
    const nftTrends = await db.select({
      date: sql<string>`date(${nfts.createdAt})`,
      count: sql<number>`count(*)`
    })
      .from(nfts)
      .where(sql`${nfts.createdAt} >= ${last30Days}`)
      .groupBy(sql`date(${nfts.createdAt})`)
      .orderBy(sql`date(${nfts.createdAt})`);

    // Collection popularity
    const collectionStats = await db.select({
      collection: nfts.collection,
      count: sql<number>`count(*)`
    })
      .from(nfts)
      .where(sql`${nfts.collection} IS NOT NULL`)
      .groupBy(nfts.collection)
      .orderBy(sql`count(*) DESC`)
      .limit(10);

    // Price analysis
    const [priceStats] = await db.select({
      avg: sql<number>`avg(${nfts.price})`,
      min: sql<number>`min(${nfts.price})`,
      max: sql<number>`max(${nfts.price})`
    })
      .from(nfts)
      .where(sql`${nfts.price} IS NOT NULL`);

    res.json({
      success: true,
      analytics: {
        nftTrends,
        collectionStats,
        priceStats
      }
    });
  } catch (error: any) {
    console.error('Failed to get NFT analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve NFT analytics'
    });
  }
});

// Transaction analytics
router.get('/transactions/analytics', async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Transaction volume trends
    const volumeTrends = await db.select({
      date: sql<string>`date(${nftTransactions.createdAt})`,
      count: sql<number>`count(*)`,
      volume: sql<number>`coalesce(sum(${nftTransactions.price}), 0)`
    })
      .from(nftTransactions)
      .where(sql`${nftTransactions.createdAt} >= ${last30Days}`)
      .groupBy(sql`date(${nftTransactions.createdAt})`)
      .orderBy(sql`date(${nftTransactions.createdAt})`);

    // Transaction type breakdown
    const typeBreakdown = await db.select({
      type: nftTransactions.transactionType,
      count: sql<number>`count(*)`,
      volume: sql<number>`coalesce(sum(${nftTransactions.price}), 0)`
    })
      .from(nftTransactions)
      .where(sql`${nftTransactions.createdAt} >= ${last30Days}`)
      .groupBy(nftTransactions.transactionType);

    // Top traders
    const topTraders = await db.select({
      wallet: nftTransactions.toWallet,
      count: sql<number>`count(*)`,
      volume: sql<number>`coalesce(sum(${nftTransactions.price}), 0)`
    })
      .from(nftTransactions)
      .where(sql`${nftTransactions.createdAt} >= ${last30Days} AND ${nftTransactions.price} IS NOT NULL`)
      .groupBy(nftTransactions.toWallet)
      .orderBy(sql`coalesce(sum(${nftTransactions.price}), 0) DESC`)
      .limit(10);

    res.json({
      success: true,
      analytics: {
        volumeTrends,
        typeBreakdown,
        topTraders
      }
    });
  } catch (error: any) {
    console.error('Failed to get transaction analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve transaction analytics'
    });
  }
});

export default router;
