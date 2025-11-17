import logger from '../utils/logger';


export interface UserProfile {
  userId: string;
  username: string;
  avatar?: string;
  bio?: string;
  website?: string;
  twitter?: string;
  discord?: string;
  verified: boolean;
  badges: string[];
  followers: number;
  following: number;
  createdAt: number;
  updatedAt: number;
  socialScore: number; // 0-100 based on engagement
}

export interface Collection {
  id: string;
  name: string;
  description: string;
  creator: string;
  items: string[]; // NFT mints
  isPrivate: boolean;
  followers: number;
  likes: number;
  createdAt: number;
  category?: string;
  coverImage?: string;
}

export interface CuratedList {
  id: string;
  title: string;
  description: string;
  creator: string;
  nfts: Array<{ mint: string; reason?: string }>;
  category: string;
  isPublic: boolean;
  upvotes: number;
  followers: number;
  createdAt: number;
}

export interface Social {
  userId: string;
  followers: Set<string>;
  following: Set<string>;
  blockedUsers: Set<string>;
  mutedUsers: Set<string>;
  lastUpdated: number;
}

export class CommunityService {
  private profiles: Map<string, UserProfile> = new Map();
  private collections: Map<string, Collection> = new Map();
  private curatedLists: Map<string, CuratedList> = new Map();
  private socialGraphs: Map<string, Social> = new Map();
  private messages: Array<{ from: string; to: string; text: string; timestamp: number }> = [];
  private feedItems: Array<{ userId: string; action: string; data: any; timestamp: number }> = [];

  /**
   * Create or get user profile
   */
  public ensureProfile(userId: string, username: string): UserProfile {
    let profile = this.profiles.get(userId);
    if (!profile) {
      profile = {
        userId,
        username,
        verified: false,
        badges: [],
        followers: 0,
        following: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        socialScore: 0,
      };
      this.profiles.set(userId, profile);
      this.socialGraphs.set(userId, {
        userId,
        followers: new Set(),
        following: new Set(),
        blockedUsers: new Set(),
        mutedUsers: new Set(),
        lastUpdated: Date.now(),
      });
      logger.info(`Created profile for user: ${username}`);
    }
    return profile;
  }

  /**
   * Update user profile
   */
  public updateProfile(userId: string, updates: Partial<UserProfile>): UserProfile | null {
    const profile = this.profiles.get(userId);
    if (!profile) return null;

    Object.assign(profile, updates, { updatedAt: Date.now() });
    this.addToFeed(userId, 'profile_updated', { username: profile.username });
    logger.info(`Updated profile for user: ${userId}`);
    return profile;
  }

  /**
   * Get user profile
   */
  public getProfile(userId: string): UserProfile | null {
    return this.profiles.get(userId) || null;
  }

  /**
   * Follow user
   */
  public followUser(followerId: string, followeeId: string): boolean {
    const followerGraph = this.socialGraphs.get(followerId);
    const followeeGraph = this.socialGraphs.get(followeeId);
    const followerProfile = this.profiles.get(followerId);
    const followeeProfile = this.profiles.get(followeeId);

    if (!followerGraph || !followeeGraph || !followerProfile || !followeeProfile) {
      return false;
    }

    if (followeeGraph.blockedUsers.has(followerId)) {
      logger.warn(`${followerId} is blocked by ${followeeId}`);
      return false;
    }

    followerGraph.following.add(followeeId);
    followeeGraph.followers.add(followerId);
    followerProfile.following += 1;
    followeeProfile.followers += 1;

    this.addToFeed(followeeId, 'user_followed', { follower: followerId });
    logger.info(`${followerId} followed ${followeeId}`);
    return true;
  }

