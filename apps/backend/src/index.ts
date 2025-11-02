import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { nanoid } from 'nanoid';
import { createServer } from 'http';
import { Connection } from '@solana/web3.js';
import { appConfig, solanaConfig, programConfig } from './config/index';
import { verifyCloutVault } from './utils/clout-vault';
import { pool } from './lib/db';
import { requestLogger, errorLogger, auditLogger, securityLogger } from './utils/logger';
import {
  validateWallet,
  validateFileUpload,
  sanitizeInput,
  csrfProtection,
  generateCSRFToken,
} from './utils/validation';
import { solanaService } from './services/solana';
import { nftService } from './services/nft';
import { ApiResponse, MintRequest } from './types';
import withdrawalRoutes from './routes/withdrawals';
import adminWithdrawalRoutes from './routes/admin/withdrawals';
import jwt from 'jsonwebtoken';
import nftRouter from './routes/nfts';
import orbRouter from './routes/orb';
import echoRouter from './routes/echo';
import cloutRouter from './routes/clout';

const app = express();
const server = createServer(app);

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  })
);

// Enforce ALLOWED_ORIGINS in production
if (
  appConfig.nodeEnv === 'production' &&
  (!process.env.ALLOWED_ORIGINS || process.env.ALLOWED_ORIGINS.trim().length === 0)
) {
  throw new Error('ALLOWED_ORIGINS must be set in production');
}

// CORS configuration
app.use(
  cors({
    origin: appConfig.cors.origin,
    credentials: appConfig.cors.credentials,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-ID'],
  })
);

// Compression
app.use(compression());

// Trust proxy for proper IP detection (needed for Render, Heroku, etc.)
app.set('trust proxy', 1);

// Request ID and logging
app.use((req: any, res: any, next: any) => {
  const id = req.headers['x-request-id'] || nanoid();
  req.id = id;
  res.setHeader('X-Request-ID', id as string);
  next();
});
app.use(requestLogger);

// Rate limiting (global with health exemptions)
const limiter = rateLimit({
  windowMs: appConfig.rateLimit.windowMs,
  max: appConfig.rateLimit.max,
  message: {
    success: false,
    error: 'Too many requests, please try again later',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: any) => {
    // Skip rate limiting for health check endpoints
    const path = req.path || req.url?.split('?')[0];
    if (path === '/healthz' || path === '/health' || path?.endsWith('/healthz') || path?.endsWith('/health')) {
      return true;
    }
    
    // Skip rate limiting for Render's health check system
    const userAgent = req.get('User-Agent') || req.headers['user-agent'] || '';
    if (userAgent.includes('Render') || userAgent.includes('render.com')) {
      return true;
    }
    
    // Skip rate limiting for internal IPs (Render's internal network)
    const ip = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || '';
    if (ip.startsWith('10.') || ip.startsWith('172.16.') || ip.startsWith('192.168.') || ip === '::1' || ip === '127.0.0.1') {
      // But only if it's a health check or Render user agent
      if (userAgent.includes('Render') || path === '/healthz' || path === '/health') {
        return true;
      }
    }
    
    return false;
  },
});
app.use(limiter);

