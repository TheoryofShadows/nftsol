import { createLogger } from '../lib/logger';

const logger = createLogger('creator-tools-service');

export interface CreatorProfile {
  creatorId: string;
  username: string;
  bio: string;
  avatar?: string;
  banner?: string;
  website?: string;
  twitter?: string;
  discord?: string;
  isVerified: boolean;
  verificationBadge?: 'silver' | 'gold' | 'platinum';
  totalNFTsMinted: number;
  totalVolume: number;
  totalRoyalties: number;
  followers: number;
  createdAt: number;
}

export interface RoyaltyConfiguration {
  creatorId: string;
  royaltyPercentage: number;
  minPriceThreshold: number; // Only apply royalties if price above this
  royaltyRecipients: Array<{
    address: string;
    percentage: number; // % of royalties to send here
    label?: string;
  }>;
  isActive: boolean;
}

export interface NFTMetadata {
  name: string;
  symbol?: string;
  description: string;
  image: string;
  externalUrl?: string;
  attributes: Array<{
    traitType: string;
    value: string | number;
  }>;
  properties?: {
    category?: string;
    creators?: Array<{
      address: string;
      share: number;
      verified?: boolean;
    }>;
    files?: Array<{
      uri: string;
      type: string;
    }>;
  };
}

export interface CollectionStats {
  collectionName: string;
  totalSupply: number;
  floorPrice: number;
  totalVolume: number;
  holders: number;
  royaltyEarned: number;
  listed: number;
  averagePrice: number;
}

export interface AnalyticsData {
  period: 'daily' | 'weekly' | 'monthly';
  date: Date;
  sales: number;
  volume: number;
  royaltiesEarned: number;
  averagePrice: number;
  floorPrice: number;
  uniqueBuyers: number;
}

export class CreatorToolsService {
  private creators: Map<string, CreatorProfile> = new Map();
  private royaltyConfigs: Map<string, RoyaltyConfiguration> = new Map();
  private collectionStats: Map<string, CollectionStats> = new Map();
  private analytics: Map<string, AnalyticsData[]> = new Map();

  /**
   * Initialize creator profile
   */
  public initializeCreator(creatorId: string, username: string): CreatorProfile {
    const existing = this.creators.get(creatorId);
    if (existing) return existing;

    const profile: CreatorProfile = {
      creatorId,
      username,
      bio: '',
      isVerified: false,
      totalNFTsMinted: 0,
      totalVolume: 0,
      totalRoyalties: 0,
      followers: 0,
      createdAt: Date.now(),
    };

    this.creators.set(creatorId, profile);
    logger.info(`Initialized creator profile: ${username} (${creatorId})`);
    return profile;
  }

  /**
   * Update creator profile
   */
  public updateCreatorProfile(
    creatorId: string,
    updates: Partial<CreatorProfile>
  ): CreatorProfile | null {
    const profile = this.creators.get(creatorId);
    if (!profile) return null;

    Object.assign(profile, updates);
    logger.info(`Updated profile for creator: ${creatorId}`);
    return profile;
  }

  /**
   * Set up royalty configuration
   */
  public configureRoyalties(
    creatorId: string,
    royaltyPercentage: number,
    recipients: Array<{ address: string; percentage: number; label?: string }>,
    minPriceThreshold: number = 0.1
  ): RoyaltyConfiguration {
    // Validate percentages sum to 100
    const totalPercentage = recipients.reduce((sum, r) => sum + r.percentage, 0);
    if (totalPercentage !== 100) {
      throw new Error('Royalty recipients percentages must sum to 100');
    }

    const config: RoyaltyConfiguration = {
      creatorId,
      royaltyPercentage: Math.min(royaltyPercentage, 50), // Cap at 50%
      minPriceThreshold,
      royaltyRecipients: recipients,
      isActive: true,
    };

    this.royaltyConfigs.set(creatorId, config);
    logger.info(`Configured royalties for creator ${creatorId}: ${royaltyPercentage}%`);
    return config;
  }

  /**
   * Get creator's royalty configuration
   */
  public getRoyaltyConfig(creatorId: string): RoyaltyConfiguration | null {
    return this.royaltyConfigs.get(creatorId) || null;
  }

  /**
   * Calculate royalty payment
   */
  public calculateRoyalty(creatorId: string, salePrice: number): { total: number; breakdown: Array<{ recipient: string; amount: number; label?: string }> } | null {
    const config = this.royaltyConfigs.get(creatorId);
    if (!config || !config.isActive || salePrice < config.minPriceThreshold) {
      return null;
    }

    const totalRoyalty = (salePrice * config.royaltyPercentage) / 100;
    const breakdown = config.royaltyRecipients.map(recipient => ({
      recipient: recipient.address,
      amount: (totalRoyalty * recipient.percentage) / 100,
      label: recipient.label,
    }));

    return { total: totalRoyalty, breakdown };
  }

