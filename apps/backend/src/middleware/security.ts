import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import type { Request, Response, NextFunction } from 'express';

// Allowed origins for CORS (comma-separated)
const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

export const corsConfig = cors({
    origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error('CORS blocked'));
    },
    credentials: true,
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
export function requestSizeLimiter(_req: Request, _res: Response, next: NextFunction) {
  next();
}
