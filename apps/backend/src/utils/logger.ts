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
      ...meta
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
      userAgent: req.get('User-Agent')
    });
  });
  
  next();
};

// Error logging
export const errorLogger = (error: Error, context?: any) => {
  logger.error('Application Error', {
    message: error.message,
    stack: error.stack,
    context
  });
};

// Performance logging
export const performanceLogger = (operation: string, duration: number, metadata?: any) => {
  logger.info('Performance Metric', {
    operation,
    duration: `${duration}ms`,
    ...metadata
  });
};

export default logger;
