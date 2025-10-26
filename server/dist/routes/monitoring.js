"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const db_1 = require("../db");
const schema_1 = require("../schema");
const drizzle_orm_1 = require("drizzle-orm");
const router = express_1.default.Router();
// Real-time platform metrics
router.get('/metrics', async (req, res) => {
    try {
        const now = new Date();
        const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        // Get basic counts
        const [totalNFTs] = await db_1.db.select({ count: (0, drizzle_orm_1.sql) `count(*)` }).from(schema_1.nfts);
        const [totalUsers] = await db_1.db.select({ count: (0, drizzle_orm_1.sql) `count(*)` }).from(schema_1.users);
        const [totalTransactions] = await db_1.db.select({ count: (0, drizzle_orm_1.sql) `count(*)` }).from(schema_1.nftTransactions);
        // Get 24-hour activity
        const [nftsLast24h] = await db_1.db.select({ count: (0, drizzle_orm_1.sql) `count(*)` })
            .from(schema_1.nfts)
            .where((0, drizzle_orm_1.sql) `${schema_1.nfts.createdAt} >= ${last24Hours}`);
        const [transactionsLast24h] = await db_1.db.select({ count: (0, drizzle_orm_1.sql) `count(*)` })
            .from(schema_1.nftTransactions)
            .where((0, drizzle_orm_1.sql) `${schema_1.nftTransactions.createdAt} >= ${last24Hours}`);
        // Get 7-day activity
        const [nftsLast7d] = await db_1.db.select({ count: (0, drizzle_orm_1.sql) `count(*)` })
            .from(schema_1.nfts)
            .where((0, drizzle_orm_1.sql) `${schema_1.nfts.createdAt} >= ${last7Days}`);
        const [transactionsLast7d] = await db_1.db.select({ count: (0, drizzle_orm_1.sql) `count(*)` })
            .from(schema_1.nftTransactions)
            .where((0, drizzle_orm_1.sql) `${schema_1.nftTransactions.createdAt} >= ${last7Days}`);
        // Get revenue metrics (if price data exists)
        const [revenueLast24h] = await db_1.db.select({
            total: (0, drizzle_orm_1.sql) `coalesce(sum(${schema_1.nftTransactions.price}), 0)`
        })
            .from(schema_1.nftTransactions)
            .where((0, drizzle_orm_1.sql) `${schema_1.nftTransactions.createdAt} >= ${last24Hours} AND ${schema_1.nftTransactions.price} IS NOT NULL`);
        const [revenueLast7d] = await db_1.db.select({
            total: (0, drizzle_orm_1.sql) `coalesce(sum(${schema_1.nftTransactions.price}), 0)`
        })
            .from(schema_1.nftTransactions)
            .where((0, drizzle_orm_1.sql) `${schema_1.nftTransactions.createdAt} >= ${last7Days} AND ${schema_1.nftTransactions.price} IS NOT NULL`);
        // Get top creators
        const topCreators = await db_1.db.select({
            creator: schema_1.nfts.creator,
            count: (0, drizzle_orm_1.sql) `count(*)`
        })
            .from(schema_1.nfts)
            .groupBy(schema_1.nfts.creator)
            .orderBy((0, drizzle_orm_1.sql) `count(*) DESC`)
            .limit(10);
        // Get transaction types breakdown
        const transactionTypes = await db_1.db.select({
            type: schema_1.nftTransactions.transactionType,
            count: (0, drizzle_orm_1.sql) `count(*)`
        })
            .from(schema_1.nftTransactions)
            .groupBy(schema_1.nftTransactions.transactionType);
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
    }
    catch (error) {
        console.error('Failed to get metrics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve metrics'
        });
    }
});
// System health check
router.get('/health', async (req, res) => {
    try {
        const start = Date.now();
        // Test database connection
        await db_1.db.select({ count: (0, drizzle_orm_1.sql) `count(*)` }).from(schema_1.nfts);
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
    }
    catch (error) {
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
router.get('/users/analytics', async (req, res) => {
    try {
        const now = new Date();
        const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        // User registration trends (simplified since users table doesn't have createdAt)
        const userTrends = await db_1.db.select({
            date: (0, drizzle_orm_1.sql) `current_date`,
            count: (0, drizzle_orm_1.sql) `count(*)`
        })
            .from(schema_1.users)
            .groupBy((0, drizzle_orm_1.sql) `current_date`);
        // Active users (users with transactions in last 7 days)
        const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const [activeUsers] = await db_1.db.select({
            count: (0, drizzle_orm_1.sql) `count(distinct ${schema_1.nftTransactions.toWallet})`
        })
            .from(schema_1.nftTransactions)
            .where((0, drizzle_orm_1.sql) `${schema_1.nftTransactions.createdAt} >= ${last7Days}`);
        // User engagement metrics
        const [avgNFTsPerUser] = await db_1.db.select({
            avg: (0, drizzle_orm_1.sql) `avg(nft_count)`
        }).from(db_1.db.select({
            creator: schema_1.nfts.creator,
            nft_count: (0, drizzle_orm_1.sql) `count(*)`
        })
            .from(schema_1.nfts)
            .groupBy(schema_1.nfts.creator)
            .as('user_nfts'));
        res.json({
            success: true,
            analytics: {
                userTrends,
                activeUsers: activeUsers.count,
                avgNFTsPerUser: avgNFTsPerUser.avg || 0
            }
        });
    }
    catch (error) {
        console.error('Failed to get user analytics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve user analytics'
        });
    }
});
// NFT analytics
router.get('/nfts/analytics', async (req, res) => {
    try {
        const now = new Date();
        const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        // NFT creation trends
        const nftTrends = await db_1.db.select({
            date: (0, drizzle_orm_1.sql) `date(${schema_1.nfts.createdAt})`,
            count: (0, drizzle_orm_1.sql) `count(*)`
        })
            .from(schema_1.nfts)
            .where((0, drizzle_orm_1.sql) `${schema_1.nfts.createdAt} >= ${last30Days}`)
            .groupBy((0, drizzle_orm_1.sql) `date(${schema_1.nfts.createdAt})`)
            .orderBy((0, drizzle_orm_1.sql) `date(${schema_1.nfts.createdAt})`);
        // Collection popularity
        const collectionStats = await db_1.db.select({
            collection: schema_1.nfts.collection,
            count: (0, drizzle_orm_1.sql) `count(*)`
        })
            .from(schema_1.nfts)
            .where((0, drizzle_orm_1.sql) `${schema_1.nfts.collection} IS NOT NULL`)
            .groupBy(schema_1.nfts.collection)
            .orderBy((0, drizzle_orm_1.sql) `count(*) DESC`)
            .limit(10);
        // Price analysis
        const [priceStats] = await db_1.db.select({
            avg: (0, drizzle_orm_1.sql) `avg(${schema_1.nfts.price})`,
            min: (0, drizzle_orm_1.sql) `min(${schema_1.nfts.price})`,
            max: (0, drizzle_orm_1.sql) `max(${schema_1.nfts.price})`
        })
            .from(schema_1.nfts)
            .where((0, drizzle_orm_1.sql) `${schema_1.nfts.price} IS NOT NULL`);
        res.json({
            success: true,
            analytics: {
                nftTrends,
                collectionStats,
                priceStats
            }
        });
    }
    catch (error) {
        console.error('Failed to get NFT analytics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve NFT analytics'
        });
    }
});
// Transaction analytics
router.get('/transactions/analytics', async (req, res) => {
    try {
        const now = new Date();
        const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        // Transaction volume trends
        const volumeTrends = await db_1.db.select({
            date: (0, drizzle_orm_1.sql) `date(${schema_1.nftTransactions.createdAt})`,
            count: (0, drizzle_orm_1.sql) `count(*)`,
            volume: (0, drizzle_orm_1.sql) `coalesce(sum(${schema_1.nftTransactions.price}), 0)`
        })
            .from(schema_1.nftTransactions)
            .where((0, drizzle_orm_1.sql) `${schema_1.nftTransactions.createdAt} >= ${last30Days}`)
            .groupBy((0, drizzle_orm_1.sql) `date(${schema_1.nftTransactions.createdAt})`)
            .orderBy((0, drizzle_orm_1.sql) `date(${schema_1.nftTransactions.createdAt})`);
        // Transaction type breakdown
        const typeBreakdown = await db_1.db.select({
            type: schema_1.nftTransactions.transactionType,
            count: (0, drizzle_orm_1.sql) `count(*)`,
            volume: (0, drizzle_orm_1.sql) `coalesce(sum(${schema_1.nftTransactions.price}), 0)`
        })
            .from(schema_1.nftTransactions)
            .where((0, drizzle_orm_1.sql) `${schema_1.nftTransactions.createdAt} >= ${last30Days}`)
            .groupBy(schema_1.nftTransactions.transactionType);
        // Top traders
        const topTraders = await db_1.db.select({
            wallet: schema_1.nftTransactions.toWallet,
            count: (0, drizzle_orm_1.sql) `count(*)`,
            volume: (0, drizzle_orm_1.sql) `coalesce(sum(${schema_1.nftTransactions.price}), 0)`
        })
            .from(schema_1.nftTransactions)
            .where((0, drizzle_orm_1.sql) `${schema_1.nftTransactions.createdAt} >= ${last30Days} AND ${schema_1.nftTransactions.price} IS NOT NULL`)
            .groupBy(schema_1.nftTransactions.toWallet)
            .orderBy((0, drizzle_orm_1.sql) `coalesce(sum(${schema_1.nftTransactions.price}), 0) DESC`)
            .limit(10);
        res.json({
            success: true,
            analytics: {
                volumeTrends,
                typeBreakdown,
                topTraders
            }
        });
    }
    catch (error) {
        console.error('Failed to get transaction analytics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve transaction analytics'
        });
    }
});
exports.default = router;
