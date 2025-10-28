import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import session from "express-session";
import compression from "compression";
import crypto from "crypto";
import { createServer } from "http";
import { RedisStore } from "connect-redis";
import { createClient } from "redis";
import { WebSocketService } from "./services/websocketService";
import health from "./routes/health";
import nfts from "./routes/nfts";
import market from "./routes/market";
import clout from "./routes/clout";
import universalNFTs from "./routes/universalNFTs";
import timeCapsules from "./routes/timeCapsules";
import collections from "./routes/collections";
import upload from "./routes/upload";
import users from "./routes/users";
import monitoring from "./routes/monitoring";
import transparency from "./routes/transparency";
import wallet from "./routes/wallet";
import candyMachine from "./routes/candy-machine";
import irys from "./routes/irys";
import bubblegum from "./routes/bubblegum";
import genesis from "./routes/genesis";
import collectionVerification from "./routes/collectionVerification";
import eternalEchoes from "./routes/eternalEchoes";
import { getAppConfig } from "./config/environment";
import { trackUsage, trackAPICalls, performanceMonitoring } from "./middleware/usageTracking";
import { AutomatedMaintenanceService } from "./services/automatedMaintenance";
import { BackupService } from "./services/backupService";
import { PerformanceService } from "./services/performanceService";
import { logEnvironmentStatus } from "./utils/envValidation";
import { REQUEST_LIMITS, SESSION_CONFIG } from "./config/constants";
import { 
  corsConfig, 
  helmetConfig, 
  generalLimiter, 
  authLimiter, 
  apiLimiter, 
  uploadLimiter,
  securityHeaders,
  securityLogger,
  sanitizeInput,
  requestSizeLimiter
} from "./middleware/security";

const appConfig = getAppConfig();
const app = express();
const server = createServer(app);

// Log environment status on startup
logEnvironmentStatus();

// Trust proxy for rate limiting and security
app.set('trust proxy', 1);

// Security middleware (order matters!)
app.use(helmetConfig);
app.use(corsConfig);
app.use(securityHeaders);
app.use(securityLogger);
app.use(requestSizeLimiter);

// Session configuration with optional Redis
let redisClient: any = null;
let sessionStore: any = null;

// Try to connect to Redis, but don't fail if it's not available
let redisConnected = false;

try {
  // Only attempt Redis connection if REDIS_URL is explicitly provided and valid
  const redisUrl = process.env.REDIS_URL;
  const hasValidRedisUrl = redisUrl && 
                          redisUrl !== 'redis://localhost:6379' && 
                          redisUrl !== 'localhost' &&
                          redisUrl.trim().length > 0 &&
                          !redisUrl.includes('undefined');
  
  if (hasValidRedisUrl) {
    redisClient = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 3) {
            console.log('⚠️ Redis connection failed after 3 attempts, continuing without Redis');
            redisClient = null;
            return false;
          }
          return Math.min(retries * 50, 500);
        }
      }
    });

    redisClient.on('error', (err: any) => {
      if (redisConnected) {
        console.warn('⚠️ Redis connection error:', err.message);
      }
    });

    redisClient.on('connect', () => {
      console.log('✅ Redis connected successfully');
      redisConnected = true;
    });

    // Try to connect, but don't block if it fails
    redisClient.connect().then(() => {
      redisConnected = true;
    }).catch((err: any) => {
      console.log('⚠️ Redis not available, using in-memory sessions:', err.message);
      redisClient = null;
    });
  } else {
    console.log('ℹ️ Redis not configured, using in-memory sessions');
    redisClient = null;
  }
} catch (error: any) {
  console.log('⚠️ Redis initialization failed, using in-memory sessions:', error.message);
  redisClient = null;
}

// Session configuration with fallback to memory store
app.use(session({
  store: sessionStore || undefined, // Use memory store if Redis is not available
  secret: process.env.SESSION_SECRET || 'fallback-session-secret',
  resave: false,
  saveUninitialized: false,
  name: SESSION_CONFIG.COOKIE_NAME,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: SESSION_CONFIG.MAX_AGE,
    sameSite: 'strict' // Additional security
  }
}));

// Body parsing with size limits
app.use(express.json({ limit: REQUEST_LIMITS.JSON_BODY }));
app.use(express.urlencoded({ extended: true, limit: REQUEST_LIMITS.URL_ENCODED }));

// Logging
app.use(morgan(appConfig.logLevel === "debug" ? "dev" : "tiny"));

// Compression middleware
app.use(compression() as any);

