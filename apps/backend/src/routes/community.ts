import { Router } from 'express';
import { getCommunityService } from '../services/community.service';
import logger from '../utils/logger';
import { authenticate as verifyAuth } from '../middlewares/auth';

const router = Router();

/**
 * GET /api/v1/community/profile/:userId
 * Get user's community profile
 */
router.get('/profile/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const communityService = getCommunityService();
    const profile = communityService.getProfile(userId);

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json({ profile });
  } catch (error) {
    logger.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

/**
 * PATCH /api/v1/community/profile
 * Update user's profile
 */
router.patch('/profile', verifyAuth, (req, res) => {
  try {
    const userId = req.user?.id;
    const communityService = getCommunityService();
    const profile = communityService.updateProfile(userId, req.body);

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json({ profile });
  } catch (error) {
    logger.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

/**
 * POST /api/v1/community/follow/:userId
 * Follow a user
 */
router.post('/follow/:userId', verifyAuth, (req, res) => {
  try {
    const followerId = req.user?.id;
    const { userId: followeeId } = req.params;

    const communityService = getCommunityService();
    const success = communityService.followUser(followerId, followeeId);

    if (!success) {
      return res.status(400).json({ error: 'Cannot follow user' });
    }

    res.json({ success: true, message: 'User followed' });
  } catch (error) {
    logger.error('Error following user:', error);
    res.status(500).json({ error: 'Failed to follow user' });
  }
});

/**
 * POST /api/v1/community/unfollow/:userId
 * Unfollow a user
 */
router.post('/unfollow/:userId', verifyAuth, (req, res) => {
  try {
    const followerId = req.user?.id;
    const { userId: followeeId } = req.params;

    const communityService = getCommunityService();
    const success = communityService.unfollowUser(followerId, followeeId);

    if (!success) {
      return res.status(400).json({ error: 'Not following this user' });
    }

    res.json({ success: true, message: 'User unfollowed' });
  } catch (error) {
    logger.error('Error unfollowing user:', error);
    res.status(500).json({ error: 'Failed to unfollow user' });
  }
});

/**
 * GET /api/v1/community/followers/:userId
 * Get user's followers
 */
router.get('/followers/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const communityService = getCommunityService();
    const followers = communityService.getFollowers(userId);

    res.json({ followers, total: followers.length });
  } catch (error) {
    logger.error('Error fetching followers:', error);
    res.status(500).json({ error: 'Failed to fetch followers' });
  }
});

/**
 * GET /api/v1/community/following/:userId
 * Get users that a user is following
 */
router.get('/following/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const communityService = getCommunityService();
    const following = communityService.getFollowing(userId);

    res.json({ following, total: following.length });
  } catch (error) {
    logger.error('Error fetching following:', error);
    res.status(500).json({ error: 'Failed to fetch following' });
  }
});

/**
 * POST /api/v1/community/block/:userId
 * Block a user
 */
router.post('/block/:userId', verifyAuth, (req, res) => {
  try {
    const userId = req.user?.id;
    const { userId: blockedId } = req.params;

    const communityService = getCommunityService();
    const success = communityService.blockUser(userId, blockedId);

    if (!success) {
      return res.status(400).json({ error: 'Cannot block user' });
    }

    res.json({ success: true, message: 'User blocked' });
  } catch (error) {
    logger.error('Error blocking user:', error);
    res.status(500).json({ error: 'Failed to block user' });
  }
});

/**
 * POST /api/v1/community/collections
 * Create a collection
 */
router.post('/collections', verifyAuth, (req, res) => {
  try {
    const userId = req.user?.id;
    const { name, description, isPrivate = false } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Collection name required' });
    }

    const communityService = getCommunityService();
    const collection = communityService.createCollection(userId, name, description, isPrivate);

    res.json({ collection });
  } catch (error) {
    logger.error('Error creating collection:', error);
    res.status(500).json({ error: 'Failed to create collection' });
  }
});

/**
 * POST /api/v1/community/collections/:collectionId/add-nft
 * Add NFT to collection
 */
router.post('/collections/:collectionId/add-nft', verifyAuth, (req, res) => {
  try {
    const { collectionId } = req.params;
    const { nftMint } = req.body;

    if (!nftMint) {
      return res.status(400).json({ error: 'NFT mint required' });
    }

    const communityService = getCommunityService();
    const success = communityService.addToCollection(collectionId, nftMint);

    if (!success) {
      return res.status(400).json({ error: 'Failed to add to collection' });
    }

    res.json({ success: true });
  } catch (error) {
    logger.error('Error adding to collection:', error);
    res.status(500).json({ error: 'Failed to add to collection' });
  }
});

/**
 * GET /api/v1/community/collections/:userId
 * Get user's collections
 */
