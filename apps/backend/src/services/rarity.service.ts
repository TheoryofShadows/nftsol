import logger from '../utils/logger';


export interface TraitFrequency {
  traitType: string;
  value: string;
  frequency: number; // 0-100 (percentage of collection)
  rarity: number; // inverse of frequency
}

export interface NFTRarity {
  mint: string;
  traitRarity: number; // 0-100
  attributeRarity: number; // 0-100
  overallRarity: number; // 0-100
  rank: number;
  percentile: number; // 0-100
  traits: TraitFrequency[];
  estimatedValue: number;
  isRare: boolean; // > 85
  isEpic: boolean; // > 95
}

export interface CollectionStats {
  collectionId: string;
  totalNFTs: number;
  averageRarity: number;
  rareCount: number; // > 85
  epicCount: number; // > 95
  traitFrequencies: Map<string, Map<string, number>>;
  floorPrice: number;
  averagePrice: number;
  rarityWeights: Map<string, number>;
}

export class RarityService {
  private nftRarities: Map<string, NFTRarity> = new Map();
  private collectionStats: Map<string, CollectionStats> = new Map();
  private traitFrequencies: Map<string, TraitFrequency[]> = new Map();

  /**
   * Calculate rarity for an NFT
   */
  public calculateRarity(
    mint: string,
    collectionId: string,
    traits: Record<string, string | number>,
    metadata?: any
  ): NFTRarity {
    const stats = this.collectionStats.get(collectionId);
    if (!stats) {
      logger.warn(`Collection ${collectionId} not found in stats`);
      return this.createDefaultRarity(mint);
    }

    const traitRarities: TraitFrequency[] = [];
    let totalTraitRarity = 0;

    // Calculate individual trait rarity
    Object.entries(traits).forEach(([traitType, value]) => {
      const valueStr = String(value);
      const freq = stats.traitFrequencies.get(traitType)?.get(valueStr) || 0;
      const frequency = freq / stats.totalNFTs;
      const rarity = 100 * (1 - frequency); // Higher rarity = rarer trait

      traitRarities.push({
        traitType,
        value: valueStr,
        frequency: frequency * 100,
        rarity,
      });

      totalTraitRarity += rarity;
    });

    const avgTraitRarity = totalTraitRarity / Object.keys(traits).length;

    // Calculate combined rarity score
    // Rarer traits compound to increase overall rarity
    const multiplicationFactor = traitRarities.length > 0
      ? traitRarities.reduce((mul, tr) => mul * (tr.rarity / 100 + 1), 1) / traitRarities.length
      : 1;

    const overallRarity = Math.min(avgTraitRarity * multiplicationFactor, 100);

    // Get rank and percentile
    const allRarities = Array.from(this.nftRarities.values())
      .filter(r => r.mint.startsWith(collectionId))
      .map(r => r.overallRarity)
      .sort((a, b) => b - a);

    const rank = allRarities.findIndex(r => r <= overallRarity) + 1;
    const percentile = ((allRarities.length - rank) / allRarities.length) * 100;

    // Estimate value based on rarity
    const estimatedValue = this.estimateValue(collectionId, overallRarity);

    const rarity: NFTRarity = {
      mint,
      traitRarity: avgTraitRarity,
      attributeRarity: this.calculateAttributeRarity(traits, stats),
      overallRarity,
      rank,
      percentile,
      traits: traitRarities,
      estimatedValue,
      isRare: overallRarity > 85,
      isEpic: overallRarity > 95,
    };

    this.nftRarities.set(mint, rarity);
    logger.debug(`Calculated rarity for ${mint}: ${overallRarity.toFixed(2)}`);

    return rarity;
  }

  /**
   * Index collection for rarity calculations
   */
  public indexCollection(
    collectionId: string,
    nfts: Array<{ mint: string; traits: Record<string, string | number> }>,
    floorPrice: number = 0,
    averagePrice: number = 0
  ): CollectionStats {
    const traitFrequencies = new Map<string, Map<string, number>>();

    // Count trait frequencies
    nfts.forEach(nft => {
      Object.entries(nft.traits).forEach(([traitType, value]) => {
        if (!traitFrequencies.has(traitType)) {
          traitFrequencies.set(traitType, new Map());
        }
        const valueStr = String(value);
        const count = traitFrequencies.get(traitType)!.get(valueStr) || 0;
        traitFrequencies.get(traitType)!.set(valueStr, count + 1);
      });
    });

    // Calculate rarity weights for each trait
    const rarityWeights = new Map<string, number>();
    Array.from(traitFrequencies.entries()).forEach(([traitType, values]) => {
      const variance = this.calculateVariance(Array.from(values.values()));
      rarityWeights.set(traitType, variance);
    });

    const stats: CollectionStats = {
      collectionId,
      totalNFTs: nfts.length,
      averageRarity: 0,
      rareCount: 0,
      epicCount: 0,
      traitFrequencies,
      floorPrice,
      averagePrice,
      rarityWeights,
    };

    // Calculate rarities for all NFTs
    let totalRarity = 0;
    nfts.forEach(nft => {
      const rarity = this.calculateRarity(nft.mint, collectionId, nft.traits);
      totalRarity += rarity.overallRarity;
      if (rarity.isRare) stats.rareCount += 1;
      if (rarity.isEpic) stats.epicCount += 1;
    });

    stats.averageRarity = totalRarity / nfts.length;
    this.collectionStats.set(collectionId, stats);

    logger.info(`Indexed collection ${collectionId}: ${nfts.length} NFTs`);
    return stats;
  }

