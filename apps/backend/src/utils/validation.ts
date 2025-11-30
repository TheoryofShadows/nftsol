import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { PublicKey, Connection, Cluster } from '@solana/web3.js';
import { appConfig } from '../config';
import csrf from 'csurf';
import { createModuleLogger } from '../utils/logger';

const log = createModuleLogger('validation');

// Type for Multer file
type MulterFile = {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer?: Buffer;
};

// Types
export type FileUploadConfig = {
  allowedTypes: readonly string[];
  maxSize: number; // in bytes
};

/**
 * Custom error class for validation errors
 */
export class ValidationError extends Error {
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(message: string, statusCode = 400, details?: unknown) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = statusCode;
    this.details = details;
    
    // Maintain proper prototype chain
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValidationError);
    }
    
    Object.setPrototypeOf(this, ValidationError.prototype);
  }

  /**
   * Creates a validation error for invalid file types
   */
  static invalidFileType(allowedTypes: readonly string[], receivedType?: string): ValidationError {
    const message = receivedType 
      ? `Invalid file type. Received: ${receivedType}. Allowed types: ${allowedTypes.join(', ')}`
      : `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`;
      
    return new ValidationError(message, 400, { allowedTypes, receivedType });
  }

  /**
   * Creates a validation error for file size limits
   */
  static fileTooLarge(maxSizeBytes: number, receivedSize?: number): ValidationError {
    const formatSize = (bytes: number) => {
      if (bytes < 1024) return `${bytes} bytes`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    const message = receivedSize !== undefined
      ? `File too large. Maximum size: ${formatSize(maxSizeBytes)}, received: ${formatSize(receivedSize)}`
      : `File too large. Maximum size: ${formatSize(maxSizeBytes)}`;
      
    return new ValidationError(message, 413, { maxSizeBytes, receivedSize });
  }
}

/**
 * Represents the result of a validation operation
 */
export interface ValidationResult<T = unknown> {
  isValid: boolean;
  error?: string;
  statusCode?: number;
  data?: T;
  details?: unknown; // For additional error details
}

/**
 * Validates if the file type is allowed
 */
/**
 * Validates if the file type is allowed
 * @param mimetype - The MIME type of the file to validate
 * @param allowedTypes - Optional array of allowed MIME types (defaults to appConfig)
 * @returns ValidationResult with validation status and error details if invalid
 */
export const validateFileType = (
  mimetype: string,
  allowedTypes: readonly string[] = appConfig.fileUpload.allowedTypes
): ValidationResult<{ allowedTypes: string[]; receivedType: string }> => {
  if (typeof mimetype !== 'string' || !mimetype.trim()) {
    throw new ValidationError('File type is required', 400);
  }

  const normalizedMimetype = mimetype.toLowerCase().trim();
  const isValid = allowedTypes.some(type => 
    type.toLowerCase() === normalizedMimetype ||
    type.endsWith('/*') && 
    normalizedMimetype.startsWith(type.slice(0, -1))
  );
  
  if (!isValid) {
    throw ValidationError.invalidFileType(allowedTypes, mimetype);
  }
  
  return {
    isValid: true,
    data: { allowedTypes: [...allowedTypes], receivedType: mimetype }
  };
};

/**
 * Validates if the file size is within limits
 */
/**
 * Validates if the file size is within limits
 * @param size - File size in bytes
 * @param maxSize - Optional maximum size in bytes (defaults to appConfig)
 * @returns ValidationResult with validation status and error details if invalid
 */
export const validateFileSize = (
  size: number,
  maxSize: number = appConfig.fileUpload.maxSize
): ValidationResult<{ maxSize: number; receivedSize: number }> => {
  if (typeof size !== 'number' || size < 0 || !Number.isFinite(size)) {
    throw new ValidationError('Invalid file size', 400, { receivedSize: size });
  }

  if (size > maxSize) {
    throw ValidationError.fileTooLarge(maxSize, size);
  }
  
  return {
    isValid: true,
    data: { maxSize, receivedSize: size }
  };
};

