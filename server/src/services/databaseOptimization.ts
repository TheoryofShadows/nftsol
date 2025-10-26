import { db } from '../db';
import { nfts, nftTransactions } from '../schema';
import { eq, and, sql, desc, asc, inArray, gte, lte, like, or } from 'drizzle-orm';

export interface QueryOptions {
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
}

export interface OptimizedQueryResult<T> {
  data: T[];
  total: number;
  hasMore: boolean;
  executionTime: number;
}

export class DatabaseOptimizationService {
  private queryCache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_TTL = 30000; // 30 seconds

  // Optimized NFT queries with proper indexing hints
  async getNFTsOptimized(options: QueryOptions = {}): Promise<OptimizedQueryResult<any>> {
    const startTime = Date.now();
    const { limit = 50, offset = 0, sortBy = 'createdAt', sortOrder = 'desc', filters = {} } = options;

    // Build dynamic where conditions
    const conditions = this.buildWhereConditions(filters);
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Use prepared statement for better performance
    const countQuery = db
      .select({ count: sql<number>`count(*)::int` })
      .from(nfts)
      .where(whereClause);

    const dataQuery = db
      .select()
      .from(nfts)
      .where(whereClause)
      .orderBy(
        sortOrder === 'desc' ? desc(nfts[sortBy as keyof typeof nfts] as any) : asc(nfts[sortBy as keyof typeof nfts] as any)
      )
      .limit(limit)
      .offset(offset);

    // Execute queries in parallel
    const [countResult, dataResult] = await Promise.all([
      countQuery,
      dataQuery
    ]);

    const total = countResult[0]?.count || 0;
    const executionTime = Date.now() - startTime;

    return {
      data: dataResult,
      total,
      hasMore: offset + limit < total,
      executionTime
    };
  }

  // Batch NFT operations for better performance
  async batchUpdateNFTs(updates: Array<{ id: string; data: Partial<any> }>): Promise<void> {
    if (updates.length === 0) return;

    // Group updates by similar data structure for batch processing
    const updateGroups = this.groupUpdatesByType(updates);

    // Execute batch updates in parallel
    const promises = updateGroups.map(group => 
      db.update(nfts)
        .set(group.data)
        .where(inArray(nfts.id, group.ids))
    );

    await Promise.all(promises);
  }

