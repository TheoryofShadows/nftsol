import { appConfig } from '../config';

// Simple logger implementation
class Logger {
  private log(level: string, message: string, meta?: any) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      service: 'nftsol-backend',
      ...meta,
    };

    if (appConfig.nodeEnv === 'production') {
      console.log(JSON.stringify(logEntry));
    } else {
      console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`, meta || '');
    }
  }

  info(message: string, meta?: any) {
    this.log('info', message, meta);
  }

  error(message: string, meta?: any) {
    this.log('error', message, meta);
  }

  warn(message: string, meta?: any) {
    this.log('warn', message, meta);
  }

  debug(message: string, meta?: any) {
    if (appConfig.nodeEnv !== 'production') {
      this.log('debug', message, meta);
    }
  }
}

const logger = new Logger();

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

// Error logging
export const errorLogger = (error: Error, context?: any) => {
  logger.error('Application Error', {
    message: error.message,
    stack: error.stack,
    context,
  });
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

export default logger;
