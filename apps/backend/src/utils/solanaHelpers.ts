import { Connection, Transaction, TransactionSignature, Commitment, ConfirmOptions, SendOptions } from '@solana/web3.js';

/**
 * Solana Helper Utilities - Production Best Practices
 * Follows Solana Labs and Helius recommended patterns
 */

export interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
};

/**
 * Exponential backoff retry helper
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {},
  errorHandler?: (error: Error, attempt: number) => boolean
): Promise<T> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Check if error handler wants to skip retry
      if (errorHandler && errorHandler(error, attempt)) {
        throw error;
      }

      // Don't retry on last attempt
      if (attempt === finalConfig.maxRetries) {
        break;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        finalConfig.initialDelay * Math.pow(finalConfig.backoffMultiplier, attempt - 1),
        finalConfig.maxDelay
      );

      console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }

  throw lastError || new Error('Retry failed');
}

/**
 * Wait for transaction confirmation with proper commitment level
 */
export async function confirmTransaction(
  connection: Connection,
  signature: TransactionSignature,
  commitment: Commitment = 'confirmed',
  timeout: number = 30000
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const status = await connection.getSignatureStatus(signature);

    if (status?.value?.confirmationStatus === commitment || status?.value?.confirmationStatus === 'finalized') {
      return;
    }

    if (status?.value?.err) {
      throw new Error(`Transaction failed: ${JSON.stringify(status.value.err)}`);
    }

    // Wait before checking again
    await sleep(500);
  }

  throw new Error(`Transaction confirmation timeout after ${timeout}ms`);
}

/**
 * Send and confirm transaction with preflight checks and rebroadcasting
 */
export async function sendAndConfirmTransaction(
  connection: Connection,
  transaction: Transaction,
  signers: any[],
  options?: ConfirmOptions & { maxRetries?: number; rebroadcastDelay?: number }
): Promise<TransactionSignature> {
  const maxRetries = options?.maxRetries || 3;
  const rebroadcastDelay = options?.rebroadcastDelay || 2000;
  
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Preflight check
      if (attempt === 1) {
        const preflightResult = await connection.simulateTransaction(transaction, signers);
        
        if (preflightResult.value.err) {
          throw new Error(`Preflight check failed: ${JSON.stringify(preflightResult.value.err)}`);
        }
        
        console.log(`Preflight check passed. CU used: ${preflightResult.value.unitsConsumed}`);
      }

      // Send transaction
      const signature = await connection.sendTransaction(transaction, signers, {
        ...options,
        skipPreflight: attempt > 1, // Skip preflight on retries
        preflightCommitment: 'confirmed'
      });

      console.log(`Transaction sent (attempt ${attempt}): ${signature}`);

      // Wait for confirmation
      await confirmTransaction(connection, signature, options?.commitment || 'confirmed');

      console.log(`Transaction confirmed: ${signature}`);
      return signature;

    } catch (error: any) {
      lastError = error;
      console.warn(`Transaction attempt ${attempt} failed:`, error.message);

      // Don't retry on certain errors
      if (error.message.includes('insufficient funds') || 
          error.message.includes('invalid account') ||
          error.message.includes('already processed')) {
        throw error;
      }

      // Wait before retry
      if (attempt < maxRetries) {
        console.log(`Retrying in ${rebroadcastDelay}ms...`);
        await sleep(rebroadcastDelay);
      }
    }
  }

  throw lastError || new Error('Transaction failed after all retries');
}

/**
 * Sleep helper
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: any): boolean {
  // Network errors
  if (error?.code === 'ECONNRESET' || error?.code === 'ETIMEDOUT') {
    return true;
  }

  // Rate limiting
  if (error?.message?.includes('rate limit') || error?.status === 429) {
    return true;
  }

  // Transaction errors that might succeed on retry
  if (error?.message?.includes('blockheight not found') || 
      error?.message?.includes('Blockhash not found')) {
    return true;
  }

  return false;
}

/**
 * Handle Solana-specific errors with proper context
 */
export function handleSolanaError(error: any, context: string): never {
  const errorMessage = error?.message || 'Unknown error';
  
  // Log with context
  console.error(`[${context}] Solana error:`, errorMessage);

  // Transform common errors to user-friendly messages
  if (errorMessage.includes('insufficient funds')) {
    throw new Error('Insufficient SOL balance for transaction fees');
  }

  if (errorMessage.includes('Transaction simulation failed')) {
    throw new Error('Transaction would fail: ' + errorMessage);
  }

  if (errorMessage.includes('blockheight')) {
    throw new Error('Blockchain synchronization issue, please try again');
  }

  // Re-throw original error
  throw error;
}

/**
 * Generate transaction deduplication key
 */
export function generateTxDedupKey(params: Record<string, any>): string {
  const sorted = Object.keys(params).sort().reduce((acc, key) => {
    acc[key] = params[key];
    return acc;
  }, {} as Record<string, any>);
  
  return Buffer.from(JSON.stringify(sorted)).toString('base64');
}

/**
 * Transaction retry handler with idempotency and parallel execution support
 */
export async function executeWithRetry<T>(
  fn: () => Promise<T>,
  dedupKey?: string,
  cache = new Map<string, Promise<T>>()
): Promise<T> {
  // If we have a deduplication key and the same request is already in flight, wait for it
  if (dedupKey && cache.has(dedupKey)) {
    return cache.get(dedupKey)!;
  }

  const promise = retryWithBackoff(fn, DEFAULT_RETRY_CONFIG, (error) => {
    return !isRetryableError(error);
  });

  // Cache the promise if deduplication key provided
  if (dedupKey) {
    cache.set(dedupKey, promise);
    
    // Clean up after completion
    promise.finally(() => cache.delete(dedupKey));
  }

  return promise;
}

/**
 * Execute multiple operations in parallel for high TPS design
 * Enables parallel execution while maintaining atomicity where needed
 */
export async function executeParallel<T>(
  operations: Array<() => Promise<T>>,
  maxConcurrency: number = 10
): Promise<T[]> {
  const results: T[] = [];
  const executing: Promise<void>[] = [];
  
  for (let i = 0; i < operations.length; i++) {
    const operation = operations[i];
    
    const promise = operation().then(result => {
      results[i] = result;
    });
    
    executing.push(promise);
    
    // Limit concurrent executions
    if (executing.length >= maxConcurrency) {
      await Promise.race(executing);
      // Remove completed promises
      for (let j = executing.length - 1; j >= 0; j--) {
        try {
          await executing[j];
          executing.splice(j, 1);
        } catch {
          // Promise already resolved/rejected
          executing.splice(j, 1);
        }
      }
    }
  }
  
  // Wait for all remaining operations
  await Promise.all(executing);
  
  return results;
}
