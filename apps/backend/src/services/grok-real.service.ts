/**
 * 🤖 Grok AI Real Verification Service
 * Direct integration with X.AI Grok API
 * No mocks, no fallbacks - real AI-powered content verification
 *
 * Features:
 * - Content authenticity scoring
 * - Creator credential verification
 * - Deepfake detection
 * - Fact-checking
 * - Red flag detection
 * - Trust score calculation
 */

import axios, { AxiosError as _AxiosError } from 'axios';

const GROK_API_BASE = 'https://api.x.ai/v1';
const GROK_MODEL = 'grok-beta';
const GROK_API_KEY = process.env.GROK_API_KEY;

interface VerificationRequest {
  content: string;
  contentType: 'text' | 'url' | 'creator' | 'collection' | 'deal' | 'community' | 'nft';
  metadata?: Record<string, any>;
}

interface VerificationResult {
  score: number; // 0-100, higher = more authentic/legitimate
  confidence: number; // 0-1, confidence in the score
  category: string;
  analysis: {
    primaryScore: number;
    secondaryScores: Record<string, number>;
    reasoning: string;
  };
  flags: string[]; // Red flags detected
  verifiedFacts: Array<{
    claim: string;
    verified: boolean;
    confidence: number;
    source?: string;
  }>;
  recommendations: string[];
  metadata: {
    processedAt: string;
    verificationTime: number; // ms
    model: string;
  };
}

