"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const morgan_1 = __importDefault(require("morgan"));
const express_session_1 = __importDefault(require("express-session"));
const compression_1 = __importDefault(require("compression"));
const crypto_1 = __importDefault(require("crypto"));
const redis_1 = require("redis");
const health_1 = __importDefault(require("./routes/health"));
const nfts_1 = __importDefault(require("./routes/nfts"));
const market_1 = __importDefault(require("./routes/market"));
const clout_1 = __importDefault(require("./routes/clout"));
const universalNFTs_1 = __importDefault(require("./routes/universalNFTs"));
const timeCapsules_1 = __importDefault(require("./routes/timeCapsules"));
const collections_1 = __importDefault(require("./routes/collections"));
const upload_1 = __importDefault(require("./routes/upload"));
const users_1 = __importDefault(require("./routes/users"));
const monitoring_1 = __importDefault(require("./routes/monitoring"));
const transparency_1 = __importDefault(require("./routes/transparency"));
const environment_1 = require("./config/environment");
const usageTracking_1 = require("./middleware/usageTracking");
const automatedMaintenance_1 = require("./services/automatedMaintenance");
const backupService_1 = require("./services/backupService");
const performanceService_1 = require("./services/performanceService");
const envValidation_1 = require("./utils/envValidation");
const constants_1 = require("./config/constants");
const security_1 = require("./middleware/security");
const appConfig = (0, environment_1.getAppConfig)();
const app = (0, express_1.default)();
// Log environment status on startup
(0, envValidation_1.logEnvironmentStatus)();
// Trust proxy for rate limiting and security
app.set('trust proxy', 1);
// Security middleware (order matters!)
app.use(security_1.helmetConfig);
app.use(security_1.corsConfig);
app.use(security_1.securityHeaders);
app.use(security_1.securityLogger);
app.use(security_1.requestSizeLimiter);
// Session configuration with optional Redis
let redisClient = null;
let sessionStore = null;
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
        redisClient = (0, redis_1.createClient)({
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
        redisClient.on('error', (err) => {
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
        }).catch((err) => {
            console.log('⚠️ Redis not available, using in-memory sessions:', err.message);
            redisClient = null;
        });
    }
    else {
        console.log('ℹ️ Redis not configured, using in-memory sessions');
        redisClient = null;
    }
}
catch (error) {
    console.log('⚠️ Redis initialization failed, using in-memory sessions:', error.message);
    redisClient = null;
}
// Session configuration with fallback to memory store
app.use((0, express_session_1.default)({
    store: sessionStore || undefined, // Use memory store if Redis is not available
    secret: process.env.SESSION_SECRET || 'fallback-session-secret',
    resave: false,
    saveUninitialized: false,
    name: constants_1.SESSION_CONFIG.COOKIE_NAME,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: constants_1.SESSION_CONFIG.MAX_AGE,
        sameSite: 'strict' // Additional security
    }
}));
// Body parsing with size limits
app.use(express_1.default.json({ limit: constants_1.REQUEST_LIMITS.JSON_BODY }));
app.use(express_1.default.urlencoded({ extended: true, limit: constants_1.REQUEST_LIMITS.URL_ENCODED }));
// Logging
app.use((0, morgan_1.default)(appConfig.logLevel === "debug" ? "dev" : "tiny"));
// Compression middleware
app.use((0, compression_1.default)());
// Request ID and performance tracking middleware
app.use((req, res, next) => {
    // Generate request ID
    req.id = crypto_1.default.randomUUID();
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
app.use(usageTracking_1.trackUsage);
app.use(usageTracking_1.trackAPICalls);
app.use(usageTracking_1.performanceMonitoring);
// Input sanitization (AFTER body parsing)
app.use(security_1.sanitizeInput);
// Rate limiting - apply to all routes (AFTER session/auth, BEFORE routes)
app.use(security_1.generalLimiter);
// API routes
app.use("/market", market_1.default);
app.use("/api", market_1.default);
app.use("/api/clout", clout_1.default);
app.use("/api/universal-nfts", universalNFTs_1.default);
app.use("/api/time-capsules", timeCapsules_1.default);
app.use("/api/collections", collections_1.default);
app.use("/api/upload", upload_1.default);
app.use("/api/users", users_1.default);
app.use("/api/monitoring", monitoring_1.default);
app.use("/api/transparency", transparency_1.default);
app.use("/healthz", health_1.default);
app.use("/health", health_1.default);
app.use("/nfts", nfts_1.default);
app.get("/", (_req, res) => res.json({ ok: true }));
// Initialize services only if required environment variables are available
const hasDatabase = !!process.env.DATABASE_URL;
const hasRedis = !!process.env.REDIS_URL && process.env.REDIS_URL.trim() !== '';
if (hasDatabase) {
    // Initialize services
    const maintenanceService = new automatedMaintenance_1.AutomatedMaintenanceService();
    maintenanceService.startAutomatedMaintenance();
    // Initialize backup service
    const backupService = new backupService_1.BackupService({
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
    const performanceService = new performanceService_1.PerformanceService({
        redisUrl: process.env.REDIS_URL,
        cacheTimeout: 300, // 5 minutes
        maxConnections: 10,
        connectionTimeout: 5000
    });
}
// Error handler middleware
app.use((err, req, res, next) => {
    // Skip if response already sent
    if (res.headersSent) {
        return next(err);
    }
    // Log error details
    const errorLog = {
        requestId: req.id,
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
        requestId: req.id,
        ...(process.env.NODE_ENV === 'development' && {
            details: err,
            stack: err.stack
        })
    });
});
exports.default = app;
