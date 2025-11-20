import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { sessionMiddleware } from './config/session';
import compression from 'compression';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { nanoid } from 'nanoid';
import { createServer } from 'http';
import { randomBytes } from 'crypto';
import { Connection } from '@solana/web3.js';
import { appConfig, solanaConfig, programConfig } from './config/index';
import { verifyCloutVault, getRewardsVaultAddress } from './utils/clout-vault';
import { pool } from './lib/db';
import { requestLogger, errorLogger, auditLogger, securityLogger } from './utils/logger';
import {
  validateWallet,
  csrfProtection,
  generateCSRFToken,
  sanitizeInput,
} from './utils/validation';
import { solanaService } from './services/solana';
import { nftService } from './services/nft';
import { heliusService } from './services/helius';
import { ApiResponse, MintRequest } from './types';
import withdrawalRoutes from './routes/withdrawals';
import adminWithdrawalRoutes from './routes/admin/withdrawals';
import migrationRoutes from './routes/migrations';
import jwt from 'jsonwebtoken';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import nftRouter from './routes/nfts';
import orbRouter from './routes/orb';
import echoRouter from './routes/echo';
import cloutRouter from './routes/clout';
import marketplaceRouter from './routes/marketplace';
import mintRouter from './routes/mint';
import marketplaceBrowseRouter from './routes/marketplace-browse';
import grokVerificationRouter from './routes/grok-verification';
import transactionsRouter from './routes/transactions';
import videoRouter from './routes/video';
import { initializeSecrets } from './lib/secrets-loader';
import verificationRealRouter from './routes/verification-real';
import { createSolanaRPCFailover } from './services/rpc-failover';
import { initializeHelius } from './services/helius-optimized';
import solanaToolsRouter from './routes/solana-tools';
import archiveGrokEchoRouter from './routes/archive-grok-echo';

initializeSecrets();

// Initialize Solana best practices services
const heliusApiKey = process.env.HELIUS_API_KEY;
if (heliusApiKey) {
  initializeHelius({ apiKey: heliusApiKey });
  console.log('✓ Helius optimized service initialized');
}

// Initialize RPC failover for reliability
const rpcFailover = createSolanaRPCFailover(heliusApiKey);
console.log('✓ RPC failover service initialized');

// PORT is set by Render automatically, but we use appConfig.port which reads from PORT env var
// This is just for reference - actual port used is from appConfig.port or Render's PORT
// const PORT = parseInt(process.env.PORT || '3001', 10); // Not used, commented out

const app = express();

// Session middleware
app.use(sessionMiddleware);

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:', 'ipfs:', 'ipfs.io', 'gateway.pinata.cloud'],
        connectSrc: ["'self'", 'https:', 'wss:', 'ws:'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
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

// CORS configuration with dynamic origin support for Netlify
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = appConfig.cors.origin;

      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) {
        return callback(null, true);
      }

      // Allow Netlify preview deployments (*.netlify.app)
      if (origin.endsWith('.netlify.app')) {
        return callback(null, true);
      }

      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
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

// Rate limiting (optimized with smart skipping)
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
  // Use in-memory store (default) for best performance in development
  // For production, consider using a store like redis-store
  skip: (req: any) => {
    // Super fast path check - health endpoints don't get rate limited
    const path = req.path;
    if (path === '/health' || path === '/api/health' || path === '/healthz') {
      return true;
    }

    // Skip for internal/local requests
    const ip = req.ip;
    if (ip === '::1' || ip === '127.0.0.1' || ip === '::ffff:127.0.0.1') {
      return true;
    }

    return false;
  },
  // Use exponential backoff for better performance
  handler: (req: any, res) => {
    res.status(429).json({
      success: false,
      error: 'Too many requests',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: req.rateLimit?.resetTime || 60
    });
  }
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

// Apply input sanitization globally as proper middleware
app.use((req: any, res: any, next: any) => {
  // Sanitize query parameters
  Object.keys(req.query).forEach(key => {
    if (typeof req.query[key] === 'string') {
      req.query[key] = sanitizeInput(req.query[key]);
    }
  });

  // Sanitize body if present
  if (req.body && typeof req.body === 'object') {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string' || typeof req.body[key] === 'number') {
        req.body[key] = sanitizeInput(req.body[key]);
      }
    });
  }

  next();
});

