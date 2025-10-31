import express from 'express';
import { createServer } from 'http';
import compression from 'compression';
import morgan from 'morgan';
import echoRouter from './routes/echo';
import nftRouter from './routes/nfts';
import orbRouter from './routes/orb';
import withdrawalsRouter from './routes/withdrawals';
import {
  corsConfig,
  helmetConfig,
  generalLimiter,
  securityHeaders,
  securityLogger,
  sanitizeInput,
} from './middleware/security';

const app = express();
const server = createServer(app);

// Trust proxy and core security middleware
app.set('trust proxy', 1);
app.use(helmetConfig);
app.use(corsConfig);
app.use(securityHeaders);
app.use(securityLogger);

// Body parsing and logging
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('tiny'));

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

// API routes (only existing, minimal)
app.use('/api/echo', echoRouter);
app.use('/api/nfts', nftRouter);
app.use('/api/orb', orbRouter);
app.use('/api/withdrawals', withdrawalsRouter);

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
