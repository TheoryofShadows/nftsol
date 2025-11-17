import { Router } from 'express';
import { getRecommendationService } from '../services/recommendation.service';
import logger from '../utils/logger';
import { authenticate as verifyAuth } from '../middlewares/auth';

const router = Router();

/**
 * GET /api/v1/recommendations/personalized
 * Get personalized recommendations for authenticated user
 */
router.get('/personalized', verifyAuth, (req, res) => {
  try {
    const userId = req.user?.id;
    const { limit = 10 } = req.query;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const recommendationService = getRecommendationService();
    const recommendations = recommendationService.getRecommendations(userId, parseInt(limit as string));

    // Add explanations for transparency
    const withExplanations = recommendations.map(rec => ({
      ...rec,
      explanation: recommendationService.getRecommendationExplanation(userId, rec.mint),
    }));

    res.json({
      data: withExplanations,
      userId,
      total: withExplanations.length,
    });
  } catch (error) {
    logger.error('Error fetching personalized recommendations:', error);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

/**
 * GET /api/v1/recommendations/trending
 * Get trending NFT recommendations
 */
router.get('/trending', (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const recommendationService = getRecommendationService();
    const recommendations = recommendationService.getTrendingRecommendations(parseInt(limit as string));

    res.json({
      data: recommendations,
      type: 'trending',
      total: recommendations.length,
    });
  } catch (error) {
    logger.error('Error fetching trending recommendations:', error);
    res.status(500).json({ error: 'Failed to fetch trending recommendations' });
  }
});

/**
 * GET /api/v1/recommendations/rarity
 * Get rarity-based recommendations
 */
router.get('/rarity', verifyAuth, (req, res) => {
  try {
    const userId = req.user?.id;
    const { limit = 10 } = req.query;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const recommendationService = getRecommendationService();
    const recommendations = recommendationService.getRarityBasedRecommendations(userId, parseInt(limit as string));

    res.json({
      data: recommendations,
      type: 'rarity',
      total: recommendations.length,
    });
  } catch (error) {
    logger.error('Error fetching rarity recommendations:', error);
    res.status(500).json({ error: 'Failed to fetch rarity recommendations' });
  }
});

/**
 * POST /api/v1/recommendations/track
 * Track user interaction for ML model
 */
router.post('/track', verifyAuth, (req, res) => {
  try {
    const userId = req.user?.id;
    const { action, nftMint, duration } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!['view', 'favorite', 'purchase', 'offer'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }

    const recommendationService = getRecommendationService();
    recommendationService.updateUserProfile(userId, action, nftMint, duration);

    res.json({ success: true, message: 'Interaction tracked' });
  } catch (error) {
    logger.error('Error tracking interaction:', error);
    res.status(500).json({ error: 'Failed to track interaction' });
  }
});

/**
 * GET /api/v1/recommendations/user-profile
 * Get user's profile for debugging/transparency
 */
router.get('/user-profile', verifyAuth, (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const recommendationService = getRecommendationService();
    const profile = recommendationService.getUserProfile(userId);

    if (!profile) {
      return res.json({ message: 'No profile found yet. Start interacting with NFTs!' });
    }

    res.json({
      userId,
      viewedCount: profile.viewedNFTs.length,
      purchasedCount: profile.purchasedNFTs.length,
      favoriteCount: profile.favoriteNFTs.length,
      followedCollectionsCount: profile.followedCollections.length,
      totalInteractions: profile.interactionHistory.length,
      recentInteractions: profile.interactionHistory.slice(-20).reverse(),
    });
  } catch (error) {
    logger.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

/**
 * GET /api/v1/recommendations/explanation/:nftMint
 * Get explanation for why an NFT is recommended
 */
router.get('/explanation/:nftMint', verifyAuth, (req, res) => {
  try {
    const userId = req.user?.id;
    const { nftMint } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const recommendationService = getRecommendationService();
    const explanation = recommendationService.getRecommendationExplanation(userId, nftMint);

    res.json({
      nftMint,
      explanation,
      transparency: 'We use machine learning to personalize your experience. Learn more about our recommendation algorithm.',
    });
  } catch (error) {
    logger.error('Error getting explanation:', error);
    res.status(500).json({ error: 'Failed to get explanation' });
  }
});

export default router;
