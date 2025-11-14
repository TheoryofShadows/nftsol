import express from 'express';
import { createServer } from 'http';
import compression from 'compression';
import morgan from 'morgan';
import fs from 'fs';
import path from 'path';

// Ensure logs directory exists
const logDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Create a write stream (in append mode)
const accessLogStream = fs.createWriteStream(
  path.join(logDir, 'access.log'),
  { flags: 'a' }
);

import { sessionMiddleware } from './config/session';
import authRouter, { validateCSRFToken, setupTestEndpoints } from './routes/auth';
import cookieParser from 'cookie-parser';
import echoRouter from './routes/echo';
import nftRouter from './routes/nfts';
import orbRouter from './routes/orb';
import withdrawalsRouter from './routes/withdrawals';
import apiRoutes from './routes/api';

// Import security middleware
import {
  corsConfig,
  helmetConfig,
  generalLimiter,
  securityHeaders,
  securityLogger,
  sanitizeInput,
} from './middleware/security';

// Import new security middleware
import { setupSecurity } from './middleware/security/index';

const app = express();
const server = createServer(app);

// Trust proxy
app.set('trust proxy', 1);

// Setup security middleware
setupSecurity(app);

// Apply existing security middleware (for backward compatibility)
app.use(helmetConfig);
app.use(corsConfig);

// Parse cookies
app.use(cookieParser());

// Session middleware (must come after CORS and before other middleware)
app.use(sessionMiddleware);

// Apply additional security middleware
app.use(securityHeaders);
app.use(securityLogger);
app.use(sanitizeInput);

// Apply rate limiting (using the existing limiter)
app.use(generalLimiter);

// Body parsing and logging
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use(morgan('dev'));
app.use(morgan('combined', { stream: accessLogStream }));

// Log all requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  console.log('Cookies:', req.cookies);
  console.log('Session:', req.session);
  next();
});

// Log all incoming requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  console.log('Headers:', req.headers);
  console.log('Cookies:', req.cookies);
  console.log('Session ID:', req.sessionID);
  console.log('Session:', req.session);
  next();
});

// API routes
app.use('/api/auth', authRouter);
console.log('Auth routes mounted at /api/auth');

// Protected API routes with CSRF protection
app.use('/api/nfts', validateCSRFToken, nftRouter);
console.log('NFT routes mounted at /api/nfts');

// Debug route to list all routes
app.get('/api/routes', (req, res) => {
  const routes = [
    { method: 'GET', path: '/api/auth/csrf-token' },
    { method: 'GET', path: '/api/auth/debug' },
    { method: 'POST', path: '/api/nfts/mint' },
    { method: 'GET', path: '/api/routes' }
  ];
  res.json(routes);
});

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

// Input sanitization (AFTER body parsing)
app.use(sanitizeInput);

// Rate limiting - apply to all routes (AFTER session/auth, BEFORE routes)
app.use(generalLimiter as any);

// API routes
app.use('/api/echo', echoRouter);
app.use('/api/nfts', nftRouter);
app.use('/api/orb', orbRouter);
app.use('/api/withdrawals', withdrawalsRouter);

// New API v1 routes
app.use('/api/v1', apiRoutes);

app.get('/', (_req, res) => res.json({ ok: true }));

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
    userAgent: req.get('User-Agent'),
  };

  console.error('Error:', JSON.stringify(errorLog, null, 2));

  // Determine status code
  const statusCode = err.statusCode || err.status || 500;

  // Don't leak error details in production for 5xx errors
  const isProduction = process.env.NODE_ENV === 'production';
  const isInternalError = statusCode >= 500;

  const message =
    isProduction && isInternalError ? 'Internal Server Error' : err.message || 'An error occurred';

  res.status(statusCode).json({
    ok: false,
    error: message,
    requestId: (req as any).id,
    ...(process.env.NODE_ENV === 'development' && {
      details: err,
      stack: err.stack,
    }),
  });
});

// Export both app and server for different use cases
export { app, server };
export default app;