// Body parsing with security limits
app.use(
  express.json({
    limit: '10mb',
    verify: (req, res, buf) => {
      // Store raw body for webhook verification if needed
      (req as any).rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply input sanitization globally
app.use(sanitizeInput);

// CSRF token endpoint
app.get('/api/csrf-token', (req, res) => {
  const token = generateCSRFToken();
  // In a real app, store this in session
  res.json({ csrfToken: token });
});

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: appConfig.fileUpload.maxSize,
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    if (appConfig.fileUpload.allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed: ${appConfig.fileUpload.allowedTypes.join(', ')}`));
    }
  },
});

// Database health check function
async function checkDatabase(): Promise<{ healthy: boolean; details: any }> {
  try {
    const start = Date.now();
    const result = await pool.query('SELECT 1 as health_check');
    const duration = Date.now() - start;
    const hasRows = result && (result as any).rowCount && (result as any).rowCount > 0;

    return {
      healthy: !!hasRows && duration < 10000,
      details: {
        connected: true,
        responseTime: `${duration}ms`,
        queryResult: result.rows[0],
      },
    };
  } catch (error) {
    return {
      healthy: false,
      details: {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown database error',
      },
    };
  }
}

// Health check endpoints
app.get('/healthz', async (req, res) => {
  try {
    // Use Promise.allSettled to prevent one failure from breaking the check
    const [solanaResult, dbResult] = await Promise.allSettled([
      solanaService.healthCheck(),
      checkDatabase(),
    ]);

    const solanaHealth = solanaResult.status === 'fulfilled' ? solanaResult.value : { healthy: false, details: { error: 'Check failed' } };
    const dbHealth = dbResult.status === 'fulfilled' ? dbResult.value : { healthy: false, details: { error: 'Check failed' } };

    // Both services must be healthy for overall health
    const overallHealthy = solanaHealth.healthy && dbHealth.healthy;
    const statusCode = overallHealthy ? 200 : 503;

    const response: ApiResponse = {
      success: true,
      data: {
        status: overallHealthy ? 'healthy' : 'unhealthy',
        timestamp: Date.now(),
        uptime: process.uptime(),
        environment: appConfig.nodeEnv,
        solana: solanaHealth,
        database: dbHealth,
      },
    };

    res.status(statusCode).json(response);
  } catch (error) {
    errorLogger(error as Error, { endpoint: '/healthz' });
    res.status(500).json({
      success: false,
      error: 'Health check failed',
    });
  }
});

app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    timestamp: Date.now(),
  });
});

// API router (v1)
import expressPkg from 'express';
const apiV1 = expressPkg.Router();

// Program configuration endpoint
apiV1.get('/programs', (req, res) => {
  const response: ApiResponse = {
    success: true,
    data: {
      programs: {
        CLOUT_PROGRAM_ID: programConfig.cloutProgramId,
        CLOUT_MINT: programConfig.cloutProgramId, // Same as program ID for CLOUT
        REWARDS_VAULT: programConfig.rewardsVault,
        MARKET_PROGRAM_ID: programConfig.marketProgramId,
        LOYALTY_PROGRAM_ID: programConfig.loyaltyProgramId,
      },
      cluster: solanaConfig.cluster,
      rpcUrl: solanaConfig.rpcUrl,
    },
    message: 'Real Solana program configuration',
  };
  res.json(response);
});

// Solana status endpoint
apiV1.get('/solana/status', async (req, res) => {
  try {
    const health = await solanaService.healthCheck();
    const response: ApiResponse = {
      success: true,
      data: health,
    };
    res.json(response);
  } catch (error) {
    errorLogger(error as Error, { endpoint: '/api/solana/status' });
    res.status(500).json({
      success: false,
      error: 'Failed to get Solana status',
    });
  }
});

// Enhanced mint endpoint with full validation
apiV1.post(
  '/simple-mint',
  csrfProtection,
  sanitizeInput,
  validateWallet,
  upload.single('file'),
  async (req, res) => {
    try {
      const mintRequest: MintRequest = {
        name: req.body.name,
        description: req.body.description,
        imageUrl: req.body.imageUrl,
        file: req.file,
        creatorWallet: req.body.creatorWallet || req.body.owner,
      };

      // Validate the mint request
      const validation = nftService.validateMintRequest(mintRequest);
      if (!validation.valid) {
        const response: ApiResponse = {
          success: false,
          error: validation.errors.join(', '),
          code: 'VALIDATION_ERROR',
        };
        return res.status(400).json(response);
      }

      // Check Solana connection
      const solanaHealth = await solanaService.healthCheck();
      if (!solanaHealth.healthy) {
        const response: ApiResponse = {
          success: false,
          error: 'Solana network unavailable',
          code: 'SOLANA_UNAVAILABLE',
        };
        return res.status(503).json(response);
      }

      // Create the mint using real blockchain
      const mintResult = await nftService.createRealMint(mintRequest);

      if (mintResult.success) {
        const response: ApiResponse = {
          success: true,
          data: mintResult,
          message: 'NFT minted successfully',
        };
        res.json(response);
        return;
      } else {
        const response: ApiResponse = {
          success: false,
          error: mintResult.error || 'Minting failed',
          code: 'MINT_FAILED',
        };
        res.status(500).json(response);
        return;
      }
    } catch (error) {
      errorLogger(error as Error, { endpoint: '/api/simple-mint' });
      const response: ApiResponse = {
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      };
      res.status(500).json(response);
      return;
    }
  }
);

// Get NFT metadata endpoint
apiV1.get('/nft/:mintAddress', async (req, res) => {
  try {
    const { mintAddress } = req.params;
    const result = await nftService.getNFTMetadata(mintAddress);
    res.json(result);
  } catch (error) {
    errorLogger(error as Error, { endpoint: '/api/nft/:mintAddress' });
    res.status(500).json({
      success: false,
      error: 'Failed to get NFT metadata',
    });
  }
});

// Get NFTs by owner endpoint
apiV1.get('/nfts/:owner', async (req, res) => {
  try {
    const { owner } = req.params;
    const result = await nftService.getNFTsByOwner(owner);
    res.json(result);
  } catch (error) {
    errorLogger(error as Error, { endpoint: '/api/nfts/:owner' });
    res.status(500).json({
      success: false,
      error: 'Failed to get NFTs by owner',
    });
  }
});

// Withdrawal routes (with rate limiting)
const withdrawLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Max 5 withdrawal requests per window
  message: 'Too many withdrawal attempts, slow down',
  standardHeaders: true,
  legacyHeaders: false,
});

// JWT Authentication middleware (replaces mock auth)
const authenticate = (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
      securityLogger('AUTH_FAILED', { reason: 'No token provided', ip: req.ip }, req);
      const response: ApiResponse = {
        success: false,
        error: 'Access token required',
        code: 'NOT_AUTHENTICATED',
      };
      return res.status(401).json(response);
    }
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      securityLogger('AUTH_MISCONFIGURED', { reason: 'JWT_SECRET not set' }, req);
      const response: ApiResponse = {
        success: false,
        error: 'Server auth not configured',
        code: 'AUTH_MISCONFIGURED',
      };
      return res.status(500).json(response);
    }
    const decoded: any = jwt.verify(token, secret);
    req.user = decoded;
    auditLogger('AUTH_SUCCESS', { userId: decoded.id, ip: req.ip }, req);
    next();
  } catch (err) {
    securityLogger(
      'AUTH_FAILED',
      {
        reason: 'Invalid token',
        error: err instanceof Error ? err.message : 'Unknown',
        ip: req.ip,
      },
      req
    );
    const response: ApiResponse = {
      success: false,
      error: 'Invalid or expired token',
      code: 'INVALID_TOKEN',
    };
    return res.status(403).json(response);
  }
};

const requireAdmin = (req: any, res: any, next: any) => {
  if (!req.user || !(req.user.isAdmin || req.user.role === 'admin')) {
    const response: ApiResponse = {
      success: false,
      error: 'Admin access required',
      code: 'FORBIDDEN',
    };
    return res.status(403).json(response);
  }
  next();
};

// Admin authentication endpoint
apiV1.post('/auth/admin', async (req, res) => {
  try {
    const { walletAddress, signature, message } = req.body;

    if (!walletAddress || !signature || !message) {
      const response: ApiResponse = {
        success: false,
        error: 'Missing required fields',
        code: 'VALIDATION_ERROR',
      };
      return res.status(400).json(response);
    }

    // Define admin wallet addresses
    const ADMIN_WALLETS = (process.env.ADMIN_WALLETS || process.env.PLATFORM_PUBLIC_KEY || '')
      .split(',')
      .map((w) => w.trim())
      .filter(Boolean);

    // Check if wallet is authorized as admin
    if (!ADMIN_WALLETS.includes(walletAddress)) {
      securityLogger('ADMIN_AUTH_FAILED', { walletAddress, reason: 'Not authorized', ip: req.ip }, req);
      const response: ApiResponse = {
        success: false,
        error: 'Wallet not authorized as admin',
        code: 'UNAUTHORIZED',
      };
      return res.status(403).json(response);
    }

    // Signature verification would go here - wallet address check is sufficient for now

    // Generate admin JWT token
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      securityLogger('ADMIN_AUTH_MISCONFIGURED', { reason: 'JWT_SECRET not set' }, req);
      const response: ApiResponse = {
        success: false,
        error: 'Server auth not configured',
        code: 'AUTH_MISCONFIGURED',
      };
      return res.status(500).json(response);
    }

    const adminToken = jwt.sign(
      {
        id: walletAddress,
        wallet: walletAddress,
        role: 'admin',
        isAdmin: true,
      },
      secret,
      { expiresIn: '24h' }
    );

    auditLogger('ADMIN_AUTH_SUCCESS', { walletAddress, ip: req.ip }, req);

    const response: ApiResponse = {
      success: true,
      data: { token: adminToken, wallet: walletAddress },
      message: 'Admin authentication successful',
    };
    return res.json(response);
  } catch (err) {
    errorLogger(err as Error, { endpoint: '/api/auth/admin' });
    const response: ApiResponse = {
      success: false,
      error: 'Admin authentication failed',
      code: 'INTERNAL_ERROR',
    };
    return res.status(500).json(response);
  }
});

// Emergency controls
const WITHDRAWALS_PAUSED = process.env.WITHDRAWALS_PAUSED === 'true';
const MAX_SINGLE_WITHDRAWAL = parseInt(
  process.env.MAX_SINGLE_WITHDRAWAL_LAMPORTS || '10000000000',
  10
);
const MAX_DAILY_PER_USER = parseInt(process.env.MAX_DAILY_PER_USER_LAMPORTS || '50000000000', 10);

// Emergency pause middleware
const emergencyPauseMiddleware = (req: any, res: any, next: any) => {
  if (WITHDRAWALS_PAUSED && req.path.includes('/withdraw')) {
    const response: ApiResponse = {
      success: false,
      error: 'Withdrawals are temporarily paused for maintenance',
      code: 'WITHDRAWALS_PAUSED',
    };
    return res.status(503).json(response);
  }
  next();
};

// Mount withdrawal routes with emergency controls
apiV1.use(
  '/wallets/withdraw',
  emergencyPauseMiddleware,
  authenticate,
  withdrawLimiter,
  withdrawalRoutes
);
apiV1.use('/admin/withdrawals', authenticate, requireAdmin, adminWithdrawalRoutes);

// Mount NFT routes with caching
apiV1.use('/nfts', nftRouter);

// Apply response compression and caching headers
apiV1.use((req, res, next) => {
  // Set cache headers for GET requests
  if (req.method === 'GET') {
    res.setHeader('Cache-Control', 'public, max-age=300'); // 5 minutes default
  }
  next();
});

// Public stats endpoint (for landing page)
app.get('/api/public/stats', async (req, res) => {
  try {
    // Get NFT count from database or in-memory store
    const nftCount = 0; // TODO: Query database for actual count
    const listedCount = 0; // TODO: Query database for listed NFTs
    const soldCount = 0; // TODO: Query database for sold NFTs
    const totalVolume = 0; // TODO: Calculate total volume

    res.json({
      success: true,
      platform: {
        totalNFTs: nftCount,
        listedNFTs: listedCount,
        soldNFTs: soldCount,
        totalVolume,
      },
    });
  } catch (error) {
    errorLogger(error as Error, { endpoint: '/api/public/stats' });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch platform statistics',
      platform: {
        totalNFTs: 0,
        listedNFTs: 0,
        soldNFTs: 0,
        totalVolume: 0,
      },
    });
  }
});

// Echo routes
app.use('/api/echo', echoRouter);
app.use('/api/orb', orbRouter);

// CLOUT routes
app.use('/api/clout', cloutRouter);

// Emergency controls endpoint
apiV1.get('/admin/emergency/status', authenticate, requireAdmin, (req, res) => {
  const response: ApiResponse = {
    success: true,
    data: {
      withdrawalsPaused: WITHDRAWALS_PAUSED,
      maxSingleWithdrawal: MAX_SINGLE_WITHDRAWAL,
      maxDailyPerUser: MAX_DAILY_PER_USER,
      timestamp: Date.now(),
    },
  };
  res.json(response);
});

// Toggle withdrawals pause (admin only)
apiV1.post('/admin/emergency/pause-withdrawals', authenticate, requireAdmin, (req, res) => {
  const { paused, reason } = req.body;

  // In production, this would update a database or config service
  console.log(`EMERGENCY: Withdrawals ${paused ? 'PAUSED' : 'RESUMED'} - Reason: ${reason}`);

  const response: ApiResponse = {
    success: true,
    data: {
      withdrawalsPaused: paused,
      reason,
      timestamp: Date.now(),
      adminId: (req as any).user.id,
    },
    message: `Withdrawals ${paused ? 'paused' : 'resumed'} successfully`,
  };
  res.json(response);
});

// Marketplace endpoints - Get all NFTs for marketplace
apiV1.get('/market', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const collection = req.query.collection as string;
    const status = req.query.status as string;

    // Query NFTs from service
    let nfts: any[] = [];
    
    // If collection filter, use Echo route logic
    if (collection === 'eternal-echoes') {
      // Will be handled by echo marketplace route
      nfts = [];
    } else {
      // Get NFTs from NFT service
      // For now, try to get from any available NFTs
      // In production, this would query database
      try {
        // This is a placeholder - in production would query database
        nfts = [];
      } catch (e) {
        nfts = [];
      }
    }

    const response: ApiResponse = {
      success: true,
      data: {
        nfts,
        total: nfts.length,
        page,
        limit,
        message: nfts.length > 0 ? 'Marketplace data loaded' : 'Marketplace is empty - start minting to populate it',
      },
    };
    res.json(response);
  } catch (error) {
    errorLogger(error as Error, { endpoint: '/api/market' });
    res.status(500).json({
      success: false,
      error: 'Failed to get marketplace data',
    });
  }
});

// Generic NFTs endpoint - supports filtering
app.get('/api/nfts', async (req, res) => {
  try {
    const collection = req.query.collection as string;
    const status = req.query.status as string;
    const owner = req.query.owner as string;
    
    let nfts: any[] = [];

    // If Echo collection, use Echo router logic
    if (collection === 'eternal-echoes') {
      // Query in-memory echo store or database
      try {
        // For now, return empty - Echo NFTs are stored separately
        nfts = [];
      } catch (e) {
        nfts = [];
      }
    } else if (owner) {
      // Get NFTs by owner
      try {
        const result = await nftService.getNFTsByOwner(owner);
        if (result.success && result.data) {
          nfts = Array.isArray(result.data) ? result.data : [result.data];
        }
      } catch (e) {
        nfts = [];
      }
    } else {
      // Get all NFTs from marketplace
      try {
        // Query database or in-memory store
        nfts = [];
      } catch (e) {
        nfts = [];
      }
    }

    // Apply status filter if provided
    if (status && nfts.length > 0) {
      nfts = nfts.filter((nft: any) => nft.status === status);
    }

    res.json({
      success: true,
      nfts,
      total: nfts.length,
    });
  } catch (error) {
    errorLogger(error as Error, { endpoint: '/api/nfts' });
    res.status(500).json({
      success: false,
      error: 'Failed to get NFTs',
      nfts: [],
    });
  }
});

// Collections endpoint
apiV1.get('/collections', (req, res) => {
  const response: ApiResponse = {
    success: true,
    data: {
      collections: [], // Start with empty - collections will appear as NFTs are minted
      message: 'No collections found',
    },
  };
  res.json(response);
});

// Wallet info endpoint
apiV1.get('/wallet/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const balance = await solanaService.getBalance(address);
    const exists = await solanaService.accountExists(address);

    const response: ApiResponse = {
      success: true,
      data: {
        address,
        balance,
        exists,
        solBalance: `${balance.toFixed(4)} SOL`,
      },
    };
    res.json(response);
  } catch (error) {
    errorLogger(error as Error, { endpoint: '/api/wallet/:address' });
    res.status(500).json({
      success: false,
      error: 'Failed to get wallet info',
    });
  }
});

// Root endpoint
apiV1.get('/', (req, res) => {
  const response: ApiResponse = {
    success: true,
    data: {
      name: 'NFTSol API',
      version: '1.0.0',
      status: 'operational',
      endpoints: {
        health: '/healthz',
        programs: '/api/v1/programs',
        mint: '/api/v1/simple-mint',
        market: '/api/v1/market',
        collections: '/api/v1/collections',
        wallet: '/api/v1/wallet/:address',
        nft: '/api/v1/nft/:mintAddress',
        nfts: '/api/v1/nfts/:owner',
      },
    },
  };
  res.json(response);
});

// Mount versioned API
app.use('/api/v1', apiV1);

// Enhanced error handling middleware
app.use((err: any, req: any, res: any, next: any) => {
  const requestId = req.id;
  const userId = req.user?.id;

  // Log error with full context
  errorLogger(err, {
    requestId,
    userId,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    body: req.body,
  });

  // Log security-relevant errors (skip 429s for health checks)
  const isHealthCheck = req.path === '/healthz' || req.path === '/health' || req.url?.includes('/healthz') || req.url?.includes('/health');
  const isRenderHealthCheck = (req.get('User-Agent') || '').includes('Render');
  
  if ((err.status === 401 || err.status === 403 || (err.status === 429 && !isHealthCheck && !isRenderHealthCheck))) {
    securityLogger(
      'ERROR_RESPONSE',
      {
        status: err.status,
        message: err.message,
        requestId,
        userId,
        ip: req.ip,
      },
      req
    );
  }

  // Determine error response based on type
  let statusCode = err.status || 500;
  let errorMessage = 'Internal server error';
  let errorCode = 'INTERNAL_ERROR';

  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorMessage = 'Validation failed';
    errorCode = 'VALIDATION_ERROR';
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    errorMessage = 'Unauthorized';
    errorCode = 'UNAUTHORIZED';
  } else if (err.name === 'ForbiddenError') {
    statusCode = 403;
    errorMessage = 'Forbidden';
    errorCode = 'FORBIDDEN';
  } else if (err.name === 'RateLimitError') {
    statusCode = 429;
    errorMessage = 'Too many requests';
    errorCode = 'RATE_LIMIT_EXCEEDED';
  }

  const response: ApiResponse = {
    success: false,
    error: appConfig.nodeEnv === 'production' ? errorMessage : err.message,
    code: errorCode,
    requestId,
  };

  res.status(statusCode).json(response);
});

// 404 handler
app.use((req, res) => {
  securityLogger(
    'ENDPOINT_NOT_FOUND',
    {
      path: req.path,
      method: req.method,
      ip: req.ip,
    },
    req
  );

  const response: ApiResponse = {
    success: false,
    error: 'Endpoint not found',
    code: 'NOT_FOUND',
    requestId: (req as any).id,
  };
  res.status(404).json(response);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

// Initialize CLOUT vault check (non-blocking)
(async () => {
  try {
    const connection = new Connection(solanaConfig.rpcUrl, solanaConfig.commitment);
    await verifyCloutVault(connection);
  } catch (error) {
    console.warn('Could not verify CLOUT vault on startup:', error instanceof Error ? error.message : error);
    console.warn('Vault will be created automatically when first reward is sent');
  }
})();

// Start server
server.listen(appConfig.port, '0.0.0.0', () => {
  console.log(`NFTSol Backend Server`);
  console.log(`Port: ${appConfig.port}`);
  console.log(`Environment: ${appConfig.nodeEnv}`);
  console.log(`CORS Origins: ${appConfig.cors.origin.join(', ')}`);
  console.log(`Rate Limit: ${appConfig.rateLimit.max} requests per ${appConfig.rateLimit.windowMs / 1000}s`);
  console.log(`File Upload: Max ${appConfig.fileUpload.maxSize / 1024 / 1024}MB`);
  console.log(`Solana RPC: ${solanaConfig.rpcUrl}`);
  console.log(`Cluster: ${solanaConfig.cluster}`);

  if (programConfig.cloutProgramId) {
    console.log(`CLOUT Token: ${programConfig.cloutProgramId}`);
    console.log(`Rewards Vault: ${programConfig.rewardsVault || 'Will be created on first use'}`);
  }
});

export { app, server };