// Request ID and performance tracking middleware
app.use((req: any, res: any, next: any) => {
  // Generate request ID
  req.id = crypto.randomUUID();
  res.setHeader('X-Request-ID', req.id);
  
  // Track response time
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    // Only set header if not already sent
    if (!res.headersSent) {
      res.setHeader('X-Response-Time', `${duration}ms`);
    }
    
    // Log slow requests
    if (duration > 1000) {
      console.warn(`🐌 Slow request: ${req.method} ${req.path} took ${duration}ms`);
    }
  });
  
  next();
});

// Usage tracking and performance monitoring
app.use(trackUsage);
app.use(trackAPICalls);
app.use(performanceMonitoring);

// Input sanitization (AFTER body parsing)
app.use(sanitizeInput);

// Rate limiting - apply to all routes (AFTER session/auth, BEFORE routes)
app.use(generalLimiter as any);

// API routes
app.use("/market", market);
app.use("/api", market);
app.use("/api/clout", clout);
app.use("/api/universal-nfts", universalNFTs);
app.use("/api/time-capsules", timeCapsules);
app.use("/api/collections", collections);
app.use("/api/upload", upload);
app.use("/api/users", users);
app.use("/api/wallet", wallet);
app.use("/api/monitoring", monitoring);
app.use("/api/transparency", transparency);
app.use("/api/candy-machine", candyMachine);
app.use("/api/irys", irys);
app.use("/api/bubblegum", bubblegum);
app.use("/api/genesis", genesis);
app.use("/api/collection-verification", collectionVerification);
app.use("/api/eternal-echoes", eternalEchoes);
app.use("/healthz", health);
app.use("/health", health);
app.use("/nfts", nfts);

app.get("/", (_req, res) => res.json({ ok: true }));

// Initialize services only if required environment variables are available
const hasDatabase = !!process.env.DATABASE_URL;
const hasRedis = !!process.env.REDIS_URL && process.env.REDIS_URL.trim() !== '';

if (hasDatabase) {
  // Initialize services
  const maintenanceService = new AutomatedMaintenanceService();
  maintenanceService.startAutomatedMaintenance();

  // Initialize backup service
  const backupService = new BackupService({
    databaseUrl: process.env.DATABASE_URL || '',
    backupDir: './backups',
    s3Bucket: process.env.S3_BACKUP_BUCKET,
    s3Region: process.env.S3_BACKUP_REGION,
    awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
    awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    retentionDays: 30
  });

  // Schedule automated backups
  backupService.scheduleBackups();
}

if (hasRedis) {
  // Initialize performance service
  const performanceService = new PerformanceService({
    redisUrl: process.env.REDIS_URL,
    cacheTimeout: 300, // 5 minutes
    maxConnections: 10,
    connectionTimeout: 5000
  });
}

// Error handler middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Skip if response already sent
  if (res.headersSent) {
    return next(err);
  }

  // Log error details
  const errorLog = {
    requestId: (req as any).id,
    method: req.method,
    path: req.path,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    timestamp: new Date().toISOString(),
    ip: req.ip,
    userAgent: req.get('User-Agent')
  };
  
  console.error('Error:', JSON.stringify(errorLog, null, 2));

  // Determine status code
  const statusCode = err.statusCode || err.status || 500;
  
  // Don't leak error details in production for 5xx errors
  const isProduction = process.env.NODE_ENV === 'production';
  const isInternalError = statusCode >= 500;
  
  const message = isProduction && isInternalError
    ? 'Internal Server Error'
    : err.message || 'An error occurred';

  res.status(statusCode).json({
    ok: false,
    error: message,
    requestId: (req as any).id,
    ...(process.env.NODE_ENV === 'development' && { 
      details: err,
      stack: err.stack 
    })
  });
});

// Initialize WebSocket service
let webSocketService: WebSocketService | null = null;
if (process.env.WS_ENABLED === 'true') {
  try {
    webSocketService = new WebSocketService(server);
    console.log('✅ WebSocket service initialized');
  } catch (error) {
    console.error('❌ Failed to initialize WebSocket service:', error);
  }
}

// Initialize Eternal Echoes service
import { initializeEternalEchoes } from "./routes/eternalEchoes";
import { Connection, clusterApiUrl } from "@solana/web3.js";

try {
  const connection = new Connection(
    process.env.SOLANA_RPC_URL || clusterApiUrl('devnet'),
    'confirmed'
  );
  initializeEternalEchoes(connection);
  console.log('✅ Eternal Echoes service initialized');
} catch (error) {
  console.error('❌ Failed to initialize Eternal Echoes service:', error);
}

// Export both app and server for different use cases
export { app, server, webSocketService };
export default app;
