import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { appConfig, solanaConfig, programConfig } from './config';
import { requestLogger, errorLogger } from './utils/logger';
import { validateWallet, validateFileUpload, sanitizeInput } from './utils/validation';
import { solanaService } from './services/solana';
import { nftService } from './services/nft';
import { ApiResponse, MintRequest } from './types';

const app = express();
const server = createServer(app);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: appConfig.cors.origin,
  credentials: appConfig.cors.credentials,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Compression
app.use(compression());

// Request logging
app.use(requestLogger);

// Rate limiting
const limiter = rateLimit({
  windowMs: appConfig.rateLimit.windowMs,
  max: appConfig.rateLimit.max,
  message: {
    success: false,
    error: 'Too many requests, please try again later',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    // Store raw body for webhook verification if needed
    (req as any).rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { 
    fileSize: appConfig.fileUpload.maxSize,
    files: 1
  },
  fileFilter: (req, file, cb) => {
    if (appConfig.fileUpload.allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed: ${appConfig.fileUpload.allowedTypes.join(', ')}`));
    }
  }
});

// Health check endpoints
app.get('/healthz', async (req, res) => {
  try {
    const solanaHealth = await solanaService.healthCheck();
    const response: ApiResponse = {
      success: true,
      data: {
        status: 'healthy',
        timestamp: Date.now(),
        uptime: process.uptime(),
        environment: appConfig.nodeEnv,
        solana: solanaHealth
      }
    };
    res.json(response);
  } catch (error) {
    errorLogger(error as Error, { endpoint: '/healthz' });
    res.status(500).json({
      success: false,
      error: 'Health check failed'
    });
  }
});

app.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    status: 'ok',
    timestamp: Date.now()
  });
});

// Program configuration endpoint
app.get('/api/programs', (req, res) => {
  const response: ApiResponse = {
    success: true,
    data: {
      programs: programConfig,
      cluster: solanaConfig.cluster,
      rpcUrl: solanaConfig.rpcUrl
    },
    message: 'Real Solana program configuration'
  };
  res.json(response);
});

// Solana status endpoint
app.get('/api/solana/status', async (req, res) => {
  try {
    const health = await solanaService.healthCheck();
    const response: ApiResponse = {
      success: true,
      data: health
    };
    res.json(response);
  } catch (error) {
    errorLogger(error as Error, { endpoint: '/api/solana/status' });
    res.status(500).json({
      success: false,
      error: 'Failed to get Solana status'
    });
  }
});

// Enhanced mint endpoint with full validation
app.post('/api/simple-mint', 
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
        creatorWallet: req.body.creatorWallet || req.body.owner
      };

      // Validate the mint request
      const validation = nftService.validateMintRequest(mintRequest);
      if (!validation.valid) {
        const response: ApiResponse = {
          success: false,
          error: validation.errors.join(', '),
          code: 'VALIDATION_ERROR'
        };
        return res.status(400).json(response);
      }

      // Check Solana connection
      const solanaHealth = await solanaService.healthCheck();
      if (!solanaHealth.healthy) {
        const response: ApiResponse = {
          success: false,
          error: 'Solana network unavailable',
          code: 'SOLANA_UNAVAILABLE'
        };
        return res.status(503).json(response);
      }

      // Create the mint
      const mintResult = await nftService.createMockMint(mintRequest);
      
      if (mintResult.success) {
        const response: ApiResponse = {
          success: true,
          data: mintResult,
          message: 'NFT minted successfully'
        };
        res.json(response);
        return;
      } else {
        const response: ApiResponse = {
          success: false,
          error: mintResult.error || 'Minting failed',
          code: 'MINT_FAILED'
        };
        res.status(500).json(response);
        return;
      }
    } catch (error) {
      errorLogger(error as Error, { endpoint: '/api/simple-mint' });
      const response: ApiResponse = {
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      };
      res.status(500).json(response);
      return;
    }
  }
);

// Get NFT metadata endpoint
app.get('/api/nft/:mintAddress', async (req, res) => {
  try {
    const { mintAddress } = req.params;
    const result = await nftService.getNFTMetadata(mintAddress);
    res.json(result);
  } catch (error) {
    errorLogger(error as Error, { endpoint: '/api/nft/:mintAddress' });
    res.status(500).json({
      success: false,
      error: 'Failed to get NFT metadata'
    });
  }
});

// Get NFTs by owner endpoint
app.get('/api/nfts/:owner', async (req, res) => {
  try {
    const { owner } = req.params;
    const result = await nftService.getNFTsByOwner(owner);
    res.json(result);
  } catch (error) {
    errorLogger(error as Error, { endpoint: '/api/nfts/:owner' });
    res.status(500).json({
      success: false,
      error: 'Failed to get NFTs by owner'
    });
  }
});

// Marketplace endpoints
app.get('/api/market', async (req, res) => {
  try {
    const response: ApiResponse = {
      success: true,
      data: {
        nfts: [
          {
            id: '1',
            name: 'Sample NFT 1',
            description: 'This is a sample NFT',
            imageUrl: 'https://via.placeholder.com/300x300/667eea/ffffff?text=NFT+1',
            price: '0.1',
            owner: 'ZKa2AZpPmkXVGR7dwe43VNswxNQbiA2JKzRidPejFQK',
            mintAddress: 'MOCK_MINT_1',
            createdAt: new Date().toISOString()
          },
          {
            id: '2',
            name: 'Sample NFT 2',
            description: 'Another sample NFT',
            imageUrl: 'https://via.placeholder.com/300x300/667eea/ffffff?text=NFT+2',
            price: '0.2',
            owner: 'ZKa2AZpPmkXVGR7dwe43VNswxNQbiA2JKzRidPejFQK',
            mintAddress: 'MOCK_MINT_2',
            createdAt: new Date().toISOString()
          }
        ],
        total: 2,
        page: 1,
        limit: 20
      }
    };
    res.json(response);
  } catch (error) {
    errorLogger(error as Error, { endpoint: '/api/market' });
    res.status(500).json({
      success: false,
      error: 'Failed to get marketplace data'
    });
  }
});

// Collections endpoint
app.get('/api/collections', (req, res) => {
  const response: ApiResponse = {
    success: true,
    data: {
      collections: [
        {
          id: '1',
          name: 'NFTSol Collection',
          description: 'Official NFTSol collection',
          imageUrl: 'https://via.placeholder.com/300x300/667eea/ffffff?text=Collection',
          itemCount: 2,
          createdAt: new Date().toISOString()
        }
      ]
    }
  };
  res.json(response);
});

// Wallet info endpoint
app.get('/api/wallet/:address', async (req, res) => {
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
        solBalance: `${balance.toFixed(4)} SOL`
      }
    };
    res.json(response);
  } catch (error) {
    errorLogger(error as Error, { endpoint: '/api/wallet/:address' });
    res.status(500).json({
      success: false,
      error: 'Failed to get wallet info'
    });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  const response: ApiResponse = {
    success: true,
    data: {
      name: 'NFTSol API',
      version: '1.0.0',
      status: 'operational',
      endpoints: {
        health: '/healthz',
        programs: '/api/programs',
        mint: '/api/simple-mint',
        market: '/api/market',
        collections: '/api/collections',
        wallet: '/api/wallet/:address',
        nft: '/api/nft/:mintAddress',
        nfts: '/api/nfts/:owner'
      }
    }
  };
  res.json(response);
});

// Global error handling middleware
app.use((err: any, req: any, res: any, next: any) => {
  errorLogger(err, { 
    url: req.url, 
    method: req.method,
    body: req.body 
  });
  
  const response: ApiResponse = {
    success: false,
    error: appConfig.nodeEnv === 'production' 
      ? 'Internal server error' 
      : err.message,
    code: 'INTERNAL_ERROR'
  };
  
  res.status(500).json(response);
});

// 404 handler
app.use((req, res) => {
  const response: ApiResponse = {
    success: false,
    error: 'Endpoint not found',
    code: 'NOT_FOUND'
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

// Start server
server.listen(appConfig.port, '0.0.0.0', () => {
  console.log(`🚀 NFTSol Backend Server`);
  console.log(`📡 Port: ${appConfig.port}`);
  console.log(`🌍 Environment: ${appConfig.nodeEnv}`);
  console.log(`🔗 CORS Origins: ${appConfig.cors.origin.join(', ')}`);
  console.log(`⚡ Rate Limit: ${appConfig.rateLimit.max} requests per ${appConfig.rateLimit.windowMs / 1000}s`);
  console.log(`📁 File Upload: Max ${appConfig.fileUpload.maxSize / 1024 / 1024}MB`);
  console.log(`🔗 Solana RPC: ${solanaConfig.rpcUrl}`);
  console.log(`🎯 Cluster: ${solanaConfig.cluster}`);
});

export { app, server };