  /**
   * Unfollow user
   */
  public unfollowUser(followerId: string, followeeId: string): boolean {
    const followerGraph = this.socialGraphs.get(followerId);
    const followeeGraph = this.socialGraphs.get(followeeId);
    const followerProfile = this.profiles.get(followerId);
    const followeeProfile = this.profiles.get(followeeId);

    if (!followerGraph || !followeeGraph) return false;

    if (followerGraph.following.has(followeeId)) {
      followerGraph.following.delete(followeeId);
      followeeGraph.followers.delete(followerId);
      if (followerProfile) followerProfile.following -= 1;
      if (followeeProfile) followeeProfile.followers -= 1;
      logger.info(`${followerId} unfollowed ${followeeId}`);
      return true;
    }
    return false;
  }

  /**
   * Check if user is following another
   */
  public isFollowing(userId: string, targetId: string): boolean {
    return this.socialGraphs.get(userId)?.following.has(targetId) || false;
  }

  /**
   * Block user
   */
  public blockUser(userId: string, blockedId: string): boolean {
    const graph = this.socialGraphs.get(userId);
    if (!graph) return false;

    graph.blockedUsers.add(blockedId);
    this.unfollowUser(userId, blockedId);
    this.unfollowUser(blockedId, userId);
    logger.info(`${userId} blocked ${blockedId}`);
    return true;
  }

  /**
   * Create collection
   */
  public createCollection(
    creator: string,
    name: string,
    description: string,
    isPrivate: boolean = false
  ): Collection {
    const collection: Collection = {
      id: `col_${creator}_${Date.now()}`,
      name,
      description,
      creator,
      items: [],
      isPrivate,
      followers: 0,
      likes: 0,
      createdAt: Date.now(),
    };

    this.collections.set(collection.id, collection);
    this.addToFeed(creator, 'collection_created', { collectionName: name });
    logger.info(`Created collection: ${collection.id}`);
    return collection;
  }

  /**
   * Add NFT to collection
   */
  public addToCollection(collectionId: string, nftMint: string): boolean {
    const collection = this.collections.get(collectionId);
    if (!collection || collection.items.includes(nftMint)) return false;

    collection.items.push(nftMint);
    logger.debug(`Added ${nftMint} to collection ${collectionId}`);
    return true;
  }

  /**
   * Create curated list
   */
  public createCuratedList(
    creator: string,
    title: string,
    description: string,
    category: string,
    nfts: string[],
    isPublic: boolean = true
  ): CuratedList {
    const list: CuratedList = {
      id: `list_${creator}_${Date.now()}`,
      title,
      description,
      creator,
      nfts: nfts.map(mint => ({ mint })),
      category,
      isPublic,
      upvotes: 0,
      followers: 0,
      createdAt: Date.now(),
    };

    this.curatedLists.set(list.id, list);
    logger.info(`Created curated list: ${list.id}`);
    return list;
  }

  /**
   * Upvote curated list
   */
  public upvoteList(listId: string, voterId: string): boolean {
    const list = this.curatedLists.get(listId);
    if (!list) return false;

    list.upvotes += 1;
    logger.debug(`${voterId} upvoted list ${listId}`);
    return true;
  }

  /**
   * Follow collection
   */
  public followCollection(userId: string, collectionId: string): boolean {
    const collection = this.collections.get(collectionId);
    if (!collection) return false;

    collection.followers += 1;
    this.addToFeed(collection.creator, 'collection_followed', {
      collectionName: collection.name,
      follower: userId,
    });
    logger.debug(`${userId} followed collection ${collectionId}`);
    return true;
  }

  /**
   * Send direct message
   */
  public sendMessage(from: string, to: string, text: string): boolean {
    const fromGraph = this.socialGraphs.get(from);
    const toGraph = this.socialGraphs.get(to);

    if (!fromGraph || !toGraph || toGraph.blockedUsers.has(from) || toGraph.mutedUsers.has(from)) {
      return false;
    }

    this.messages.push({
      from,
      to,
      text,
      timestamp: Date.now(),
    });

    logger.debug(`Message from ${from} to ${to}`);
    return true;
  }