router.get('/collections/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const communityService = getCommunityService();
    const collections = communityService.getUserCollections(userId);

    res.json({ collections, total: collections.length });
  } catch (error) {
    logger.error('Error fetching collections:', error);
    res.status(500).json({ error: 'Failed to fetch collections' });
  }
});

/**
 * GET /api/v1/community/collections/trending
 * Get trending collections
 */
router.get('/trending-collections', (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const communityService = getCommunityService();
    const collections = communityService.getTrendingCollections(parseInt(limit as string));

    res.json({ collections, total: collections.length });
  } catch (error) {
    logger.error('Error fetching trending collections:', error);
    res.status(500).json({ error: 'Failed to fetch trending collections' });
  }
});

/**
 * POST /api/v1/community/curated-lists
 * Create a curated list
 */
router.post('/curated-lists', verifyAuth, (req, res) => {
  try {
    const userId = req.user?.id;
    const { title, description, category, nfts, isPublic = true } = req.body;

    if (!title || !category || !nfts) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const communityService = getCommunityService();
    const list = communityService.createCuratedList(userId, title, description, category, nfts, isPublic);

    res.json({ list });
  } catch (error) {
    logger.error('Error creating curated list:', error);
    res.status(500).json({ error: 'Failed to create curated list' });
  }
});

/**
 * GET /api/v1/community/curated-lists/trending
 * Get trending curated lists
 */
router.get('/curated-lists/trending', (req, res) => {
  try {
    const { limit = 10, category } = req.query;
    const communityService = getCommunityService();
    const lists = communityService.getTrendingLists(
      parseInt(limit as string),
      category as string
    );

    res.json({ lists, total: lists.length });
  } catch (error) {
    logger.error('Error fetching trending lists:', error);
    res.status(500).json({ error: 'Failed to fetch trending lists' });
  }
});

/**
 * POST /api/v1/community/curated-lists/:listId/upvote
 * Upvote a curated list
 */
router.post('/curated-lists/:listId/upvote', verifyAuth, (req, res) => {
  try {
    const userId = req.user?.id;
    const { listId } = req.params;

    const communityService = getCommunityService();
    const success = communityService.upvoteList(listId, userId);

    if (!success) {
      return res.status(400).json({ error: 'Cannot upvote list' });
    }

    res.json({ success: true });
  } catch (error) {
    logger.error('Error upvoting list:', error);
    res.status(500).json({ error: 'Failed to upvote list' });
  }
});

/**
 * GET /api/v1/community/feed
 * Get user's social feed
 */
router.get('/feed', verifyAuth, (req, res) => {
  try {
    const userId = req.user?.id;
    const { limit = 50 } = req.query;

    const communityService = getCommunityService();
    const feed = communityService.getSocialFeed(userId, parseInt(limit as string));

    res.json({ feed, total: feed.length });
  } catch (error) {
    logger.error('Error fetching feed:', error);
    res.status(500).json({ error: 'Failed to fetch feed' });
  }
});

/**
 * POST /api/v1/community/messages/:userId
 * Send direct message
 */
router.post('/messages/:userId', verifyAuth, (req, res) => {
  try {
    const from = req.user?.id;
    const { userId: to } = req.params;
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Message text required' });
    }

    const communityService = getCommunityService();
    const success = communityService.sendMessage(from, to, text);

    if (!success) {
      return res.status(400).json({ error: 'Cannot send message' });
    }

    res.json({ success: true });
  } catch (error) {
    logger.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

/**
 * GET /api/v1/community/messages
 * Get user's messages
 */
router.get('/messages', verifyAuth, (req, res) => {
  try {
    const userId = req.user?.id;
    const { limit = 50 } = req.query;

    const communityService = getCommunityService();
    const messages = communityService.getMessages(userId, parseInt(limit as string));

    res.json({ messages, total: messages.length });
  } catch (error) {
    logger.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

/**
 * GET /api/v1/community/suggest-users
 * Get suggested users to follow
 */
router.get('/suggest-users', verifyAuth, (req, res) => {
  try {
    const userId = req.user?.id;
    const { limit = 10 } = req.query;

    const communityService = getCommunityService();
    const suggestions = communityService.suggestUsers(userId, parseInt(limit as string));

    res.json({ suggestions, total: suggestions.length });
  } catch (error) {
    logger.error('Error fetching suggestions:', error);
    res.status(500).json({ error: 'Failed to fetch suggestions' });
  }
});

/**
 * GET /api/v1/community/stats/:userId
 * Get user's community stats
 */
router.get('/stats/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const communityService = getCommunityService();
    const stats = communityService.getUserStats(userId);

    res.json(stats);
  } catch (error) {
    logger.error('Error fetching user stats:', error);
    res.status(500).json({ error: 'Failed to fetch user stats' });
  }
});

export default router;
