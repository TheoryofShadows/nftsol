/**
 * AI Features Routes
 * Consolidated from legacy server/routes/ai-features.ts
 * Provides NFT description enhancement, pricing recommendations,
 * and collection name suggestions using xAI Grok / Cloudflare AI fallback.
 */

import { Router, Request, Response } from 'express';
import axios from 'axios';
import { sensitiveOpLimiter, standardLimiter } from '../middleware/rate-limiting';
import logger from '../utils/logger';

const router = Router();

interface AIEnhancementResult {
  enhanced: string;
  keywords: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  suggestions: string[];
}

/**
 * Call xAI Grok API or fall back to Cloudflare AI
 */
async function callAI(systemPrompt: string, userPrompt: string): Promise<string> {
  const xaiKey = process.env.XAI_API_KEY;

  if (xaiKey) {
    try {
      const res = await axios.post(
        'https://api.x.ai/v1/chat/completions',
        {
          model: 'grok-4-latest',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: 500,
          temperature: 0.7,
        },
        {
          headers: { Authorization: `Bearer ${xaiKey}`, 'Content-Type': 'application/json' },
          timeout: 20000,
        }
      );
      return res.data.choices[0]?.message?.content || '';
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.warn(`xAI API failed, falling back to Cloudflare AI: ${msg}`);
    }
  }

  // Cloudflare AI fallback
  const cfAccountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const cfToken = process.env.CLOUDFLARE_AI_TOKEN;

  if (cfAccountId && cfToken) {
    try {
      const res = await axios.post(
        `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/ai/run/@cf/meta/llama-3-8b-instruct`,
        { messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }] },
        { headers: { Authorization: `Bearer ${cfToken}`, 'Content-Type': 'application/json' }, timeout: 15000 }
      );
      return res.data?.result?.response || '';
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.warn(`Cloudflare AI failed: ${msg}`);
    }
  }

  return '';
}

/**
 * GET /api/ai-features/health
 * Health check for AI features service
 */
router.get('/health', standardLimiter, async (_req: Request, res: Response) => {
  const xaiConfigured = !!process.env.XAI_API_KEY;
  const cloudflareConfigured = !!(process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_AI_TOKEN);

  res.json({
    success: true,
    data: {
      status: xaiConfigured || cloudflareConfigured ? 'healthy' : 'unavailable',
      providers: {
        xai: xaiConfigured ? 'configured' : 'not configured',
        cloudflare: cloudflareConfigured ? 'configured' : 'not configured',
      },
      timestamp: new Date().toISOString(),
    },
  });
});

/**
 * POST /api/ai-features/enhance-description
 * Enhance NFT description using AI
 */
router.post('/enhance-description', sensitiveOpLimiter, async (req: Request, res: Response) => {
  try {
    const { title, description, category, attributes } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({
        success: false,
        error: 'title, description, and category are required',
        code: 'MISSING_FIELDS',
      });
    }

    const systemPrompt = `You are an expert NFT copywriter. Enhance NFT descriptions to be compelling, authentic, and SEO-optimised. Return ONLY valid JSON: {"enhanced":"...","keywords":[],"sentiment":"positive","suggestions":[]}`;
    const userPrompt = `NFT Title: ${title}\nCategory: ${category}\nAttributes: ${JSON.stringify(attributes || [])}\nOriginal Description: ${description}`;

    const aiResponse = await callAI(systemPrompt, userPrompt);

    let result: AIEnhancementResult;
    try {
      result = JSON.parse(aiResponse);
    } catch {
      // Fallback: return capitalised and cleaned version
      result = {
        enhanced: description.trim().replace(/\s+/g, ' '),
        keywords: title.toLowerCase().split(' ').filter((w: string) => w.length > 3),
        sentiment: 'positive',
        suggestions: ['Add rarity information', 'Include creator story', 'Mention unique attributes'],
      };
    }

    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('AI description enhancement failed:', error);
    res.status(500).json({ success: false, error: 'Failed to enhance description' });
  }
});

/**
 * POST /api/ai-features/generate-pricing
 * Generate pricing recommendations for an NFT
 */
router.post('/generate-pricing', standardLimiter, async (req: Request, res: Response) => {
  try {
    const { name, category, rarity, attributes, floorPrice } = req.body;

    if (!name || !category) {
      return res.status(400).json({
        success: false,
        error: 'name and category are required',
        code: 'MISSING_FIELDS',
      });
    }

    const systemPrompt = `You are an expert NFT market analyst on Solana. Provide pricing recommendations in SOL. Return ONLY valid JSON: {"suggestedPrice":0.5,"priceRange":{"min":0.3,"max":0.8},"reasoning":"...","marketFactors":[]}`;
    const userPrompt = `NFT: ${name}\nCategory: ${category}\nRarity: ${rarity || 'common'}\nAttributes: ${JSON.stringify(attributes || [])}\nCollection floor: ${floorPrice || 'unknown'} SOL`;

    const aiResponse = await callAI(systemPrompt, userPrompt);

    let result;
    try {
      result = JSON.parse(aiResponse);
    } catch {
      const basePrice = floorPrice ? parseFloat(floorPrice) * 1.1 : 0.1;
      result = {
        suggestedPrice: basePrice,
        priceRange: { min: basePrice * 0.8, max: basePrice * 1.5 },
        reasoning: 'Based on collection floor price and market conditions',
        marketFactors: ['Collection floor price', 'Rarity tier', 'Market trend'],
      };
    }

    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('AI pricing generation failed:', error);
    res.status(500).json({ success: false, error: 'Failed to generate pricing' });
  }
});

/**
 * POST /api/ai-features/suggest-collection-name
 * Suggest collection names using AI
 */
router.post('/suggest-collection-name', standardLimiter, async (req: Request, res: Response) => {
  try {
    const { theme, style, targetAudience } = req.body;

    if (!theme) {
      return res.status(400).json({
        success: false,
        error: 'theme is required',
        code: 'MISSING_FIELDS',
      });
    }

    const systemPrompt = `You are a creative NFT brand strategist. Generate memorable, unique NFT collection names. Return ONLY valid JSON: {"names":["Name One","Name Two","Name Three"],"explanations":{"Name One":"why"}}`;
    const userPrompt = `Theme: ${theme}\nStyle: ${style || 'modern'}\nTarget audience: ${targetAudience || 'general NFT collectors'}`;

    const aiResponse = await callAI(systemPrompt, userPrompt);

    let result;
    try {
      result = JSON.parse(aiResponse);
    } catch {
      const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
      result = {
        names: [
          `${capitalize(theme)} Genesis`,
          `${capitalize(theme)} Collective`,
          `${capitalize(theme)} Origins`,
        ],
        explanations: {},
      };
    }

    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('AI collection name suggestion failed:', error);
    res.status(500).json({ success: false, error: 'Failed to suggest collection names' });
  }
});

export default router;