/**
 * Validates a file against type and size constraints
 */
/**
 * Validates a file against type and size constraints
 * @param file - The file to validate
 * @param options - Optional validation options
 * @returns Validation result with file details if valid
 */
export function validateFile(
  file: MulterFile | undefined,
  options?: {
    allowedTypes?: string[];
    maxSize?: number;
  }
): ValidationResult<{ file: MulterFile; type: string; size: number }> {
  if (!file) {
    return {
      isValid: false,
      error: 'No file was uploaded',
      statusCode: 400
    };
  }

  // Validate file type
  const typeResult = validateFileType(
    file.mimetype,
    options?.allowedTypes
  );
  
  if (!typeResult.isValid) {
    const result: ValidationResult<{ file: MulterFile; type: string; size: number }> = {
      isValid: false,
      error: typeResult.error,
      statusCode: typeResult.statusCode || 400,
    };
    
    if ('details' in typeResult) {
      result.details = (typeResult as any).details;
    }
    
    return result;
  }

  // Validate file size
  const sizeResult = validateFileSize(file.size, options?.maxSize);
  
  if (!sizeResult.isValid) {
    const result: ValidationResult<{ file: MulterFile; type: string; size: number }> = {
      isValid: false,
      error: sizeResult.error,
      statusCode: sizeResult.statusCode || 400,
    };
    
    if ('details' in sizeResult) {
      result.details = (sizeResult as any).details;
    }
    
    return result;
  }

  // If we get here, file is valid
  return {
    isValid: true,
    data: {
      file,
      type: file.mimetype,
      size: file.size
    }
  } as const;
}

/**
 * Express middleware for file upload validation
 */
/**
 * Express middleware for file upload validation
 */
export const validateUpload = (req: Request, res: Response, next: NextFunction): void | Response => {
  try {
    const { isValid, error, statusCode = 400 } = validateFile(req.file);
    
    if (!isValid) {
      return res.status(statusCode).json({ 
        success: false, 
        error: error || 'Invalid file'
      });
    }

    next();
  } catch (error) {
    log.error('Upload validation error:', error);
    return res.status(500).json({
      success: false,
      error: 'An error occurred during file validation'
    });
  }
};

/**
 * Sanitizes input to prevent XSS attacks
 * @param input - The input to sanitize
 * @returns Sanitized string
 */
