import { Request, Response, NextFunction } from 'express';
import { validateFileType, validateFileSize } from '../config';
import { ApiResponse } from '../types';
import { PublicKey } from '@solana/web3.js';
import crypto from 'crypto';

// Centralized Solana address validation
export const SOLANA_ADDRESS_REGEX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export function isValidSolanaAddress(address: string): boolean {
  if (!address || typeof address !== 'string') {
    return false;
  }

  // First check regex pattern
  if (!SOLANA_ADDRESS_REGEX.test(address)) {
    return false;
  }

  // Then validate with PublicKey constructor
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

// Validation middleware factory
export const validateRequest = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body);
    if (error) {
      const response: ApiResponse = {
        success: false,
        error: error.details[0].message,
        code: 'VALIDATION_ERROR',
      };
      res.status(400).json(response);
      return;
    }
    next();
  };
};

// Wallet address validation using centralized function
export const validateWallet = (req: Request, res: Response, next: NextFunction) => {
  const { creatorWallet, owner } = req.body;
  const wallet = creatorWallet || owner;

  if (!wallet) {
    const response: ApiResponse = {
      success: false,
      error: 'Wallet address is required',
      code: 'MISSING_WALLET',
    };
    res.status(400).json(response);
    return;
  }

  if (!isValidSolanaAddress(wallet)) {
    const response: ApiResponse = {
      success: false,
      error: 'Invalid Solana wallet address format',
      code: 'INVALID_WALLET',
    };
    res.status(400).json(response);
    return;
  }

  next();
};

// File upload validation
export const validateFileUpload = (req: Request, res: Response, next: NextFunction) => {
  const file = req.file;

  if (!file) {
    const response: ApiResponse = {
      success: false,
      error: 'No file uploaded',
      code: 'NO_FILE',
    };
    res.status(400).json(response);
    return;
  }

  if (!validateFileType(file.mimetype)) {
    const response: ApiResponse = {
      success: false,
      error: `Invalid file type. Allowed types: ${process.env.ALLOWED_FILE_TYPES || 'image/jpeg, image/png, image/gif, image/webp'}`,
      code: 'INVALID_FILE_TYPE',
    };
    res.status(400).json(response);
    return;
  }

  if (!validateFileSize(file.size)) {
    const response: ApiResponse = {
      success: false,
      error: `File too large. Maximum size: ${process.env.MAX_FILE_SIZE || '10MB'}`,
      code: 'FILE_TOO_LARGE',
    };
    res.status(400).json(response);
    return;
  }

  next();
};

// Rate limiting validation
export const validateRateLimit = (req: Request, res: Response, next: NextFunction) => {
  // This would integrate with express-rate-limit
  next();
};

// Enhanced input sanitization with XSS protection
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Comprehensive string sanitization
  const sanitizeString = (str: string): string => {
    if (typeof str !== 'string') return str;

    return (
      str
        .trim()
        // Remove HTML tags and script content
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<[^>]*>/g, '')
        // Remove dangerous characters
        .replace(/[<>"'&]/g, '')
        // Remove control characters
        // eslint-disable-next-line no-control-regex
        .replace(/[\x00-\x1F\x7F]/g, '')
        // Limit length
        .substring(0, 1000)
    );
  };

  // Sanitize all string fields in body
  if (req.body && typeof req.body === 'object') {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeString(req.body[key]);
      }
    }
  }

  // Sanitize query parameters
  if (req.query && typeof req.query === 'object') {
    for (const key in req.query) {
      if (typeof req.query[key] === 'string') {
        req.query[key] = sanitizeString(req.query[key] as string);
      }
    }
  }

  next();
};

// CSRF protection middleware
export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  // Skip CSRF for GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Skip CSRF for health checks
  if (req.path === '/healthz' || req.path === '/health') {
    return next();
  }

  const csrfToken = req.headers['x-csrf-token'] as string;
  const sessionToken = (req as any).session?.csrfToken;

  if (!csrfToken || !sessionToken || csrfToken !== sessionToken) {
    const response: ApiResponse = {
      success: false,
      error: 'Invalid CSRF token',
      code: 'CSRF_TOKEN_INVALID',
    };
    return res.status(403).json(response);
  }

  next();
};

// Generate CSRF token
export const generateCSRFToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};
