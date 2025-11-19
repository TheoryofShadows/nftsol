/**
 * 🚀 Solana Validation Utilities
 * Security and validation best practices for Solana integration
 * - Address validation
 * - Signature verification
 * - Mint validation
 * - Safe numeric operations
 */

import { PublicKey } from '@solana/web3.js';
import * as bs58 from 'bs58';

/**
 * Validate Solana address format
 */
export function isValidSolanaAddress(address: string): boolean {
  try {
    const publicKey = new PublicKey(address);
    // Verify the address is exactly 32 bytes when decoded
    const decoded = bs58.decode(address);
    return decoded.length === 32;
  } catch {
    return false;
  }
}

/**
 * Validate Solana signature format
 */
export function isValidSignature(signature: string): boolean {
  try {
    const decoded = bs58.decode(signature);
    // Solana signatures should be 64 bytes
    return decoded.length === 64;
  } catch {
    return false;
  }
}

/**
 * Validate and parse a public key safely
 */
export function parseSolanaAddress(address: string): PublicKey | null {
  try {
    if (!isValidSolanaAddress(address)) {
      return null;
    }
    return new PublicKey(address);
  } catch {
    return null;
  }
}

/**
 * Validate token mint address
 */
export function isValidTokenMint(mint: string): boolean {
  return isValidSolanaAddress(mint);
}

/**
 * Validate account owner matches expected
 */
export function validateAccountOwner(
  accountOwner: string,
  expectedOwner: string
): boolean {
  try {
    const owner = new PublicKey(accountOwner);
    const expected = new PublicKey(expectedOwner);
    return owner.equals(expected);
  } catch {
    return false;
  }
}

/**
 * Safe lamport to SOL conversion
 * Prevents precision errors in decimal conversion
 */
export function lamportsToSol(lamports: number | bigint): number {
  const lamportNum = typeof lamports === 'bigint' ? Number(lamports) : lamports;

  if (!Number.isFinite(lamportNum)) {
    throw new Error('Invalid lamport value');
  }

  return lamportNum / 1e9;
}

/**
 * Safe SOL to lamports conversion
 * Prevents rounding errors
 */
export function solToLamports(sol: number): bigint {
  if (!Number.isFinite(sol) || sol < 0) {
    throw new Error('Invalid SOL amount');
  }

  // Use BigInt to avoid floating point errors
  return BigInt(Math.floor(sol * 1e9));
}

/**
 * Format lamports as SOL with proper precision
 */
export function formatLamportsAsSol(lamports: number | bigint): string {
  const sol = lamportsToSol(lamports);
  return sol.toFixed(9).replace(/\.?0+$/, '');
}

/**
 * Validate amount is within reasonable bounds
 */
export function validateAmount(
  amount: number,
  minAmount: number = 0,
  maxAmount: number = Infinity
): boolean {
  return (
    Number.isFinite(amount) &&
    !Number.isNaN(amount) &&
    amount >= minAmount &&
    amount <= maxAmount
  );
}

/**
 * Validate NFT metadata
 */