export const sanitizeInput = (input: string | number | undefined | null): string => {
  if (input === null || input === undefined) return '';

  const str = String(input);

  // Remove potentially dangerous control characters using char codes
  const cleaned = Array.from(str)
    .filter((char) => {
      const code = char.charCodeAt(0);
      if (code <= 0x1f) return false; // C0 controls
      if (code >= 0x7f && code <= 0x9f) return false; // C1 controls
      if (code >= 0x2000 && code <= 0x200f) return false; // General punctuation
      if (code >= 0x2028 && code <= 0x202f) return false; // Line/paragraph separators
      if (code >= 0x205f && code <= 0x206f) return false; // Additional spacing marks
      if (code === 0x3000) return false; // Ideographic space
      return true;
    })
    .join('');

  return cleaned
    .replace(/[<>&"'`=]/g, '')
    .trim();
};

/**
 * Sanitizes request body to remove sensitive fields before logging
 * Prevents logging of passwords, tokens, keys, and other sensitive data
 * @param body - The request body object
 * @returns Sanitized copy of the body with sensitive fields removed
 */
export const sanitizeRequestBody = (body: any): any => {
  if (!body || typeof body !== 'object') {
    return body;
  }

  // Fields that should never be logged
  const sensitiveFields = [
    'password',
    'passwordHash',
    'token',
    'accessToken',
    'refreshToken',
    'apiKey',
    'secretKey',
    'secret',
    'privateKey',
    'privateKeyHex',
    'authorization',
    'auth',
    'csrf',
    'csrfToken',
    'sessionId',
    'session',
    'signature',
    'pin',
    'otp',
    'twoFactor',
    '2fa',
    'mnemonic',
    'seed',
    'recoveryCode',
    'recoveryPhrase'
  ];

  const sanitized: any = {};

  for (const [key, value] of Object.entries(body)) {
    // Check if this is a sensitive field (case-insensitive)
    const lowerKey = key.toLowerCase();
    const isSensitive = sensitiveFields.some(field =>
      lowerKey.includes(field.toLowerCase())
    );

    if (isSensitive) {
      // Don't log sensitive field values
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      // Safe to log these primitive types
      sanitized[key] = value;
    } else if (value === null) {
      sanitized[key] = null;
    } else if (Array.isArray(value)) {
      // For arrays, just log the length
      sanitized[key] = `[Array(${value.length})]`;
    } else if (typeof value === 'object') {
      // For nested objects, recursively sanitize
      sanitized[key] = sanitizeRequestBody(value);
    } else {
      // For other types, just indicate presence
      sanitized[key] = `[${typeof value}]`;
    }
  }

  return sanitized;
};

/**
 * CSRF Protection Middleware
 * Configured to work with both session-based and body-based token extraction
 */
export const csrfProtection: RequestHandler = csrf({
  // Use session-based CSRF tokens (required for csurf to work properly)
  value: (req: any): string => {
    // Try to get token from body first (for multipart form data with _csrf field)
    if (req.body && typeof req.body === 'object') {
      const tokenFromBody = (req.body as any)._csrf;
      if (tokenFromBody && typeof tokenFromBody === 'string') {
        return tokenFromBody;
      }
    }

    // Try to get token from headers
    const tokenFromHeader = req.headers['x-csrf-token'] || req.headers['x-xsrf-token'];
    if (tokenFromHeader && typeof tokenFromHeader === 'string') {
      return tokenFromHeader;
    }

    // Try to get token from cookie
    const tokenFromCookie = req.cookies?.['XSRF-TOKEN'];
    if (tokenFromCookie && typeof tokenFromCookie === 'string') {
      return tokenFromCookie;
    }

    // Must return a string for csurf, will be validated against session
    return '';
  }
});

// Generate CSRF Token
/**
 * Generates and attaches a CSRF token to the response locals
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Next middleware function
 * @returns void or calls next()
 */
/**
 * Generates and attaches a CSRF token to the response locals
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Next middleware function
 * @returns void or calls next()
 */
export const generateCSRFToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    if (typeof req.csrfToken !== 'function') {
      throw new ValidationError('CSRF protection is not properly configured', 500);
    }
    
    const token = req.csrfToken();
    if (!token) {
      throw new ValidationError('Failed to generate CSRF token', 500);
    }
    
    // Set token in response locals for use in templates/API responses
    res.locals.csrfToken = token;
    
    // Also set as a cookie for AJAX requests
    res.cookie('XSRF-TOKEN', token, {
      httpOnly: false, // Allow JavaScript to read the cookie
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });
    
    next();
  } catch (error) {
    if (error instanceof ValidationError) {
      return next(error);
    }
    next(new ValidationError(
      'Failed to generate CSRF token',
      500,
      error instanceof Error ? { message: error.message } : undefined
    ));
  }
};

/**
 * Options for Solana address validation
 */
export interface SolanaAddressValidationOptions {
  /**
   * Whether to check if the address is on the curve
   * @default true
   */
  checkOnCurve?: boolean;
  
  /**
   * Optional connection to validate address existence on-chain
   */
  connection?: Connection;
  
  /**
   * Whether to validate the address exists on-chain
   * Requires 'connection' to be provided
   * @default false
   */
  validateExistence?: boolean;
  
  /**
   * Cluster to use for address validation
   * @default 'mainnet-beta'
   */
  cluster?: Cluster;
}

