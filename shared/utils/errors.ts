/**
 * Error Handling Utilities
 * Standardized error classes and handling
 */

import { ErrorCode } from '../types';
import { ERROR_MESSAGES } from '../constants';

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public details?: any,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: new Date().toISOString(),
    };
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super('VALIDATION_ERROR', message, details, 400);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super('NOT_FOUND', `${resource} not found`, undefined, 404);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = ERROR_MESSAGES.UNAUTHORIZED) {
    super('AUTH_ERROR', message, undefined, 401);
    this.name = 'UnauthorizedError';
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter?: number) {
    super(
      'RATE_LIMIT',
      ERROR_MESSAGES.RATE_LIMIT,
      { retryAfter },
      429
    );
    this.name = 'RateLimitError';
  }
}

export class NetworkError extends AppError {
  constructor(message: string = ERROR_MESSAGES.NETWORK_ERROR) {
    super('NETWORK_ERROR', message, undefined, 503);
    this.name = 'NetworkError';
  }
}

// Error handler factory
export function createErrorHandler() {
  return (error: unknown) => {
    if (error instanceof AppError) {
      return error;
    }

    if (error instanceof Error) {
      return new AppError('SERVER_ERROR', error.message, error.stack);
    }

    return new AppError('SERVER_ERROR', 'An unexpected error occurred');
  };
}

