import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import session from "express-session";
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
app.use(sanitizeInput);

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
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Body parsing with size limits
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Logging
app.use(morgan(appConfig.logLevel === "debug" ? "dev" : "tiny"));

// Rate limiting - apply to all routes
// app.use(generalLimiter); // Commented out due to TypeScript issues

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

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Unhandled error", err);
  res.status(500).json({ error: "Internal Server Error" });
});

export default app;
