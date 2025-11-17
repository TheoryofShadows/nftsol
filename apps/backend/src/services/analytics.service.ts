import logger from '../utils/logger';


export interface PricePoint {
  timestamp: number;
  price: number;
  currency: string;
  sales: number;
}

export interface CollectionAnalytics {
  collectionId: string;
  totalVolume: number;
  floorPrice: number;
  averagePrice: number;
  priceHistory: PricePoint[];
  sales24h: number;
  sales7d: number;
  sales30d: number;
  uniqueBuyers24h: number;
  uniqueBuyers7d: number;
  holders: number;
  royaltyPercentage: number;
  tradingVelocity: number; // sales per NFT per day
}

export interface NFTAnalytics {
  mint: string;
  viewCount: number;
  favoriteCount: number;
  offerCount: number;
  lastSalePrice?: number;
  lastSaleDate?: number;
  priceHistory: PricePoint[];
  estimatedValue: number;
  trending: boolean;
  engagement: number; // 0-100
}

export interface TrendingData {
  collectionId: string;
  name: string;
  volume24h: number;
  volumeChange24h: number; // percentage
  floorPrice: number;
  floorPriceChange24h: number;
  sales24h: number;
  saleVelocity: number;
  trendScore: number; // 0-100
}

export interface ChartData {
  timestamp: number;
  value: number;
  label?: string;
}

export class AnalyticsService {
  private collectionAnalytics: Map<string, CollectionAnalytics> = new Map();
  private nftAnalytics: Map<string, NFTAnalytics> = new Map();
  private trendingCache: TrendingData[] = [];
  private updateInterval = 3600000; // 1 hour

  constructor() {
    setInterval(() => this.updateTrendingData(), this.updateInterval);
  }

  /**
   * Record NFT view
   */
  public recordView(mint: string): void {
    let analytics = this.nftAnalytics.get(mint);
    if (!analytics) {
      analytics = this.createNFTAnalytics(mint);
    }
    analytics.viewCount += 1;
    logger.debug(`View recorded for ${mint}: total ${analytics.viewCount}`);
  }

  /**
   * Record NFT favorite
   */
  public recordFavorite(mint: string): void {
    let analytics = this.nftAnalytics.get(mint);
    if (!analytics) {
      analytics = this.createNFTAnalytics(mint);
    }
    analytics.favoriteCount += 1;
    logger.debug(`Favorite recorded for ${mint}`);
  }

  /**
   * Record NFT offer
   */
  public recordOffer(mint: string): void {
    let analytics = this.nftAnalytics.get(mint);
    if (!analytics) {
      analytics = this.createNFTAnalytics(mint);
    }
    analytics.offerCount += 1;
    logger.debug(`Offer recorded for ${mint}`);
  }

  /**
   * Record sale
   */
  public recordSale(
    mint: string,
    collectionId: string,
    price: number,
    currency: string = 'SOL'
  ): void {
    // Update NFT analytics
    let nftAnalytics = this.nftAnalytics.get(mint);
    if (!nftAnalytics) {
      nftAnalytics = this.createNFTAnalytics(mint);
    }
    nftAnalytics.lastSalePrice = price;
    nftAnalytics.lastSaleDate = Date.now();
    nftAnalytics.priceHistory.push({
      timestamp: Date.now(),
      price,
      currency,
      sales: 1,
    });

    // Keep last 100 sales
    if (nftAnalytics.priceHistory.length > 100) {
      nftAnalytics.priceHistory.shift();
    }

    nftAnalytics.estimatedValue = price;

    // Update collection analytics
    let collectionAnalytics = this.collectionAnalytics.get(collectionId);
    if (!collectionAnalytics) {
      collectionAnalytics = this.createCollectionAnalytics(collectionId);
    }

    collectionAnalytics.totalVolume += price;
    collectionAnalytics.floorPrice = Math.min(collectionAnalytics.floorPrice, price);

    // Update time-based metrics
    const now = Date.now();
    const day24h = 24 * 60 * 60 * 1000;
    const day7d = 7 * 24 * 60 * 60 * 1000;
    const day30d = 30 * 24 * 60 * 60 * 1000;

    collectionAnalytics.sales24h += (now - (nftAnalytics.lastSaleDate || 0) < day24h ? 1 : 0);
    collectionAnalytics.sales7d += (now - (nftAnalytics.lastSaleDate || 0) < day7d ? 1 : 0);
    collectionAnalytics.sales30d += (now - (nftAnalytics.lastSaleDate || 0) < day30d ? 1 : 0);

    logger.info(`Recorded sale: ${mint} in ${collectionId} for ${price} ${currency}`);
  }

  /**
   * Get NFT analytics
   */
  public getNFTAnalytics(mint: string): NFTAnalytics | null {
    return this.nftAnalytics.get(mint) || null;
  }

  /**
   * Get collection analytics
   */
  public getCollectionAnalytics(collectionId: string): CollectionAnalytics | null {
    return this.collectionAnalytics.get(collectionId) || null;
  }

  /**
   * Get trending collections
   */
  public getTrendingCollections(limit: number = 10): TrendingData[] {
    return this.trendingCache.slice(0, limit);
  }

  /**
   * Get price history chart data
   */
  public getPriceHistory(mint: string): ChartData[] {
    const analytics = this.nftAnalytics.get(mint);
    if (!analytics) return [];

    return analytics.priceHistory.map(p => ({
      timestamp: p.timestamp,
      value: p.price,
      label: new Date(p.timestamp).toLocaleDateString(),
    }));
  }

