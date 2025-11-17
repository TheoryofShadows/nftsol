
import { Request, Response } from 'express';

// Mock data for social trading features
const topTraders = [
  {
    id: 'trader-1',
    username: 'CryptoMaster',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=CryptoMaster',
    rank: 1,
    totalPnL: 125.8,
    weeklyPnL: 23.4,
    winRate: 78,
    followers: 2847,
    isFollowing: false,
    verified: true,
    trades: 456,
    portfolioValue: 890.2,
    streak: 12,
    riskScore: 7.2,
    averageHoldTime: 4.5,
    specialties: ['Blue Chips', 'Gaming NFTs'],
    isOnline: true,
    lastActive: new Date(),
    badge: 'diamond' as const
  },
  {
    id: 'trader-2',
    username: 'NFTWhale',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=NFTWhale',
    rank: 2,
    totalPnL: 98.5,
    weeklyPnL: 18.7,
    winRate: 72,
    followers: 1923,
    isFollowing: true,
    verified: true,
    trades: 342,
    portfolioValue: 654.3,
    streak: 8,
    riskScore: 6.8,
    averageHoldTime: 7.2,
    specialties: ['Art', 'PFPs'],
    isOnline: false,
    lastActive: new Date(Date.now() - 300000),
    badge: 'gold' as const
  },
  {
    id: 'trader-3',
    username: 'ArtCollector',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ArtCollector',
    rank: 3,
    totalPnL: 76.2,
    weeklyPnL: -5.2,
    winRate: 69,
    followers: 1456,
    isFollowing: false,
    verified: false,
    trades: 298,
    portfolioValue: 432.1,
    streak: 0,
    riskScore: 8.1,
    averageHoldTime: 12.3,
    specialties: ['1/1 Art', 'Photography'],
    isOnline: true,
    lastActive: new Date(Date.now() - 120000),
    badge: 'silver' as const
  }
];

// Mock comments data
const mockComments = [
  {
    id: 'comment-1',
    user: {
      username: 'NFTAnalyst',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=NFTAnalyst',
      verified: true
    },
    content: 'Great analysis! I agree with the technical breakout pattern.',
    timestamp: new Date(Date.now() - 120000),
    likes: 5,
    isLiked: false
  },
  {
    id: 'comment-2',
    user: {
      username: 'CollectorPro',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=CollectorPro',
      verified: false
    },
    content: 'Mad Lads floor has been solid lately. Good pick!',
    timestamp: new Date(Date.now() - 240000),
    likes: 3,
    isLiked: true
  }
];

const tradingFeed = [
  {
    id: 'feed-1',
    trader: topTraders[0],
    action: 'buy' as const,
    nft: {
      id: 'nft-1',
      name: 'Mad Lads #1847',
      image: 'https://img-cdn.magiceden.dev/rs:fill:640:640:0:0/plain/https://madlist-assets.s3.us-west-2.amazonaws.com/madlads/1847.png',
      price: 32.5,
      collection: 'Mad Lads',
      rarity: 85,
      previousPrice: 28.9
    },
    timestamp: new Date(Date.now() - 300000), // 5 minutes ago
    likes: 23,
    comments: 8,
    shares: 5,
    bookmarks: 12,
    isLiked: false,
    isBookmarked: false,
    analysis: 'This Mad Lads NFT has strong fundamentals and the recent community update suggests price appreciation. Technical analysis shows a breakout pattern.',
    confidence: 87,
    tags: ['trending', 'blue-chip', 'community-strong'],
    profitLoss: 3.6,
    sentiment: 'bullish' as const,
    comments_data: mockComments
  },
  {
    id: 'feed-2',
    trader: topTraders[1],
    action: 'sell' as const,
    nft: {
      id: 'nft-2',
      name: 'DeGods #5829',
      image: 'https://img-cdn.magiceden.dev/rs:fill:640:640:0:0/plain/https://metadata.degods.com/g/5829-dead.png',
      price: 45.2,
      collection: 'DeGods',
      rarity: 72,
      previousPrice: 52.1
    },
    timestamp: new Date(Date.now() - 900000), // 15 minutes ago
    likes: 34,
    comments: 12,
    shares: 8,
    bookmarks: 18,
    isLiked: true,
    isBookmarked: true,
    analysis: 'Taking profits on this DeGods position after 40% gain. Market showing signs of short-term consolidation.',
    confidence: 92,
    tags: ['profit-taking', 'high-value', 'consolidation'],
    profitLoss: 12.8,
    sentiment: 'bearish' as const,
    comments_data: mockComments.slice(0, 1)
  },
  {
    id: 'feed-3',
    trader: topTraders[2],
    action: 'bid' as const,
    nft: {
      id: 'nft-3',
      name: 'y00ts #2456',
      image: 'https://img-cdn.magiceden.dev/rs:fill:640:640:0:0/plain/https://creator-hub-prod.s3.us-east-2.amazonaws.com/y00ts_pfp_2456_1665664706905.png',
      price: 28.7,
      collection: 'y00ts',
      rarity: 91,
      previousPrice: 31.2
    },
    timestamp: new Date(Date.now() - 600000), // 10 minutes ago
    likes: 18,
    comments: 6,
    shares: 3,
    bookmarks: 9,
    isLiked: false,
    isBookmarked: false,
    analysis: 'Strong trait combination with rare background. Market dip presents good entry opportunity.',
    confidence: 78,
    tags: ['rare-traits', 'dip-buy', 'value-play'],
    sentiment: 'bullish' as const,
    comments_data: []
  }
];

