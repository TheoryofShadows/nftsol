import { Router } from 'express';
import { getGamificationService } from '../services/gamification.service';
import logger from '../utils/logger';
import { authenticate as verifyAuth } from '../middlewares/auth';

const router = Router();

/**
 * POST /api/v1/gamification/init
 * Initialize user in gamification system
 */
router.post('/init', verifyAuth, (req, res) => {
  try {
    const userId = req.user?.id;
    const username = req.user?.username || userId;

    const gamificationService = getGamificationService();
    const userAchievements = gamificationService.initializeUser(userId, username);

    res.json({ userAchievements });
  } catch (error) {
    logger.error('Error initializing gamification:', error);
    res.status(500).json({ error: 'Failed to initialize gamification' });
  }
});

/**
 * GET /api/v1/gamification/achievements
 * Get all available achievements (public)
 */
router.get('/achievements', (req, res) => {
  try {
    const gamificationService = getGamificationService();
    const achievements = gamificationService.getAllAchievements();

    res.json({ data: achievements, total: achievements.length });
  } catch (error) {
    logger.error('Error fetching achievements:', error);
    res.status(500).json({ error: 'Failed to fetch achievements' });
  }
});

/**
 * GET /api/v1/gamification/achievements/:userId
 * Get achievements for a specific user
 */
router.get('/achievements/:userId', verifyAuth, (req, res) => {
  try {
    const { userId } = req.params;

    const gamificationService = getGamificationService();
    const achievements = gamificationService.getAchievements(userId);

    res.json({ success: true, data: achievements });
  } catch (error) {
    logger.error('Error fetching user achievements:', error);
    res.status(500).json({ error: 'Failed to fetch achievements' });
  }
});

/**
 * GET /api/v1/gamification/user-achievements
 * Get authenticated user's achievements and stats
 */
router.get('/user-achievements', verifyAuth, (req, res) => {
  try {
    const userId = req.user?.id;

    const gamificationService = getGamificationService();
    const userAchievements = gamificationService.getUserAchievements(userId);

    if (!userAchievements) {
      return res.json({ message: 'User not yet initialized. Complete your first action to get started!' });
    }

    res.json({
      userId,
      achievements: userAchievements.achievements,
      totalPoints: userAchievements.totalPoints,
      level: userAchievements.level,
      levelProgress: userAchievements.levelProgress,
      streak: userAchievements.streak,
      nextLevelPoints: (userAchievements.level + 1) * 100,
    });
  } catch (error) {
    logger.error('Error fetching user achievements:', error);
    res.status(500).json({ error: 'Failed to fetch user achievements' });
  }
});

/**
 * POST /api/v1/gamification/track-activity
 * Track user activity and check for achievement unlocks
 */
router.post('/track-activity', verifyAuth, (req, res) => {
  try {
    const userId = req.user?.id;
    const { action, stats } = req.body;

    if (!action || !stats) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const gamificationService = getGamificationService();

    gamificationService.updateStreak(userId);

    const pointsMap: Record<string, number> = {
      nft_viewed: 1,
      nft_favorited: 5,
      nft_purchased: 20,
      nft_minted: 25,
      offer_made: 10,
      collection_followed: 5,
      user_followed: 10,
      trade_completed: 15,
    };

    const points = pointsMap[action] || 0;
    if (points > 0) {
      gamificationService.addPoints(userId, points, action);
    }

    gamificationService.checkAndUnlockMilestones(userId, stats);

    const userAchievements = gamificationService.getUserAchievements(userId);

    res.json({
      success: true,
      pointsAdded: points,
      userAchievements,
    });
  } catch (error) {
    logger.error('Error tracking activity:', error);
    res.status(500).json({ error: 'Failed to track activity' });
  }
});

/**
 * GET /api/v1/gamification/leaderboard
 * Get global leaderboard (requires auth)
 */
router.get('/leaderboard', verifyAuth, (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const gamificationService = getGamificationService();
    const leaderboard = gamificationService.getLeaderboard(
      parseInt(limit as string),
      parseInt(offset as string)
    );

    res.json({
      data: leaderboard,
      total: leaderboard.length,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });
  } catch (error) {
    logger.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

/**
 * GET /api/v1/gamification/profile/:userId
 * Get a user's gamification profile
 */
router.get('/profile/:userId', verifyAuth, (req, res) => {
  try {
    const { userId } = req.params;

    const gamificationService = getGamificationService();
    const profile = gamificationService.getUserProfile(userId);

    if (!profile) {
      return res.status(404).json({ success: false, error: 'Profile not found' });
    }

    res.json({ success: true, data: profile });
  } catch (error) {
    logger.error('Error fetching gamification profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

/**
 * GET /api/v1/gamification/user-rank
 * Get user's rank on leaderboard
 */
router.get('/user-rank', verifyAuth, (req, res) => {
  try {
    const userId = req.user?.id;

    const gamificationService = getGamificationService();
    const rank = gamificationService.getUserRank(userId);

    if (rank < 0) {
      return res.json({ rank: null, message: 'User not yet ranked' });
    }

    res.json({ userId, rank });
  } catch (error) {
    logger.error('Error fetching user rank:', error);
    res.status(500).json({ error: 'Failed to fetch user rank' });
  }
});

/**
 * GET /api/v1/gamification/leaderboard/friends
 * Get leaderboard for users who have interacted with the requesting user
 */
router.get('/leaderboard/friends', verifyAuth, (req, res) => {
  try {
    const userId = req.user?.id;
    const { limit = 20 } = req.query;
    const parsedLimit = Math.min(parseInt(limit as string) || 20, 100);

    const gamificationService = getGamificationService();

    const globalBoard = gamificationService.getLeaderboard(parsedLimit, 0);

    // Exclude the requesting user from the friends leaderboard
    const friendsBoard = globalBoard.filter((entry) => entry.userId !== userId);

    res.json({
      data: friendsBoard,
      total: friendsBoard.length,
      note: 'Showing top community members. Follow creators to personalise this list.',
    });
  } catch (error) {
    logger.error('Error fetching friends leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch friends leaderboard' });
  }
});

/**
 * POST /api/v1/gamification/daily-login
 * Record daily login for streak
 */
router.post('/daily-login', verifyAuth, (req, res) => {
  try {
    const userId = req.user?.id;

    const gamificationService = getGamificationService();
    gamificationService.updateStreak(userId);
    gamificationService.addPoints(userId, 10, 'daily_login');

    const userAchievements = gamificationService.getUserAchievements(userId);

    res.json({
      success: true,
      message: 'Daily login recorded!',
      pointsAdded: 10,
      streak: userAchievements?.streak || 0,
    });
  } catch (error) {
    logger.error('Error recording daily login:', error);
    res.status(500).json({ error: 'Failed to record daily login' });
  }
});

export default router;
