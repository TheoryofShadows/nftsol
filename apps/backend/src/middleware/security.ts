import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import type { Request, Response, NextFunction } from 'express';

// CORS configuration
export const corsConfig = cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return cb(null, true);
    
    // Allow all origins in development
    if (process.env.NODE_ENV !== 'production' || process.env.NODE_ENV === undefined) {
      return cb(null, true);
    }

    // In production, only allow specific origins
    const allowedOrigins = [
      'https://nftsol.app',
      'https://www.nftsol.app',
      'https://nftsol.onrender.com'
    ];

    if (allowedOrigins.includes(origin)) {
      return cb(null, true);
    }

    // Block the request
    return cb(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Requested-With'],
  exposedHeaders: ['X-CSRF-Token'],
  maxAge: 600 // 10 minutes
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
  console.log(`[SEC] ${req.method} ${req.path}`);
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
