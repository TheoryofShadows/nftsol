import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// Rate limiting configurations
// Skip rate limiting in test environment
const isTestEnv = process.env.NODE_ENV === 'test';

export const createRateLimiter = (windowMs: number, max: number, message?: string): any => {
  // In test environment, return a no-op middleware
  if (isTestEnv) {
    return (req: Request, res: Response, next: NextFunction) => {
      next();
    };
  }

  return rateLimit({
    windowMs,
    max,
    message: message || 'Too many requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: any, res: any) => {
      res.status(429).json({
        error: 'Rate limit exceeded',
        message: message || 'Too many requests, please try again later.',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
  }); // No type assertion needed
};

// Different rate limits for different endpoints
export const generalLimiter = createRateLimiter(15 * 60 * 1000, 100); // 100 requests per 15 minutes
export const authLimiter = createRateLimiter(15 * 60 * 1000, 5); // 5 auth attempts per 15 minutes
export const apiLimiter = createRateLimiter(60 * 1000, 30); // 30 API calls per minute
export const uploadLimiter = createRateLimiter(60 * 1000, 10); // 10 uploads per minute

// Helper to extract IP address for rate limiting
const getIpAddress = (req: any) => {
  return req.ip || 
         req.connection?.remoteAddress || 
         req.socket?.remoteAddress ||
         (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
         'unknown';
};

// Enhanced CORS configuration with proper environment separation
export const corsConfig = cors({
  origin: (origin, callback) => {
    const isProduction = process.env.NODE_ENV === 'production';
    const isStaging = process.env.NODE_ENV === 'staging';
    
    let allowedOrigins: string[] = [];
    
    if (isProduction) {
      // Production: Only allow production domains
      allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
        'https://nftsol.app',
        'https://www.nftsol.app',
        'https://market.nftsol.app'
      ];
    } else if (isStaging) {
      // Staging: Allow staging domains
      allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
        'https://staging.nftsol.app',
        'https://staging.market.nftsol.app'
      ];
    } else {
      // Development: Allow localhost and development domains
      allowedOrigins = process.env.DEV_ALLOWED_ORIGINS?.split(',') || [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:5174',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174'
      ];
    }
    
    // Allow requests with no origin (mobile apps, curl, etc.) in development only
    if (!origin) {
      if (isProduction) {
        return callback(new Error('CORS: Origin required in production'), false);
      }
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`🚨 CORS: Blocked origin "${origin}" in ${process.env.NODE_ENV} mode`);
      callback(new Error(`CORS: Origin "${origin}" not allowed in ${process.env.NODE_ENV} mode`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token'],
  optionsSuccessStatus: 200
});

// Enhanced Helmet configuration
export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      connectSrc: ["'self'", "https://api.helius.xyz", "https://api.pinata.cloud"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// JWT Authentication middleware with secure secret validation
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const jwtSecret = process.env.JWT_SECRET;
  
  // SECURITY: JWT_SECRET must be set in environment
  if (!jwtSecret) {
    console.error('🚨 SECURITY: JWT_SECRET not set in environment');
    return res.status(500).json({ error: 'Server configuration error' });
  }
  
  // SECURITY: JWT_SECRET must be strong (minimum 32 characters)
  if (jwtSecret.length < 32) {
    console.error('🚨 SECURITY: JWT_SECRET too weak (minimum 32 characters required)');
    return res.status(500).json({ error: 'Server configuration error' });
  }
  
  jwt.verify(token, jwtSecret, (err: any, user: any) => {
    if (err) {
      console.warn(`🚨 JWT: Invalid token attempt from ${req.ip}`);
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    
    req.user = user;
    next();
  });
};

// CSRF Protection
export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return next();
  }

  const token = req.headers['x-csrf-token'] as string;
  const sessionToken = req.session?.csrfToken;

  if (!token || !sessionToken || token !== sessionToken) {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }

  next();
};

// Generate CSRF token
export const generateCSRFToken = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session) {
    req.session = {};
  }
  
  req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  res.locals.csrfToken = req.session.csrfToken;
  next();
};

// Input validation middleware
export const validateInput = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error: any) {
      res.status(400).json({
        error: 'Validation failed',
        details: error.errors
      });
    }
  };
};

// SQL Injection protection
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      // Remove potentially dangerous characters
      return obj
        .replace(/[<>]/g, '')
        .replace(/['"]/g, '')
        .replace(/[;]/g, '')
        .replace(/[()]/g, '')
        .trim();
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        sanitized[key] = sanitize(obj[key]);
      }
      return sanitized;
    }
    
    return obj;
  };

  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  req.params = sanitize(req.params);
  
  next();
};

// Security headers
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
};

// Request logging for security monitoring
export const securityLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      referer: req.get('Referer')
    };

    // Log suspicious activity
    if (res.statusCode >= 400 || duration > 5000) {
      console.warn('🚨 Security Alert:', JSON.stringify(logData));
    }
  });

  next();
};

// IP whitelist for admin endpoints
export const adminWhitelist = (req: Request, res: Response, next: NextFunction) => {
  const adminIPs = process.env.ADMIN_IPS?.split(',') || [];
  const clientIP = req.ip || req.connection.remoteAddress;

  if (adminIPs.length > 0 && clientIP && !adminIPs.includes(clientIP)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  next();
};

// Request size limits
export const requestSizeLimiter = (req: Request, res: Response, next: NextFunction) => {
  const contentLength = parseInt(req.get('content-length') || '0');
  const maxSize = 50 * 1024 * 1024; // 50MB

  if (contentLength > maxSize) {
    return res.status(413).json({ 
      ok: false,
      error: 'Request too large',
      maxSize: `${maxSize / 1024 / 1024}MB`
    });
  }

  next();
};