  /**
   * Get messages for user
   */
  public getMessages(userId: string, limit: number = 50): Array<any> {
    return this.messages
      .filter(m => m.to === userId || m.from === userId)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Get user's followers
   */
  public getFollowers(userId: string): string[] {
    return Array.from(this.socialGraphs.get(userId)?.followers || new Set());
  }

  /**
   * Get user's following
   */
  public getFollowing(userId: string): string[] {
    return Array.from(this.socialGraphs.get(userId)?.following || new Set());
  }

  /**
   * Get user's collections
   */
  public getUserCollections(userId: string): Collection[] {
    return Array.from(this.collections.values()).filter(c => c.creator === userId);
  }

  /**
   * Get trending collections
   */
  public getTrendingCollections(limit: number = 10): Collection[] {
    return Array.from(this.collections.values())
      .filter(c => !c.isPrivate)
      .sort((a, b) => {
        const scoreA = (a.followers * 0.6 + a.likes * 0.4) * a.items.length;
        const scoreB = (b.followers * 0.6 + b.likes * 0.4) * b.items.length;
        return scoreB - scoreA;
      })
      .slice(0, limit);
  }

  /**
   * Get trending curated lists
   */
  public getTrendingLists(limit: number = 10, category?: string): CuratedList[] {
    return Array.from(this.curatedLists.values())
      .filter(l => l.isPublic && (!category || l.category === category))
      .sort((a, b) => (b.upvotes + b.followers) - (a.upvotes + a.followers))
      .slice(0, limit);
  }

  /**
   * Get user's social feed
   */
  public getSocialFeed(userId: string, limit: number = 50): Array<any> {
    const following = this.getFollowing(userId);
    return this.feedItems
      .filter(item => following.includes(item.userId) || item.userId === userId)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Add to user's feed
   */
  private addToFeed(userId: string, action: string, data: any): void {
    this.feedItems.push({
      userId,
      action,
      data,
      timestamp: Date.now(),
    });

    if (this.feedItems.length > 5000) {
      this.feedItems.shift();
    }
  }

  /**
   * Calculate social score
   */
  public calculateSocialScore(userId: string): number {
    const profile = this.profiles.get(userId);
    if (!profile) return 0;

    const followersScore = Math.min(profile.followers * 0.5, 30);
    const badgesScore = profile.badges.length * 5;
    const verifiedBonus = profile.verified ? 20 : 0;
    const engagementScore = this.feedItems.filter(f => f.userId === userId).length * 0.1;

    const totalScore = Math.min(followersScore + badgesScore + verifiedBonus + engagementScore, 100);
    profile.socialScore = totalScore;
    return totalScore;
  }

  /**
   * Suggest users to follow
   */
  public suggestUsers(userId: string, limit: number = 10): UserProfile[] {
    const userGraph = this.socialGraphs.get(userId);
    if (!userGraph) return [];

    return Array.from(this.profiles.values())
      .filter(
        p =>
          p.userId !== userId &&
          !userGraph.following.has(p.userId) &&
          !userGraph.blockedUsers.has(p.userId)
      )
      .sort((a, b) => b.followers - a.followers)
      .slice(0, limit);
  }

  /**
   * Get user stats
   */
  public getUserStats(userId: string): Record<string, any> {
    const profile = this.profiles.get(userId);
    const collections = this.getUserCollections(userId);
    const feedActivity = this.feedItems.filter(f => f.userId === userId).length;

    if (!profile) return {};

    return {
      profile,
      collections: collections.length,
      feedActivity,
      socialScore: this.calculateSocialScore(userId),
      followers: this.getFollowers(userId).length,
      following: this.getFollowing(userId).length,
    };
  }
}

let communityService: CommunityService;

export function getCommunityService(): CommunityService {
  if (!communityService) {
    communityService = new CommunityService();
  }
  return communityService;
}

export function initializeCommunityService(): CommunityService {
  if (!communityService) {
    communityService = new CommunityService();
  }
  return communityService;
}
