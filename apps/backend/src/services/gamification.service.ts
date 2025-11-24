import logger from '../utils/logger';


export enum AchievementType {
  FIRST_NFT = 'first_nft',
  COLLECTOR = 'collector',
  HODLER = 'hodler',
  WHALE = 'whale',
  SOCIAL_BUTTERFLY = 'social_butterfly',
  CREATOR = 'creator',
  MARKET_EXPERT = 'market_expert',
  INFLUENCER = 'influencer',
  PHILANTHROPIST = 'philanthropist',
  LEGENDARY = 'legendary',
}

export interface Achievement {
  id: string;
  type: AchievementType;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  points: number;
  unlockedAt?: number;
}

export interface UserAchievements {
  userId: string;
  achievements: Achievement[];
  totalPoints: number;
  level: number;
  levelProgress: number; // 0-100
  streak: number;
  lastActivityAt: number;
}

export interface Leaderboard {
  rank: number;
  userId: string;
  _username: string;
  totalPoints: number;
  level: number;
  achievementCount: number;
}

export class GamificationService {
  private userAchievements: Map<string, UserAchievements> = new Map();
  private leaderboard: Leaderboard[] = [];
  private updateLeaderboardInterval = 3600000; // 1 hour

  private achievements: Map<AchievementType, Achievement> = new Map([
    [
      AchievementType.FIRST_NFT,
      {
        id: 'first_nft',
        type: AchievementType.FIRST_NFT,
        name: 'First Steps',
        description: 'Purchase your first NFT',
        icon: '🎨',
        rarity: 'common',
        points: 10,
      },
    ],
    [
      AchievementType.COLLECTOR,
      {
        id: 'collector',
        type: AchievementType.COLLECTOR,
        name: 'Collector',
        description: 'Collect 10 NFTs',
        icon: '📦',
        rarity: 'uncommon',
        points: 50,
      },
    ],
    [
      AchievementType.HODLER,
      {
        id: 'hodler',
        type: AchievementType.HODLER,
        name: 'HODL Master',
        description: 'Hold an NFT for 30 days',
        icon: '💎',
        rarity: 'rare',
        points: 100,
      },
    ],
    [
      AchievementType.WHALE,
      {
        id: 'whale',
        type: AchievementType.WHALE,
        name: 'Whale Watcher',
        description: 'Spend 100 SOL on the marketplace',
        icon: '🐳',
        rarity: 'epic',
        points: 500,
      },
    ],
    [
      AchievementType.SOCIAL_BUTTERFLY,
      {
        id: 'social_butterfly',
        type: AchievementType.SOCIAL_BUTTERFLY,
        name: 'Social Butterfly',
        description: 'Follow 50 creators',
        icon: '🦋',
        rarity: 'uncommon',
        points: 75,
      },
    ],
    [
      AchievementType.CREATOR,
      {
        id: 'creator',
        type: AchievementType.CREATOR,
        name: 'Creator',
        description: 'Mint your first NFT',
        icon: '✨',
        rarity: 'uncommon',
        points: 100,
      },
    ],
    [
      AchievementType.MARKET_EXPERT,
      {
        id: 'market_expert',
        type: AchievementType.MARKET_EXPERT,
        name: 'Market Expert',
        description: 'Make 10 successful trades',
        icon: '📈',
        rarity: 'rare',
        points: 200,
      },
    ],
    [
      AchievementType.INFLUENCER,
      {
        id: 'influencer',
        type: AchievementType.INFLUENCER,
        name: 'Influencer',
        description: 'Get 1000 followers',
        icon: '⭐',
        rarity: 'epic',
        points: 400,
      },
    ],
    [
      AchievementType.PHILANTHROPIST,
      {
        id: 'philanthropist',
        type: AchievementType.PHILANTHROPIST,
        name: 'Philanthropist',
        description: 'Donate 10 NFTs to charity',
        icon: '❤️',
        rarity: 'epic',
        points: 300,
      },
    ],
    [
      AchievementType.LEGENDARY,
      {
        id: 'legendary',
        type: AchievementType.LEGENDARY,
        name: 'Legendary',
        description: 'Unlock all achievements',
        icon: '👑',
        rarity: 'legendary',
        points: 1000,
      },
    ],
  ]);

  constructor() {
    // Start leaderboard update interval
    setInterval(() => this.updateLeaderboard(), this.updateLeaderboardInterval);
  }

  /**
   * Initialize user achievements
   */
  public initializeUser(userId: string, _username: string): UserAchievements {
    const existing = this.userAchievements.get(userId);
    if (existing) return existing;

    const userAch: UserAchievements = {
      userId,
      achievements: [],
      totalPoints: 0,
      level: 1,
      levelProgress: 0,
      streak: 0,
      lastActivityAt: Date.now(),
    };

    this.userAchievements.set(userId, userAch);
    return userAch;
  }

