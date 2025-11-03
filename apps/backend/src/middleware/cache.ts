/**
 * HTTP response caching middleware with ETag support
 */

import { Request, Response, NextFunction } from 'express';
import { cache, cacheKeys } from '../utils/cache';
import crypto from 'crypto';

interface CachedResponse {
  data: any;
  headers: Record<string, string | number | readonly string[]>;
  statusCode: number;
  etag: string;
}

const responseCache = new Map<string, CachedResponse>();

/**
 * Generate ETag from response data
 */
function generateETag(data: any): string {
  const str = JSON.stringify(data);
  return crypto.createHash('md5').update(str).digest('hex');
}

/**
 * Cache middleware with ETag support
 */
function normalizeETag(etag: string): string {
  const trimmed = etag.trim();
  const withoutWeakIndicator = trimmed.startsWith('W/') ? trimmed.slice(2) : trimmed;
  return withoutWeakIndicator.replace(/^"(.*)"$/, '$1');
}

function parseIfNoneMatch(
  header: string | readonly string[]
): { wildcard: boolean; etags: string[] } {
  const raw = Array.isArray(header) ? header.join(',') : (header as string);
  if (!raw) {
    return { wildcard: false, etags: [] };
  }

  const tokens = raw.split(',').map((token) => token.trim()).filter(Boolean);

  let wildcard = false;
  const etags: string[] = [];

  for (const token of tokens) {
    if (token === '*') {
      wildcard = true;
      continue;
    }

    etags.push(normalizeETag(token));
  }

  return { wildcard, etags };
}

export function cacheMiddleware(ttl: number = 5 * 60 * 1000) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = req.originalUrl || req.url;
    const cached = responseCache.get(cacheKey);

    // Check If-None-Match header (ETag)
    const ifNoneMatch = req.headers['if-none-match'];
    if (ifNoneMatch && cached) {
      const { wildcard, etags } = parseIfNoneMatch(ifNoneMatch);

      if (wildcard || etags.includes(cached.etag)) {
        Object.entries(cached.headers).forEach(([key, value]) => {
          if (typeof value !== 'undefined') {
            res.setHeader(key, value as string | number | readonly string[]);
          }
        });

        res.setHeader('ETag', `"${cached.etag}"`);
        return res.status(304).end(); // Not Modified
      }
    }

    // Store original json method
    const originalJson = res.json.bind(res);
    
    // Override json to cache response
    res.json = function(data: any) {
      const etag = generateETag(data);
      
      // Store in cache
      responseCache.set(cacheKey, {
        data,
        headers: res.getHeaders() as Record<string, string | number | readonly string[]>,
        statusCode: res.statusCode,
        etag,
      });

      // Set ETag header
      res.setHeader('ETag', `"${etag}"`);
      res.setHeader('Cache-Control', `public, max-age=${Math.floor(ttl / 1000)}`);

      // Clean up after TTL
      setTimeout(() => {
        responseCache.delete(cacheKey);
      }, ttl);

      return originalJson(data);
    };

    next();
  };
}

/**
 * Clear cache for specific route
 */
export function clearCache(pattern: string) {
  const keys = Array.from(responseCache.keys()).filter((key) => key.includes(pattern));
  keys.forEach((key) => responseCache.delete(key));
}

