import { createLogger } from '../lib/logger';

const logger = createLogger('recommendation-service');

export interface NFTMetadata {
  mint: string;
  name: string;
  collection?: string;
  attributes?: Record<string, string>;
  price?: number;
  rarity?: number;
  views?: number;
  favoriteCount?: number;
}

export interface UserProfile {
  userId: string;
  viewedNFTs: string[];
  purchasedNFTs: string[];
  favoriteNFTs: string[];
  followedCollections: string[];
  interactionHistory: Array<{
    action: 'view' | 'favorite' | 'purchase' | 'offer';
    nftMint: string;
    timestamp: number;
    duration?: number; // in ms
  }>;
}

export interface Recommendation {
  mint: string;
  score: number;
  reason: 'similar_to_liked' | 'trending' | 'new_release' | 'collection_match' | 'attribute_match' | 'rarity' | 'social_signal';
  confidence: number;
}

export class RecommendationService {
  private nftCache: Map<string, NFTMetadata> = new Map();
  private userProfiles: Map<string, UserProfile> = new Map();
  private collectionStats: Map<string, { totalNFTs: number; avgPrice: number; views: number }> = new Map();

  /**
   * Update user profile based on interaction
   */
  public updateUserProfile(
    userId: string,
    action: 'view' | 'favorite' | 'purchase' | 'offer',
    nftMint: string,
    duration?: number
  ): void {
    let profile = this.userProfiles.get(userId);
    if (!profile) {
      profile = {
        userId,
        viewedNFTs: [],
        purchasedNFTs: [],
        favoriteNFTs: [],
        followedCollections: [],
        interactionHistory: [],
      };
      this.userProfiles.set(userId, profile);
    }

    profile.interactionHistory.push({
      action,
      nftMint,
      timestamp: Date.now(),
      duration,
    });

    // Keep last 500 interactions
    if (profile.interactionHistory.length > 500) {
      profile.interactionHistory.shift();
    }

    // Update specific lists
    if (action === 'view' && !profile.viewedNFTs.includes(nftMint)) {
      profile.viewedNFTs.push(nftMint);
    } else if (action === 'purchase' && !profile.purchasedNFTs.includes(nftMint)) {
      profile.purchasedNFTs.push(nftMint);
    } else if (action === 'favorite' && !profile.favoriteNFTs.includes(nftMint)) {
      profile.favoriteNFTs.push(nftMint);
    }

    logger.debug(`Updated profile for user ${userId}: ${action} on ${nftMint}`);
  }