/**
 * Validates a Solana address with additional options
 * @param address - The address to validate
 * @param options - Validation options
 * @returns Promise that resolves to a validation result
 */
export async function validateSolanaAddress(
  address: string,
  options: SolanaAddressValidationOptions & { validateExistence: true; connection: Connection }
): Promise<ValidationResult<{ publicKey: PublicKey; exists: boolean }>>;

export async function validateSolanaAddress(
  address: string,
  options?: SolanaAddressValidationOptions
): Promise<ValidationResult<{ publicKey: PublicKey }>>;

export async function validateSolanaAddress(
  address: string,
  options: SolanaAddressValidationOptions = {}
): Promise<ValidationResult> {
  const {
    checkOnCurve = true,
    connection,
    validateExistence = false,
    cluster = 'mainnet-beta'
  } = options;

  // Basic validation
  if (typeof address !== 'string' || !address.trim()) {
    throw new ValidationError('Address is required', 400);
  }

  const trimmedAddress = address.trim();
  
  // Base58 validation
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  if (!base58Regex.test(trimmedAddress)) {
    return {
      isValid: false,
      error: 'Invalid Solana address format',
      statusCode: 400,
      data: { address: trimmedAddress }
    };
  }

  try {
    const publicKey = new PublicKey(trimmedAddress);
    
    // Check if address is on the curve
    if (checkOnCurve && !PublicKey.isOnCurve(publicKey.toBuffer())) {
      return {
        isValid: false,
        error: 'Invalid Solana address: not on curve',
        statusCode: 400,
        data: { address: trimmedAddress }
      };
    }

    // Check if address exists on-chain
    if (validateExistence) {
      if (!connection) {
        return {
          isValid: false,
          error: 'Connection is required for on-chain validation',
          statusCode: 500,
          data: { address: trimmedAddress, cluster }
        };
      }

      try {
        const [accountInfo, balance] = await Promise.all([
          connection.getAccountInfo(publicKey),
          connection.getBalance(publicKey)
        ]);
        
        return {
          isValid: true,
          data: { 
            publicKey,
            exists: accountInfo !== null,
            hasBalance: balance > 0,
            balance,
            cluster
          }
        };
      } catch (error) {
        return {
          isValid: false,
          error: 'Failed to validate address on-chain',
          statusCode: 503, // Service Unavailable
          data: { 
            address: trimmedAddress, 
            cluster,
            message: error instanceof Error ? error.message : 'Unknown error'
          }
        };
      }
    }

    return {
      isValid: true,
      data: { publicKey, cluster }
    };
  } catch (error) {
    return {
      isValid: false,
      error: 'Invalid Solana address',
      statusCode: 400,
      data: { address: trimmedAddress }
    };
  }
}

/**
 * Validates if a string is a valid Solana address
 * @deprecated Use validateSolanaAddress instead for more features
 */
/**
 * Validates if a string is a valid Solana address
 * @deprecated Use validateSolanaAddress instead for more features and better error handling
 */
export const isValidSolanaAddress = async (address: string): Promise<boolean> => {
  try {
    const result = await validateSolanaAddress(address);
    return result.isValid;
  } catch {
    return false;
  }
};

/**
 * Validates and normalizes a Solana address
 * @param address - The address to validate and normalize
 * @param options - Validation options
 * @returns The normalized address or throws ValidationError
 */
export const validateAndNormalizeSolanaAddress = async (
  address: string,
  options?: Omit<SolanaAddressValidationOptions, 'validateExistence'>
): Promise<string> => {
  const result = await validateSolanaAddress(address, options);
  if (!result.isValid) {
    throw new ValidationError(
      result.error || 'Invalid Solana address',
      result.statusCode,
      result.data
    );
  }
  return result.data!.publicKey.toBase58();
}

/**
 * Options for wallet validation middleware
 */
interface WalletValidationOptions {
  /**
   * Fields in the request to check for wallet addresses
   * @default ['wallet', 'toAddress', 'recipientAddress', 'publicKey']
   */
  addressFields?: readonly string[];
  
