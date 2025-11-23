/**
 * Magic Eden Diamond Service
 * Track Diamond points, rewards, and quest progress
 *
 * Magic Eden Rewards: https://magiceden.io/rewards
 */

import logger from '../utils/logger';

const ME_API_BASE = 'https://api-mainnet.magiceden.dev/v2';
const ME_REWARDS_API = 'https://api-mainnet.magiceden.dev/v2/rewards';

export interface DiamondTier {
  name: string;
  minPoints: number;
  maxPoints: number;
  benefits: string[];
  color: string;
}

export const DIAMOND_TIERS: DiamondTier[] = [
  {
    name: 'Bronze',
    minPoints: 0,
    maxPoints: 999,
    benefits: ['Basic marketplace access'],
    color: '#CD7F32',
  },
  {
    name: 'Silver',
    minPoints: 1000,
    maxPoints: 4999,
    benefits: ['Reduced fees', 'Early access to some drops'],
    color: '#C0C0C0',
  },
  {
    name: 'Gold',
    minPoints: 5000,
    maxPoints: 19999,
    benefits: ['Priority support', 'Exclusive drops access', 'Lower fees'],
    color: '#FFD700',
  },
  {
    name: 'Platinum',
    minPoints: 20000,
    maxPoints: 49999,
    benefits: ['VIP support', 'Guaranteed allowlists', 'Lowest fees'],
    color: '#E5E4E2',
  },
  {
    name: 'Diamond',
    minPoints: 50000,
    maxPoints: Infinity,
    benefits: ['Ultimate benefits', 'Direct team access', 'Zero fees on select'],
    color: '#B9F2FF',
  },
];

export interface DiamondStatus {
  wallet: string;
  points: number;
  tier: DiamondTier;
  nextTier: DiamondTier | null;
  pointsToNextTier: number;
  progressPercent: number;
  rank?: number;
  weeklyPoints: number;
  monthlyPoints: number;
  lifetimeVolume: number;
  questsCompleted: number;
  lastUpdated: number;
}

export interface DiamondQuest {
  id: string;
  name: string;
  description: string;
  pointsReward: number;
  progress: number;
  target: number;
  completed: boolean;
  expiresAt?: number;
  category: 'daily' | 'weekly' | 'special' | 'milestone';
}

export interface MECollection {
  symbol: string;
  name: string;
  image: string;
  floorPrice: number;
  listedCount: number;
  volumeAll: number;
  hasRewards: boolean;
}

class MagicEdenService {
  private apiKey: string | null;