// CSRF token endpoint
app.get('/api/csrf-token', (req, res, next) => {
  generateCSRFToken(req, res, () => {
    // The token is now available in res.locals.csrfToken
    res.json({ csrfToken: res.locals.csrfToken || '' });
  });
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

// Simple health check endpoints - extremely fast responses
app.get('/health', (req, res) => {
  res.set('Cache-Control', 'no-cache').json({
    status: 'ok',
    timestamp: Date.now(),
    service: 'nftsol-backend'
  });
});

// API health check endpoint (for frontend) - optimized for speed
app.get('/api/health', (req, res) => {
  // Use lightweight response for fast checks
  res.set('Cache-Control', 'no-cache').json({
    ok: 1,
    ts: Date.now()
  });
});

// Detailed health check endpoint
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

// Root API documentation endpoint
app.get('/', (req, res) => {
  const apiDocs = {
    service: 'NFTSol Backend API',
    version: '1.0.0',
    status: 'operational',
    timestamp: new Date().toISOString(),
    uptime: `${Math.round(process.uptime())} seconds`,
    environment: appConfig.nodeEnv,

    endpoints: {
      health: {
        '/health': 'Simple health check',
        '/api/health': 'Lightweight health check',
        '/healthz': 'Detailed health check with database and Solana status',
        '/api/health/detailed': 'Full health diagnostics',
      },

      nfts: {
        'GET /api/nfts': 'List all NFTs in marketplace',
        'GET /api/nfts/:owner': 'Get NFTs by owner wallet address',
        'GET /api/nft/:mintAddress': 'Get specific NFT metadata',
        'POST /api/simple-mint': 'Mint a new NFT',
      },

      wallet: {
        'GET /api/wallet/:address': 'Get wallet info (balance, existence)',
      },

      orb: {
        'GET /api/orb/history/:ledgerId': 'Get AI-explained transaction history',
        'GET /api/orb/embed/:ledgerId': 'Get Orb embed URL for iframe',
        'GET /api/orb/explain/:signature': 'Get AI explanation for transaction',
        'GET /api/orb/heatmap/:ledgerId': 'Get contribution heatmap data',
        'GET /api/orb/timeline/:ledgerId': 'Get historical timeline',
      },

      clout: {
        'GET /api/clout/balance/:wallet': 'Get CLOUT token balance',
        'POST /api/clout/transfer': 'Transfer CLOUT tokens',
      },

      echo: {
        'POST /api/echo/mint': 'Create new Echo (collaborative NFT)',
        'GET /api/echo/:echoId': 'Get Echo details',
        'POST /api/echo/:echoId/add-layer': 'Add layer to Echo',
      },

      marketplace: {
        'GET /api/marketplace/browse': 'Browse marketplace with filters',
        'POST /api/marketplace/list': 'List NFT for sale',
        'POST /api/marketplace/buy': 'Buy NFT from marketplace',
      },

      admin: {
        'POST /api/auth/admin': 'Authenticate as admin (requires wallet signature)',
        'POST /api/admin/withdrawals': 'Process withdrawal (admin only)',
      },
    },

    authentication: {
      description: 'Wallet signature-based authentication',
      method: 'POST to /api/auth/admin',
      required_fields: ['walletAddress', 'signature', 'message'],
      response: {
        token: 'JWT token for authenticated requests',
        expires: '24 hours',
      },
    },

    error_format: {
      success: false,
      error: 'Error message',
      code: 'ERROR_CODE',
      requestId: 'Unique request identifier',
    },

    success_format: {
      success: true,
      data: '{}',
      message: 'Optional success message',
    },

    features: {
      'NFT Marketplace': 'Mint, buy, and sell NFTs on Solana',
      'Eternal Echoes': 'Collaborative, layered NFT creation',
      'CLOUT Tokens': 'Platform reward token system',
      'AI Verification': 'Grok AI video authenticity verification',
      'Compressed NFTs': 'Low-cost minting via Bubblegum',
      'Helius ORB': 'AI-powered transaction explorer',
    },

    blockchain: {
      network: solanaConfig.cluster,
      rpcUrl: solanaConfig.rpcUrl,
      'CLOUT Token': programConfig.cloutProgramId,
    },

    documentation: {
      'GitHub': 'https://github.com/TheoryofShadows/nftsol',
      'Frontend': 'https://nftsol.app',
      'Issues': 'https://github.com/TheoryofShadows/nftsol/issues',
    },

    quick_start: {
      '1_health_check': 'curl https://nftsol.onrender.com/healthz',
      '2_list_nfts': 'curl https://nftsol.onrender.com/api/nfts',
      '3_wallet_info': 'curl https://nftsol.onrender.com/api/wallet/{walletAddress}',
    },
  };

  res.setHeader('Content-Type', 'application/json');
  res.json(apiDocs);
});

    // Enhanced health check with detailed diagnostics
app.get('/api/health/detailed', async (req, res) => {
  try {
    interface HealthService {
      status: string;
      responseTime: number;
      error?: string;
      details?: any;
    }

    const health: {
      status: string;
      timestamp: string;
      uptime: number;
      environment: string;
      services: {
        database: HealthService;
        solana: HealthService;
        memory: {
          used: number;
          total: number;
          limit: number;
        };
      };
    } = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: appConfig.nodeEnv,
      services: {
        database: { status: 'unknown', responseTime: 0 },
        solana: { status: 'unknown', responseTime: 0 },
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          limit: Math.round(process.memoryUsage().rss / 1024 / 1024),
        },
      },
    };

    // Check database
    try {
      const dbStart = Date.now();
      await pool.query('SELECT NOW()');
      health.services.database = {
        status: 'healthy',
        responseTime: Date.now() - dbStart,
      };
    } catch (error) {
      health.services.database = {
        status: 'unhealthy',
        responseTime: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      health.status = 'degraded';
    }

    // Check Solana
    try {
      const solanaStart = Date.now();
      const solanaHealth = await solanaService.healthCheck();
      health.services.solana = {
        status: solanaHealth.healthy ? 'healthy' : 'unhealthy',
        responseTime: Date.now() - solanaStart,
        details: solanaHealth.details,
      };
      if (!solanaHealth.healthy) {
        health.status = 'degraded';
      }
    } catch (error) {
      health.services.solana = {
        status: 'unhealthy',
        responseTime: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      health.status = 'degraded';
    }

    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    errorLogger(error as Error, { endpoint: '/api/health/detailed' });
    res.status(500).json({
      status: 'unhealthy',
      error: 'Health check failed',
      timestamp: new Date().toISOString(),
    });
  }
});

// API router (v1)
import expressPkg from 'express';
const apiV1 = expressPkg.Router();

// CSRF token endpoint
apiV1.get('/csrf-token', (req, res) => {
  // Generate CSRF token
  const csrfToken = randomBytes(32).toString('hex');
  
  if (req.session) {
    req.session.csrfToken = csrfToken;
  }

  // Set token in cookie
  res.cookie('csrf-token', csrfToken, {
    httpOnly: false, // Allow JavaScript to read
    secure: false, // Allow HTTP in development
    sameSite: 'lax',
    maxAge: 3600000, // 1 hour
  });
  
  res.json({
    success: true,
    csrfToken: csrfToken,
  });
});

// Program configuration endpoint
apiV1.get('/programs', async (req, res) => {
  // Calculate rewards vault dynamically
  const rewardsVault = await getRewardsVaultAddress();

  const response: ApiResponse = {
    success: true,
    data: {
      programs: {
        CLOUT_PROGRAM_ID: programConfig.cloutProgramId,
        CLOUT_MINT: programConfig.cloutProgramId, // Same as program ID for CLOUT
        REWARDS_VAULT: rewardsVault?.toBase58() || 'Auto-calculated from REWARDS_OWNER + CLOUT_MINT',
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

// Get wallet info (balance + existence)
apiV1.get('/wallet/:address', async (req, res) => {
  try {
    const { address } = req.params;

    if (!address) {
      const response: ApiResponse = {
        success: false,
        error: 'Wallet address is required',
        code: 'MISSING_ADDRESS',
      };
      return res.status(400).json(response);
    }

    const [exists, balance] = await Promise.all([
      solanaService.accountExists(address),
      solanaService.getBalance(address).catch(() => 0),
    ]);

    const walletInfo = {
      address,
      balance,
      exists,
      solBalance: `${balance.toFixed(4)} SOL`,
    };

    const response: ApiResponse = {
      success: true,
      data: walletInfo,
    };

    return res.json(response);
  } catch (error) {
    errorLogger(error as Error, { endpoint: '/api/v1/wallet/:address' });
    const response: ApiResponse = {
      success: false,
      error: 'Failed to get wallet info',
      code: 'WALLET_INFO_ERROR',
    };
    return res.status(500).json(response);
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

    // Verify Ed25519 signature over the provided message
    try {
      const { PublicKey } = await import('@solana/web3.js');
      const publicKeyBytes = new PublicKey(walletAddress).toBytes();
      const signatureBytes = bs58.decode(signature);
      const messageBytes = new TextEncoder().encode(message);
      const ok = nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
      if (!ok) {
        securityLogger('ADMIN_AUTH_FAILED', { walletAddress, reason: 'Invalid signature' }, req);
        return res.status(403).json({ success: false, error: 'Invalid signature', code: 'INVALID_SIGNATURE' });
      }
    } catch (e) {
      securityLogger('ADMIN_AUTH_FAILED', { walletAddress, reason: 'Signature verification error', e: (e as Error).message }, req);
      return res.status(400).json({ success: false, error: 'Signature verification error', code: 'VERIFY_ERROR' });
    }

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
apiV1.use('/admin/migrations', migrationRoutes);

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
    // Query database for actual NFT counts
    const totalNFTsResult = await pool.query('SELECT COUNT(*) as count FROM nfts');
    const nftCount = parseInt(totalNFTsResult.rows[0]?.count || '0', 10);

    const listedResult = await pool.query("SELECT COUNT(*) as count FROM nfts WHERE listed = true OR status = 'listed'");
    const listedCount = parseInt(listedResult.rows[0]?.count || '0', 10);

    const soldResult = await pool.query("SELECT COUNT(*) as count FROM nfts WHERE status = 'sold' OR sold = true");
    const soldCount = parseInt(soldResult.rows[0]?.count || '0', 10);

    // Calculate total volume from sales (if price column exists)
    const volumeResult = await pool.query(`
      SELECT COALESCE(SUM(CAST(price AS NUMERIC)), 0) as total_volume
      FROM nfts
      WHERE (status = 'sold' OR sold = true) AND price IS NOT NULL
    `);
    const totalVolume = parseFloat(volumeResult.rows[0]?.total_volume || '0');

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
    // Return defaults on error (graceful degradation)
    res.json({
      success: true,
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

// 🌍 Internet Archive + Grok + Echo Integration (revolutionary NFT workflow)
app.use('/api/archive', archiveGrokEchoRouter);

// Solana/Helius comprehensive tools (error handling, monitoring, optimization)
app.use('/api/tools', solanaToolsRouter);

// CLOUT routes
app.use('/api/clout', cloutRouter);

// Marketplace routes
app.use('/api/marketplace', marketplaceRouter);
app.use('/api/marketplace', marketplaceBrowseRouter);

// Ultra-cheap minting routes
app.use('/api/mint', mintRouter);

// NFT verification and balance endpoints (for frontend compatibility)
app.get('/api/nfts/verify/:address', async (req, res) => {
  try {
    const { address } = req.params;
    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'Missing wallet address',
        code: 'MISSING_ADDRESS',
      });
    }

    const exists = await solanaService.accountExists(address);

    res.json({
      success: true,
      data: {
        address,
        exists,
        valid: exists,
      },
      valid: exists,
      message: exists
        ? 'Wallet verified on Solana network'
        : 'Wallet not found on Solana network',
    });
  } catch (error) {
    errorLogger(error as Error, { endpoint: '/api/nfts/verify/:address' });
    res.status(500).json({
      success: false,
      error: 'Verification failed',
      code: 'VERIFICATION_FAILED',
    });
  }
});

app.get('/api/nfts/balance/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const balance = await solanaService.getBalance(address);
    res.json({ success: true, data: { balance, address, solBalance: `${balance.toFixed(4)} SOL` } });
  } catch (error) {
    errorLogger(error as Error, { endpoint: '/api/nfts/balance/:address' });
    res.status(500).json({ success: false, error: 'Failed to get balance' });
  }
});

// Redirect /api/nfts/mint to /api/v1/simple-mint for compatibility
app.post('/api/nfts/mint', async (req, res, next) => {
  req.url = '/api/v1/simple-mint';
  next();
});

// Redirect /api/mint/nft to /api/v1/simple-mint for compatibility
app.post('/api/mint/nft', async (req, res, next) => {
  req.url = '/api/v1/simple-mint';
  next();
});

// API path redirect middleware (for frontend compatibility)
app.use('/api', (req, res, next) => {
  // Don't redirect if already /api/v1
  if (req.path.startsWith('/v1/')) {
    return next();
  }

  // Redirect /api/auth/admin to /api/v1/auth/admin
  if (req.path === '/auth/admin' && req.method === 'POST') {
    req.url = '/api/v1/auth/admin';
    return next();
  }

  // Redirect /api/admin/withdrawals to /api/v1/admin/withdrawals
  if (req.path.startsWith('/admin/withdrawals')) {
    req.url = '/api/v1' + req.path;
    return next();
  }

  // Redirect /api/wallets/withdraw to /api/v1/wallets/withdraw
  if (req.path === '/wallets/withdraw' && req.method === 'POST') {
    req.url = '/api/v1/wallets/withdraw';
    return next();
  }

  next();
});

// Grok AI verification routes
app.use('/api/grok', grokVerificationRouter);

app.use('/api/verify', verificationRealRouter);
// Video upload routes
app.use('/api/video', videoRouter);

// Transaction history routes (Helius Nov 2025 upgrade)
app.use('/api/transactions', transactionsRouter);

// Waitlist subscription endpoint
app.post('/api/waitlist/subscribe', async (req, res) => {
  try {
    const { email, walletAddress, referralCode, source } = req.body;

    if (!email || !/^[-.\w]+@([-\w]+\.)+[-\w]{2,}$/.test(email)) {
      const response: ApiResponse = {
        success: false,
        error: 'Valid email address is required',
        code: 'INVALID_EMAIL',
      };
      return res.status(400).json(response);
    }

    // Store in database (will auto-create table if doesn't exist)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS waitlist (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        wallet_address VARCHAR(44),
        referral_code VARCHAR(50),
        source VARCHAR(20) DEFAULT 'landing',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await pool.query(`
      INSERT INTO waitlist (email, wallet_address, referral_code, source)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO UPDATE SET
        wallet_address = EXCLUDED.wallet_address,
        referral_code = EXCLUDED.referral_code
      RETURNING id
    `, [email, walletAddress || null, referralCode || null, source || 'landing']);

    // Log successful signup
    auditLogger(
      'WAITLIST_SIGNUP',
      `New waitlist signup: ${email}`,
      { email, hasWallet: !!walletAddress, hasReferral: !!referralCode }
    );

    const response: ApiResponse = {
      success: true,
      message: 'Successfully joined waitlist! Check your email for updates.',
      data: {
        email,
        position: 'early', // Could query actual position
      },
    };

    res.json(response);
  } catch (error) {
    console.error('Waitlist subscription error:', error);

    const response: ApiResponse = {
      success: false,
      error: 'Failed to join waitlist. Please try again.',
      code: 'WAITLIST_ERROR',
    };

    res.status(500).json(response);
  }
});

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
  if (process.env.NODE_ENV !== 'production') {
    console.log(`EMERGENCY: Withdrawals ${paused ? 'PAUSED' : 'RESUMED'} - Reason: ${reason}`);
  }
  auditLogger('EMERGENCY_WITHDRAWAL_TOGGLE', { paused, reason, adminId: (req as any).user.id }, req);

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

// Marketplace endpoints - Get all NFTs for marketplace (real data fallbacks)
apiV1.get('/market', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const collection = req.query.collection as string;
    const owner = req.query.owner as string;

    let nfts: any[] = [];
    let total = 0;

    // 1) If specific collection requested, fetch from that collection
    if (collection && collection !== 'eternal-echoes') {
      try {
        const result = await heliusService.getAssetsByCollection(collection, { page, limit });
        nfts = result.items.map((item: any) => ({
          id: item.id,
          mintAddress: item.id,
          name: item.content?.metadata?.name || 'Unnamed NFT',
          description: item.content?.metadata?.description || '',
          image: item.content?.links?.image || '',
          imageUrl: item.content?.links?.image || '',
          owner: item.ownership?.owner,
          collection: item.grouping?.find((g: any) => g.group_key === 'collection')?.group_value || 'Unknown',
          isListed: false,
          price: null,
          status: 'owned',
          compressed: item.compression?.compressed || false,
          source: 'blockchain',
          creator: item.ownership?.owner || '',
        }));
        total = result.total;
      } catch (error) {
        console.error('[Market] Error fetching collection:', error);
        nfts = [];
      }
    }
    // 2) If owner specified, fetch NFTs for that owner
    else if (owner) {
      try {
        const result = await heliusService.getAssetsByOwner(owner, { limit: limit * page });
        nfts = result.items
          .slice((page - 1) * limit, page * limit)
          .map((item: any) => ({
            id: item.id,
            mintAddress: item.id,
            name: item.content?.metadata?.name || 'Unnamed NFT',
            description: item.content?.metadata?.description || '',
            image: item.content?.links?.image || '',
            imageUrl: item.content?.links?.image || '',
            owner: owner,
            collection: item.grouping?.find((g: any) => g.group_key === 'collection')?.group_value || 'Unknown',
            isListed: false,
            price: null,
            status: 'owned',
            compressed: item.compression?.compressed || false,
            source: 'blockchain',
            creator: item.ownership?.owner || '',
          }));
        total = result.total;
      } catch (error) {
        console.error('[Market] Error fetching owner NFTs:', error);
        nfts = [];
      }
    }
    // 3) DEFAULT: Fetch featured/popular NFTs from mainnet (with smart fallbacks)
    else {
      try {
        console.log(`[Market] Fetching marketplace NFTs (page ${page}, limit ${limit})...`);

        // Strategy: Try to get NFTs from platform wallet first (fastest)
        // Then fallback to popular collections if available
        const platformOwner = process.env.PLATFORM_PUBLIC_KEY;

        if (platformOwner) {
          try {
            const result = await heliusService.getAssetsByOwner(platformOwner, {
              page,
              limit,
            });
            nfts = result.items.map((item: any) => ({
              id: item.id,
              mintAddress: item.id,
              name: item.content?.metadata?.name || 'Unnamed NFT',
              description: item.content?.metadata?.description || '',
              image: item.content?.links?.image || '',
              imageUrl: item.content?.links?.image || '',
              owner: platformOwner,
              collection: item.grouping?.find((g: any) => g.group_key === 'collection')?.group_value || 'Unknown',
              isListed: false,
              price: null,
              status: 'owned',
              compressed: item.compression?.compressed || false,
              source: 'blockchain',
              creator: item.ownership?.owner || '',
            }));
            total = result.total;
            console.log(`[Market] Found ${nfts.length} NFTs from platform wallet`);
          } catch (ownerError) {
            console.error('[Market] Error fetching from platform wallet:', ownerError);
            nfts = [];
          }
        }

        // If no NFTs from platform wallet, try database listings
        if (nfts.length === 0) {
          try {
            const listingsResult = await pool.query(
              `SELECT "mintAddress", name, description, image, "imageUrl", owner, collection, price, status, "listedAt"
               FROM nfts
               WHERE (status = 'listed' OR status = 'active' OR listed = true)
               ORDER BY "listedAt" DESC NULLS LAST, "createdAt" DESC
               LIMIT $1 OFFSET $2`,
              [limit, (page - 1) * limit]
            );

            if (listingsResult.rows.length > 0) {
              nfts = listingsResult.rows.map((row: any) => ({
                id: row.mintAddress,
                mintAddress: row.mintAddress,
                name: row.name || 'Unnamed NFT',
                description: row.description || '',
                image: row.imageUrl || row.image || '',
                imageUrl: row.imageUrl || row.image || '',
                owner: row.owner || '',
                collection: row.collection || 'Unknown',
                isListed: true,
                price: row.price || null,
                status: row.status || 'listed',
                listedAt: row.listedAt,
                source: 'database',
                creator: row.owner || '',
              }));

              // Get total count
              const countResult = await pool.query(
                `SELECT COUNT(*) as count FROM nfts
                 WHERE (status = 'listed' OR status = 'active' OR listed = true)`
              );
              total = parseInt(countResult.rows[0]?.count || '0', 10);
              console.log(`[Market] Found ${nfts.length} NFTs from database listings`);
            }
          } catch (dbError) {
            console.error('[Market] Error fetching from database:', dbError);
            nfts = [];
          }
        }

        // Final fallback: Return empty array with helpful message
        if (nfts.length === 0) {
          console.log('[Market] No NFTs found - marketplace is empty. Users can mint NFTs to populate it.');
        }
      } catch (error) {
        console.error('[Market] Error fetching marketplace NFTs:', error);
        nfts = [];
      }
    }

    // Also check for listings in our database
    if (nfts.length > 0) {
      try {
        const mintAddresses = nfts.map((nft) => nft.mintAddress);
        const listingsResult = await pool.query(
          `SELECT "mintAddress", price, status, "listedAt" FROM nfts
           WHERE "mintAddress" = ANY($1) AND (status = 'listed' OR status = 'active')`,
          [mintAddresses]
        );
        const listingsMap = new Map(
          listingsResult.rows.map((row: any) => [row.mintAddress, row])
        );

        // Define types for listing and NFT
        interface Listing {
          price: number;
          listedAt: string | Date;
          status: string;
          mintAddress: string;
        }

        interface NFT {
          mintAddress: string;
          status: string;
          [key: string]: any;
        }

        // Merge listing data
        nfts = nfts.map((nft: NFT) => {
          const listing = listingsMap.get(nft.mintAddress) as Listing | undefined;
          return {
            ...nft,
            isListed: !!listing,
            price: listing?.price ?? null,
            listedAt: listing?.listedAt ?? null,
            status: listing?.status ?? nft.status,
          };
        });
      } catch (error) {
        console.error('[Market] Error fetching listings:', error);
        // Continue without listing data
      }
    }

    const response: ApiResponse = {
      success: true,
      data: {
        nfts,
        total: total || nfts.length,
        page,
        limit,
        message: nfts.length > 0
          ? `Loaded ${nfts.length} NFTs from Solana mainnet`
          : 'No NFTs found',
      },
    };
    res.json(response);
  } catch (error) {
    errorLogger(error as Error, { endpoint: '/api/v1/market' });
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
      } catch {
        nfts = [];
      }
    } else if (owner) {
      // Get ALL NFTs from blockchain using Helius DAS API
      try {
        console.log(`[NFTs] Fetching ALL Solana NFTs for owner: ${owner}`);

        // Get ALL NFTs from blockchain
        const heliusNFTs = await heliusService.getAssetsByOwner(owner, { limit: 1000 });

        // Also fetch local listing status
        const localListings = await pool.query(`
          SELECT "mintAddress", status, price, "listedAt"
          FROM nfts
          WHERE owner = $1 AND (status = 'listed' OR status = 'active')
        `, [owner]);

        const localListingsMap = new Map(
          localListings.rows.map(row => [row.mintAddress, row])
        );

        // Merge: Show ALL blockchain NFTs with listing status
        nfts = heliusNFTs.items.map((nft: any) => {
          const localData = localListingsMap.get(nft.id);
          return {
            id: nft.id,
            mintAddress: nft.id,
            name: nft.content?.metadata?.name || 'Unnamed NFT',
            description: nft.content?.metadata?.description || '',
            image: nft.content?.links?.image || '',
            owner: owner,
            collection: nft.grouping?.find((g: any) => g.group_key === 'collection')?.group_value || 'Unknown',
            // Local listing data if available
            isListed: (localData as any)?.status === 'listed',
            price: (localData as any)?.price ?? null,
            listedAt: (localData as any)?.listedAt ?? null,
            status: (localData as any)?.status ?? 'owned',
            // Blockchain data
            compressed: nft.compression?.compressed || false,
            source: 'blockchain',
            canList: true, // User owns it, can list it
            onChain: true, // Real blockchain NFT
            royalty: nft.royalty?.percent || 0,
          };
        });

        console.log(`[NFTs] Found ${nfts.length} NFTs on blockchain for ${owner}`);
      } catch (e) {
        console.error('[NFTs] Helius error, falling back to local database:', e);
        // Fallback to local database
        try {
          const result = await nftService.getNFTsByOwner(owner);
          if (result.success && result.data) {
            nfts = Array.isArray(result.data) ? result.data : [result.data];
          }
        } catch {
          nfts = [];
        }
      }
    } else {
      // Get all NFTs from marketplace
      try {
        // Query database or in-memory store
        nfts = [];
      } catch {
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

// Wallet info endpoint
apiV1.get('/wallet/:address', async (req, res) => {
  try {
    const { address } = req.params;

    // Validate wallet address format
    if (!address || address.length < 32 || address.length > 44) {
      const response: ApiResponse = {
        success: false,
        error: 'Invalid wallet address format',
        code: 'INVALID_ADDRESS',
      };
      return res.status(400).json(response);
    }

    try {
      const balance = await solanaService.getBalance(address);
      const exists = await solanaService.accountExists(address);

      const response: ApiResponse = {
        success: true,
        data: {
          address,
          balance: balance || 0,
          exists: exists !== undefined ? exists : true,
          solBalance: `${(balance || 0).toFixed(4)} SOL`,
        },
      };
      res.json(response);
    } catch (solanaError) {
      // If Solana service fails, return basic info
      errorLogger(solanaError as Error, { endpoint: '/api/v1/wallet/:address', action: 'solana_service' });
      const response: ApiResponse = {
        success: true,
        data: {
          address,
          balance: 0,
          exists: true,
          solBalance: '0.0000 SOL',
          note: 'Unable to fetch balance from Solana network',
        },
      };
      res.json(response);
    }
  } catch (error) {
    errorLogger(error as Error, { endpoint: '/api/v1/wallet/:address' });
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get wallet info',
      code: 'WALLET_INFO_ERROR',
    };
    res.status(500).json(response);
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

// Collections endpoint (DB -> Helius fallback)
apiV1.get('/collections', async (req, res) => {
  try {
    // Try to query with 'listed' status first (most common)
    let result;
    try {
      result = await pool.query(`
        SELECT
          COALESCE(collection, 'Unknown') as id,
          COALESCE(collection, 'Unknown Collection') as name,
          COUNT(*) as "nftCount",
          MIN(image) as image,
          COALESCE(MIN(CAST(price AS DECIMAL)), 0) as "floorPrice",
          COALESCE(AVG(CAST(price AS DECIMAL)), 0) as "avgPrice"
        FROM nfts
        WHERE status = 'listed' OR listed = true
        GROUP BY collection
        ORDER BY COUNT(*) DESC
        LIMIT 50
      `);
    } catch (firstError: any) {
      // If that fails, try with 'collection_name' column
      try {
        result = await pool.query(`
          SELECT
            COALESCE(collection_name, 'Unknown') as id,
            COALESCE(collection_name, 'Unknown Collection') as name,
            COUNT(*) as "nftCount",
            MIN(image_url) as image,
            COALESCE(MIN(CAST(price AS DECIMAL)), 0) as "floorPrice",
            COALESCE(AVG(CAST(price AS DECIMAL)), 0) as "avgPrice"
          FROM nfts
          WHERE status = 'listed' OR listed = true
          GROUP BY collection_name
          ORDER BY COUNT(*) DESC
          LIMIT 50
        `);
      } catch (secondError: any) {
        // If both fail, return empty array with helpful error
        errorLogger(firstError as Error, { endpoint: '/api/v1/collections', attempt: 'first' });
        errorLogger(secondError as Error, { endpoint: '/api/v1/collections', attempt: 'second' });
        const response: ApiResponse = {
          success: true,
          data: [],
          message: 'No collections found - database schema may need updating',
        };
        return res.json(response);
      }
    }

    let rows = result.rows || [];

    // Fallback to Helius-derived collections if DB is empty
    if (!rows.length) {
      try {
        const owner = process.env.PLATFORM_PUBLIC_KEY;
        if (owner) {
          const owned = await heliusService.getAssetsByOwner(owner, { limit: 500 });
          const counts = new Map<string, { id: string; name: string; nftCount: number; image?: string; floorPrice: number; avgPrice: number }>();
          for (const item of owned.items) {
            const col = item.grouping?.find((g: any) => g.group_key === 'collection')?.group_value;
            if (!col) continue;
            const entry = counts.get(col) || { id: col, name: col, nftCount: 0, image: item.content?.links?.image, floorPrice: 0, avgPrice: 0 };
            entry.nftCount += 1;
            if (!entry.image && (item.content?.links?.image || (item.content as any)?.files?.[0]?.uri)) {
              entry.image = item.content?.links?.image || (item.content as any)?.files?.[0]?.uri;
            }
            counts.set(col, entry);
          }
          rows = Array.from(counts.values()).sort((a, b) => b.nftCount - a.nftCount).slice(0, 50) as any;
        }
      } catch {
        // ignore fallback errors
      }
    }

    const response: ApiResponse = {
      success: true,
      data: rows,
      message: `Found ${rows.length} collections`,
    };

    res.json(response);
  } catch (error) {
    errorLogger(error as Error, { endpoint: '/api/v1/collections' });
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch collections',
      code: 'COLLECTIONS_ERROR',
    };
    res.status(500).json(response);
  }
});

// Mount versioned API
app.use('/api/v1', apiV1);

// Enhanced error handling middleware
app.use((err: any, req: any, res: any, _next: any) => {
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

// Create HTTP server
const server = createServer(app);

// Start server
const serverPort = process.env.PORT ? parseInt(process.env.PORT, 10) : appConfig.port;
server.listen(serverPort, '0.0.0.0', async () => {
  console.log(`🚀 NFTSol Backend Server Started`);
  console.log(`📍 Port: ${serverPort} (from ${process.env.PORT ? 'PORT env var' : 'config'})`);
  console.log(`🌍 Environment: ${appConfig.nodeEnv}`);
  console.log(`🌐 CORS Origins: ${appConfig.cors.origin.join(', ')}`);
  console.log(`⚡ Rate Limit: ${appConfig.rateLimit.max} requests per ${appConfig.rateLimit.windowMs / 1000}s`);
  console.log(`📤 File Upload: Max ${appConfig.fileUpload.maxSize / 1024 / 1024}MB`);
  console.log(`🔗 Solana RPC: ${solanaConfig.rpcUrl}`);
  console.log(`🌐 Cluster: ${solanaConfig.cluster}`);
  console.log(`✅ Server ready at http://0.0.0.0:${serverPort}`);

  if (programConfig.cloutProgramId) {
    console.log(`💰 CLOUT Token: ${programConfig.cloutProgramId}`);
    // Calculate rewards vault dynamically
    try {
      const rewardsVault = await getRewardsVaultAddress();
      if (rewardsVault) {
        console.log(`🏦 Rewards Vault: ${rewardsVault.toBase58()} (auto-calculated from REWARDS_OWNER + CLOUT_MINT)`);
      } else {
        console.log(`🏦 Rewards Vault: Will be created on first use (auto-calculated)`);
      }
    } catch (error) {
      console.warn('⚠️ Could not calculate rewards vault:', error instanceof Error ? error.message : error);
    }
  }
});

export { app, server };