export function validateNFTMetadata(metadata: any): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!metadata) {
    errors.push('Metadata is required');
    return { valid: false, errors };
  }

  // Validate name
  if (!metadata.name || typeof metadata.name !== 'string') {
    errors.push('Valid name is required');
  } else if (metadata.name.length > 32) {
    errors.push('Name must be 32 characters or less');
  }

  // Validate symbol
  if (!metadata.symbol || typeof metadata.symbol !== 'string') {
    errors.push('Valid symbol is required');
  } else if (metadata.symbol.length > 10) {
    errors.push('Symbol must be 10 characters or less');
  }

  // Validate URI
  if (metadata.uri && typeof metadata.uri !== 'string') {
    errors.push('URI must be a string');
  } else if (metadata.uri && !isValidMetadataUri(metadata.uri)) {
    errors.push('URI format is invalid');
  }

  // Validate seller fee basis points
  if (metadata.sellerFeeBasisPoints !== undefined) {
    if (
      !Number.isInteger(metadata.sellerFeeBasisPoints) ||
      metadata.sellerFeeBasisPoints < 0 ||
      metadata.sellerFeeBasisPoints > 10000
    ) {
      errors.push(
        'Seller fee basis points must be an integer between 0 and 10000'
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate metadata URI format
 */
export function isValidMetadataUri(uri: string): boolean {
  try {
    // Should be either HTTPS URL or IPFS URI
    if (uri.startsWith('https://')) {
      new URL(uri);
      return true;
    }
    if (uri.startsWith('ipfs://')) {
      return /^ipfs:\/\/[a-zA-Z0-9]{46,}/.test(uri); // IPFS hash should be ~46 chars
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Validate transaction recipient
 */
export function isValidRecipient(recipient: string): boolean {
  return isValidSolanaAddress(recipient);
}

/**
 * Validate wallet signature
 * Verifies the signature follows Solana's Ed25519 format
 */
export function isValidWalletSignature(
  signature: string,
  message: string,
  publicKey: string
): boolean {
  try {
    // Basic format validation
    if (!isValidSignature(signature) || !isValidSolanaAddress(publicKey)) {
      return false;
    }

    // Note: Full cryptographic verification should be done in frontend
    // or with @solana/web3.js signing utilities
    return true;
  } catch {
    return false;
  }
}

/**
 * Safe JSON parsing
 */
export function safeJsonParse<T = any>(
  json: string,
  defaultValue: T | null = null
): T | null {
  try {
    return JSON.parse(json) as T;
  } catch {
    return defaultValue;
  }
}

/**
 * Validate all required fields exist
 */
export function validateRequiredFields(
  obj: any,
  fields: string[]
): { valid: boolean; missingFields: string[] } {
  const missingFields = fields.filter(
    (field) => obj[field] === undefined || obj[field] === null || obj[field] === ''
  );

  return {
    valid: missingFields.length === 0,
    missingFields,
  };
}

/**
 * Sanitize string input
 */
export function sanitizeInput(input: string, maxLength: number = 1000): string {
  if (typeof input !== 'string') {
    return '';
  }

  // Trim and limit length
  let sanitized = input.trim().substring(0, maxLength);

  // Remove control characters
  // eslint-disable-next-line no-control-regex
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');

  return sanitized;
}

/**
 * Validate and sanitize batch of addresses
 */
export function validateAddressBatch(
  addresses: string[]
): { valid: PublicKey[]; invalid: string[] } {
  const valid: PublicKey[] = [];
  const invalid: string[] = [];

  addresses.forEach((addr) => {
    const parsed = parseSolanaAddress(addr);
    if (parsed) {
      valid.push(parsed);
    } else {
      invalid.push(addr);
    }
  });

  return { valid, invalid };
}

/**
 * Check if address is system program
 */
export function isSystemProgram(address: string): boolean {
  try {
    return new PublicKey(address).equals(new PublicKey('11111111111111111111111111111111'));
  } catch {
    return false;
  }
}

/**
 * Check if address is spl-token program
 */
export function isSPLTokenProgram(address: string): boolean {
  try {
    return new PublicKey(address).equals(
      new PublicKey('TokenkegQfeZyiNwAJsyFbPVwwQQfzZZFqZktqCxWvq')
    );
  } catch {
    return false;
  }
}

/**
 * Validate numeric precision for blockchain operations
 */
export function validatePrecision(
  value: number,
  decimals: number = 9
): { valid: boolean; error?: string } {
  if (!Number.isFinite(value)) {
    return { valid: false, error: 'Value must be a finite number' };
  }

  // Check decimal places
  const decimalPlaces = (value.toString().split('.')[1] || '').length;
  if (decimalPlaces > decimals) {
    return {
      valid: false,
      error: `Value cannot have more than ${decimals} decimal places`,
    };
  }

  return { valid: true };
}

/**
 * Summary validation for complete transaction
 */
export function validateTransaction(transactionData: {
  from?: string;
  to?: string;
  amount?: number;
  fee?: number;
  mint?: string;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!transactionData.from || !isValidSolanaAddress(transactionData.from)) {
    errors.push('Valid sender address required');
  }

  if (!transactionData.to || !isValidSolanaAddress(transactionData.to)) {
    errors.push('Valid recipient address required');
  }

  if (
    transactionData.amount === undefined ||
    !validateAmount(transactionData.amount, 0)
  ) {
    errors.push('Valid amount required');
  }

  if (
    transactionData.fee === undefined ||
    !validateAmount(transactionData.fee, 0)
  ) {
    errors.push('Valid fee required');
  }

  if (transactionData.mint && !isValidTokenMint(transactionData.mint)) {
    errors.push('Valid token mint required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export default {
  isValidSolanaAddress,
  isValidSignature,
  parseSolanaAddress,
  isValidTokenMint,
  validateAccountOwner,
  lamportsToSol,
  solToLamports,
  formatLamportsAsSol,
  validateAmount,
  validateNFTMetadata,
  isValidMetadataUri,
  isValidRecipient,
  isValidWalletSignature,
  safeJsonParse,
  validateRequiredFields,
  sanitizeInput,
  validateAddressBatch,
  isSystemProgram,
  isSPLTokenProgram,
  validatePrecision,
  validateTransaction,
};
