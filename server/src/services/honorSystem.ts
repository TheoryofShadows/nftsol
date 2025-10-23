import { db } from '../db';
import { userNftStats, nftTransactions } from '../schema';
import { eq, and, gte, desc } from 'drizzle-orm';

export interface HonorFactors {
  platformUsage: number;        // 30% - How much user uses the platform
  communityEngagement: number;   // 25% - Community participation
  transactionReliability: number; // 20% - Transaction success rate
  creationQuality: number;       // 15% - Quality of NFTs created
  stakingParticipation: number;  // 10% - CLOUT staking activity
}

export interface HonorScore {
  total: number;
  factors: HonorFactors;
  level: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
  benefits: {
    cloutMultiplier: number;
    feeReduction: number;
    premiumAccess: boolean;
    governanceWeight: number;
  };
}

export class HonorSystem {
  
  // Calculate comprehensive honor score for a wallet
  async calculateHonorScore(walletAddress: string): Promise<HonorScore> {
    try {
      const factors = await this.calculateHonorFactors(walletAddress);
      const total = this.calculateWeightedScore(factors);
      const level = this.getHonorLevel(total);
      const benefits = this.calculateBenefits(total);

      return {
        total,
        factors,
        level,
        benefits
      };
    } catch (error) {
      console.error('Failed to calculate honor score:', error);
      return this.getDefaultHonorScore();
    }
  }

  // Calculate individual honor factors
  private async calculateHonorFactors(walletAddress: string): Promise<HonorFactors> {
    const [
      platformUsage,
      communityEngagement,
      transactionReliability,
      creationQuality,
      stakingParticipation
    ] = await Promise.all([
      this.calculatePlatformUsage(walletAddress),
      this.calculateCommunityEngagement(walletAddress),
      this.calculateTransactionReliability(walletAddress),
      this.calculateCreationQuality(walletAddress),
      this.calculateStakingParticipation(walletAddress)
    ]);

    return {
      platformUsage,
      communityEngagement,
      transactionReliability,
      creationQuality,
      stakingParticipation
    };
  }

  // Platform usage score (0-100)
  private async calculatePlatformUsage(walletAddress: string): Promise<number> {
    try {
      const [stats] = await db
        .select()
        .from(userNftStats)
        .where(eq(userNftStats.walletAddress, walletAddress));

      if (!stats) return 0;

      // Factors: NFTs created, owned, sales volume, activity recency
      const nftsCreated = Number(stats.nftsCreated || 0);
      const nftsOwned = Number(stats.nftsOwned || 0);
      const totalSales = Number(stats.totalSales || 0);
      const lastActivity = stats.lastActivity;

      let score = 0;

      // NFT creation activity (40 points max)
      score += Math.min(40, nftsCreated * 5);

      // Ownership diversity (20 points max)
      score += Math.min(20, nftsOwned * 2);

      // Sales volume (30 points max)
      score += Math.min(30, totalSales * 0.1);

      // Recent activity (10 points max)
      if (lastActivity) {
        const daysSinceActivity = (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceActivity < 7) score += 10;
        else if (daysSinceActivity < 30) score += 5;
      }

      return Math.min(100, score);
    } catch (error) {
      console.error('Error calculating platform usage:', error);
      return 0;
    }
  }

  // Community engagement score (0-100)
  private async calculateCommunityEngagement(walletAddress: string): Promise<number> {
    try {
      // This would integrate with community features like:
      // - Comments on NFTs
      // - Likes and shares
      // - Forum participation
      // - Social media integration
      
      // For now, base it on transaction volume and frequency
      const transactions = await db
        .select()
        .from(nftTransactions)
        .where(and(
          eq(nftTransactions.toWallet, walletAddress),
          gte(nftTransactions.createdAt, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) // Last 30 days
        ));

      const transactionCount = transactions.length;
      const totalVolume = transactions.reduce((sum, tx) => sum + Number(tx.price || 0), 0);

      let score = 0;
      score += Math.min(50, transactionCount * 5); // Activity
      score += Math.min(50, totalVolume * 0.1); // Volume

      return Math.min(100, score);
    } catch (error) {
      console.error('Error calculating community engagement:', error);
      return 0;
    }
  }