  /**
   * Generate NFT metadata template
   */
  public generateNFTMetadata(
    name: string,
    description: string,
    imageUrl: string,
    attributes: Record<string, string | number> = {},
    externalUrl?: string
  ): NFTMetadata {
    const attributesArray = Object.entries(attributes).map(([traitType, value]) => ({
      traitType,
      value,
    }));

    return {
      name,
      description,
      image: imageUrl,
      externalUrl,
      attributes: attributesArray,
      properties: {
        category: 'image',
      },
    };
  }

  /**
   * Get creator analytics
   */
  public getCreatorAnalytics(creatorId: string, period: 'daily' | 'weekly' | 'monthly' = 'monthly'): AnalyticsData[] {
    const allAnalytics = this.analytics.get(creatorId) || [];
    return allAnalytics.filter(a => a.period === period).sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  /**
   * Record sale for analytics
   */
  public recordSale(
    creatorId: string,
    salePrice: number,
    buyerAddress: string,
    collectionId?: string
  ): void {
    const creator = this.creators.get(creatorId);
    if (!creator) return;

    creator.totalVolume += salePrice;

    // Update collection stats
    if (collectionId) {
      const stats = this.collectionStats.get(collectionId) || {
        collectionName: collectionId,
        totalSupply: 0,
        floorPrice: salePrice,
        totalVolume: 0,
        holders: 0,
        royaltyEarned: 0,
        listed: 0,
        averagePrice: salePrice,
      };

      stats.totalVolume += salePrice;
      stats.averagePrice = stats.totalVolume / Math.max(1, stats.totalSupply);
      stats.floorPrice = Math.min(stats.floorPrice, salePrice);

      this.collectionStats.set(collectionId, stats);
    }

    // Calculate royalties
    const royaltyInfo = this.calculateRoyalty(creatorId, salePrice);
    if (royaltyInfo) {
      creator.totalRoyalties += royaltyInfo.total;
    }

    logger.info(`Recorded sale: ${creatorId} - ${salePrice} SOL from ${buyerAddress}`);
  }

  /**
   * Get collection statistics
   */
  public getCollectionStats(collectionId: string): CollectionStats | null {
    return this.collectionStats.get(collectionId) || null;
  }

  /**
   * Verify creator (grant badge)
   */
  public verifyCreator(creatorId: string, badgeLevel: 'silver' | 'gold' | 'platinum' = 'silver'): boolean {
    const creator = this.creators.get(creatorId);
    if (!creator) return false;

    creator.isVerified = true;
    creator.verificationBadge = badgeLevel;
    logger.info(`Creator ${creatorId} verified with ${badgeLevel} badge`);
    return true;
  }

  /**
   * Add follower
   */
  public followCreator(creatorId: string): boolean {
    const creator = this.creators.get(creatorId);
    if (!creator) return false;

    creator.followers += 1;
    return true;
  }

  /**
   * Get creator profile
   */
  public getCreatorProfile(creatorId: string): CreatorProfile | null {
    return this.creators.get(creatorId) || null;
  }

  /**
   * Get top creators by volume
   */
  public getTopCreators(limit: number = 10): CreatorProfile[] {
    return Array.from(this.creators.values())
      .sort((a, b) => b.totalVolume - a.totalVolume)
      .slice(0, limit);
  }

  /**
   * Get top creators by followers
   */
  public getTopCreatorsByFollowers(limit: number = 10): CreatorProfile[] {
    return Array.from(this.creators.values())
      .sort((a, b) => b.followers - a.followers)
      .slice(0, limit);
  }

  /**
   * Bulk update NFT metadata
   */
  public batchUpdateMetadata(
    nfts: Array<{ mint: string; metadata: NFTMetadata }>
  ): { successful: number; failed: number } {
    let successful = 0;
    let failed = 0;

    nfts.forEach(({ mint, metadata }) => {
      try {
        // TODO: Update on-chain metadata via Metaplex
        logger.debug(`Updated metadata for NFT: ${mint}`);
        successful += 1;
      } catch (error) {
        logger.error(`Failed to update metadata for NFT ${mint}:`, error);
        failed += 1;
      }
    });

    return { successful, failed };
  }

  /**
   * Get dashboard summary
   */
  public getCreatorDashboard(creatorId: string): Record<string, any> {
    const creator = this.creators.get(creatorId);
    if (!creator) return {};

    const royaltyConfig = this.royaltyConfigs.get(creatorId);
    const analytics = this.getCreatorAnalytics(creatorId, 'monthly');
    const recentAnalytics = analytics.slice(0, 1)[0];

    return {
      creatorProfile: creator,
      royaltyConfiguration: royaltyConfig,
      recentStats: recentAnalytics,
      allAnalytics: analytics,
      topCreators: this.getTopCreators().map(c => ({
        username: c.username,
        totalVolume: c.totalVolume,
        followers: c.followers,
        isVerified: c.isVerified,
      })),
    };
  }
}

let creatorToolsService: CreatorToolsService;

export function getCreatorToolsService(): CreatorToolsService {
  if (!creatorToolsService) {
    creatorToolsService = new CreatorToolsService();
  }
  return creatorToolsService;
}

export function initializeCreatorToolsService(): CreatorToolsService {
  if (!creatorToolsService) {
    creatorToolsService = new CreatorToolsService();
  }
  return creatorToolsService;
}
