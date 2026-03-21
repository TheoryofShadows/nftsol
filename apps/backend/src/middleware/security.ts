import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import type { Request, Response, NextFunction } from 'express';
import { createModuleLogger } from '../utils/logger';

const log = createModuleLogger('security');

// CORS configuration - RESTRICTED in production
export const corsConfig = cors({
  origin: (origin, cb) => {
    const nodeEnv = process.env.NODE_ENV || 'development';

    // In development, allow all origins for testing
    if (nodeEnv === 'development') {
      // But still require origin header to be present or allow no origin
      if (!origin) return cb(null, true);
      return cb(null, true);
    }

    // In production, ONLY allow specific trusted origins
    if (!origin) {
      // Reject requests with no origin in production
      return cb(new Error('Origin header is required in production'));
    }

    const allowedOrigins = [
      'https://nftsol.app',
      'https://www.nftsol.app',
    ];

    if (allowedOrigins.includes(origin)) {
      return cb(null, true);
    }

    // Block the request with specific error
    log.warn(`CORS request blocked from unauthorized origin: ${origin}`);
    return cb(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Requested-With', 'X-Request-ID'],
  exposedHeaders: ['X-CSRF-Token', 'X-Request-ID'],
  maxAge: 86400 // 24 hours
});

export const helmetConfig = helmet({ contentSecurityPolicy: false });

// Generic, auth, api and upload rate limiters
export const generalLimiter = rateLimit({ windowMs: 60_000, max: 100 });
export const authLimiter = rateLimit({ windowMs: 60_000, max: 20 });
export const apiLimiter = rateLimit({ windowMs: 60_000, max: 300 });
export const uploadLimiter = rateLimit({ windowMs: 60_000, max: 30 });

// Additional security headers
export function securityHeaders(_req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
}

// Lightweight request logger for security-sensitive info
export function securityLogger(req: Request, _res: Response, next: NextFunction) {
  // Keep minimal to avoid PII
  // eslint-disable-next-line no-console
  log.info(`[SEC] ${req.method} ${req.path}`);
  next();
}

// Basic sanitization placeholder (extend as needed)
export function sanitizeInput(_req: Request, _res: Response, next: NextFunction) {
  next();
}

// Request size limiter placeholder (body parser limits are applied elsewhere)
export const requestSizeLimiter = (_req: Request, _res: Response, next: NextFunction) => {
  next();
};

// Default export with all security middleware
export default [
  helmet(),
  corsConfig,
  securityHeaders,
  securityLogger,
  sanitizeInput,
  requestSizeLimiter
];