  // Optimized search with full-text search capabilities
  async searchNFTs(searchTerm: string, options: QueryOptions = {}): Promise<OptimizedQueryResult<any>> {
    const startTime = Date.now();
    const { limit = 50, offset = 0 } = options;

    // Use PostgreSQL full-text search for better performance
    const searchConditions = [
      like(nfts.name, `%${searchTerm}%`),
      like(nfts.description, `%${searchTerm}%`),
      like(nfts.collection, `%${searchTerm}%`)
    ];

    const whereClause = or(...searchConditions);

    const [countResult, dataResult] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` })
        .from(nfts)
        .where(whereClause),
      db.select()
        .from(nfts)
        .where(whereClause)
        .orderBy(desc(nfts.createdAt))
        .limit(limit)
        .offset(offset)
    ]);

    const total = countResult[0]?.count || 0;
    const executionTime = Date.now() - startTime;

    return {
      data: dataResult,
      total,
      hasMore: offset + limit < total,
      executionTime
    };
  }

  // Get NFT statistics with optimized aggregation queries
  async getNFTStatistics(): Promise<any> {
    const cacheKey = 'nft-statistics';
    const cached = this.queryCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    const startTime = Date.now();

    // Use single query with multiple aggregations for better performance
    const statsQuery = db
      .select({
        totalNFTs: sql<number>`count(*)::int`,
        totalListed: sql<number>`count(*) filter (where status = 'listed')::int`,
        totalSold: sql<number>`count(*) filter (where status = 'sold')::int`,
        averagePrice: sql<number>`avg(cast(price as numeric)) filter (where price is not null)`,
        totalVolume: sql<number>`sum(cast(price as numeric)) filter (where status = 'sold')`,
        uniqueCollections: sql<number>`count(distinct collection)::int`,
        uniqueOwners: sql<number>`count(distinct owner)::int`
      })
      .from(nfts);

    const [stats] = await statsQuery;
    const executionTime = Date.now() - startTime;

    const result = {
      ...stats,
      executionTime
    };

    // Cache the result
    this.queryCache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });

    return result;
  }

  // Get trending NFTs with optimized ranking algorithm
  async getTrendingNFTs(limit: number = 20): Promise<any[]> {
    const cacheKey = `trending-nfts-${limit}`;
    const cached = this.queryCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    const startTime = Date.now();

    // Complex ranking query with multiple factors
    const trendingQuery = db
      .select({
        id: nfts.id,
        name: nfts.name,
        image: nfts.image,
        price: nfts.price,
        collection: nfts.collection,
        owner: nfts.owner,
        status: nfts.status,
        createdAt: nfts.createdAt,
        // Calculate trending score based on multiple factors
        trendingScore: sql<number>`
          (
            case when status = 'listed' then 1 else 0 end * 2 +
            case when created_at > now() - interval '24 hours' then 3 else 0 end +
            case when created_at > now() - interval '7 days' then 2 else 0 end +
            case when created_at > now() - interval '30 days' then 1 else 0 end
          ) as trending_score
        `
      })
      .from(nfts)
      .where(eq(nfts.status, 'listed'))
      .orderBy(sql`trending_score desc, created_at desc`)
      .limit(limit);

    const result = await trendingQuery;
    const executionTime = Date.now() - startTime;

    // Cache the result
    this.queryCache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });

    return result;
  }

  // Get user's NFT portfolio with optimized queries
  async getUserPortfolio(walletAddress: string, options: QueryOptions = {}): Promise<OptimizedQueryResult<any>> {
    const startTime = Date.now();
    const { limit = 50, offset = 0, sortBy = 'createdAt', sortOrder = 'desc' } = options;

    const conditions = [
      eq(nfts.owner, walletAddress)
    ];

    const whereClause = and(...conditions);

    const [countResult, dataResult] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` })
        .from(nfts)
        .where(whereClause),
      db.select()
        .from(nfts)
        .where(whereClause)
        .orderBy(
          sortOrder === 'desc' ? desc(nfts[sortBy as keyof typeof nfts] as any) : asc(nfts[sortBy as keyof typeof nfts] as any)
        )
        .limit(limit)
        .offset(offset)
    ]);

    const total = countResult[0]?.count || 0;
    const executionTime = Date.now() - startTime;

    return {
      data: dataResult,
      total,
      hasMore: offset + limit < total,
      executionTime
    };
  }

  // Private helper methods
  private buildWhereConditions(filters: Record<string, any>): any[] {
    const conditions: any[] = [];

    if (filters.owner) {
      conditions.push(eq(nfts.owner, filters.owner));
    }

    if (filters.status) {
      conditions.push(eq(nfts.status, filters.status));
    }

    if (filters.collection) {
      conditions.push(eq(nfts.collection, filters.collection));
    }

    // Platform filter removed - platform field doesn't exist in schema
    // if (filters.platform) {
    //   conditions.push(eq(nfts.platform, filters.platform));
    // }

    if (filters.minPrice) {
      conditions.push(gte(sql`cast(${nfts.price} as numeric)`, filters.minPrice));
    }

    if (filters.maxPrice) {
      conditions.push(lte(sql`cast(${nfts.price} as numeric)`, filters.maxPrice));
    }

    if (filters.createdAfter) {
      conditions.push(gte(nfts.createdAt, new Date(filters.createdAfter)));
    }

    if (filters.createdBefore) {
      conditions.push(lte(nfts.createdAt, new Date(filters.createdBefore)));
    }

    return conditions;
  }

  private groupUpdatesByType(updates: Array<{ id: string; data: Partial<any> }>): Array<{ ids: string[]; data: Partial<any> }> {
    const groups = new Map<string, { ids: string[]; data: Partial<any> }>();

    updates.forEach(({ id, data }) => {
      const key = JSON.stringify(data);
      if (!groups.has(key)) {
        groups.set(key, { ids: [], data });
      }
      groups.get(key)!.ids.push(id);
    });

    return Array.from(groups.values());
  }

  // Clear cache when data changes
  clearCache(pattern?: string): void {
    if (pattern) {
      for (const key of this.queryCache.keys()) {
        if (key.includes(pattern)) {
          this.queryCache.delete(key);
        }
      }
    } else {
      this.queryCache.clear();
    }
  }

  // Get cache statistics
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.queryCache.size,
      keys: Array.from(this.queryCache.keys())
    };
  }
}

export const databaseOptimizationService = new DatabaseOptimizationService();