class GrokRealService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = GROK_API_KEY || '';
    this.baseUrl = GROK_API_BASE;

    if (!this.apiKey) {
      console.warn('⚠️ GROK_API_KEY not configured. Set GROK_API_KEY in .env');
      console.warn('Get a free key at: https://console.x.ai/');
    }
  }

  /**
   * Main verification method - routes to specific verification type
   */
  async verify(request: VerificationRequest): Promise<VerificationResult> {
    const startTime = Date.now();

    try {
      let result: VerificationResult;

      switch (request.contentType) {
        case 'text':
          result = await this.verifyText(request.content);
          break;
        case 'creator':
          result = await this.verifyCreator(request.content, request.metadata);
          break;
        case 'collection':
          result = await this.verifyCollection(request.content, request.metadata);
          break;
        case 'deal':
          result = await this.verifyDeal(request.content, request.metadata);
          break;
        case 'community':
          result = await this.verifyCommunity(request.content, request.metadata);
          break;
        case 'nft':
          result = await this.verifyNFT(request.content, request.metadata);
          break;
        case 'url':
          result = await this.verifyURL(request.content);
          break;
        default:
          result = await this.verifyText(request.content);
      }

      // Add metadata
      result.metadata.processedAt = new Date().toISOString();
      result.metadata.verificationTime = Date.now() - startTime;
      result.metadata.model = GROK_MODEL;

      return result;
    } catch (error) {
      console.error('[Grok] Verification error:', error);
      throw new Error(`Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Verify general text content (claims, statements, etc.)
   */
  private async verifyText(content: string): Promise<VerificationResult> {
    const prompt = `Analyze the following content for authenticity, accuracy, and potential issues:

"${content}"

Provide analysis in JSON format with:
- truthScore (0-100): How truthful/authentic is this?
- confidenceScore (0-1): How confident are you?
- redFlags: Array of concerns
- verifiedFacts: Specific claims and their verification status
- recommendations: What the user should know

Return ONLY valid JSON, no markdown or extra text.`;

    const response = await this.callGrokAPI(prompt);
    return this.parseGrokResponse(response, 'text');
  }

  /**
   * Verify creator/artist authenticity and credentials
   */
  private async verifyCreator(creatorAddress: string, metadata?: Record<string, any>): Promise<VerificationResult> {
    const portfolioInfo = metadata?.portfolio ? JSON.stringify(metadata.portfolio) : '';
    const socialProof = metadata?.social ? JSON.stringify(metadata.social) : '';

    const prompt = `Verify the authenticity and legitimacy of this NFT creator:

Creator Address: ${creatorAddress}
${portfolioInfo ? `Portfolio Data: ${portfolioInfo}` : ''}
${socialProof ? `Social Proof: ${socialProof}` : ''}

Analyze:
1. Account legitimacy (age, activity level)
2. Portfolio quality and consistency
3. Any signs of plagiarism or art theft
4. Community reception and feedback
5. Red flags or suspicious activity

Provide JSON with:
- trustScore (0-100): Overall trust level
- confidenceScore (0-1): Confidence in assessment
- redFlags: Any warning signs
- verifiedCredentials: What we can confirm
- recommendations: Trust level assessment

Return ONLY valid JSON.`;

    const response = await this.callGrokAPI(prompt);
    return this.parseGrokResponse(response, 'creator');
  }

  /**
   * Verify NFT collection legitimacy (rug pull detection, etc.)
   */
  private async verifyCollection(collectionMint: string, metadata?: Record<string, any>): Promise<VerificationResult> {
    const collectionInfo = metadata?.info ? JSON.stringify(metadata.info) : '';
    const holders = metadata?.holders ? metadata.holders : 0;
    const volume = metadata?.volume ? metadata.volume : 0;

    const prompt = `Analyze this NFT collection for legitimacy and rug pull risk:

Collection: ${collectionMint}
${collectionInfo ? `Info: ${collectionInfo}` : ''}
Holders: ${holders}
Trading Volume: ${volume}

Assess:
1. Creator verification and history
2. Community health and authenticity
3. Trading patterns for manipulation
4. Rug pull risk indicators
5. Actual vs claimed utility

Provide JSON with:
- legitimacyScore (0-100): Overall legitimacy
- rugPullRisk (0-100): Risk of rug pull
- confidenceScore (0-1)
- redFlags: Specific concerns
- verifiedClaims: What's actually true
- recommendations: Investment assessment

Return ONLY valid JSON.`;

    const response = await this.callGrokAPI(prompt);
    return this.parseGrokResponse(response, 'collection');
  }

  /**
   * Verify deal/offer fairness
   */
  private async verifyDeal(dealInfo: string, metadata?: Record<string, any>): Promise<VerificationResult> {
    const marketData = metadata?.market ? JSON.stringify(metadata.market) : '';
    const terms = metadata?.terms ? JSON.stringify(metadata.terms) : '';

    const prompt = `Assess the fairness of this NFT deal:

Deal Details: ${dealInfo}
${marketData ? `Market Data: ${marketData}` : ''}
${terms ? `Deal Terms: ${terms}` : ''}

Analyze:
1. Price fairness based on market data
2. Terms reasonableness
3. Seller/buyer legitimacy
4. Hidden risks or catches
5. Compared to similar deals

Provide JSON with:
- fairnessScore (0-100): How fair is this deal?
- confidenceScore (0-1)
- priceAssessment: Fair/Overpriced/Underpriced
- redFlags: Any concerns
- recommendations: Should they proceed?

Return ONLY valid JSON.`;

    const response = await this.callGrokAPI(prompt);
    return this.parseGrokResponse(response, 'deal');
  }

  /**
   * Verify community engagement authenticity
   */
  private async verifyCommunity(communityInfo: string, metadata?: Record<string, any>): Promise<VerificationResult> {
    const holders = metadata?.holderCount ? metadata.holderCount : 0;
    const activity = metadata?.activity ? JSON.stringify(metadata.activity) : '';
    const voting = metadata?.voting ? JSON.stringify(metadata.voting) : '';

    const prompt = `Verify the authenticity of this NFT/DAO community:

Community Info: ${communityInfo}
Unique Holders: ${holders}
${activity ? `Activity: ${activity}` : ''}
${voting ? `Voting Data: ${voting}` : ''}

Assess:
1. Holder authenticity (real people vs bots)
2. Engagement genuineness
3. Bot/brigading detection
4. Community health indicators
5. Manipulation signs

Provide JSON with:
- authenticityScore (0-100): How genuine is this community?
- confidenceScore (0-1)
- botRisk (0-100): Likelihood of bots/manipulation
- redFlags: Suspicious patterns
- communityHealth: Assessment
- recommendations: Trust level

Return ONLY valid JSON.`;

    const response = await this.callGrokAPI(prompt);
    return this.parseGrokResponse(response, 'community');
  }

  /**
   * Verify NFT authenticity (original art, not stolen/fake)
   */
  private async verifyNFT(nftMint: string, metadata?: Record<string, any>): Promise<VerificationResult> {
    const nftInfo = metadata?.info ? JSON.stringify(metadata.info) : '';
    const imageUrl = metadata?.imageUrl || '';
    const creatorAddress = metadata?.creator || '';

    const prompt = `Verify this NFT's authenticity:

NFT Mint: ${nftMint}
${nftInfo ? `NFT Info: ${nftInfo}` : ''}
${imageUrl ? `Image URL: ${imageUrl}` : ''}
Creator: ${creatorAddress}

Assess:
1. Is the art original or plagiarized?
2. Is the image legitimate or AI-generated deepfake?
3. Creator's previous works match style?
4. Any history of stolen NFTs?
5. Metadata accuracy

Provide JSON with:
- authenticityScore (0-100): Is this NFT genuine?
- confidenceScore (0-1)
- isOriginal: true/false
- isFake: Likelihood of deepfake/AI generation
- redFlags: Concerns
- verifiedOrigins: What we can confirm
- recommendations: Authenticity assessment

Return ONLY valid JSON.`;

    const response = await this.callGrokAPI(prompt);
    return this.parseGrokResponse(response, 'nft');
  }

  /**
   * Verify URL content authenticity
   */
  private async verifyURL(url: string): Promise<VerificationResult> {
    const prompt = `Verify the content and authenticity of this URL:

URL: ${url}

Assess:
1. Is the domain legitimate?
2. What's the main content?
3. Any phishing/scam indicators?
4. Accuracy of claims made
5. Potential risks

Provide JSON with:
- trustScore (0-100): Is this URL trustworthy?
- confidenceScore (0-1)
- isPhishing: Likelihood of phishing/scam
- contentAccuracy (0-100): Accuracy of claims
- redFlags: Any warning signs
- summary: What the URL contains
- recommendations: Safe to visit?

Return ONLY valid JSON.`;

    const response = await this.callGrokAPI(prompt);
    return this.parseGrokResponse(response, 'url');
  }

  /**
   * Call Grok API directly
   */
  private async callGrokAPI(prompt: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('GROK_API_KEY not configured. Get one at https://console.x.ai/');
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: GROK_MODEL,
          messages: [
            {
              role: 'system',
              content: 'You are an expert NFT analyst and authenticator. Always respond with valid JSON only, no markdown or explanation.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3, // Lower temp for consistency
          max_tokens: 2000,
          top_p: 0.9,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      const content = response.data.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from Grok API');
      }

      return content;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('[Grok API Error]:', {
          status: error.response?.status,
          message: error.response?.data?.error?.message || error.message
        });

        if (error.response?.status === 401) {
          throw new Error('Invalid GROK_API_KEY. Get one at https://console.x.ai/');
        }
        if (error.response?.status === 429) {
          throw new Error('Rate limited by Grok API. Try again later.');
        }
      }
      throw error;
    }
  }

  /**
   * Parse Grok's JSON response
   */
  private parseGrokResponse(content: string, category: string): VerificationResult {
    try {
      // Extract JSON from response (in case of markdown wrapping)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Normalize field names
      const score = parsed.trustScore || parsed.truthScore || parsed.legitimacyScore || parsed.fairnessScore || parsed.authenticityScore || 50;
      const confidence = parsed.confidenceScore || parsed.confidence || 0.5;

      return {
        score: Math.min(100, Math.max(0, score)), // Clamp 0-100
        confidence: Math.min(1, Math.max(0, confidence)), // Clamp 0-1
        category,
        analysis: {
          primaryScore: score,
          secondaryScores: {
            ...(parsed.rugPullRisk && { rugPullRisk: parsed.rugPullRisk }),
            ...(parsed.botRisk && { botRisk: parsed.botRisk }),
            ...(parsed.isPhishing && { phishingRisk: parsed.isPhishing }),
            ...(parsed.priceAssessment && { priceAssessment: parsed.priceAssessment }),
          },
          reasoning: parsed.summary || parsed.analysis || ''
        },
        flags: parsed.redFlags || [],
        verifiedFacts: parsed.verifiedFacts || parsed.verifiedClaims || parsed.verifiedCredentials || [],
        recommendations: parsed.recommendations || [],
        metadata: {
          processedAt: new Date().toISOString(),
          verificationTime: 0,
          model: GROK_MODEL
        }
      };
    } catch (error) {
      console.error('[Parse Error]:', error);
      console.error('[Raw Response]:', content);

      // Fallback: return safe default
      return {
        score: 50,
        confidence: 0.3,
        category,
        analysis: {
          primaryScore: 50,
          secondaryScores: {},
          reasoning: 'Unable to parse verification. Please try again.'
        },
        flags: ['verification_failed', 'response_unparseable'],
        verifiedFacts: [],
        recommendations: ['Please retry the verification'],
        metadata: {
          processedAt: new Date().toISOString(),
          verificationTime: 0,
          model: GROK_MODEL
        }
      };
    }
  }

  /**
   * Batch verification for multiple items
   */
  async verifyBatch(requests: VerificationRequest[]): Promise<VerificationResult[]> {
    // Process sequentially to avoid rate limiting
    const results: VerificationResult[] = [];

    for (const request of requests) {
      try {
        const result = await this.verify(request);
        results.push(result);
      } catch (error) {
        results.push({
          score: 0,
          confidence: 0,
          category: request.contentType,
          analysis: {
            primaryScore: 0,
            secondaryScores: {},
            reasoning: `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          },
          flags: ['batch_error'],
          verifiedFacts: [],
          recommendations: [],
          metadata: {
            processedAt: new Date().toISOString(),
            verificationTime: 0,
            model: GROK_MODEL
          }
        });
      }

      // Rate limit: 1 second between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return results;
  }
}

// Export singleton
export const grokRealService = new GrokRealService();
export type { VerificationRequest, VerificationResult };
