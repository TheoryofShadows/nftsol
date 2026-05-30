import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import fs from 'fs';
import { appConfig } from '../config';

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

// Define format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Define transports
const transports: winston.transport[] = [
  // Console transport (all environments)
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize({ all: true }),
      winston.format.printf((info) => {
        const { timestamp, level, message, ...meta } = info;
        let metaStr = '';
        if (Object.keys(meta).length) {
          try {
            metaStr = JSON.stringify(meta, null, 2);
          } catch {
            metaStr = '[Unserializable meta]';
          }
        }
        return `${timestamp} [${level}]: ${message} ${metaStr}`;
      })
    ),
  }),

  // Error log file
  new winston.transports.File({
    filename: path.join(logsDir, 'error.log'),
    level: 'error',
    format: winston.format.uncolorize(),
  }),

  // All logs file
  new winston.transports.File({
    filename: path.join(logsDir, 'combined.log'),
    format: winston.format.uncolorize(),
  }),

  // Daily rotate file for combined logs
  new DailyRotateFile({
    filename: path.join(logsDir, 'application-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',
    format: winston.format.uncolorize(),
  }),

  // Daily rotate file for errors only
  new DailyRotateFile({
    filename: path.join(logsDir, 'errors-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '30d',
    level: 'error',
    format: winston.format.uncolorize(),
  }),
];

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  format,
  defaultMeta: { service: 'nftsol-backend' },
  transports,
  exceptionHandlers: [
    new DailyRotateFile({
      filename: path.join(logsDir, 'exceptions-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      format: winston.format.uncolorize(),
    }),
  ],
  rejectionHandlers: [
    new DailyRotateFile({
      filename: path.join(logsDir, 'rejections-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      format: winston.format.uncolorize(),
    }),
  ],
});

// Request logging middleware
export const requestLogger = (req: any, res: any, next: any) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('HTTP Request', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
  });

  next();
};

// Error logging with tracking
export const errorLogger = (error: Error, context?: any) => {
  logger.error('Application Error', {
    message: error.message,
    stack: error.stack,
    context,
  });
  
  // Track error if tracking is configured
  if (process.env.ERROR_TRACKING_URL || process.env.SENTRY_DSN) {
    import('./error-tracking').then(({ trackErrorSync }) => {
      trackErrorSync(error, context);
    }).catch(() => {
      // Ignore if module not found
    });
  }
};

// Performance logging
export const performanceLogger = (operation: string, duration: number, metadata?: any) => {
  logger.info('Performance Metric', {
    operation,
    duration: `${duration}ms`,
    ...metadata,
  });
};

// Audit logging for security events
export const auditLogger = (event: string, details: any, req?: any) => {
  // Skip logging health check rate limits
  const isHealthCheck = req?.path === '/healthz' || req?.path === '/health' || 
                        req?.url?.includes('/healthz') || req?.url?.includes('/health');
  const isRenderHealthCheck = (req?.get?.('User-Agent') || '').includes('Render');
  if (event.includes('ERROR_RESPONSE') && details?.status === 429 && (isHealthCheck || isRenderHealthCheck)) {
    return; // Don't log health check rate limits
  }

  const auditEntry = {
    timestamp: new Date().toISOString(),
    event,
    level: 'audit',
    service: 'nftsol-backend',
    requestId: req?.id,
    ip: req?.ip,
    userAgent: req?.get?.('User-Agent'),
    userId: req?.user?.id,
    ...details,
  };

  if (appConfig.nodeEnv === 'production') {
    console.log(JSON.stringify(auditEntry));
  } else {
    console.log(`[AUDIT] ${event}:`, auditEntry);
  }
};

// Security event logging
export const securityLogger = (event: string, details: any, req?: any) => {
  auditLogger(
    `SECURITY_${event}`,
    {
      ...details,
      severity: 'high',
    },
    req
  );
};

// Convenience functions that use Winston instead of console.log
export const createModuleLogger = (moduleName: string) => {
  return {
    error: (message: string, error?: Error | unknown, meta?: Record<string, any>) => {
      const stack = error instanceof Error ? error.stack : '';
      logger.error(`[${moduleName}] ${message}`, { ...meta, stack });
    },
    warn: (message: string, meta?: Record<string, any>) => {
      logger.warn(`[${moduleName}] ${message}`, meta);
    },
    info: (message: string, meta?: Record<string, any>) => {
      logger.info(`[${moduleName}] ${message}`, meta);
    },
    debug: (message: string, meta?: Record<string, any>) => {
      logger.debug(`[${moduleName}] ${message}`, meta);
    },
    http: (message: string, meta?: Record<string, any>) => {
      logger.log('http', `[${moduleName}] ${message}`, meta);
    },
  };
};

/**
 * Redact secrets from an RPC URL before logging.
 *
 * Helius (and similar) RPC URLs embed the API key as a query parameter
 * (e.g. `?api-key=...`). Logging the raw URL leaks that secret into logs,
 * so mask any `api-key`/`apikey`/`access-token` query value.
 */
export const redactRpcUrl = (url: string): string => {
  if (!url) return url;
  return url.replace(/((?:api[-_]?key|access[-_]?token)=)[^&\s]+/gi, '$1[REDACTED]');
};

export default logger;
