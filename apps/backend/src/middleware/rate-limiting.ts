/**
 * Rate Limiting Middleware
 * Comprehensive rate limiting for all API endpoints to prevent abuse
 */

import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// Store for in-memory rate limiting (can be replaced with Redis for distributed systems)
const store = new Map<string, { count: number; resetTime: number }>();

// Helper to get client IP (considers X-Forwarded-For header for proxies)
export function getClientIp(req: Request): string {
  return (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
    req.socket.remoteAddress ||
    'unknown';
}

// Standard rate limiter: 100 requests per 15 minutes
export const standardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    error: 'Too many requests, please try again later',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => getClientIp(req),
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Too many requests, please try again later',
      code: 'RATE_LIMIT_EXCEEDED'
    });
  }
});

// Auth limiter: 5 requests per 15 minutes (stricter for login attempts)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later',
    code: 'AUTH_RATE_LIMIT_EXCEEDED'
  },
  skipSuccessfulRequests: true, // Only count failed attempts
  keyGenerator: (req) => `${getClientIp(req)}:${req.body?.email || 'unknown'}`,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Too many authentication attempts, please try again later',
      code: 'AUTH_RATE_LIMIT_EXCEEDED'
    });
  }
});

// Sensitive operations limiter: 10 requests per hour (minting, transfers, etc.)
export const sensitiveOpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    error: 'Too many sensitive operations, please try again later',
    code: 'SENSITIVE_OP_RATE_LIMIT_EXCEEDED'
  },
  keyGenerator: (req) => {
    // Use wallet address if available, otherwise IP
    const walletAddress = req.body?.walletAddress || req.query?.walletAddress || getClientIp(req);
    return `${getClientIp(req)}:${walletAddress}`;
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Too many sensitive operations, please try again later',
      code: 'SENSITIVE_OP_RATE_LIMIT_EXCEEDED'
    });
  }
});

// Strict limiter: 3 requests per minute (for expensive operations)
export const strictLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  message: {
    success: false,
    error: 'Too many requests, please try again later',
    code: 'STRICT_RATE_LIMIT_EXCEEDED'
  },
  keyGenerator: (req) => getClientIp(req),
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Too many requests, please try again later',
      code: 'STRICT_RATE_LIMIT_EXCEEDED'
    });
  }
});

// Webhook limiter: 100 requests per minute (for webhook endpoints)
export const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: {
    success: false,
    error: 'Too many webhook requests, please try again later',
    code: 'WEBHOOK_RATE_LIMIT_EXCEEDED'
  },
  keyGenerator: (req) => getClientIp(req),
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Too many webhook requests, please try again later',
      code: 'WEBHOOK_RATE_LIMIT_EXCEEDED'
    });
  }
});

// Data retrieval limiter: 200 requests per 15 minutes (for public data endpoints)
export const dataLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: {
    success: false,
    error: 'Too many data requests, please try again later',
    code: 'DATA_RATE_LIMIT_EXCEEDED'
  },
  keyGenerator: (req) => getClientIp(req),
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Too many data requests, please try again later',
      code: 'DATA_RATE_LIMIT_EXCEEDED'
    });
  }
});

// Export all limiters as a preset object
export const rateLimiters = {
  standard: standardLimiter,
  auth: authLimiter,
  sensitiveOp: sensitiveOpLimiter,
  strict: strictLimiter,
  webhook: webhookLimiter,
  data: dataLimiter
};

export default standardLimiter;
