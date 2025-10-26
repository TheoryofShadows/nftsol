"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestSizeLimiter = exports.adminWhitelist = exports.securityLogger = exports.securityHeaders = exports.sanitizeInput = exports.validateInput = exports.generateCSRFToken = exports.csrfProtection = exports.authenticateToken = exports.helmetConfig = exports.corsConfig = exports.uploadLimiter = exports.apiLimiter = exports.authLimiter = exports.generalLimiter = exports.createRateLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
// Rate limiting configurations
// Skip rate limiting in test environment
const isTestEnv = process.env.NODE_ENV === 'test';
const createRateLimiter = (windowMs, max, message) => {
    // In test environment, return a no-op middleware
    if (isTestEnv) {
        return (req, res, next) => {
            next();
        };
    }
    return (0, express_rate_limit_1.default)({
        windowMs,
        max,
        message: message || 'Too many requests, please try again later.',
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
            res.status(429).json({
                error: 'Rate limit exceeded',
                message: message || 'Too many requests, please try again later.',
                retryAfter: Math.ceil(windowMs / 1000)
            });
        }
    }); // No type assertion needed
};
exports.createRateLimiter = createRateLimiter;
// Different rate limits for different endpoints
exports.generalLimiter = (0, exports.createRateLimiter)(15 * 60 * 1000, 100); // 100 requests per 15 minutes
exports.authLimiter = (0, exports.createRateLimiter)(15 * 60 * 1000, 5); // 5 auth attempts per 15 minutes
exports.apiLimiter = (0, exports.createRateLimiter)(60 * 1000, 30); // 30 API calls per minute
exports.uploadLimiter = (0, exports.createRateLimiter)(60 * 1000, 10); // 10 uploads per minute
// Helper to extract IP address for rate limiting
const getIpAddress = (req) => {
    return req.ip ||
        req.connection?.remoteAddress ||
        req.socket?.remoteAddress ||
        req.headers['x-forwarded-for']?.split(',')[0] ||
        'unknown';
};
// Enhanced CORS configuration with proper environment separation
exports.corsConfig = (0, cors_1.default)({
    origin: (origin, callback) => {
        const isProduction = process.env.NODE_ENV === 'production';
        const isStaging = process.env.NODE_ENV === 'staging';
        let allowedOrigins = [];
        if (isProduction) {
            // Production: Only allow production domains
            allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
                'https://nftsol.app',
                'https://www.nftsol.app',
                'https://market.nftsol.app'
            ];
        }
        else if (isStaging) {
            // Staging: Allow staging domains
            allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
                'https://staging.nftsol.app',
                'https://staging.market.nftsol.app'
            ];
        }
        else {
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
        }
        else {
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
exports.helmetConfig = (0, helmet_1.default)({
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
const authenticateToken = (req, res, next) => {
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
    jsonwebtoken_1.default.verify(token, jwtSecret, (err, user) => {
        if (err) {
            console.warn(`🚨 JWT: Invalid token attempt from ${req.ip}`);
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};
exports.authenticateToken = authenticateToken;
// CSRF Protection
const csrfProtection = (req, res, next) => {
    if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
        return next();
    }
    const token = req.headers['x-csrf-token'];
    const sessionToken = req.session?.csrfToken;
    if (!token || !sessionToken || token !== sessionToken) {
        return res.status(403).json({ error: 'Invalid CSRF token' });
    }
    next();
};
exports.csrfProtection = csrfProtection;
// Generate CSRF token
const generateCSRFToken = (req, res, next) => {
    if (!req.session) {
        req.session = {};
    }
    req.session.csrfToken = crypto_1.default.randomBytes(32).toString('hex');
    res.locals.csrfToken = req.session.csrfToken;
    next();
};
exports.generateCSRFToken = generateCSRFToken;
// Input validation middleware
const validateInput = (schema) => {
    return (req, res, next) => {
        try {
            const validated = schema.parse(req.body);
            req.body = validated;
            next();
        }
        catch (error) {
            res.status(400).json({
                error: 'Validation failed',
                details: error.errors
            });
        }
    };
};
exports.validateInput = validateInput;
// SQL Injection protection
const sanitizeInput = (req, res, next) => {
    const sanitize = (obj) => {
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
            const sanitized = {};
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
exports.sanitizeInput = sanitizeInput;
// Security headers
const securityHeaders = (req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    next();
};
exports.securityHeaders = securityHeaders;
// Request logging for security monitoring
const securityLogger = (req, res, next) => {
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
exports.securityLogger = securityLogger;
// IP whitelist for admin endpoints
const adminWhitelist = (req, res, next) => {
    const adminIPs = process.env.ADMIN_IPS?.split(',') || [];
    const clientIP = req.ip || req.connection.remoteAddress;
    if (adminIPs.length > 0 && clientIP && !adminIPs.includes(clientIP)) {
        return res.status(403).json({ error: 'Access denied' });
    }
    next();
};
exports.adminWhitelist = adminWhitelist;
// Request size limits
const requestSizeLimiter = (req, res, next) => {
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
exports.requestSizeLimiter = requestSizeLimiter;
