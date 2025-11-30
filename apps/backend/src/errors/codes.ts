/**
 * Standardized Error Codes
 * All API errors must use one of these codes for consistency
 */

export const ERROR_CODES = {
  // ============================================================================
  // WALLET ERRORS (WALLET_xxx)
  // ============================================================================
  WALLET_NOT_FOUND: 'WALLET_001',
  INVALID_WALLET_ADDRESS: 'WALLET_002',
  WALLET_BALANCE_INSUFFICIENT: 'WALLET_003',
  WALLET_OPERATION_FAILED: 'WALLET_004',
  WALLET_NOT_CONNECTED: 'WALLET_005',

  // ============================================================================
  // NFT ERRORS (NFT_xxx)
  // ============================================================================
  NFT_NOT_FOUND: 'NFT_001',
  NFT_ALREADY_MINTED: 'NFT_002',
  INVALID_METADATA: 'NFT_003',
  NFT_MINT_FAILED: 'NFT_004',
  NFT_TRANSFER_FAILED: 'NFT_005',
  INVALID_COLLECTION: 'NFT_006',

  // ============================================================================
  // SOLANA BLOCKCHAIN ERRORS (SOLANA_xxx)
  // ============================================================================
  SOLANA_RPC_ERROR: 'SOLANA_001',
  TRANSACTION_FAILED: 'SOLANA_002',
  BLOCKHASH_EXPIRED: 'SOLANA_003',
  INSUFFICIENT_SOL: 'SOLANA_004',
  INVALID_TRANSACTION: 'SOLANA_005',
  RPC_TIMEOUT: 'SOLANA_006',
  ACCOUNT_NOT_FOUND: 'SOLANA_007',
  PROGRAM_ERROR: 'SOLANA_008',

  // ============================================================================
  // CLOUT TOKEN ERRORS (CLOUT_xxx)
  // ============================================================================
  CLOUT_TRANSFER_FAILED: 'CLOUT_001',
  CLOUT_BALANCE_INSUFFICIENT: 'CLOUT_002',
  CLOUT_INVALID_AMOUNT: 'CLOUT_003',
  CLOUT_OPERATION_NOT_ALLOWED: 'CLOUT_004',

  // ============================================================================
  // ECHO/LEDGER ERRORS (ECHO_xxx)
  // ============================================================================
  ECHO_LEDGER_NOT_FOUND: 'ECHO_001',
  ECHO_INVALID_DATA: 'ECHO_002',
  ECHO_LIMIT_EXCEEDED: 'ECHO_003',
  ECHO_OPERATION_FAILED: 'ECHO_004',

  // ============================================================================
  // AUTHENTICATION ERRORS (AUTH_xxx)
  // ============================================================================
  UNAUTHORIZED: 'AUTH_001',
  TOKEN_EXPIRED: 'AUTH_002',
  INVALID_SIGNATURE: 'AUTH_003',
  SIGNATURE_VERIFICATION_FAILED: 'AUTH_004',
  REFRESH_TOKEN_INVALID: 'AUTH_005',
  SESSION_EXPIRED: 'AUTH_006',
  INSUFFICIENT_PERMISSIONS: 'AUTH_007',

  // ============================================================================
  // VALIDATION ERRORS (VALIDATION_xxx)
  // ============================================================================
  VALIDATION_ERROR: 'VALIDATION_001',
  MISSING_REQUIRED_FIELD: 'VALIDATION_002',
  INVALID_FORMAT: 'VALIDATION_003',
  VALUE_OUT_OF_RANGE: 'VALIDATION_004',
  INVALID_ENUM_VALUE: 'VALIDATION_005',

  // ============================================================================
  // DATABASE ERRORS (DATABASE_xxx)
  // ============================================================================
  DATABASE_ERROR: 'DATABASE_001',
  RECORD_NOT_FOUND: 'DATABASE_002',
  DUPLICATE_RECORD: 'DATABASE_003',
  DATABASE_CONSTRAINT_VIOLATION: 'DATABASE_004',
  MIGRATION_FAILED: 'DATABASE_005',

  // ============================================================================
  // FILE UPLOAD ERRORS (FILE_xxx)
  // ============================================================================
  FILE_UPLOAD_FAILED: 'FILE_001',
  FILE_TOO_LARGE: 'FILE_002',
  INVALID_FILE_TYPE: 'FILE_003',
  FILE_STORAGE_ERROR: 'FILE_004',
  FILE_NOT_FOUND: 'FILE_005',

  // ============================================================================
  // EXTERNAL SERVICE ERRORS (SERVICE_xxx)
  // ============================================================================
  EXTERNAL_SERVICE_ERROR: 'SERVICE_001',
  HELIUS_API_ERROR: 'SERVICE_002',
  PINATA_UPLOAD_ERROR: 'SERVICE_003',
  IRYS_UPLOAD_ERROR: 'SERVICE_004',
  MAGIC_EDEN_API_ERROR: 'SERVICE_005',
  GROK_VERIFICATION_ERROR: 'SERVICE_006',
  CLOUDFLARE_AI_ERROR: 'SERVICE_007',

  // ============================================================================
  // RATE LIMITING ERRORS (RATE_LIMIT_xxx)
  // ============================================================================
  RATE_LIMITED: 'RATE_LIMIT_001',
  TOO_MANY_REQUESTS: 'RATE_LIMIT_002',
  IP_BLOCKED: 'RATE_LIMIT_003',

  // ============================================================================
  // SYSTEM ERRORS (SYSTEM_xxx)
  // ============================================================================
  INTERNAL_SERVER_ERROR: 'SYSTEM_001',
  NOT_IMPLEMENTED: 'SYSTEM_002',
  SERVICE_UNAVAILABLE: 'SYSTEM_003',
  MAINTENANCE_MODE: 'SYSTEM_004',
  CONFIG_ERROR: 'SYSTEM_005',
  ENVIRONMENT_VARIABLE_MISSING: 'SYSTEM_006',

  // ============================================================================
  // MARKETPLACE ERRORS (MARKETPLACE_xxx)
  // ============================================================================
  LISTING_NOT_FOUND: 'MARKETPLACE_001',
  OFFER_EXPIRED: 'MARKETPLACE_002',
  INSUFFICIENT_FUNDS_FOR_PURCHASE: 'MARKETPLACE_003',
  LISTING_ALREADY_SOLD: 'MARKETPLACE_004',
  INVALID_PRICE: 'MARKETPLACE_005',

  // ============================================================================
  // WITHDRAWAL ERRORS (WITHDRAWAL_xxx)
  // ============================================================================
  WITHDRAWAL_NOT_FOUND: 'WITHDRAWAL_001',
  WITHDRAWAL_ALREADY_PROCESSED: 'WITHDRAWAL_002',
  WITHDRAWAL_FAILED: 'WITHDRAWAL_003',
  WITHDRAWAL_EXCEEDS_LIMIT: 'WITHDRAWAL_004',
  INVALID_RECIPIENT_ADDRESS: 'WITHDRAWAL_005',
  WITHDRAWAL_PENDING: 'WITHDRAWAL_006',

  // ============================================================================
  // VIDEO NFT ERRORS (VIDEO_xxx)
  // ============================================================================
  VIDEO_UPLOAD_FAILED: 'VIDEO_001',
  VIDEO_PROCESSING_ERROR: 'VIDEO_002',
  VIDEO_VERIFICATION_FAILED: 'VIDEO_003',
  INVALID_VIDEO_FORMAT: 'VIDEO_004',
  VIDEO_TOO_LONG: 'VIDEO_005',

  // ============================================================================
  // CSRF & SECURITY ERRORS (SECURITY_xxx)
  // ============================================================================
  CSRF_TOKEN_INVALID: 'SECURITY_001',
  CSRF_TOKEN_EXPIRED: 'SECURITY_002',
  SUSPICIOUS_ACTIVITY: 'SECURITY_003',
  MALFORMED_REQUEST: 'SECURITY_004',
  FORBIDDEN_OPERATION: 'SECURITY_005',
} as const;

