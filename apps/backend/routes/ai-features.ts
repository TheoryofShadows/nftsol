import { Router } from "express";
import { aiFeaturesService } from "../ai-features-service";

const router = Router();

/**
 * Health check for AI features service
 */
router.get('/health', async (req, res) => {
  try {
    const isHealthy = await aiFeaturesService.healthCheck();
    res.json({
      status: isHealthy ? 'healthy' : 'unavailable',
      service: 'AI Features Service',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Enhance NFT descriptions with AI-powered copywriting
 */
router.post('/enhance-description', async (req, res) => {
  try {
    const { title, description, category, attributes } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({ 
        error: 'Title, description, and category are required' 
      });
    }

    const enhancement = await aiFeaturesService.enhanceDescription(
      title,
      description,
      category,
      attributes
    );

    res.json({
      success: true,
      enhancement,
      processedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Description enhancement error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Enhancement failed'
    });
  }
});

/**
 * AI-powered pricing analysis and recommendations
 */
router.post('/analyze-pricing', async (req, res) => {
  try {
    const { title, description, category, attributes, marketData } = req.body;

    if (!title || !description || !category || !attributes) {
      return res.status(400).json({ 
        error: 'Title, description, category, and attributes are required' 
      });
    }

    const analysis = await aiFeaturesService.analyzePricing(
      title,
      description,
      category,
      attributes,
      marketData
    );

    res.json({
      success: true,
      analysis,
      processedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Pricing analysis error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Analysis failed'
    });
  }
});

/**
 * Generate collection insights and marketing strategies
 */
router.post('/collection-insights', async (req, res) => {
  try {
    const { collectionName, collectionDescription, nftTitles, categories } = req.body;

    if (!collectionName || !collectionDescription) {
      return res.status(400).json({ 
        error: 'Collection name and description are required' 
      });
    }

    const insights = await aiFeaturesService.generateCollectionInsights(
      collectionName,
      collectionDescription,
      nftTitles || [],
      categories || []
    );

    res.json({
      success: true,
      insights,
      processedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Collection insights error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Insights generation failed'
    });
  }
});

/**
 * AI chatbot for marketplace support
 */
router.post('/chatbot', async (req, res) => {
  try {
    const { message, context } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Message is required' 
      });
    }

    const defaultContext = {
      userType: 'new_user',
      ...context
    };

    const response = await aiFeaturesService.processChatbotQuery(
      message.trim(),
      defaultContext
    );

    res.json({
      success: true,
      response,
      processedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Chatbot processing error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Chatbot processing failed'
    });
  }
});

/**
 * Generate social media content and hashtags
 */
router.post('/social-content', async (req, res) => {
  try {
    const { nftTitle, category, platform } = req.body;

    if (!nftTitle || !category) {
      return res.status(400).json({ 
        error: 'NFT title and category are required' 
      });
    }

    const validPlatforms = ['twitter', 'instagram', 'discord', 'all'];
    const targetPlatform = validPlatforms.includes(platform) ? platform : 'all';

    const content = await aiFeaturesService.generateSocialContent(
      nftTitle,
      category,
      targetPlatform as any
    );

    res.json({
      success: true,
      content,
      processedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Social content generation error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Content generation failed'
    });
  }
});

/**
 * Batch process multiple NFTs for insights
 */
router.post('/batch-analyze', async (req, res) => {
  try {
    const { nfts } = req.body;

    if (!Array.isArray(nfts) || nfts.length === 0) {
      return res.status(400).json({ 
        error: 'Array of NFTs is required' 
      });
    }

    if (nfts.length > 10) {
      return res.status(400).json({ 
        error: 'Maximum 10 NFTs can be processed at once' 
      });
    }

    const results = await Promise.allSettled(
      nfts.map(async (nft, index) => {
        if (!nft.title || !nft.description || !nft.category) {
          throw new Error(`NFT at index ${index} missing required fields`);
        }

        const [enhancement, pricing] = await Promise.all([
          aiFeaturesService.enhanceDescription(
            nft.title,
            nft.description,
            nft.category,
            nft.attributes
          ),
          aiFeaturesService.analyzePricing(
            nft.title,
            nft.description,
            nft.category,
            nft.attributes || [],
            nft.marketData
          )
        ]);

        return {
          nftId: nft.id || index,
          enhancement,
          pricing
        };
      })
    );

    const successful = results
      .filter(result => result.status === 'fulfilled')
      .map(result => (result as PromiseFulfilledResult<any>).value);

    const failed = results
      .map((result, index) => ({ result, index }))
      .filter(({ result }) => result.status === 'rejected')
      .map(({ result, index }) => ({
        nftId: nfts[index].id || index,
        error: (result as PromiseRejectedResult).reason.message
      }));

    res.json({
      success: true,
      processed: successful.length,
      failed: failed.length,
      results: successful,
      errors: failed,
      processedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Batch analysis error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Batch analysis failed'
    });
  }
});

export default router;