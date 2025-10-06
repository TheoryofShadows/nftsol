
import { Request, Response } from 'express';

// CLOUT system data structures
interface CloutBalance {
  userId: string;
  total: number;
  staked: number;
  available: number;
  pending: number;
  lastUpdated: Date;
}

interface StakingPool {
  id: string;
  name: string;
  apy: number;
  minStake: number;
  lockPeriod: number; // days
  totalStaked: number;
  maxStakers: number;
  status: 'active' | 'coming_soon' | 'ended';
}

interface UserStake {
  userId: string;
  poolId: string;
  amount: number;
  startDate: Date;
  lastRewardClaim: Date;
  pendingRewards: number;
}

interface PremiumFeature {
  id: string;
  name: string;
  description: string;
  cost: number;
  duration: number; // days
  benefits: string[];
  category: string;
  popular: boolean;
}

interface UserFeature {
  userId: string;
  featureId: string;
  purchaseDate: Date;
  expiryDate: Date;
  active: boolean;
}

// In-memory storage (replace with database in production)
const cloutBalances = new Map<string, CloutBalance>();
const userStakes = new Map<string, UserStake[]>();
const userFeatures = new Map<string, UserFeature[]>();

// Initialize staking pools
const stakingPools: StakingPool[] = [
  {
    id: 'basic-pool',
    name: 'Basic Staking',
    apy: 12,
    minStake: 100,
    lockPeriod: 30,
    totalStaked: 1250000,
    maxStakers: 1000,
    status: 'active'
  },
  {
    id: 'premium-pool',
    name: 'Premium Staking',
    apy: 18,
    minStake: 1000,
    lockPeriod: 90,
    totalStaked: 890000,
    maxStakers: 500,
    status: 'active'
  },
  {
    id: 'elite-pool',
    name: 'Elite Staking',
    apy: 25,
    minStake: 10000,
    lockPeriod: 180,
    totalStaked: 2100000,
    maxStakers: 100,
    status: 'active'
  },
  {
    id: 'diamond-pool',
    name: 'Diamond Hands',
    apy: 35,
    minStake: 50000,
    lockPeriod: 365,
    totalStaked: 500000,
    maxStakers: 50,
    status: 'coming_soon'
  }
];

// Initialize premium features
const premiumFeatures: PremiumFeature[] = [
  {
    id: 'advanced-analytics',
    name: 'Advanced Analytics',
    description: 'Detailed portfolio analytics and market insights',
    cost: 500,
    duration: 30,
    benefits: [
      'Portfolio performance tracking',
      'Market trend analysis',
      'Price prediction models',
      'Custom alerts and notifications'
    ],
    category: 'analytics',
    popular: true
  },
  {
    id: 'premium-recommendations',
    name: 'Premium AI Recommendations',
    description: 'Enhanced AI recommendations with priority access',
    cost: 750,
    duration: 30,
    benefits: [
      'Priority recommendation queue',
      'Advanced filtering options',
      'Personalized curator insights',
      'Early access to trending NFTs'
    ],
    category: 'ai',
    popular: true
  },
  {
    id: 'creator-tools-pro',
    name: 'Creator Tools Pro',
    description: 'Professional NFT creation and management tools',
    cost: 1000,
    duration: 30,
    benefits: [
      'Bulk NFT creation tools',
      'Advanced metadata editor',
      'Collection management dashboard',
      'Marketing automation tools'
    ],
    category: 'creator',
    popular: false
  },
  {
    id: 'marketplace-boost',
    name: 'Marketplace Boost',
    description: 'Enhanced visibility for your NFT listings',
    cost: 300,
    duration: 7,
    benefits: [
      'Featured placement in search',
      'Homepage banner rotation',
      'Social media promotion',
      'Newsletter inclusion'
    ],
    category: 'marketing',
    popular: true
  },
  {
    id: 'white-glove-support',
    name: 'White Glove Support',
    description: 'Priority customer support and personal account manager',
    cost: 2000,
    duration: 30,
    benefits: [
      'Dedicated account manager',
      'Priority support queue',
      'Custom onboarding session',
      'Monthly strategy consultation'
    ],
    category: 'support',
    popular: false
  },
  {
    id: 'api-access',
    name: 'Developer API Access',
    description: 'Full API access for developers and advanced users',
    cost: 1500,
    duration: 30,
    benefits: [
      'Full REST API access',
      'Real-time WebSocket feeds',
      'Historical data export',
      'Custom integration support'
    ],
    category: 'developer',
    popular: false
  }
];

class CloutService {
  static getOrCreateBalance(userId: string): CloutBalance {
    if (!cloutBalances.has(userId)) {
      cloutBalances.set(userId, {
        userId,
        total: 1000, // Starting bonus
        staked: 0,
        available: 1000,
        pending: 0,
        lastUpdated: new Date()
      });
    }
    return cloutBalances.get(userId)!;
  }

  static updateBalance(userId: string, changes: Partial<CloutBalance>) {
    const balance = this.getOrCreateBalance(userId);
    Object.assign(balance, changes, { lastUpdated: new Date() });
    cloutBalances.set(userId, balance);
  }

  static calculateStakingRewards(userId: string): number {
    const stakes = userStakes.get(userId) || [];
    let totalRewards = 0;

    stakes.forEach(stake => {
      const pool = stakingPools.find(p => p.id === stake.poolId);
      if (!pool) return;

      const daysSinceLastClaim = Math.floor(
        (Date.now() - stake.lastRewardClaim.getTime()) / (1000 * 60 * 60 * 24)
      );

      const dailyRate = pool.apy / 365 / 100;
      const rewards = stake.amount * dailyRate * daysSinceLastClaim;
      totalRewards += rewards;
    });

    return Math.floor(totalRewards);
  }

