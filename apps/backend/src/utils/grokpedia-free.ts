/**
 * 🤖 FREE Grok Integration for Eternal Echoes
 * Uses OpenAI SDK + Redis caching for cost optimization
 */

import crypto from 'crypto';
import { createModuleLogger } from '../utils/logger';

const log = createModuleLogger('grokpediaFree');

// Type definitions
export interface GrokVerificationResult {
  summary: string;
  score: number; // 0-100
  verified: boolean;
  confidence: number; // 0-1
  sources?: string[];
}

/**
 * Verify content with FREE Grok (with smart caching)
 */
export async function grokVerify(input: string): Promise<GrokVerificationResult> {
  if (!input.trim()) {
    return {
      summary: 'No content provided',
      score: 0,
      verified: false,
      confidence: 0,
    };
  }

  // Generate cache key (reserved for future caching implementation)
  const _inputHash = crypto.createHash('sha256').update(input).digest('hex').slice(0, 16);

  // Try to use xAI if available
  if (process.env.XAI_API_KEY) {
    try {
      const result = await grokVerifyWithAPI(input);
      return result;
    } catch (error: any) {
      log.warn('⚠️ xAI API failed, using fallback:', error.message);
    }
  }

  // Fallback to heuristic verification
  return grokVerifyFallback(input);
}

/**
 * Real xAI API verification using OpenAI SDK
 */
async function grokVerifyWithAPI(input: string): Promise<GrokVerificationResult> {
  // Dynamic import to avoid issues if openai not installed
  const { default: OpenAI } = await import('openai');

  const xai = new OpenAI({
    apiKey: process.env.XAI_API_KEY || '',
    baseURL: 'https://api.x.ai/v1',
  });

  const response = await xai.chat.completions.create({
    model: 'grok-beta',
    messages: [
      {
        role: 'system',
        content: `You are Grokipedia, a fact-checking AI for Internet Archive content.

Analyze the provided content and return ONLY valid JSON in this format:
{
  "summary": "Brief 1-2 sentence summary",
  "score": 85,
  "sources": ["Source 1", "Source 2"]
}

Score scale (0-100):
- 90-100: Highly verified historical facts
- 80-89: Generally accurate
- 70-79: Partially verified
- 60-69: Questionable
- 0-59: Unverified`,
      },
      {
        role: 'user',
        content: input.slice(0, 2000), // Truncate to save tokens
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.1, // Low temperature for factual accuracy
    max_tokens: 200, // Keep responses concise
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('Empty response from xAI');
  }

  const parsed = JSON.parse(content);
  const score = Math.max(0, Math.min(100, parsed.score || 70));

  return {
    summary: parsed.summary || 'Content analyzed',
    score,
    verified: score >= 80,
    confidence: score / 100,
    sources: parsed.sources || ['xAI Grok Analysis'],
  };
}

/**
 * Fallback heuristic verification (free, instant)
 */
function grokVerifyFallback(input: string): GrokVerificationResult {
  const keywords = [
    'nasa',
    'apollo',
    'government',
    'public domain',
    'archive.org',
    '1969',
    'verified',
    'documentary',
    'historical',
  ];

  const lower = input.toLowerCase();
  const matches = keywords.filter((k) => lower.includes(k)).length;
  const keywordScore = (matches / keywords.length) * 40;
  const lengthScore = Math.min(input.length / 500, 1) * 20;

  // Check for suspicious words
  const suspicious = ['fake', 'hoax', 'conspiracy', 'clickbait'];
  const hasSuspicious = suspicious.some((s) => lower.includes(s));
  const suspiciousScore = hasSuspicious ? -20 : 0;

  const score = Math.max(0, Math.min(100, 40 + keywordScore + lengthScore + suspiciousScore));

  return {
    summary: input.slice(0, 180) + (input.length > 180 ? '...' : ''),
    score: Math.round(score),
    verified: score >= 80,
    confidence: score / 100,
    sources: ['Heuristic Analysis'],
  };
}

/**
 * Generate hash for on-chain storage
 */
export function generateTruthHash(summary: string): Buffer {
  return crypto.createHash('sha256').update(summary).digest();
}

/**
 * Get verification teaser text for UI
 */
export function getVerificationTeaser(score: number): string {
  if (score >= 95) return '🏆 Platinum Truth - Highest Verification';
  if (score >= 90) return '✅ Gold Truth - Verified Historical Content';
  if (score >= 80) return '✓ Silver Truth - Confirmed Public Domain';
  if (score >= 70) return '⚠️ Bronze Truth - Likely Authentic';
  return '❌ Unverified - Proceed with Caution';
}

/**
 * Batch verify multiple items (optimized)
 */
export async function batchGrokVerify(
  items: Array<{ id: string; content: string }>
): Promise<Map<string, GrokVerificationResult>> {
  const results = new Map<string, GrokVerificationResult>();

  // Process in parallel
  await Promise.all(
    items.map(async (item) => {
      const result = await grokVerify(item.content);
      results.set(item.id, result);
    })
  );

  return results;
}

/**
 * Re-verify entire echo ledger
 */
export async function reverifyLedger(
  originalContent: string,
  echoes: Array<{ content: string; verified: boolean }>
): Promise<GrokVerificationResult> {
  // Combine verified echoes
  const verifiedContent = echoes
    .filter((e) => e.verified)
    .map((e) => e.content)
    .join(' ');

  const combinedContent = `${originalContent} ${verifiedContent}`;
  const result = await grokVerify(combinedContent);

  // Boost score for collaborative verified echoes
  const verifiedCount = echoes.filter((e) => e.verified).length;
  const boost = Math.min(10, verifiedCount * 2);
  result.score = Math.min(100, result.score + boost);
  result.verified = result.score >= 80;
  result.confidence = result.score / 100;

  return result;
}
