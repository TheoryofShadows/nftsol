
import { Express, Request, Response } from "express";
import { db } from "./db";
import { nfts, nftTransactions, userNftStats } from "@shared/nft-schema";
import { eq, desc, sql, and, gte, like, or, lte, type SQL } from "drizzle-orm";

// Rate limiting for public APIs
const rateLimitMap = new Map();

function rateLimit(req: Request, res: Response, next: any, limit = 100) {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  
  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return next();
  }
  
  const userLimit = rateLimitMap.get(ip);
  if (now > userLimit.resetTime) {
    userLimit.count = 1;
    userLimit.resetTime = now + windowMs;
    return next();
  }
  
  if (userLimit.count >= limit) {
    return res.status(429).json({ 
      error: 'Rate limit exceeded', 
      retryAfter: Math.ceil((userLimit.resetTime - now) / 1000) 
    });
  }
  
  userLimit.count++;
  next();
}

export function setupPublicAPIRoutes(app: Express) {
  // Public NFT search with advanced filters
  app.get("/api/public/nfts/search", (req, res, next) => rateLimit(req, res, next, 50), async (req: Request, res: Response) => {
    try {
      const {
        q,
        collection,
        creator,
        minPrice,
        maxPrice,
        category,
        sortBy = 'newest',
        page = 1,
        limit = 20
      } = req.query;

      const parseNumeric = (value: unknown): number | undefined => {
        if (typeof value !== 'string') {
          return undefined;
        }
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : undefined;
      };

      const parseText = (value: unknown): string | undefined => {
        if (typeof value !== 'string') {
          return undefined;
        }
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : undefined;
      };

      const pageNum = parseNumeric(page) ?? 1;
      const limitNum = Math.min(parseNumeric(limit) ?? 20, 100); // Max 100 items
      const offset = (pageNum - 1) * limitNum;

      const filters: SQL<unknown>[] = [eq(nfts.status, 'listed')];

      const searchTerm = parseText(q);
      if (searchTerm) {
        const searchFilter = or(
          like(nfts.name, `%${searchTerm}%`),
          like(nfts.description, `%${searchTerm}%`)
        );

        if (searchFilter) {
          filters.push(searchFilter);
        }
      }

      const collectionFilter = parseText(collection);
      if (collectionFilter) {
        filters.push(like(nfts.collection, `%${collectionFilter}%`));
      }

      const creatorFilter = parseText(creator);
      if (creatorFilter) {
        filters.push(like(nfts.creator, `%${creatorFilter}%`));
      }

      const categoryFilter = parseText(category);
      if (categoryFilter) {
        filters.push(
          sql`LOWER(${nfts.attributes}::text) LIKE ${`%${categoryFilter.toLowerCase()}%`}`
        );
      }

      const minPriceValue = parseNumeric(minPrice);
      if (minPriceValue !== undefined) {
        filters.push(gte(nfts.price, minPriceValue.toString()));
      }

      const maxPriceValue = parseNumeric(maxPrice);
      if (maxPriceValue !== undefined) {
        filters.push(lte(nfts.price, maxPriceValue.toString()));
      }

      const whereClause = filters.length > 1 ? and(...filters) : filters[0];

      if (!db) return res.status(503).json({ error: "Database not configured" });
      const baseQuery = db.select().from(nfts).where(whereClause);
      const sortKey = typeof sortBy === 'string' ? sortBy : 'newest';
      const orderedQuery = (() => {
        if (sortKey === 'price_low') {
          return baseQuery.orderBy(() => sql`CAST(${nfts.price} AS DECIMAL) ASC`);
        }
        if (sortKey === 'price_high') {
          return baseQuery.orderBy(() => sql`CAST(${nfts.price} AS DECIMAL) DESC`);
        }
        if (sortKey === 'oldest') {
          return baseQuery.orderBy((aliases) => aliases.createdAt);
        }
        return baseQuery.orderBy((aliases) => desc(aliases.createdAt));
      })();

      const results = await orderedQuery.offset(offset).limit(limitNum);

      // Get total count for pagination
      const [totalCount] = await db
        .select({ count: sql`COUNT(*)` })
        .from(nfts)
        .where(eq(nfts.status, 'listed'));

      res.json({
        nfts: results,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalCount?.count || 0,
          totalPages: Math.ceil(Number(totalCount?.count ?? 0) / limitNum),
          hasMore: results.length === limitNum
        },
        filters: { q, collection, creator, minPrice, maxPrice, category, sortBy }
      });
    } catch (error) {
      console.error("Public NFT search error:", error);
      res.status(500).json({ error: "Search failed" });
    }
  });

  // Public collections API
  app.get("/api/public/collections", (req, res, next) => rateLimit(req, res, next), async (req: Request, res: Response) => {
    try {
      if (!db) return res.status(503).json({ error: "Database not configured" });
      const collections = await db
        .select({
          collection: nfts.collection,
          count: sql`COUNT(*)`,
          floorPrice: sql`MIN(CAST(${nfts.price} AS DECIMAL))`,
          avgPrice: sql`AVG(CAST(${nfts.price} AS DECIMAL))`,
          maxPrice: sql`MAX(CAST(${nfts.price} AS DECIMAL))`,
          lastActivity: sql`MAX(${nfts.listedAt})`
        })
        .from(nfts)
        .where(eq(nfts.status, 'listed'))
        .groupBy(nfts.collection)
        .orderBy(sql`COUNT(*) DESC`)
        .limit(50);

      res.json({
        collections,
        totalCollections: collections.length,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error("Collections API error:", error);
      res.status(500).json({ error: "Failed to fetch collections" });
    }
  });

  // Public collection details
  app.get("/api/public/collections/:name", (req, res, next) => rateLimit(req, res, next), async (req: Request, res: Response) => {
    try {
      const { name } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = Math.min(parseInt(limit as string), 50);
      const offset = (pageNum - 1) * limitNum;

      // Get collection stats
      if (!db) return res.status(503).json({ error: "Database not configured" });
      const [stats] = await db
        .select({
          collection: nfts.collection,
          totalItems: sql`COUNT(*)`,
          listedItems: sql`COUNT(CASE WHEN ${nfts.status} = 'listed' THEN 1 END)`,
          floorPrice: sql`MIN(CASE WHEN ${nfts.status} = 'listed' THEN CAST(${nfts.price} AS DECIMAL) END)`,
          avgPrice: sql`AVG(CASE WHEN ${nfts.status} = 'listed' THEN CAST(${nfts.price} AS DECIMAL) END)`,
          maxPrice: sql`MAX(CASE WHEN ${nfts.status} = 'listed' THEN CAST(${nfts.price} AS DECIMAL) END)`,
          totalVolume: sql`SUM(CASE WHEN ${nfts.status} = 'sold' THEN CAST(${nfts.price} AS DECIMAL) END)`
        })
        .from(nfts)
        .where(like(nfts.collection, `%${name}%`));

      // Get collection NFTs
      const nftItems = await db
        .select()
        .from(nfts)
        .where(and(
          like(nfts.collection, `%${name}%`),
          eq(nfts.status, 'listed')
        ))
        .orderBy(desc(nfts.listedAt))
        .offset(offset)
        .limit(limitNum);

      res.json({
        collection: {
          name: stats?.collection || name,
          stats: stats || {},
          nfts: nftItems,
          pagination: {
            page: pageNum,
            limit: limitNum,
            hasMore: nftItems.length === limitNum
          }
        }
      });
    } catch (error) {
      console.error("Collection details error:", error);
      res.status(500).json({ error: "Failed to fetch collection details" });
    }
  });

  // Public trending NFTs
  app.get("/api/public/trending", (req, res, next) => rateLimit(req, res, next), async (req: Request, res: Response) => {
    try {
      const { timeframe = '24h', limit = 10 } = req.query;
      
      let timeFilter = new Date();
      switch (timeframe) {
        case '1h':
          timeFilter.setHours(timeFilter.getHours() - 1);
          break;
        case '24h':
          timeFilter.setDate(timeFilter.getDate() - 1);
          break;
        case '7d':
          timeFilter.setDate(timeFilter.getDate() - 7);
          break;
        case '30d':
          timeFilter.setDate(timeFilter.getDate() - 30);
          break;
        default:
          timeFilter.setDate(timeFilter.getDate() - 1);
      }

      // Get trending based on recent activity and views (simulated)
      if (!db) return res.status(503).json({ error: "Database not configured" });
      const trending = await db
        .select({
          nft: nfts,
          activityScore: sql`RANDOM() * 100` // Simplified trending score
        })
        .from(nfts)
        .where(and(
          eq(nfts.status, 'listed'),
          gte(nfts.listedAt, timeFilter)
        ))
        .orderBy(sql`RANDOM() * 100 DESC`)
        .limit(parseInt(limit as string) || 10);

      res.json({
        trending: trending.map(t => t.nft),
        timeframe,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error("Trending API error:", error);
      res.status(500).json({ error: "Failed to fetch trending NFTs" });
    }
  });

  // Public creator profiles
  app.get("/api/public/creators/:address", (req, res, next) => rateLimit(req, res, next), async (req: Request, res: Response) => {
    try {
      const { address } = req.params;
      
      // Get creator stats
      if (!db) return res.status(503).json({ error: "Database not configured" });
      const [creatorStats] = await db
        .select({
          totalCreated: sql`COUNT(*)`,
          totalListed: sql`COUNT(CASE WHEN ${nfts.status} = 'listed' THEN 1 END)`,
          totalSold: sql`COUNT(CASE WHEN ${nfts.status} = 'sold' THEN 1 END)`,
          totalVolume: sql`SUM(CASE WHEN ${nfts.status} = 'sold' THEN CAST(${nfts.price} AS DECIMAL) END)`,
          avgPrice: sql`AVG(CASE WHEN ${nfts.status} = 'listed' THEN CAST(${nfts.price} AS DECIMAL) END)`,
          floorPrice: sql`MIN(CASE WHEN ${nfts.status} = 'listed' THEN CAST(${nfts.price} AS DECIMAL) END)`
        })
        .from(nfts)
        .where(eq(nfts.creator, address));

      // Get creator's NFTs
      const creatorNFTs = await db
        .select()
        .from(nfts)
        .where(eq(nfts.creator, address))
        .orderBy(desc(nfts.createdAt))
        .limit(20);

      res.json({
        creator: {
          address,
          stats: creatorStats || {},
          nfts: creatorNFTs,
          verified: false // Add verification logic later
        }
      });
    } catch (error) {
      console.error("Creator profile error:", error);
      res.status(500).json({ error: "Failed to fetch creator profile" });
    }
  });

  // Public marketplace statistics
  app.get("/api/public/stats", (req, res, next) => rateLimit(req, res, next), async (req: Request, res: Response) => {
    try {
      // Get platform-wide statistics
      if (!db) return res.status(503).json({ error: "Database not configured" });
      const [platformStats] = await db
        .select({
          totalNFTs: sql`COUNT(*)`,
          listedNFTs: sql`COUNT(CASE WHEN ${nfts.status} = 'listed' THEN 1 END)`,
          soldNFTs: sql`COUNT(CASE WHEN ${nfts.status} = 'sold' THEN 1 END)`,
          totalVolume: sql`SUM(CASE WHEN ${nfts.status} = 'sold' THEN CAST(${nfts.price} AS DECIMAL) END)`,
          avgPrice: sql`AVG(CASE WHEN ${nfts.status} = 'listed' THEN CAST(${nfts.price} AS DECIMAL) END)`,
          floorPrice: sql`MIN(CASE WHEN ${nfts.status} = 'listed' THEN CAST(${nfts.price} AS DECIMAL) END)`,
          uniqueCreators: sql`COUNT(DISTINCT ${nfts.creator})`,
          uniqueCollections: sql`COUNT(DISTINCT ${nfts.collection})`
        })
        .from(nfts);

      // Get recent activity (last 24h)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const [recentActivity] = await db
        .select({
          newListings: sql`COUNT(CASE WHEN ${nfts.listedAt} >= ${yesterday} THEN 1 END)`,
          recentSales: sql`COUNT(CASE WHEN ${nfts.soldAt} >= ${yesterday} AND ${nfts.status} = 'sold' THEN 1 END)`,
          volume24h: sql`SUM(CASE WHEN ${nfts.soldAt} >= ${yesterday} AND ${nfts.status} = 'sold' THEN CAST(${nfts.price} AS DECIMAL) END)`
        })
        .from(nfts);

      res.json({
        platform: platformStats || {},
        recent: recentActivity || {},
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error("Platform stats error:", error);
      res.status(500).json({ error: "Failed to fetch platform statistics" });
    }
  });

  // Public price history API
  app.get("/api/public/nfts/:mintAddress/price-history", (req, res, next) => rateLimit(req, res, next), async (req: Request, res: Response) => {
    try {
      const { mintAddress } = req.params;
      
      if (!db) return res.status(503).json({ error: "Database not configured" });
      const priceHistory = await db
        .select({
          price: nftTransactions.price,
          timestamp: nftTransactions.blockTime,
          transactionType: nftTransactions.transactionType,
          fromWallet: nftTransactions.fromWallet,
          toWallet: nftTransactions.toWallet
        })
        .from(nftTransactions)
        .where(eq(nftTransactions.mintAddress, mintAddress))
        .orderBy(desc(nftTransactions.blockTime))
        .limit(50);

      res.json({
        mintAddress,
        priceHistory,
        totalTransactions: priceHistory.length
      });
    } catch (error) {
      console.error("Price history error:", error);
      res.status(500).json({ error: "Failed to fetch price history" });
    }
  });

  // Public API health check
  app.get("/api/public/health", (req: Request, res: Response) => {
    res.json({
      status: 'operational',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: process.uptime(),
      endpoints: [
        '/api/public/nfts/search',
        '/api/public/collections',
        '/api/public/collections/:name',
        '/api/public/trending',
        '/api/public/creators/:address',
        '/api/public/stats',
        '/api/public/nfts/:mintAddress/price-history'
      ]
    });
  });

  // Public API documentation
  app.get("/api/public/docs", (req: Request, res: Response) => {
    res.json({
      title: "NFTSol Public API Documentation",
      version: "1.0.0",
      baseUrl: "/api/public",
      endpoints: {
        "/nfts/search": {
          method: "GET",
          description: "Search NFTs with advanced filters",
          parameters: {
            q: "Search query",
            collection: "Filter by collection",
            creator: "Filter by creator",
            minPrice: "Minimum price",
            maxPrice: "Maximum price",
            category: "NFT category",
            sortBy: "Sort order (newest, oldest, price_low, price_high)",
            page: "Page number",
            limit: "Items per page (max 100)"
          }
        },
        "/collections": {
          method: "GET",
          description: "Get all collections with stats"
        },
        "/collections/:name": {
          method: "GET",
          description: "Get specific collection details and NFTs"
        },
        "/trending": {
          method: "GET",
          description: "Get trending NFTs",
          parameters: {
            timeframe: "1h, 24h, 7d, 30d",
            limit: "Number of items (max 50)"
          }
        },
        "/creators/:address": {
          method: "GET",
          description: "Get creator profile and stats"
        },
        "/stats": {
          method: "GET",
          description: "Get platform-wide statistics"
        },
        "/nfts/:mintAddress/price-history": {
          method: "GET",
          description: "Get price history for specific NFT"
        }
      },
      rateLimit: "100 requests per minute per IP",
      authentication: "None required for public endpoints"
    });
  });
}
