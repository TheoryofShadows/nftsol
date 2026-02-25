/**
 * Intelligent retry logic with exponential backoff and jitter
 */

interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  retryable?: (error: any) => boolean;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    retryable = (error: any) => {
      // Retry on network errors and 5xx status codes
      if (error?.code === 'ECONNRESET' || error?.code === 'ETIMEDOUT') {
        return true;
      }
      if (error?.status >= 500) {
        return true;
      }
      // Retry on Solana-specific transient errors
      const msg: string = error?.message || '';
      if (
        msg.includes('BlockhashNotFound') ||
        msg.includes('Transaction was not confirmed') ||
        msg.includes('block height exceeded') ||
        msg.includes('429') || // RPC rate limit
        msg.includes('Too Many Requests') ||
        msg.includes('Service Unavailable') ||
        msg.includes('Gateway Timeout')
      ) {
        return true;
      }
      return false;
    },
  } = options;

  let lastError: any;
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      attempt++;

      // Don't retry if we've exhausted retries
      if (attempt > maxRetries) {
        break;
      }

      // Don't retry if error is not retryable
      if (!retryable(error)) {
        throw error;
      }

      // Calculate delay with exponential backoff and jitter
      const exponentialDelay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
      const jitter = Math.random() * 0.3 * exponentialDelay; // 0-30% jitter
      const delay = exponentialDelay + jitter;

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Dedupe concurrent requests for the same resource
 */
class RequestDeduplicator {
  private pendingRequests: Map<string, Promise<any>> = new Map();

  async dedupe<T>(key: string, fn: () => Promise<T>): Promise<T> {
    // If request is already pending, return the existing promise
    const existing = this.pendingRequests.get(key);
    if (existing) {
      return existing;
    }

    // Create new request
    const promise = fn().finally(() => {
      // Clean up after request completes
      this.pendingRequests.delete(key);
    });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  clear() {
    this.pendingRequests.clear();
  }
}

export const requestDeduplicator = new RequestDeduplicator();

