/**
 * Error Handling Middleware
 * Centralized error handling for Express
 */

import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError, NotFoundError, NetworkError } from '@shared/utils/errors';
import { logger } from '@shared/utils/logger';
import { envConfig } from '@shared/config/environment';

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Log error
  logger.error('Request error', err, {
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Handle known error types
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code,
      details: envConfig.isDevelopment ? err.details : undefined,
      timestamp: new Date().toISOString(),
    });
  }

  // Handle Zod validation errors (if not caught by validation middleware)
  if (err.name === 'ZodError') {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: envConfig.isDevelopment ? (err as any).errors : undefined,
      timestamp: new Date().toISOString(),
    });
  }

  // Handle unknown errors
  const message = envConfig.isProduction 
    ? 'An internal server error occurred'
    : err.message;

  return res.status(500).json({
    success: false,
    error: message,
    code: 'SERVER_ERROR',
    timestamp: new Date().toISOString(),
  });
}

/**
 * 404 Not Found handler
 */
export function notFoundHandler(req: Request, res: Response) {
  logger.warn('Route not found', {
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  res.status(404).json({
    success: false,
    error: 'Route not found',
    code: 'NOT_FOUND',
    path: req.path,
    timestamp: new Date().toISOString(),
  });
}