  /**
   * Whether the wallet address is required
   * @default true
   */
  required?: boolean;
  
  /**
   * Whether to validate the address format
   * @default true
   */
  validateFormat?: boolean;
  
  /**
   * Solana connection for on-chain validation
   * Required if checkExistence is true
   */
  connection?: Connection;
  
  /**
   * Whether to check if the wallet exists on-chain
   * @default false
   * @requires connection - A Solana connection must be provided
   */
  checkExistence?: boolean;
  
  /**
   * Test addresses to bypass validation (useful for testing)
   */
  testAddresses?: readonly string[];
  
  /**
   * Custom error message for validation failures
   */
  errorMessage?: string;
  
  /**
   * Whether to normalize the address (trim whitespace, etc.)
   * @default true
   */
  normalizeAddress?: boolean;
}

/**
 * Default wallet address fields to check in the request
 */
const DEFAULT_WALLET_FIELDS: string[] = [
  'wallet',
  'toAddress',
  'recipientAddress',
  'publicKey',
  'walletAddress',
  'fromAddress',
  'senderAddress'
];

/**
 * Extracts wallet address from request
 */
const extractWalletAddress = (req: Request, fields: string[] = [...DEFAULT_WALLET_FIELDS]): string | null => {
  // Check query params first
  for (const field of fields) {
    const value = req.query[field];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  
  // Then check request body
  for (const field of fields) {
    const value = req.body?.[field];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  
  return null;
};

/**
 * Middleware to validate wallet address in request
 * @deprecated Use the newer validateWallet function with RequestHandler return type
 * @param options - Validation options
 * @returns Express middleware function
 */
export const validateWalletLegacy = (options: WalletValidationOptions = {}) => {
  // Create mutable copies of the arrays to avoid readonly issues
  const addressFields = options.addressFields ? [...options.addressFields] : [...DEFAULT_WALLET_FIELDS];
  const testAddresses = options.testAddresses ? [...options.testAddresses] : [];
  const required = options.required !== undefined ? options.required : true;
  const validateFormat = options.validateFormat !== undefined ? options.validateFormat : true;
  const checkExistence = options.checkExistence !== undefined ? options.checkExistence : false;
  const connection = options.connection;
  
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
            // Extract wallet address from request
      const address = extractWalletAddress(req, addressFields);
      
      // Handle missing address
      if (!address || !address.trim()) {
        if (required) {
          throw new ValidationError('Wallet address is required', 400, {
            fields: addressFields,
            received: { body: req.body, query: req.query }
          });
        }
        return next();
      }
      
      const trimmedAddress = address.trim();
      
      // Check if it's a test address
      if (testAddresses.includes(trimmedAddress)) {
        res.locals.walletAddress = trimmedAddress;
        return next();
      }
      
      // Validate the address if required
      if (validateFormat || checkExistence) {
        const validationOptions: SolanaAddressValidationOptions = {
          checkOnCurve: validateFormat,
          connection: checkExistence ? connection : undefined,
          validateExistence: checkExistence
        };
        
        const result = await validateSolanaAddress(trimmedAddress, validationOptions);
        
        if (!result.isValid) {
          throw new ValidationError(
            result.error || 'Invalid wallet address',
            400,
            { address: trimmedAddress }
          );
        }
        
        // Store the validated address and public key in res.locals
        res.locals.walletAddress = result.data!.publicKey.toBase58();
        res.locals.publicKey = result.data!.publicKey;
        
        // Add existence info if available
        if ('exists' in result.data!) {
          res.locals.walletExists = result.data.exists;
        }
      } else {
        // Just store the address if no validation is needed
        res.locals.walletAddress = trimmedAddress;
      }
      
      next();
    } catch (error) {
      if (error instanceof ValidationError) {
        return next(error);
      }
      
      // Convert to ValidationError for consistent error handling
      const validationError = new ValidationError(
        'Failed to validate wallet address',
        500,
        error instanceof Error ? { message: error.message } : undefined
      );
      next(validationError);
    }
  };
};

