import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import session from "express-session";
import compression from "compression";
import crypto from "crypto";
import { RedisStore } from "connect-redis";
import { createClient } from "redis";
import health from "./routes/health.js";
import nfts from "./routes/nfts.js";
import market from "./routes/market";
import clout from "./routes/clout";
import universalNFTs from "./routes/universalNFTs";
import timeCapsules from "./routes/timeCapsules";
import collections from "./routes/collections";
import upload from "./routes/upload";
import users from "./routes/users";
import monitoring from "./routes/monitoring";
import { getAppConfig } from "./config/environment";
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
try {
  redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    socket: {
      reconnectStrategy: (retries) => {
        if (retries > 3) {
          console.log('⚠️ Redis connection failed, continuing without Redis');
          return false; // Stop trying to reconnect
        }
        return Math.min(retries * 50, 500);
      }
    }
  });

  redisClient.on('error', (err: any) => {
    console.log('⚠️ Redis connection error (continuing without Redis):', err.message);
  });

  redisClient.on('connect', () => {
    console.log('✅ Redis connected successfully');
  });

  // Try to connect, but don't block if it fails
  redisClient.connect().catch((err: any) => {
    console.log('⚠️ Redis not available, continuing without Redis:', err.message);
    redisClient = null;
  });

  // Only use Redis store if client is available
  if (redisClient) {
    sessionStore = new RedisStore({ client: redisClient });
  }
} catch (error) {
  console.log('⚠️ Redis initialization failed, continuing without Redis');
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
    res.setHeader('X-Response-Time', `${duration}ms`);
    
    // Log slow requests
    if (duration > 1000) {
      console.warn(`🐌 Slow request: ${req.method} ${req.path} took ${duration}ms`);
    }
  });
  
  next();
});

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
app.use("/api/monitoring", monitoring);
app.use("/healthz", health);
app.use("/health", health);
app.use("/nfts", nfts);

app.get("/", (_req, res) => res.json({ ok: true }));

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

// Initialize performance service
const performanceService = new PerformanceService({
  redisUrl: process.env.REDIS_URL,
  cacheTimeout: 300, // 5 minutes
  maxConnections: 10,
  connectionTimeout: 5000
});

// Schedule automated backups
backupService.scheduleBackups();

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

export default app;