  // Transaction reliability score (0-100)
  private async calculateTransactionReliability(walletAddress: string): Promise<number> {
    try {
      const transactions = await db
        .select()
        .from(nftTransactions)
        .where(eq(nftTransactions.toWallet, walletAddress));

      if (transactions.length === 0) return 50; // Neutral for new users

      // Calculate success rate based on completed transactions
      const successfulTransactions = transactions.filter(tx => tx.signature);
      const successRate = (successfulTransactions.length / transactions.length) * 100;

      return Math.min(100, successRate);
    } catch (error) {
      console.error('Error calculating transaction reliability:', error);
      return 50;
    }
  }

  // Creation quality score (0-100)
  private async calculateCreationQuality(walletAddress: string): Promise<number> {
    try {
      // This would analyze:
      // - NFT metadata quality
      // - Image resolution and uniqueness
      // - Collection coherence
      // - Community reception (likes, views, sales)
      
      // For now, base it on sales success
      const [stats] = await db
        .select()
        .from(userNftStats)
        .where(eq(userNftStats.walletAddress, walletAddress));

      if (!stats) return 0;

      const nftsCreated = Number(stats.nftsCreated || 0);
      const totalSales = Number(stats.totalSales || 0);

      if (nftsCreated === 0) return 0;

      // Sales success rate
      const avgSalePrice = totalSales / nftsCreated;
      let score = Math.min(100, avgSalePrice * 2); // Higher average price = better quality

      return Math.min(100, score);
    } catch (error) {
      console.error('Error calculating creation quality:', error);
      return 0;
    }
  }

  // Staking participation score (0-100)
  private async calculateStakingParticipation(walletAddress: string): Promise<number> {
    try {
      // This would check:
      // - CLOUT token staking amount
      // - Staking duration
      // - Staking rewards claimed
      
      // For now, return a placeholder
      // In production, this would integrate with your staking system
      return 0;
    } catch (error) {
      console.error('Error calculating staking participation:', error);
      return 0;
    }
  }

  // Calculate weighted total score
  private calculateWeightedScore(factors: HonorFactors): number {
    const weights = {
      platformUsage: 0.30,
      communityEngagement: 0.25,
      transactionReliability: 0.20,
      creationQuality: 0.15,
      stakingParticipation: 0.10
    };

    return Math.round(
      factors.platformUsage * weights.platformUsage +
      factors.communityEngagement * weights.communityEngagement +
      factors.transactionReliability * weights.transactionReliability +
      factors.creationQuality * weights.creationQuality +
      factors.stakingParticipation * weights.stakingParticipation
    );
  }

  // Get honor level based on score
  private getHonorLevel(score: number): HonorScore['level'] {
    if (score >= 90) return 'Diamond';
    if (score >= 75) return 'Platinum';
    if (score >= 60) return 'Gold';
    if (score >= 40) return 'Silver';
    return 'Bronze';
  }

  // Calculate benefits based on honor level
  private calculateBenefits(score: number) {
    return {
      cloutMultiplier: 1 + (score / 200), // 1x to 1.5x multiplier
      feeReduction: Math.min(50, score / 2), // Up to 50% fee reduction
      premiumAccess: score >= 60,
      governanceWeight: Math.floor(score / 20) // 1 vote per 20 points
    };
  }

  // Get default honor score for new users
  private getDefaultHonorScore(): HonorScore {
    return {
      total: 0,
      factors: {
        platformUsage: 0,
        communityEngagement: 0,
        transactionReliability: 50,
        creationQuality: 0,
        stakingParticipation: 0
      },
      level: 'Bronze',
      benefits: {
        cloutMultiplier: 1.0,
        feeReduction: 0,
        premiumAccess: false,
        governanceWeight: 0
      }
    };
  }

  // Update honor score after an action
  async updateHonorScore(walletAddress: string, action: string, amount?: number) {
    try {
      // This would update the honor score in real-time
      // For now, we'll just log the action
      console.log(`Honor update: ${walletAddress} - ${action} - ${amount || 'N/A'}`);
      
      // In production, you might want to:
      // 1. Update a real-time honor cache
      // 2. Trigger CLOUT distribution
      // 3. Update user benefits
      // 4. Send notifications
      
      return { success: true };
    } catch (error: any) {
      console.error('Failed to update honor score:', error);
      return { success: false, error: error.message };
    }
  }
}