/**
 * Validates wallet addresses in incoming requests with enhanced type safety and options
 * 
 * @example
 * // Basic usage
 * router.post('/transfer', validateWallet(), handleTransfer);
 * 
 * @example
 * // With custom fields and existence check
 * router.post('/airdrop', 
 *   validateWallet({
 *     addressFields: ['recipient'],
 *     checkExistence: true,
 *     connection: getConnection(),
 *     errorMessage: 'Invalid recipient address'
 *   }),
 *   handleAirdrop
 * );
 * 
 * @param options - Configuration options for wallet validation
 * @returns Express middleware function
 */
/**
 * Validates wallet addresses in incoming requests with enhanced type safety and options
 * 
 * @example
 * Basic usage
 * router.post('/transfer', validateWallet(), handleTransfer);
 * 
 * @param options - Configuration options for wallet validation
 * @returns Express middleware function
 */
export const validateWallet = (options: WalletValidationOptions = {}): RequestHandler => {
  const {
    addressFields = DEFAULT_WALLET_FIELDS,
    required = true,
    validateFormat = true,
    checkExistence = false,
    testAddresses = [],
    errorMessage,
    normalizeAddress = true,
    connection
  } = options;

  // Validate required options
  if (checkExistence && !connection) {
    throw new Error('A Solana connection is required when checkExistence is true');
  }

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const address = extractWalletAddress(req, addressFields as string[]);
      
      // Handle missing address
      if (!address && required) {
        return res.status(400).json({
          success: false,
          error: errorMessage || 'Wallet address is required',
          code: 'WALLET_ADDRESS_REQUIRED',
          fields: addressFields
        });
      }

      if (!address) {
        return next();
      }

      // Skip validation for test addresses
      if (testAddresses.includes(address)) {
        return next();
      }

      // Normalize address if needed
      const normalizedAddress = normalizeAddress ? address.trim() : address;
      
      // Validate format if enabled
      if (validateFormat) {
        try {
          new PublicKey(normalizedAddress);
        } catch (error) {
          return res.status(400).json({
            success: false,
            error: errorMessage || 'Invalid wallet address format',
            code: 'INVALID_WALLET_FORMAT',
            address: normalizedAddress
          });
        }
      }

      // Check existence on-chain if enabled
      if (checkExistence && connection) {
        try {
          const accountInfo = await connection.getAccountInfo(new PublicKey(normalizedAddress));
          if (!accountInfo) {
            return res.status(400).json({
              success: false,
              error: errorMessage || 'Wallet does not exist on this network',
              code: 'WALLET_NOT_FOUND',
              address: normalizedAddress
            });
          }
        } catch (error) {
          log.error('Error checking wallet existence:', error);
          return res.status(500).json({
            success: false,
            error: 'Failed to validate wallet address',
            code: 'WALLET_VALIDATION_ERROR'
          });
        }
      }

      // Attach normalized address to request for later use
      (req as any).walletAddress = normalizedAddress;
      
      next();
    } catch (error) {
      log.error('Wallet validation error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during wallet validation',
        code: 'INTERNAL_SERVER_ERROR'
      });
    }
  };
};

/**
 * @deprecated Use validateWallet instead. This function will be removed in a future version.
 * 
 * Creates a wallet validation middleware with custom options
 * 
 * @example
 * // Old way (deprecated)
 * router.post('/deposit', createWalletValidator(), handleDeposit);
 * 
 * // New way (preferred)
 * router.post('/deposit', validateWallet(), handleDeposit);
 * 
 * @param options - Configuration options for wallet validation
 * @returns Express middleware function
 */
export const createWalletValidator = (options: WalletValidationOptions = {}): RequestHandler => {
  log.warn('createWalletValidator is deprecated. Use validateWallet instead.');
  return validateWallet(options);
};
