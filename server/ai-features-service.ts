import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

export interface AIDescriptionResult {
  enhancedDescription: string;
  seoKeywords: string[];
  marketingCopy: string;
  socialMediaCaptions: {
    twitter: string;
    instagram: string;
    discord: string;
  };
  confidence: number;
}

export interface AIPricingAnalysis {
  suggestedPrice: number;
  priceRange: { min: number; max: number };
  reasoning: string;
  marketFactors: string[];
  competitorAnalysis: string;
  confidence: number;
}

export interface AICollectionInsights {
  collectionTheme: string;
  targetAudience: string;
  marketingStrategy: string[];
  brandingTips: string[];
  crossPromotionIdeas: string[];
  confidence: number;
}

export interface AIChatbotResponse {
  response: string;
  intent: string;
  suggestedActions: string[];
  helpfulResources: string[];
}

// OpenAI quota tracker
export const openaiCallTracker = {
  count: 0,
  resetTime: Date.now() + (60 * 1000), // Reset every minute
  dailyCount: 0,
  dailyResetTime: Date.now() + (24 * 60 * 60 * 1000)
};

// Conservative OpenAI limits (adjust based on your plan)
export const OPENAI_LIMITS = {
  perMinute: 3, // Very conservative for free tier
  perDay: 100   // Adjust based on your quota
};

function checkOpenAIQuota(): boolean {
  const now = Date.now();
  
  // Reset minute counter
  if (now > openaiCallTracker.resetTime) {
    openaiCallTracker.count = 0;
    openaiCallTracker.resetTime = now + (60 * 1000);
  }
  
  // Reset daily counter
  if (now > openaiCallTracker.dailyResetTime) {
    openaiCallTracker.dailyCount = 0;
    openaiCallTracker.dailyResetTime = now + (24 * 60 * 60 * 1000);
  }
  
  // Check limits
  if (openaiCallTracker.count >= OPENAI_LIMITS.perMinute || 
      openaiCallTracker.dailyCount >= OPENAI_LIMITS.perDay) {
    return false;
  }
  
  openaiCallTracker.count++;
  openaiCallTracker.dailyCount++;
  return true;
}

export class AIFeaturesService {
  /**
   * Enhance NFT descriptions with AI-powered copywriting
   */
  async enhanceDescription(
    title: string,
    description: string,
    category: string,
    attributes?: Array<{ trait_type: string; value: string }>
  ): Promise<AIDescriptionResult> {
    try {
      // Check OpenAI quota before making request
      if (!checkOpenAIQuota()) {
        throw new Error('OpenAI quota exceeded. Please try again later.');
      }

      const systemPrompt = `You are an expert NFT copywriter and digital marketing specialist. Your goal is to create compelling, market-ready descriptions that drive sales and engagement.`;

      const attributesText = attributes 
        ? attributes.map(attr => `${attr.trait_type}: ${attr.value}`).join(', ')
        : '';

      const userPrompt = `Enhance this NFT listing for maximum market appeal:

      Title: "${title}"
      Current Description: "${description}"
      Category: ${category}
      ${attributesText ? `Attributes: ${attributesText}` : ''}

      Create:
      1. An enhanced description (100-200 words) that's compelling and professional
      2. SEO keywords for discoverability
      3. Marketing copy for listings (50 words)
      4. Social media captions for Twitter, Instagram, and Discord
      5. Your confidence level (0-1)

      Focus on:
      - Emotional appeal and storytelling
      - Scarcity and uniqueness
      - Utility and benefits
      - Community and culture fit
      - Investment potential (where appropriate)

      Format as JSON:
      {
        "enhancedDescription": "string",
        "seoKeywords": ["keyword1", "keyword2"],
        "marketingCopy": "string",
        "socialMediaCaptions": {
          "twitter": "string",
          "instagram": "string", 
          "discord": "string"
        },
        "confidence": number
      }`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1000,
        temperature: 0.7
      });

