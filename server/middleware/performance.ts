import { Request, Response, NextFunction } from 'express';
import compression from 'compression';

/**
 * Performance middleware for the NFTSol server
 */

// Compression middleware with optimized settings
export const compressionMiddleware = compression({
  level: 6, // Good balance between compression ratio and CPU usage
  threshold: 1024, // Only compress responses larger than 1KB
  filter: (req, res) => {
    // Don't compress if the client doesn't support it
    if (req.headers['x-no-compression']) {
      return false;
    }
    // Use compression for all other responses
    return compression.filter(req, res);
  }
});

// Response time tracking middleware
export const responseTimeMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    // Log slow requests
    if (duration > 1000) {
      console.warn(`Slow request: ${req.method} ${req.path} took ${duration}ms`);
    }
    
    // Add response time header
    res.setHeader('X-Response-Time', `${duration}ms`);
  });
  
  next();
};

// Memory usage monitoring
export const memoryMonitoringMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const memUsage = process.memoryUsage();
  
  // Log memory warnings
  if (memUsage.heapUsed > 500 * 1024 * 1024) { // 500MB
    console.warn('High memory usage detected:', {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB',
      external: Math.round(memUsage.external / 1024 / 1024) + 'MB'
    });
  }
  
  next();
};

// Request size limiting
export const requestSizeLimiter = (maxSize: string = '50mb') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = req.headers['content-length'];
    
    if (contentLength) {
      const sizeInMB = parseInt(contentLength) / (1024 * 1024);
      const maxSizeInMB = parseInt(maxSize.replace('mb', ''));
      
      if (sizeInMB > maxSizeInMB) {
        return res.status(413).json({
          error: 'Request too large',
          maxSize: maxSize,
          receivedSize: `${sizeInMB.toFixed(2)}MB`
        });
      }
    }
    
    next();
  };
};

// API response caching middleware
export const apiCacheMiddleware = (duration: number = 300) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }
    
    // Don't cache authenticated requests
    if (req.headers.authorization) {
      return next();
    }
    
    // Set cache headers
    res.setHeader('Cache-Control', `public, max-age=${duration}`);
    res.setHeader('Expires', new Date(Date.now() + duration * 1000).toUTCString());
    
    next();
  };
};

// Health check endpoint
export const healthCheckEndpoint = (req: Request, res: Response) => {
  const memUsage = process.memoryUsage();
  const uptime = process.uptime();
  
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(uptime),
    memory: {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024)
    },
    environment: process.env.NODE_ENV || 'development'
  });
};