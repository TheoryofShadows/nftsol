import { Request, Response, NextFunction } from 'express';
import { UsageMonitoringService } from '../services/usageMonitoringService';

const usageService = new UsageMonitoringService();

// Generate demo data on startup
usageService.generateDemoData();

export const trackUsage = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // Skip tracking for certain paths
  const skipPaths = ['/healthz', '/favicon.ico', '/robots.txt'];
  if (skipPaths.includes(req.path)) {
    return next();
  }
  
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    
    // Extract user information
    const userId = (req as any).user?.id;
    const walletAddress = (req as any).user?.walletAddress;
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'Unknown';
    
    // Calculate request/response sizes
    const requestSize = req.get('content-length') ? parseInt(req.get('content-length')!) : 0;
    const responseSize = res.get('content-length') ? parseInt(res.get('content-length')!) : 0;
    
    const metrics = {
      timestamp: Date.now(),
      endpoint: req.path,
      method: req.method,
      responseTime,
      statusCode: res.statusCode,
      userId,
      walletAddress,
      ipAddress,
      userAgent,
      requestSize,
      responseSize
    };
    
    usageService.recordUsage(metrics);
  });
  
  next();
};

// Enhanced tracking for API endpoints
export const trackAPICalls = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // Only track API calls
  if (!req.path.startsWith('/api/')) {
    return next();
  }
  
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    
    // Log API call details
    console.log(`API Call: ${req.method} ${req.path} - ${res.statusCode} (${responseTime}ms)`);
    
    // Record detailed metrics
    const metrics = {
      timestamp: Date.now(),
      endpoint: req.path,
      method: req.method,
      responseTime,
      statusCode: res.statusCode,
      userId: (req as any).user?.id,
      walletAddress: (req as any).user?.walletAddress,
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent') || 'Unknown',
      requestSize: req.get('content-length') ? parseInt(req.get('content-length')!) : 0,
      responseSize: res.get('content-length') ? parseInt(res.get('content-length')!) : 0
    };
    
    usageService.recordUsage(metrics);
  });
  
  next();
};

// Performance monitoring middleware
export const performanceMonitoring = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    
    // Log slow requests
    if (responseTime > 1000) {
      console.warn(`Slow request detected: ${req.method} ${req.path} - ${responseTime}ms`);
    }
    
    // Log error responses
    if (res.statusCode >= 400) {
      console.error(`Error response: ${req.method} ${req.path} - ${res.statusCode} (${responseTime}ms)`);
    }
  });
  
  next();
};

export { usageService };