const challenges = [
  {
    id: 'challenge-1',
    title: 'Weekly Profit Challenge',
    description: 'Achieve 15% profit this week from NFT trading',
    reward: 5000,
    participants: 234,
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    progress: 67,
    type: 'trading' as const,
    joined: false
  },
  {
    id: 'challenge-2',
    title: 'Collection Master',
    description: 'Collect NFTs from 5 different blue-chip collections',
    reward: 3000,
    participants: 156,
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    progress: 40,
    type: 'collecting' as const,
    joined: true
  },
  {
    id: 'challenge-3',
    title: 'Community Builder',
    description: 'Refer 10 new users to the platform',
    reward: 2500,
    participants: 89,
    endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
    progress: 20,
    type: 'social' as const,
    joined: false
  }
];

export function setupSocialTradingRoutes(app: any) {
  // Get top traders
  app.get('/api/social/top-traders', async (req: Request, res: Response) => {
    try {
      res.json(topTraders);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get trading feed
  app.get('/api/social/trading-feed', async (req: Request, res: Response) => {
    try {
      res.json(tradingFeed);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get challenges
  app.get('/api/social/challenges', async (req: Request, res: Response) => {
    try {
      res.json(challenges);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Follow/unfollow trader
  app.post('/api/social/follow', async (req: Request, res: Response) => {
    try {
      const { userId, traderId } = req.body;
      // In production, save to database
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Copy trade
  app.post('/api/social/copy-trade', async (req: Request, res: Response) => {
    try {
      const { userId, tradeId } = req.body;
      // In production, execute the trade copy
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Like trade
  app.post('/api/social/like-trade', async (req: Request, res: Response) => {
    try {
      const { userId, feedId } = req.body;
      // In production, save like to database
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Join challenge
  app.post('/api/social/join-challenge', async (req: Request, res: Response) => {
    try {
      const { userId, challengeId } = req.body;
      // In production, add user to challenge
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Bookmark trade
  app.post('/api/social/bookmark-trade', async (req: Request, res: Response) => {
    try {
      const { userId, feedId } = req.body;
      // In production, save bookmark to database
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Share trade
  app.post('/api/social/share-trade', async (req: Request, res: Response) => {
    try {
      const { userId, feedId } = req.body;
      // In production, handle social sharing
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Post comment
  app.post('/api/social/post-comment', async (req: Request, res: Response) => {
    try {
      const { userId, feedId, content } = req.body;
      // In production, save comment to database
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get notifications
  app.get('/api/social/notifications/:userId', async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      // Mock notifications
      const notifications = [
        {
          id: 'notif-1',
          type: 'follow',
          message: 'CryptoMaster started following you',
          timestamp: new Date(Date.now() - 300000),
          read: false
        },
        {
          id: 'notif-2',
          type: 'copy_trade',
          message: 'Your trade was copied by 5 traders',
          timestamp: new Date(Date.now() - 600000),
          read: false
        }
      ];
      res.json(notifications);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
}
