import { Request, Response, NextFunction, RequestHandler, ErrorRequestHandler } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors, { CorsOptions } from 'cors';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import Redis from 'ioredis';
// Using the default export approach for express-validator v7
const ev = require('express-validator');
const { validationResult, body, param, query, ValidationChain } = ev;
import env from '../../config';
import { SecurityConfig, RedisConfig } from '../../types/config';
import logger from '../../utils/logger';

// Rate limiting tiers (requests per 15 minutes)
const RATE_LIMIT_TIERS = {
  public: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again after 15 minutes'
  },
  authenticated: {
    windowMs: 15 * 60 * 1000,
    max: 500,
    message: 'Too many requests, please try again later'
  },
  critical: {
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: 'Too many critical requests, please try again later'
  }
};

// Redis configuration
const redisConfig: RedisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0', 10),
  keyPrefix: process.env.REDIS_KEY_PREFIX || 'nftsol:',
};

// Initialize Redis client for rate limiting with error handling
let redisClient: Redis | null = null;
let rateLimiter: RateLimiterRedis | null = null;

try {
  redisClient = new Redis({
    host: redisConfig.host,
    port: redisConfig.port,
    password: redisConfig.password,
    db: redisConfig.db,
    enableOfflineQueue: false,
    retryStrategy: (times: number) => {
      const delay = Math.min(times * 100, 5000);
      return delay;
    },
    reconnectOnError: (err: Error) => {
      console.error('Redis connection error:', err.message);
      return true; // Reconnect on error
    }
  });

  // Set up event handlers
  redisClient.on('error', (err: Error) => {
    console.error('Redis error:', err);
  });

  redisClient.on('connect', () => {
    console.log('Connected to Redis');
  });

  // Rate limiting configuration
  rateLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: `${redisConfig.keyPrefix}ratelimit`,
    points: 100, // 100 requests
    duration: 60, // per 60 seconds
    blockDuration: 60 * 15, // Block for 15 minutes if limit is exceeded
    inMemoryBlockOnConsumed: 110, // Start blocking at 110% of points
    inMemoryBlockDuration: 60, // Block for 1 minute when in-memory blocking
  });
} catch (error) {
  console.error('Failed to initialize Redis:', error);
  rateLimiter = null;
}

// Rate limiting middleware
export const rateLimiterMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Skip rate limiting if Redis is not available
  if (!rateLimiter) {
    console.warn('Rate limiter not available, skipping rate limiting');
    return next();
  }

  // Get the client IP address (respecting X-Forwarded-For if behind a proxy)
  const clientIp = req.headers['x-forwarded-for']?.toString().split(',')[0] || req.socket.remoteAddress || 'unknown';

  rateLimiter.consume(clientIp)
    .then(() => {
      next();
    })
    .catch((err) => {
      console.warn(`Rate limit exceeded for IP: ${clientIp}`, err);
      res.status(429).json({
        status: 'error',
        message: 'Too many requests, please try again later.',
        retryAfter: err.msBeforeNext / 1000, // Convert to seconds
      });
    });
};

// Security headers middleware
export const securityHeaders: RequestHandler[] = [
  // Helmet security headers
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    frameguard: { action: 'deny' },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    ieNoOpen: true,
    noSniff: true,
    xssFilter: true,
  }),

  // CORS configuration
  cors({
    origin: (env as any).ALLOWED_ORIGINS || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  } as CorsOptions),

  // Prevent clickjacking
  (req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Frame-Options', 'DENY');
    next();
  },

  // Prevent MIME type sniffing
  (req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
  },

  // Enable XSS filtering
  (req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  },
];

// Request validation middleware
export const validateRequest = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        status: 'error',
        message: error.details[0].message,
      });
    }
    next();
  };
};

// Request size limiter
export const requestSizeLimiter = (limit = '10mb') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = req.headers['content-length'];
    if (contentLength && parseInt(contentLength, 10) > 10 * 1024 * 1024) {
      return res.status(413).json({
        status: 'error',
        message: 'Request entity too large',
      });
    }
    next();
  };
};

// CSRF protection middleware
export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  // Skip CSRF for API routes
  if (req.path.startsWith('/api/')) {
    return next();
  }
  
  // Implement CSRF protection here
  // This is a simplified example - you might want to use a library like csurf
  next();
};

// Error handling middleware for security
const securityErrorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ status: 'error', message: 'Invalid token' });
  }
  next(err);
};

// Security middleware initialization
export const setupSecurity = (app: {
  use: (middleware: RequestHandler | ErrorRequestHandler) => void;
  set: (key: string, value: any) => void;
  disable: (setting: string) => void;
}) => {
  // Security-related app settings
  app.set('trust proxy', 1); // Trust first proxy
  app.set('x-powered-by', false); // Disable X-Powered-By header
  
  // Disable etag for API responses to prevent 304 responses
  app.set('etag', false);
  
  // Disable X-Powered-By header (Helmet does this, but just to be sure)
  app.disable('x-powered-by');
  
  // Disable client-side caching by default
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Surrogate-Control', 'no-store');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
  });
  // Apply security middleware
  securityHeaders.forEach(middleware => app.use(middleware));
  
  // Apply rate limiting
  app.use(rateLimiterMiddleware);
  
  // Apply CSRF protection
  app.use(csrfProtection);
  
  // Apply request size limiting
  app.use(requestSizeLimiter('10mb'));
  
  // Apply error handling for security-related issues
  app.use(securityErrorHandler);
};