  static async stakeTokens(userId: string, poolId: string, amount: number): Promise<boolean> {
    const balance = this.getOrCreateBalance(userId);
    const pool = stakingPools.find(p => p.id === poolId);

    if (!pool || pool.status !== 'active') {
      throw new Error('Invalid or inactive staking pool');
    }

    if (amount < pool.minStake) {
      throw new Error(`Minimum stake is ${pool.minStake} CLOUT`);
    }

    if (balance.available < amount) {
      throw new Error('Insufficient CLOUT balance');
    }

    // Update balance
    this.updateBalance(userId, {
      available: balance.available - amount,
      staked: balance.staked + amount
    });

    // Create stake record
    const userStakeList = userStakes.get(userId) || [];
    userStakeList.push({
      userId,
      poolId,
      amount,
      startDate: new Date(),
      lastRewardClaim: new Date(),
      pendingRewards: 0
    });
    userStakes.set(userId, userStakeList);

    return true;
  }

  static async claimRewards(userId: string, poolId: string): Promise<number> {
    const stakes = userStakes.get(userId) || [];
    const stake = stakes.find(s => s.poolId === poolId);

    if (!stake) {
      throw new Error('No stake found for this pool');
    }

    const rewards = this.calculateStakingRewards(userId);
    if (rewards === 0) {
      throw new Error('No rewards available to claim');
    }

    // Update balance
    const balance = this.getOrCreateBalance(userId);
    this.updateBalance(userId, {
      available: balance.available + rewards,
      total: balance.total + rewards,
      pending: balance.pending - rewards
    });

    // Update stake record
    stake.lastRewardClaim = new Date();
    stake.pendingRewards = 0;

    return rewards;
  }

  static async purchaseFeature(userId: string, featureId: string): Promise<boolean> {
    const feature = premiumFeatures.find(f => f.id === featureId);
    if (!feature) {
      throw new Error('Feature not found');
    }

    const balance = this.getOrCreateBalance(userId);
    if (balance.available < feature.cost) {
      throw new Error('Insufficient CLOUT balance');
    }

    // Check if user already owns this feature
    const userFeatureList = userFeatures.get(userId) || [];
    const existingFeature = userFeatureList.find(f => f.featureId === featureId && f.active);
    if (existingFeature) {
      throw new Error('Feature already owned');
    }

    // Deduct cost
    this.updateBalance(userId, {
      available: balance.available - feature.cost,
      total: balance.total - feature.cost
    });

    // Add feature to user
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + feature.duration);

    userFeatureList.push({
      userId,
      featureId,
      purchaseDate: new Date(),
      expiryDate,
      active: true
    });
    userFeatures.set(userId, userFeatureList);

    return true;
  }

  static getUserFeatures(userId: string): UserFeature[] {
    const features = userFeatures.get(userId) || [];
    return features.filter(f => f.active && f.expiryDate > new Date());
  }

  static getUserStakes(userId: string): (UserStake & { pool: StakingPool })[] {
    const stakes = userStakes.get(userId) || [];
    return stakes.map(stake => ({
      ...stake,
      pool: stakingPools.find(p => p.id === stake.poolId)!
    })).filter(s => s.pool);
  }
}

export function setupCloutRoutes(app: any) {
  // Get user CLOUT balance
  app.get('/api/clout/balance/:userId', async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const balance = CloutService.getOrCreateBalance(userId);
      
      // Update pending rewards
      const pendingRewards = CloutService.calculateStakingRewards(userId);
      balance.pending = pendingRewards;
      
      res.json(balance);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get staking pools
  app.get('/api/clout/staking-pools', async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId as string;
      
      const poolsWithUserData = stakingPools.map(pool => {
        const userStakeList = userStakes.get(userId) || [];
        const userStake = userStakeList.find(s => s.poolId === pool.id);
        
        return {
          ...pool,
          userStaked: userStake?.amount || 0,
          rewards: userStake ? CloutService.calculateStakingRewards(userId) : 0
        };
      });
      
      res.json(poolsWithUserData);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Stake tokens
  app.post('/api/clout/stake', async (req: Request, res: Response) => {
    try {
      const { userId, poolId, amount } = req.body;
      
      if (!userId || !poolId || !amount) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      await CloutService.stakeTokens(userId, poolId, amount);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Claim staking rewards
  app.post('/api/clout/claim-rewards', async (req: Request, res: Response) => {
    try {
      const { userId, poolId } = req.body;
      
      if (!userId || !poolId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      const amount = await CloutService.claimRewards(userId, poolId);
      res.json({ success: true, amount });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get premium features
  app.get('/api/clout/premium-features', async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId as string;
      const ownedFeatures = userId ? CloutService.getUserFeatures(userId) : [];
      
      const featuresWithOwnership = premiumFeatures.map(feature => ({
        ...feature,
        owned: ownedFeatures.some(f => f.featureId === feature.id)
      }));
      
      res.json(featuresWithOwnership);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Purchase premium feature
  app.post('/api/clout/purchase-feature', async (req: Request, res: Response) => {
    try {
      const { userId, featureId } = req.body;
      
      if (!userId || !featureId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      await CloutService.purchaseFeature(userId, featureId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Award CLOUT tokens (for platform actions)
  app.post('/api/clout/award', async (req: Request, res: Response) => {
    try {
      const { userId, amount, reason } = req.body;
      
      if (!userId || !amount) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      const balance = CloutService.getOrCreateBalance(userId);
      CloutService.updateBalance(userId, {
        available: balance.available + amount,
        total: balance.total + amount
      });
      
      res.json({ success: true, newBalance: balance.total + amount });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
}

export { CloutService };