  /**
   * Get collection volume chart
   */
  public getCollectionVolumeChart(collectionId: string): ChartData[] {
    const analytics = this.collectionAnalytics.get(collectionId);
    if (!analytics) return [];

    // Simulate hourly data (in production, would be from database)
    const hours = 24;
    const data: ChartData[] = [];
    const now = Date.now();
    const hourMs = 60 * 60 * 1000;

    for (let i = 0; i < hours; i++) {
      const timestamp = now - (hours - i) * hourMs;
      // Simulate volume with some variance
      const volume = (analytics.totalVolume / 24) * (0.5 + Math.random());
      data.push({
        timestamp,
        value: volume,
        label: new Date(timestamp).toLocaleTimeString(),
      });
    }

    return data;
  }

  /**
   * Get floor price history
   */
  public getFloorPriceHistory(collectionId: string): ChartData[] {
    const analytics = this.collectionAnalytics.get(collectionId);
    if (!analytics) return [];

    // Simulate floor price trends (in production, from historical data)
    const days = 30;
    const data: ChartData[] = [];
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    for (let i = 0; i < days; i++) {
      const timestamp = now - (days - i) * dayMs;
      const trend = i / days; // Gradually increase over time
      const floorPrice = analytics.floorPrice * (0.9 + trend * 0.2);
      data.push({
        timestamp,
        value: floorPrice,
        label: new Date(timestamp).toLocaleDateString(),
      });
    }

    return data;
  }

  /**
   * Calculate engagement score
   */
  public calculateEngagementScore(mint: string): number {
    const analytics = this.nftAnalytics.get(mint);
    if (!analytics) return 0;

    const viewScore = Math.min(analytics.viewCount * 0.1, 30);
    const favoriteScore = Math.min(analytics.favoriteCount * 2, 30);
    const offerScore = Math.min(analytics.offerCount * 5, 40);

    return Math.min(viewScore + favoriteScore + offerScore, 100);
  }

  /**
   * Get top performing NFTs
   */
  public getTopPerformingNFTs(collectionId: string, limit: number = 10): NFTAnalytics[] {
    return Array.from(this.nftAnalytics.values())
      .filter(a => a.mint.includes(collectionId) || a.mint.startsWith(collectionId))
      .map(a => ({
        ...a,
        engagement: this.calculateEngagementScore(a.mint),
      }))
      .sort((a, b) => b.engagement - a.engagement)
      .slice(0, limit);
  }

  /**
   * Get collection health metrics
   */
  public getCollectionHealth(collectionId: string): Record<string, any> {
    const analytics = this.collectionAnalytics.get(collectionId);
    if (!analytics) return {};

    const velocity = analytics.tradingVelocity;
    const health = velocity > 0.5 ? 'healthy' : velocity > 0.2 ? 'moderate' : 'low';

    return {
      health,
      velocity,
      sales24h: analytics.sales24h,
      volume24h: analytics.totalVolume,
      uniqueBuyers24h: analytics.uniqueBuyers24h,
      averagePrice: analytics.averagePrice,
      holders: analytics.holders,
      liquidity: velocity > 0.3 ? 'high' : velocity > 0.1 ? 'medium' : 'low',
    };
  }

  /**
   * Create NFT analytics entry
   */
  private createNFTAnalytics(mint: string): NFTAnalytics {
    const analytics: NFTAnalytics = {
      mint,
      viewCount: 0,
      favoriteCount: 0,
      offerCount: 0,
      priceHistory: [],
      estimatedValue: 0,
      trending: false,
      engagement: 0,
    };
    this.nftAnalytics.set(mint, analytics);
    return analytics;
  }

  /**
   * Create collection analytics entry
   */
  private createCollectionAnalytics(collectionId: string): CollectionAnalytics {
    const analytics: CollectionAnalytics = {
      collectionId,
      totalVolume: 0,
      floorPrice: Infinity,
      averagePrice: 0,
      priceHistory: [],
      sales24h: 0,
      sales7d: 0,
      sales30d: 0,
      uniqueBuyers24h: 0,
      uniqueBuyers7d: 0,
      holders: 0,
      royaltyPercentage: 0,
      tradingVelocity: 0,
    };
    this.collectionAnalytics.set(collectionId, analytics);
    return analytics;
  }

  /**
   * Update trending data
   */
  private updateTrendingData(): void {
    this.trendingCache = Array.from(this.collectionAnalytics.values())
      .map(analytics => ({
        collectionId: analytics.collectionId,
        name: analytics.collectionId,
        volume24h: analytics.sales24h * analytics.averagePrice,
        volumeChange24h: Math.random() * 100 - 50, // Simulated
        floorPrice: analytics.floorPrice === Infinity ? 0 : analytics.floorPrice,
        floorPriceChange24h: Math.random() * 50 - 25, // Simulated
        sales24h: analytics.sales24h,
        saleVelocity: analytics.tradingVelocity,
        trendScore: Math.min(
          analytics.sales24h * 5 + analytics.uniqueBuyers24h * 10,
          100
        ),
      }))
      .sort((a, b) => b.trendScore - a.trendScore);

    logger.debug(`Updated trending collections: ${this.trendingCache.length}`);
  }
}

let analyticsService: AnalyticsService;

export function getAnalyticsService(): AnalyticsService {
  if (!analyticsService) {
    analyticsService = new AnalyticsService();
  }
  return analyticsService;
}

export function initializeAnalyticsService(): AnalyticsService {
  if (!analyticsService) {
    analyticsService = new AnalyticsService();
  }
  return analyticsService;
}
