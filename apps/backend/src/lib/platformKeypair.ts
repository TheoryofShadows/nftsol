import logger from '../utils/logger';
import { Keypair as Web3Keypair } from "@solana/web3.js";
import bs58 from "bs58";

let cachedKeypair: Web3Keypair | null = null;

/**
 * Load and cache the platform signing keypair from env.
 * Accepts either JSON array form "[1,2,...]" or base58 string.
 */
export function getPlatformKeypair(): Web3Keypair {
  if (cachedKeypair) return cachedKeypair;

  // Try PLATFORM_KEYPAIR first, then PLATFORM_SECRET_KEY_BASE58
  const secret = process.env.PLATFORM_KEYPAIR || process.env.PLATFORM_SECRET_KEY_BASE58;
  if (!secret) {
    throw new Error("PLATFORM_KEYPAIR or PLATFORM_SECRET_KEY_BASE58 env var missing");
  }

  let secretBytes: Uint8Array;

  try {
    // First try to parse as JSON array
    if (secret.startsWith('[')) {
      const parsed = JSON.parse(secret);
      secretBytes = Uint8Array.from(parsed);
    } 
    // Then try to parse as comma-separated string of numbers
    else if (secret.includes(',')) {
      const parsed = secret.split(',').map(Number);
      secretBytes = new Uint8Array(parsed);
    }
    // Finally, try to decode as base58
    else {
      secretBytes = bs58.decode(secret);
    }
  } catch (error: unknown) {
    logger.error('Error parsing platform keypair:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Invalid platform keypair format: ${errorMessage}`);
  }

  cachedKeypair = Web3Keypair.fromSecretKey(secretBytes);
  return cachedKeypair;
}

export function clearCachedPlatformKeypair() {
  cachedKeypair = null;
}