  /**
   * Get NFT rarity
   */
  public getRarity(mint: string): NFTRarity | null {
    return this.nftRarities.get(mint) || null;
  }

  /**
   * Get collection stats
   */
  public getCollectionStats(collectionId: string): CollectionStats | null {
    return this.collectionStats.get(collectionId) || null;
  }

  /**
   * Get top rarest NFTs in collection
   */
  public getTopRareNFTs(collectionId: string, limit: number = 10): NFTRarity[] {
    return Array.from(this.nftRarities.values())
      .filter(r => r.mint.startsWith(collectionId) || r.mint.includes(collectionId))
      .sort((a, b) => b.overallRarity - a.overallRarity)
      .slice(0, limit);
  }

  /**
   * Get rarity by percentile
   */
  public getNFTsByPercentile(
    collectionId: string,
    minPercentile: number,
    maxPercentile: number,
    limit: number = 50
  ): NFTRarity[] {
    return Array.from(this.nftRarities.values())
      .filter(
        r =>
          r.percentile >= minPercentile &&
          r.percentile <= maxPercentile &&
          (r.mint.startsWith(collectionId) || r.mint.includes(collectionId))
      )
      .slice(0, limit);
  }

  /**
   * Find NFTs with specific traits
   */
  public findByTraits(
    collectionId: string,
    traits: Record<string, string | number>,
    limit: number = 50
  ): NFTRarity[] {
    return Array.from(this.nftRarities.values())
      .filter(nft => {
        const match = nft.traits.every(tr =>
          Object.entries(traits).some(([type, value]) => tr.traitType === type && tr.value === String(value))
        );
        return match && (nft.mint.startsWith(collectionId) || nft.mint.includes(collectionId));
      })
      .slice(0, limit);
  }

  /**
   * Get rarity distribution
   */
  public getRarityDistribution(collectionId: string): {
    common: number;
    uncommon: number;
    rare: number;
    epic: number;
    legendary: number;
  } {
    const rarities = Array.from(this.nftRarities.values()).filter(
      r => r.mint.startsWith(collectionId) || r.mint.includes(collectionId)
    );

    return {
      common: rarities.filter(r => r.overallRarity < 50).length,
      uncommon: rarities.filter(r => r.overallRarity >= 50 && r.overallRarity < 75).length,
      rare: rarities.filter(r => r.overallRarity >= 75 && r.overallRarity < 85).length,
      epic: rarities.filter(r => r.overallRarity >= 85 && r.overallRarity < 95).length,
      legendary: rarities.filter(r => r.overallRarity >= 95).length,
    };
  }

  /**
   * Estimate NFT value based on rarity
   */
  private estimateValue(collectionId: string, rarity: number): number {
    const stats = this.collectionStats.get(collectionId);
    if (!stats) return 0;

    // Base value on collection floor
    const baseValue = stats.floorPrice || stats.averagePrice || 1;
    const rarityMultiplier = 1 + rarity / 100; // 1x-2x multiplier based on rarity

    return baseValue * rarityMultiplier;
  }

  /**
   * Calculate attribute rarity (penalizes common attributes)
   */
  private calculateAttributeRarity(
    traits: Record<string, string | number>,
    stats: CollectionStats
  ): number {
    let score = 0;
    let count = 0;

    Object.entries(traits).forEach(([traitType, value]) => {
      const freq = stats.traitFrequencies.get(traitType)?.get(String(value)) || 0;
      const frequency = freq / stats.totalNFTs;
      const rarity = 100 * (1 - frequency);
      score += rarity;
      count += 1;
    });

    return count > 0 ? score / count : 50;
  }

  /**
   * Calculate variance for trait weighting
   */
  private calculateVariance(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance); // Standard deviation
  }

  /**
   * Create default rarity for uncalculated NFT
   */
  private createDefaultRarity(mint: string): NFTRarity {
    return {
      mint,
      traitRarity: 50,
      attributeRarity: 50,
      overallRarity: 50,
      rank: 0,
      percentile: 50,
      traits: [],
      estimatedValue: 0,
      isRare: false,
      isEpic: false,
    };
  }

  /**
   * Get price prediction based on rarity
   */
  public predictPrice(
    mint: string,
    collectionFloorPrice: number,
    recentSalePrices: number[] = []
  ): { estimated: number; low: number; high: number } {
    const rarity = this.nftRarities.get(mint);
    if (!rarity) {
      return { estimated: collectionFloorPrice, low: collectionFloorPrice * 0.8, high: collectionFloorPrice * 1.2 };
    }

    const rarityMultiplier = 1 + rarity.overallRarity / 100;
    const recentAvg = recentSalePrices.length > 0
      ? recentSalePrices.reduce((a, b) => a + b) / recentSalePrices.length
      : collectionFloorPrice;

    const estimated = recentAvg * rarityMultiplier;
    const low = estimated * 0.85;
    const high = estimated * 1.15;

    return { estimated, low, high };
  }
}

let rarityService: RarityService;

export function getRarityService(): RarityService {
  if (!rarityService) {
    rarityService = new RarityService();
  }
  return rarityService;
}

export function initializeRarityService(): RarityService {
  if (!rarityService) {
    rarityService = new RarityService();
  }
  return rarityService;
}