      return JSON.parse(response.choices[0].message.content!);

    } catch (error) {
      console.error('AI description enhancement failed:', error);
      
      // Provide fallback when AI is unavailable
      if (error instanceof Error && error.message.includes('quota')) {
        return {
          enhancedDescription: `${description}\n\nThis unique NFT in the ${category} category offers exceptional value and artistic merit. Join our community of collectors and discover the potential of this remarkable digital asset.`,
          seoKeywords: [category.toLowerCase(), 'nft', 'solana', 'digital art', 'collectible'],
          marketingCopy: `Discover this exceptional ${category} NFT - ${title}. Limited availability on Solana blockchain.`,
          socialMediaCaptions: {
            twitter: `🎨 New ${category} NFT: ${title} \n#NFT #Solana #DigitalArt`,
            instagram: `✨ ${title} ✨\nNew ${category} NFT now available!\n#NFT #Solana #Art`,
            discord: `🚀 Check out this amazing ${category} NFT: ${title}! Available now on our marketplace.`
          },
          confidence: 0.6
        };
      }
      
      throw new Error(`Failed to enhance description: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * AI-powered pricing analysis and recommendations
   */
  async analyzePricing(
    title: string,
    description: string,
    category: string,
    attributes: Array<{ trait_type: string; value: string }>,
    marketData?: { recentSales: number[]; floorPrice: number; volume: number }
  ): Promise<AIPricingAnalysis> {
    try {
      // Check OpenAI quota
      if (!checkOpenAIQuota()) {
        // Provide basic pricing fallback
        return {
          suggestedPrice: 0.5,
          priceRange: { min: 0.1, max: 2.0 },
          reasoning: `Basic pricing suggestion based on ${category} category. Consider market conditions and rarity.`,
          marketFactors: ['Category popularity', 'Attribute rarity', 'Current market trends'],
          competitorAnalysis: 'AI pricing analysis temporarily unavailable. Manual research recommended.',
          confidence: 0.5
        };
      }

      const systemPrompt = `You are an expert NFT market analyst with deep knowledge of pricing strategies, market trends, and valuation methods for digital assets.`;

      const marketDataText = marketData 
        ? `Recent sales: ${marketData.recentSales.join(', ')} SOL, Floor price: ${marketData.floorPrice} SOL, Volume: ${marketData.volume} SOL`
        : 'No market data available';

      const userPrompt = `Analyze pricing for this NFT:

      Title: "${title}"
      Description: "${description}"
      Category: ${category}
      Attributes: ${attributes.map(attr => `${attr.trait_type}: ${attr.value}`).join(', ')}
      Market Data: ${marketDataText}

      Provide:
      1. Suggested price in SOL
      2. Price range (min/max)
      3. Detailed reasoning
      4. Key market factors affecting price
      5. Competitor analysis insights
      6. Confidence level (0-1)

      Consider:
      - Rarity and uniqueness of attributes
      - Category market trends
      - Art quality and appeal
      - Utility and functionality
      - Creator reputation factors
      - Current market conditions

      Format as JSON:
      {
        "suggestedPrice": number,
        "priceRange": {"min": number, "max": number},
        "reasoning": "string",
        "marketFactors": ["factor1", "factor2"],
        "competitorAnalysis": "string",
        "confidence": number
      }`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        max_tokens: 800,
        temperature: 0.6
      });

      return JSON.parse(response.choices[0].message.content!);

    } catch (error) {
      console.error('AI pricing analysis failed:', error);
      throw new Error(`Failed to analyze pricing: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate collection insights and marketing strategies
   */
  async generateCollectionInsights(
    collectionName: string,
    collectionDescription: string,
    nftTitles: string[],
    categories: string[]
  ): Promise<AICollectionInsights> {
    try {
      const systemPrompt = `You are a strategic NFT collection advisor and marketing expert specializing in building successful digital asset brands and communities.`;

      const userPrompt = `Analyze this NFT collection and provide strategic insights:

      Collection: "${collectionName}"
      Description: "${collectionDescription}"
      NFT Titles: ${nftTitles.slice(0, 10).join(', ')}
      Categories: ${categories.join(', ')}

      Provide strategic insights:
      1. Collection theme and positioning
      2. Target audience analysis
      3. Marketing strategy recommendations
      4. Branding tips
      5. Cross-promotion ideas
      6. Confidence level

      Focus on:
      - Brand consistency and identity
      - Community building strategies
      - Market positioning
      - Revenue optimization
      - Long-term sustainability

      Format as JSON:
      {
        "collectionTheme": "string",
        "targetAudience": "string", 
        "marketingStrategy": ["strategy1", "strategy2"],
        "brandingTips": ["tip1", "tip2"],
        "crossPromotionIdeas": ["idea1", "idea2"],
        "confidence": number
      }`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1000,
        temperature: 0.7
      });

      return JSON.parse(response.choices[0].message.content!);

    } catch (error) {
      console.error('AI collection insights failed:', error);
      throw new Error(`Failed to generate collection insights: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * AI chatbot for NFT marketplace support
   */
  async processChatbotQuery(
    userMessage: string,
    context: {
      userType: 'creator' | 'collector' | 'new_user';
      currentPage?: string;
      recentActivity?: string[];
    }
  ): Promise<AIChatbotResponse> {
    try {
      const systemPrompt = `You are NFTSol's helpful AI assistant. You provide expert guidance on:
      - NFT creation and minting
      - Buying and selling NFTs
      - Wallet setup and security
      - Platform features and navigation
      - Market trends and strategies
      - Technical support

      Be helpful, concise, and actionable. Always maintain a friendly, professional tone.`;

      const contextText = `User type: ${context.userType}${context.currentPage ? `, Current page: ${context.currentPage}` : ''}${context.recentActivity ? `, Recent activity: ${context.recentActivity.join(', ')}` : ''}`;

      const userPrompt = `User question: "${userMessage}"
      Context: ${contextText}

      Provide:
      1. A helpful response (2-3 sentences)
      2. The user's intent/what they're trying to do
      3. Suggested actions they can take
      4. Helpful resources or links

      Format as JSON:
      {
        "response": "string",
        "intent": "string",
        "suggestedActions": ["action1", "action2"],
        "helpfulResources": ["resource1", "resource2"]
      }`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        max_tokens: 500,
        temperature: 0.5
      });

      return JSON.parse(response.choices[0].message.content!);

    } catch (error) {
      console.error('AI chatbot processing failed:', error);
      throw new Error(`Failed to process chatbot query: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate trending hashtags and social media content
   */
  async generateSocialContent(
    nftTitle: string,
    category: string,
    platform: 'twitter' | 'instagram' | 'discord' | 'all'
  ): Promise<{ [key: string]: { content: string; hashtags: string[] } }> {
    try {
      const systemPrompt = `You are a social media expert specializing in NFT and crypto content that drives engagement and sales.`;

      const userPrompt = `Create engaging social media content for this NFT:

      NFT: "${nftTitle}"
      Category: ${category}
      Platform(s): ${platform}

      Generate content optimized for:
      - Maximum engagement
      - Relevant trending hashtags
      - Platform-specific best practices
      - NFT community appeal

      ${platform === 'all' ? 'Create content for Twitter, Instagram, and Discord.' : `Create content for ${platform}.`}

      Format as JSON with platform-specific content and hashtags.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        max_tokens: 800,
        temperature: 0.8
      });

      return JSON.parse(response.choices[0].message.content!);

    } catch (error) {
      console.error('AI social content generation failed:', error);
      throw new Error(`Failed to generate social content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Health check for AI features service
   */
  async healthCheck(): Promise<boolean> {
    try {
      if (!process.env.OPENAI_API_KEY) {
        return false;
      }

      await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [{ role: "user", content: "Hello" }],
        max_tokens: 5
      });

      return true;
    } catch (error) {
      console.error('AI features service health check failed:', error);
      return false;
    }
  }
}

export const aiFeaturesService = new AIFeaturesService();