  /**
   * Get personalized recommendations for a user
   */
  public getRecommendations(userId: string, limit: number = 10): Recommendation[] {
    const profile = this.userProfiles.get(userId);
    if (!profile || profile.favoriteNFTs.length === 0) {
      // Return trending/popular if no user history
      return this.getTrendingRecommendations(limit);
    }

    const recommendations = new Map<string, Recommendation>();
    const allNFTs = Array.from(this.nftCache.values());

    // 1. Similar to liked NFTs (collaborative filtering)
    profile.favoriteNFTs.forEach(favMint => {
      const favNFT = this.nftCache.get(favMint);
      if (favNFT) {
        this.findSimilarNFTs(favNFT, allNFTs, 5).forEach(similar => {
          if (
            !profile.viewedNFTs.includes(similar.mint) &&
            !profile.purchasedNFTs.includes(similar.mint)
          ) {
            const existing = recommendations.get(similar.mint);
            const newScore = 0.4 + Math.random() * 0.1;
            if (!existing || existing.score < newScore) {
              recommendations.set(similar.mint, {
                mint: similar.mint,
                score: newScore,
                reason: 'similar_to_liked',
                confidence: 0.85,
              });
            }
          }
        });
      }
    });

    // 2. New releases in followed collections
    profile.followedCollections.forEach(collId => {
      allNFTs
        .filter(nft => nft.collection === collId && !profile.viewedNFTs.includes(nft.mint))
        .slice(0, 3)
        .forEach(nft => {
          const existing = recommendations.get(nft.mint);
          const newScore = 0.7;
          if (!existing || existing.score < newScore) {
            recommendations.set(nft.mint, {
              mint: nft.mint,
              score: newScore,
              reason: 'new_release',
              confidence: 0.9,
            });
          }
        });
    });

    // 3. Attribute-based matching
    this.getAttributeBasedRecommendations(profile, allNFTs, 3).forEach(rec => {
      const existing = recommendations.get(rec.mint);
      if (!existing || existing.score < rec.score) {
        recommendations.set(rec.mint, rec);
      }
    });

    // 4. Trending & social signals
    this.getTrendingRecommendations(3).forEach(trend => {
      const existing = recommendations.get(trend.mint);
      const boostScore = (existing?.score || 0) * 0.3 + trend.score * 0.7;
      recommendations.set(trend.mint, {
        ...trend,
        score: boostScore,
      });
    });

    // Sort and return top recommendations
    return Array.from(recommendations.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Find similar NFTs based on attributes and collection
   */
  private findSimilarNFTs(nft: NFTMetadata, candidates: NFTMetadata[], limit: number): NFTMetadata[] {
    return candidates
      .filter(c => c.mint !== nft.mint && c.collection === nft.collection)
      .sort((a, b) => {
        let scoreA = 0;
        let scoreB = 0;

        // Attribute similarity
        if (nft.attributes && a.attributes) {
          const matches = Object.entries(nft.attributes).filter(
            ([key, val]) => a.attributes?.[key] === val
          ).length;
          scoreA += matches;
        }

        if (nft.attributes && b.attributes) {
          const matches = Object.entries(nft.attributes).filter(
            ([key, val]) => b.attributes?.[key] === val
          ).length;
          scoreB += matches;
        }

        // Rarity proximity
        if (nft.rarity && a.rarity) {
          scoreA += 1 - Math.abs(a.rarity - nft.rarity);
        }
        if (nft.rarity && b.rarity) {
          scoreB += 1 - Math.abs(b.rarity - nft.rarity);
        }

        return scoreB - scoreA;
      })
      .slice(0, limit);
  }

  /**
   * Get attribute-based recommendations
   */
  private getAttributeBasedRecommendations(
    profile: UserProfile,
    allNFTs: NFTMetadata[],
    limit: number
  ): Recommendation[] {
    const attributeFreq = new Map<string, Map<string, number>>();

    // Analyze favorite NFTs' attributes
    profile.favoriteNFTs.forEach(mint => {
      const nft = this.nftCache.get(mint);
      if (nft?.attributes) {
        Object.entries(nft.attributes).forEach(([key, val]) => {
          if (!attributeFreq.has(key)) {
            attributeFreq.set(key, new Map());
          }
          const valMap = attributeFreq.get(key)!;
          valMap.set(val, (valMap.get(val) || 0) + 1);
        });
      }
    });

    // Score candidates by attribute match
    const scored = allNFTs
      .filter(nft => !profile.viewedNFTs.includes(nft.mint))
      .map(nft => {
        let score = 0;
        if (nft.attributes) {
          Object.entries(nft.attributes).forEach(([key, val]) => {
            const freq = attributeFreq.get(key)?.get(val) || 0;
            score += freq * 0.2; // Weight by frequency
          });
        }
        return { nft, score };
      })
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score);

    return scored.slice(0, limit).map(s => ({
      mint: s.nft.mint,
      score: Math.min(s.score / 5, 1), // Normalize to 0-1
      reason: 'attribute_match',
      confidence: 0.75,
    }));
  }

  /**
   * Get trending recommendations based on community activity
   */
  private getTrendingRecommendations(limit: number): Recommendation[] {
    return Array.from(this.nftCache.values())
      .map(nft => ({
        mint: nft.mint,
        score: (nft.views || 0) * 0.3 + (nft.favoriteCount || 0) * 0.7,
      }))
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(s => ({
        ...s,
        reason: 'trending' as const,
        confidence: 0.8,
      }));
  }

  /**
   * Get rarity-based recommendations
   */
  public getRarityBasedRecommendations(userId: string, limit: number = 10): Recommendation[] {
    const profile = this.userProfiles.get(userId);
    if (!profile) return [];

    return Array.from(this.nftCache.values())
      .filter(nft => !profile.viewedNFTs.includes(nft.mint))
      .map(nft => ({
        mint: nft.mint,
        score: (nft.rarity || 0) / 100, // Normalize
        reason: 'rarity' as const,
        confidence: 0.85,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Cache NFT metadata for recommendations
   */
  public updateNFTCache(nft: NFTMetadata): void {
    this.nftCache.set(nft.mint, nft);
  }

  /**
   * Get user profile
   */
  public getUserProfile(userId: string): UserProfile | undefined {
    return this.userProfiles.get(userId);
  }

  /**
   * Get recommendation explanation (for transparency)
   */
  public getRecommendationExplanation(userId: string, nftMint: string): string {
    const rec = this.getRecommendations(userId, 100).find(r => r.mint === nftMint);
    if (!rec) return 'This NFT is new to our recommendation system.';

    const explanations: Record<string, string> = {
      similar_to_liked: 'This NFT is similar to ones you liked before.',
      trending: `This NFT is currently trending based on ${Math.round(rec.confidence * 100)}% confidence.`,
      new_release: 'This is a new release from a collection you follow.',
      collection_match: 'This is from a collection matching your interests.',
      attribute_match: 'This NFT has attributes you typically prefer.',
      rarity: 'This NFT has high rarity properties.',
      social_signal: 'This NFT is gaining attention in the community.',
    };

    return explanations[rec.reason] || 'Personalized for you based on your interests.';
  }
}

let recommendationService: RecommendationService;

export function getRecommendationService(): RecommendationService {
  if (!recommendationService) {
    recommendationService = new RecommendationService();
  }
  return recommendationService;
}

export function initializeRecommendationService(): RecommendationService {
  if (!recommendationService) {
    recommendationService = new RecommendationService();
  }
  return recommendationService;
}