  /**
   * Unlock achievement for user
   */
  public unlockAchievement(userId: string, achievementType: AchievementType): boolean {
    let userAch = this.userAchievements.get(userId);
    if (!userAch) {
      userAch = this.initializeUser(userId, '');
    }

    // Check if already unlocked
    if (userAch.achievements.some(a => a.type === achievementType)) {
      return false;
    }

    const achievement = this.achievements.get(achievementType);
    if (!achievement) {
      logger.warn(`Achievement ${achievementType} not found`);
      return false;
    }

    const unlockedAch: Achievement = {
      ...achievement,
      unlockedAt: Date.now(),
    };

    userAch.achievements.push(unlockedAch);
    userAch.totalPoints += achievement.points;
    userAch.lastActivityAt = Date.now();

    // Update level
    this.updateLevel(userAch);

    logger.info(`User ${userId} unlocked achievement: ${achievementType}`);
    return true;
  }

  /**
   * Add points to user
   */
  public addPoints(userId: string, points: number, reason: string = 'activity'): void {
    let userAch = this.userAchievements.get(userId);
    if (!userAch) {
      userAch = this.initializeUser(userId, '');
    }

    userAch.totalPoints += points;
    userAch.lastActivityAt = Date.now();
    this.updateLevel(userAch);

    logger.debug(`Added ${points} points to ${userId} (${reason})`);
  }

  /**
   * Update daily streak
   */
  public updateStreak(userId: string): void {
    let userAch = this.userAchievements.get(userId);
    if (!userAch) {
      userAch = this.initializeUser(userId, '');
    }

    const lastActivity = userAch.lastActivityAt;
    const today = new Date().toDateString();
    const lastActivityDate = new Date(lastActivity).toDateString();

    if (lastActivityDate !== today) {
      userAch.streak += 1;
      userAch.lastActivityAt = Date.now();

      // Bonus points for streaks
      if (userAch.streak % 7 === 0) {
        this.addPoints(userId, 25, `${userAch.streak} day streak`);
      }
    }
  }

  /**
   * Update user level based on points
   */
  private updateLevel(userAch: UserAchievements): void {
    const pointsPerLevel = 100;
    const newLevel = Math.floor(userAch.totalPoints / pointsPerLevel) + 1;

    if (newLevel > userAch.level) {
      userAch.level = newLevel;
      userAch.levelProgress = 0;
      logger.info(`User ${userAch.userId} reached level ${newLevel}`);
    } else {
      userAch.levelProgress = ((userAch.totalPoints % pointsPerLevel) / pointsPerLevel) * 100;
    }
  }

  /**
   * Get user achievements
   */
  public getUserAchievements(userId: string): UserAchievements | null {
    return this.userAchievements.get(userId) || null;
  }

  /**
   * Get leaderboard
   */
  public getLeaderboard(limit: number = 50, offset: number = 0): Leaderboard[] {
    return this.leaderboard.slice(offset, offset + limit);
  }

  /**
   * Get user rank
   */
  public getUserRank(userId: string): number {
    const rank = this.leaderboard.findIndex(l => l.userId === userId);
    return rank >= 0 ? rank + 1 : -1;
  }

  /**
   * Update leaderboard
   */
  private updateLeaderboard(): void {
    this.leaderboard = Array.from(this.userAchievements.values())
      .map((userAch, idx) => ({
        rank: idx + 1,
        userId: userAch.userId,
        _username: userAch.userId, // TODO: Get from database
        totalPoints: userAch.totalPoints,
        level: userAch.level,
        achievementCount: userAch.achievements.length,
      }))
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .map((entry, idx) => ({ ...entry, rank: idx + 1 }));
  }

  /**
   * Check and unlock milestone achievements
   */
  public checkAndUnlockMilestones(userId: string, stats: Record<string, number>): void {
    const userAch = this.userAchievements.get(userId);
    if (!userAch) return;

    // First NFT
    if (stats.purchasedNFTs === 1) {
      this.unlockAchievement(userId, AchievementType.FIRST_NFT);
    }

    // Collector
    if (stats.purchasedNFTs >= 10) {
      this.unlockAchievement(userId, AchievementType.COLLECTOR);
    }

    // Whale (100 SOL spent)
    if (stats.totalSpent >= 100) {
      this.unlockAchievement(userId, AchievementType.WHALE);
    }

    // Creator
    if (stats.mintedNFTs >= 1) {
      this.unlockAchievement(userId, AchievementType.CREATOR);
    }

    // Market Expert
    if (stats.trades >= 10) {
      this.unlockAchievement(userId, AchievementType.MARKET_EXPERT);
    }

    // Influencer
    if (stats.followers >= 1000) {
      this.unlockAchievement(userId, AchievementType.INFLUENCER);
    }

    // Check for legendary
    if (userAch.achievements.length === this.achievements.size - 1) {
      this.unlockAchievement(userId, AchievementType.LEGENDARY);
    }
  }

  /**
   * Get achievement templates
   */
  public getAllAchievements(): Achievement[] {
    return Array.from(this.achievements.values());
  }
}

let gamificationService: GamificationService;

export function getGamificationService(): GamificationService {
  if (!gamificationService) {
    gamificationService = new GamificationService();
  }
  return gamificationService;
}

export function initializeGamificationService(): GamificationService {
  if (!gamificationService) {
    gamificationService = new GamificationService();
  }
  return gamificationService;
}
