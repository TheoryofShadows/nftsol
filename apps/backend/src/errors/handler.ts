/**
 * Standardized Error Handler
 * Formats all errors consistently with error codes
 */

import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import { ERROR_CODES, getErrorMetadata } from './codes';

export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 500,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Express error handler middleware
 * Must be used AFTER all other middleware and route handlers
 */
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Default error
  let error = err;
  if (!(err instanceof AppError)) {
    error = new AppError(
      ERROR_CODES.INTERNAL_SERVER_ERROR,
      err.message || 'Internal server error',
      500,
      { originalError: err.code }
    );
  }

  // Log the error
  logger.error('Error handler triggered', {
    code: error.code,
    message: error.message,
    statusCode: error.statusCode,
    path: req.path,
    method: req.method,
    stack: error.stack,
    details: error.details,
  });

  // Get error metadata
  const metadata = getErrorMetadata(error.code);

  // Don't expose error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Prepare response
  const response = {
    success: false,
    error: {
      code: error.code,
      message: metadata.userMessage || error.message,
      ...(isDevelopment && { details: error.details }),
      suggestion: metadata.suggestion,
      retryable: metadata.retryable,
    },
    timestamp: new Date().toISOString(),
    path: req.path,
    ...(isDevelopment && { stack: error.stack }),
  };

  // Send response
  res.status(metadata.statusCode).json(response);
};

/**
 * Async wrapper for route handlers
 * Catches errors and passes to error handler
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    return Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Create a wallet error
 */
export function walletNotFound() {
  return new AppError(
    ERROR_CODES.WALLET_NOT_FOUND,
    'Wallet not found',
    404
  );
}

export function invalidWalletAddress() {
  return new AppError(
    ERROR_CODES.INVALID_WALLET_ADDRESS,
    'Invalid wallet address format',
    400
  );
}

export function insufficientBalance() {
  return new AppError(
    ERROR_CODES.WALLET_BALANCE_INSUFFICIENT,
    'Insufficient wallet balance',
    402
  );
}

/**
 * Create an NFT error
 */
export function nftNotFound() {
  return new AppError(
    ERROR_CODES.NFT_NOT_FOUND,
    'NFT not found',
    404
  );
}

export function invalidNFTMetadata() {
  return new AppError(
    ERROR_CODES.INVALID_METADATA,
    'Invalid NFT metadata',
    400
  );
}

/**
 * Create a Solana error
 */
export function solanaRPCError(details?: string) {
  return new AppError(
    ERROR_CODES.SOLANA_RPC_ERROR,
    'Solana RPC error: ' + (details || 'Unable to communicate with blockchain'),
    503
  );
}

export function transactionFailed(details?: string) {
  return new AppError(
    ERROR_CODES.TRANSACTION_FAILED,
    'Transaction failed: ' + (details || 'Check wallet balance and network'),
    500
  );
}

/**
 * Create an authentication error
 */
export function unauthorized() {
  return new AppError(
    ERROR_CODES.UNAUTHORIZED,
    'Not authenticated',
    401
  );
}

export function tokenExpired() {
  return new AppError(
    ERROR_CODES.TOKEN_EXPIRED,
    'Token has expired',
    401
  );
}

export function signatureVerificationFailed() {
  return new AppError(
    ERROR_CODES.INVALID_SIGNATURE,
    'Signature verification failed',
    401
  );
}

/**
 * Create a validation error
 */
export function validationError(message: string, details?: Record<string, any>) {
  return new AppError(
    ERROR_CODES.VALIDATION_ERROR,
    message || 'Validation failed',
    400,
    details
  );
}

export function missingRequiredField(fieldName: string) {
  return new AppError(
    ERROR_CODES.MISSING_REQUIRED_FIELD,
    `Required field missing: ${fieldName}`,
    400
  );
}

/**
 * Create a rate limit error
 */
export function rateLimited() {
  return new AppError(
    ERROR_CODES.RATE_LIMITED,
    'Rate limit exceeded',
    429
  );
}

/**
 * Create a database error
 */
export function databaseError(details?: string) {
  return new AppError(
    ERROR_CODES.DATABASE_ERROR,
    'Database error: ' + (details || 'Unable to complete operation'),
    500
  );
}

/**
 * Create a generic server error
 */
export function internalServerError(details?: string) {
  return new AppError(
    ERROR_CODES.INTERNAL_SERVER_ERROR,
    'Internal server error',
    500,
    details ? { details } : undefined
  );
}
