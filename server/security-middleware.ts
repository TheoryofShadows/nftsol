
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import { body, validationResult, param, query } from 'express-validator';
import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import fs from 'fs';

// Rate limiting configurations
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 1000 : 100, // Higher limit for development
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'development' && req.url.includes('/src/'),
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 auth requests per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later.'
  },
  skipSuccessfulRequests: true,
});

export const nftMintLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 NFT mints per hour
  message: {
    error: 'Too many NFT minting attempts, please try again later.'
  },
});

export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 uploads per 15 minutes
  message: {
    error: 'Too many file uploads, please try again later.'
  },
});

// Helmet security configuration
export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://www.googletagmanager.com"],
      connectSrc: ["'self'", "wss:", "https:"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: "same-origin" }
});

// CORS configuration
export const corsConfig = cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.com', 'https://nftsol.app'] 
    : ['http://localhost:5173', 'http://localhost:5000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
});

// Input validation schemas
export const validateWalletAddress = [
  body('walletAddress').isLength({ min: 32, max: 44 }).matches(/^[1-9A-HJ-NP-Za-km-z]+$/),
  handleValidationErrors
];

export const validateNFTData = [
  body('name').trim().isLength({ min: 1, max: 100 }).escape(),
  body('description').trim().isLength({ min: 1, max: 1000 }).escape(),
  body('price').isFloat({ min: 0.001, max: 10000 }),
  body('royalty').isFloat({ min: 0, max: 20 }),
  handleValidationErrors
];

export const validateTransactionData = [
  body('signature').isLength({ min: 64, max: 128 }).matches(/^[A-Za-z0-9]+$/),
  body('mintAddress').isLength({ min: 32, max: 44 }).matches(/^[1-9A-HJ-NP-Za-km-z]+$/),
  body('amount').isFloat({ min: 0 }),
  handleValidationErrors
];

// Validation error handler
function handleValidationErrors(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
}

// Security headers middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Remove server information
  res.removeHeader('X-Powered-By');
  
  // Skip security headers for static assets to avoid caching conflicts
  if (req.url.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
    return next();
  }
  
  // Skip strict headers for API routes that need CORS flexibility
  const isApiRoute = req.path.startsWith('/api');
  const isAuthRoute = req.path.includes('/auth') || req.path.includes('/login');
  
  // Add custom security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Allow framing for SSR compatibility but deny for sensitive routes
  if (isAuthRoute) {
    res.setHeader('X-Frame-Options', 'DENY');
  } else {
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  }
  
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Only set HSTS in production
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  // Use flexible referrer policy for better compatibility
  res.setHeader('Referrer-Policy', isApiRoute ? 'same-origin' : 'strict-origin-when-cross-origin');
  
  next();
};

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();
  
  // Log request details
  console.log(`[${new Date().toISOString()}] ${requestId} ${req.method} ${req.url} - IP: ${req.ip}`);
  
  // Add request ID to response headers
  res.setHeader('X-Request-ID', requestId);
  
  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] ${requestId} ${res.statusCode} - ${duration}ms`);
  });
  
  next();
};

// IP whitelist for admin routes
export const adminIPWhitelist = (req: Request, res: Response, next: NextFunction) => {
  const allowedIPs = process.env.ADMIN_ALLOWED_IPS?.split(',') || [];
  const clientIP = req.ip;
  
  // Allow all IPs in development mode
  if (process.env.NODE_ENV === 'development') {
    return next();
  }
  
  if (allowedIPs.length > 0 && !allowedIPs.includes(clientIP || '')) {
    console.warn(`[SECURITY] Unauthorized admin access attempt from IP: ${clientIP}`);
    return res.status(403).json({ error: 'Access denied' });
  }
  
  next();
};

// SQL injection prevention
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  const sqlInjectionPattern = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi;
  
  const checkForSQLInjection = (obj: any): boolean => {
    for (const key in obj) {
      if (typeof obj[key] === 'string' && sqlInjectionPattern.test(obj[key])) {
        return true;
      }
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        if (checkForSQLInjection(obj[key])) return true;
      }
    }
    return false;
  };
  
  if (checkForSQLInjection(req.body) || checkForSQLInjection(req.query) || checkForSQLInjection(req.params)) {
    console.warn(`[SECURITY] Potential SQL injection attempt from IP: ${req.ip}`);
    return res.status(400).json({ error: 'Invalid input detected' });
  }
  
  next();
};

// File upload security
export const validateFileUpload = (req: Request, res: Response, next: NextFunction) => {
  if (!req.file) return next();
  
  const file = req.file;
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  // Check file type
  if (!allowedTypes.includes(file.mimetype)) {
    return res.status(400).json({ error: 'Invalid file type. Only images are allowed.' });
  }
  
  // Check file size
  if (file.size > maxSize) {
    return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
  }
  
  // Check file signature (magic numbers)
  const buffer = file.buffer || fs.readFileSync(file.path);
  const signature = buffer.toString('hex', 0, 4);
  
  const validSignatures = [
    'ffd8ffe0', 'ffd8ffe1', 'ffd8ffe2', 'ffd8ffe3', 'ffd8ffe8', // JPEG
    '89504e47', // PNG
    '47494638', // GIF
    '52494646', // WEBP
  ];
  
  if (!validSignatures.some(sig => signature.toLowerCase().startsWith(sig))) {
    return res.status(400).json({ error: 'Invalid file format detected.' });
  }
  
  next();
};

// Blockchain transaction validation
export const validateBlockchainTransaction = (req: Request, res: Response, next: NextFunction) => {
  const { signature, amount, walletAddress } = req.body;
  
  // Validate Solana signature format
  if (signature && !/^[1-9A-HJ-NP-Za-km-z]{87,88}$/.test(signature)) {
    return res.status(400).json({ error: 'Invalid transaction signature format' });
  }
  
  // Validate Solana wallet address format
  if (walletAddress && !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(walletAddress)) {
    return res.status(400).json({ error: 'Invalid Solana wallet address format' });
  }
  
  // Validate amount
  if (amount !== undefined && (isNaN(amount) || amount < 0 || amount > 1000000)) {
    return res.status(400).json({ error: 'Invalid transaction amount' });
  }
  
  next();
};

// Centralized async handler for routes
export const asyncHandler = (fn: Function) =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);

// Error handling middleware
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(`[ERROR] ${err.message}`, {
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });
  
  // Don't leak error details in production
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message;
  
  res.status(err.status || 500).json({
    error: message,
    requestId: res.getHeader('X-Request-ID')
  });
};