/**
 * Error code descriptions and recommended HTTP status codes
 */
export const ERROR_CODE_DESCRIPTIONS: Record<string, {
  description: string;
  statusCode: number;
  retryable: boolean;
  userMessage: string;
  suggestion: string;
}> = {
  // Wallet errors
  WALLET_001: {
    description: 'Wallet address not found in system',
    statusCode: 404,
    retryable: false,
    userMessage: 'This wallet has not been registered yet',
    suggestion: 'Check the wallet address and try connecting your wallet again'
  },
  WALLET_002: {
    description: 'Invalid wallet address format',
    statusCode: 400,
    retryable: false,
    userMessage: 'The wallet address format is invalid',
    suggestion: 'Ensure you\'re providing a valid Solana wallet address'
  },
  WALLET_003: {
    description: 'Insufficient balance for operation',
    statusCode: 402,
    retryable: false,
    userMessage: 'Your wallet balance is insufficient for this operation',
    suggestion: 'Add more SOL to your wallet and try again'
  },
  WALLET_004: {
    description: 'General wallet operation failed',
    statusCode: 500,
    retryable: true,
    userMessage: 'Failed to process wallet operation',
    suggestion: 'Try again in a few moments'
  },
  WALLET_005: {
    description: 'Wallet is not connected',
    statusCode: 401,
    retryable: false,
    userMessage: 'Your wallet is not connected',
    suggestion: 'Connect your wallet and try again'
  },

  // NFT errors
  NFT_001: {
    description: 'NFT not found in database',
    statusCode: 404,
    retryable: false,
    userMessage: 'This NFT does not exist',
    suggestion: 'Verify the NFT address and try again'
  },
  NFT_002: {
    description: 'NFT has already been minted',
    statusCode: 409,
    retryable: false,
    userMessage: 'This NFT has already been minted',
    suggestion: 'Try minting a different NFT'
  },
  NFT_003: {
    description: 'Invalid NFT metadata',
    statusCode: 400,
    retryable: false,
    userMessage: 'The NFT metadata is invalid',
    suggestion: 'Check the metadata fields and ensure they are valid'
  },
  NFT_004: {
    description: 'NFT minting operation failed',
    statusCode: 500,
    retryable: true,
    userMessage: 'Failed to mint NFT',
    suggestion: 'Try minting again in a few moments'
  },
  NFT_005: {
    description: 'NFT transfer operation failed',
    statusCode: 500,
    retryable: true,
    userMessage: 'Failed to transfer NFT',
    suggestion: 'Try the transfer again'
  },

  // Solana errors
  SOLANA_001: {
    description: 'Solana RPC endpoint error',
    statusCode: 503,
    retryable: true,
    userMessage: 'Unable to communicate with Solana blockchain',
    suggestion: 'Try again in a few moments'
  },
  SOLANA_002: {
    description: 'Blockchain transaction failed',
    statusCode: 500,
    retryable: true,
    userMessage: 'Transaction failed on blockchain',
    suggestion: 'Check your wallet balance and network connection, then try again'
  },
  SOLANA_003: {
    description: 'Blockhash has expired',
    statusCode: 400,
    retryable: true,
    userMessage: 'Transaction became invalid',
    suggestion: 'Try the operation again'
  },

  // Auth errors
  AUTH_001: {
    description: 'Not authenticated',
    statusCode: 401,
    retryable: false,
    userMessage: 'You are not authenticated',
    suggestion: 'Sign in and try again'
  },
  AUTH_002: {
    description: 'Token has expired',
    statusCode: 401,
    retryable: true,
    userMessage: 'Your session has expired',
    suggestion: 'Sign in again'
  },
  AUTH_003: {
    description: 'Signature verification failed',
    statusCode: 401,
    retryable: false,
    userMessage: 'Signature verification failed',
    suggestion: 'Ensure your wallet is properly connected and try again'
  },

  // Validation errors
  VALIDATION_001: {
    description: 'Request validation failed',
    statusCode: 400,
    retryable: false,
    userMessage: 'Invalid request data',
    suggestion: 'Check all required fields are filled correctly'
  },
  VALIDATION_002: {
    description: 'Required field is missing',
    statusCode: 400,
    retryable: false,
    userMessage: 'A required field is missing',
    suggestion: 'Ensure all required fields are provided'
  },

  // Rate limiting
  RATE_LIMIT_001: {
    description: 'Rate limit exceeded',
    statusCode: 429,
    retryable: true,
    userMessage: 'Too many requests',
    suggestion: 'Wait a moment before retrying'
  },

  // Server errors
  SYSTEM_001: {
    description: 'Internal server error',
    statusCode: 500,
    retryable: true,
    userMessage: 'Something went wrong',
    suggestion: 'Try again in a few moments. If the problem persists, contact support'
  },
};

/**
 * Get error metadata by code
 */
export function getErrorMetadata(code: string) {
  return ERROR_CODE_DESCRIPTIONS[code] || {
    description: 'Unknown error',
    statusCode: 500,
    retryable: true,
    userMessage: 'An unknown error occurred',
    suggestion: 'Try again or contact support if the problem persists'
  };
}
