/**
 * Validation Middleware
 * Express middleware for request validation using Zod schemas
 */

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '@shared/utils/errors';
import { logger } from '@shared/utils/logger';

/**
 * Validates request body against a Zod schema
 */
export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = new ValidationError(
          'Validation failed',
          error.errors
        );
        
        logger.warn('Validation failed', {
          path: req.path,
          method: req.method,
          errors: error.errors,
        });
        
        return res.status(400).json({
          success: false,
          error: validationError.message,
          details: error.errors,
          code: 'VALIDATION_ERROR',
        });
      }
      next(error);
    }
  };
}

/**
 * Validates request query parameters against a Zod schema
 */
export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = new ValidationError(
          'Invalid query parameters',
          error.errors
        );
        
        logger.warn('Query validation failed', {
          path: req.path,
          method: req.method,
          errors: error.errors,
        });
        
        return res.status(400).json({
          success: false,
          error: validationError.message,
          details: error.errors,
          code: 'VALIDATION_ERROR',
        });
      }
      next(error);
    }
  };
}

/**
 * Validates request params against a Zod schema
 */
export function validateParams(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.params = schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = new ValidationError(
          'Invalid route parameters',
          error.errors
        );
        
        logger.warn('Params validation failed', {
          path: req.path,
          method: req.method,
          errors: error.errors,
        });
        
        return res.status(400).json({
          success: false,
          error: validationError.message,
          details: error.errors,
          code: 'VALIDATION_ERROR',
        });
      }
      next(error);
    }
  };
}