  constructor() {
    this.apiKey = process.env.MAGIC_EDEN_API_KEY || null;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }
    return headers;
  }

  /**
   * Get Diamond status for a wallet
   */
  async getDiamondStatus(wallet: string): Promise<DiamondStatus | null> {
    try {
      // Failsafe: validate wallet address again
      if (typeof wallet !== 'string' || !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(wallet)) {
        throw new Error('Invalid wallet address format');
      }
      // Try official rewards endpoint
      const response = await fetch(`${ME_REWARDS_API}/user/${encodeURIComponent(wallet)}`, {
        headers: this.getHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        return this.parseDiamondStatus(wallet, data);
      }

      // Fallback: Calculate from activity
      return this.calculateDiamondStatus(wallet);
    } catch (error) {
      logger.error(`Error fetching ME Diamond status for ${wallet}:`, error);
      return this.calculateDiamondStatus(wallet);
    }
  }

  /**
   * Parse Diamond status from API response
   */
  private parseDiamondStatus(wallet: string, data: any): DiamondStatus {
    const points = data.points || data.diamondPoints || 0;
    const tier = this.getTierForPoints(points);
    const nextTier = this.getNextTier(tier);

    return {
      wallet,
      points,
      tier,
      nextTier,
      pointsToNextTier: nextTier ? nextTier.minPoints - points : 0,
      progressPercent: this.calculateProgress(points, tier, nextTier),
      rank: data.rank,
      weeklyPoints: data.weeklyPoints || 0,
      monthlyPoints: data.monthlyPoints || 0,
      lifetimeVolume: data.lifetimeVolume || data.volume || 0,
      questsCompleted: data.questsCompleted || 0,
      lastUpdated: Date.now(),
    };
  }

  /**
   * Calculate Diamond status from wallet activity (fallback)
   */
  private async calculateDiamondStatus(wallet: string): Promise<DiamondStatus> {
    try {
      // Get wallet activity from ME API
      const activityResponse = await fetch(
        `${ME_API_BASE}/wallets/${wallet}/activities?offset=0&limit=100`,
        { headers: this.getHeaders() }
      );

      let estimatedPoints = 0;
      let volume = 0;

      if (activityResponse.ok) {
        const activities = await activityResponse.json();

        for (const activity of activities || []) {
          // Estimate points based on activity type
          if (activity.type === 'buyNow' || activity.type === 'buy') {
            estimatedPoints += 10;
            volume += activity.price || 0;
          } else if (activity.type === 'list') {
            estimatedPoints += 2;
          } else if (activity.type === 'bid') {
            estimatedPoints += 5;
          }
        }
      }

      const tier = this.getTierForPoints(estimatedPoints);
      const nextTier = this.getNextTier(tier);

      return {
        wallet,
        points: estimatedPoints,
        tier,
        nextTier,
        pointsToNextTier: nextTier ? nextTier.minPoints - estimatedPoints : 0,
        progressPercent: this.calculateProgress(estimatedPoints, tier, nextTier),
        weeklyPoints: 0,
        monthlyPoints: 0,
        lifetimeVolume: volume / 1e9, // Convert lamports to SOL
        questsCompleted: 0,
        lastUpdated: Date.now(),
      };
    } catch (error) {
      logger.error(`Error calculating Diamond status for ${wallet}:`, error);

      // Return default Bronze status
      const tier = DIAMOND_TIERS[0];
      return {
        wallet,
        points: 0,
        tier,
        nextTier: DIAMOND_TIERS[1],
        pointsToNextTier: 1000,
        progressPercent: 0,
        weeklyPoints: 0,
        monthlyPoints: 0,
        lifetimeVolume: 0,
        questsCompleted: 0,
        lastUpdated: Date.now(),
      };
    }
  }

  /**
   * Get available quests
   */
  async getQuests(wallet: string): Promise<DiamondQuest[]> {
    try {
      const response = await fetch(`${ME_REWARDS_API}/quests?wallet=${wallet}`, {
        headers: this.getHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        return (data.quests || []).map((q: any) => ({
          id: q.id,
          name: q.name || q.title,
          description: q.description,
          pointsReward: q.points || q.reward,
          progress: q.progress || 0,
          target: q.target || q.requirement || 1,
          completed: q.completed || q.progress >= (q.target || 1),
          expiresAt: q.expiresAt,
          category: q.category || 'daily',
        }));
      }

      // Return mock quests if API unavailable
      return this.getMockQuests();
    } catch (error) {
      logger.error('Error fetching ME quests:', error);
      return this.getMockQuests();
    }
  }

  /**
   * Get mock quests for demo
   */
  private getMockQuests(): DiamondQuest[] {
    return [
      {
        id: 'daily-buy',
        name: 'Daily Trader',
        description: 'Make 1 purchase today',
        pointsReward: 50,
        progress: 0,
        target: 1,
        completed: false,
        category: 'daily',
      },
      {
        id: 'daily-list',
        name: 'List It',
        description: 'List 3 NFTs today',
        pointsReward: 30,
        progress: 0,
        target: 3,
        completed: false,
        category: 'daily',
      },
      {
        id: 'weekly-volume',
        name: 'Volume King',
        description: 'Trade 10 SOL volume this week',
        pointsReward: 200,
        progress: 0,
        target: 10,
        completed: false,
        category: 'weekly',
      },
      {
        id: 'milestone-100',
        name: 'Centurion',
        description: 'Complete 100 trades',
        pointsReward: 1000,
        progress: 0,
        target: 100,
        completed: false,
        category: 'milestone',
      },
    ];
  }

  /**
   * Get tier for points
   */
  getTierForPoints(points: number): DiamondTier {
    for (let i = DIAMOND_TIERS.length - 1; i >= 0; i--) {
      if (points >= DIAMOND_TIERS[i].minPoints) {
        return DIAMOND_TIERS[i];
      }
    }
    return DIAMOND_TIERS[0];
  }

  /**
   * Get next tier
   */
  getNextTier(currentTier: DiamondTier): DiamondTier | null {
    const currentIndex = DIAMOND_TIERS.findIndex((t) => t.name === currentTier.name);
    if (currentIndex < DIAMOND_TIERS.length - 1) {
      return DIAMOND_TIERS[currentIndex + 1];
    }
    return null;
  }

  /**
   * Calculate progress to next tier
   */
  private calculateProgress(
    points: number,
    currentTier: DiamondTier,
    nextTier: DiamondTier | null
  ): number {
    if (!nextTier) return 100;

    const tierRange = nextTier.minPoints - currentTier.minPoints;
    const pointsInTier = points - currentTier.minPoints;

    return Math.min(100, Math.max(0, (pointsInTier / tierRange) * 100));
  }

  /**
   * Get collection stats from Magic Eden
   */
  async getCollectionStats(symbol: string): Promise<MECollection | null> {
    try {
      const response = await fetch(`${ME_API_BASE}/collections/${symbol}/stats`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();

      return {
        symbol: data.symbol,
        name: data.name || symbol,
        image: data.image || '',
        floorPrice: (data.floorPrice || 0) / 1e9,
        listedCount: data.listedCount || 0,
        volumeAll: (data.volumeAll || 0) / 1e9,
        hasRewards: data.hasRewards || false,
      };
    } catch (error) {
      logger.error(`Error fetching ME collection stats for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Get all Diamond tiers
   */
  getAllTiers(): DiamondTier[] {
    return DIAMOND_TIERS;
  }
}

// Singleton instance
let meService: MagicEdenService;

export function getMagicEdenService(): MagicEdenService {
  if (!meService) {
    meService = new MagicEdenService();
  }
  return meService;
}

export { MagicEdenService };
export default getMagicEdenService;
