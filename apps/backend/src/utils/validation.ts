import { Request, Response, NextFunction } from 'express';
import { validateWalletAddress, validateFileType, validateFileSize } from '../config';
import { ApiResponse } from '../types';

// Validation middleware factory
export const validateRequest = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body);
    if (error) {
      const response: ApiResponse = {
        success: false,
        error: error.details[0].message,
        code: 'VALIDATION_ERROR'
      };
      res.status(400).json(response);
      return;
    }
    next();
  };
};

// Wallet address validation
export const validateWallet = (req: Request, res: Response, next: NextFunction) => {
  const { creatorWallet, owner } = req.body;
  const wallet = creatorWallet || owner;
  
  if (!wallet) {
    const response: ApiResponse = {
      success: false,
      error: 'Wallet address is required',
      code: 'MISSING_WALLET'
    };
    res.status(400).json(response);
    return;
  }
  
  if (!validateWalletAddress(wallet)) {
    const response: ApiResponse = {
      success: false,
      error: 'Invalid wallet address format',
      code: 'INVALID_WALLET'
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
      code: 'NO_FILE'
    };
    res.status(400).json(response);
    return;
  }
  
  if (!validateFileType(file.mimetype)) {
    const response: ApiResponse = {
      success: false,
      error: `Invalid file type. Allowed types: ${process.env.ALLOWED_FILE_TYPES || 'image/jpeg, image/png, image/gif, image/webp'}`,
      code: 'INVALID_FILE_TYPE'
    };
    res.status(400).json(response);
    return;
  }
  
  if (!validateFileSize(file.size)) {
    const response: ApiResponse = {
      success: false,
      error: `File too large. Maximum size: ${process.env.MAX_FILE_SIZE || '10MB'}`,
      code: 'FILE_TOO_LARGE'
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

// Input sanitization
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Sanitize string inputs
  const sanitizeString = (str: string): string => {
    return str.trim().replace(/[<>]/g, '');
  };
  
  if (req.body.name) {
    req.body.name = sanitizeString(req.body.name);
  }
  
  if (req.body.description) {
    req.body.description = sanitizeString(req.body.description);
  }
  
  next();
};
