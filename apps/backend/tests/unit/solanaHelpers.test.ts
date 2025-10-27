import { describe, it, expect, beforeEach } from '@jest/globals';
import { 
  retryWithBackoff, 
  confirmTransaction, 
  sendAndConfirmTransaction,
  isRetryableError,
  handleSolanaError,
  generateTxDedupKey,
  executeWithRetry,
  executeParallel
} from '../../src/utils/solanaHelpers';
import { Connection, Transaction, PublicKey } from '@solana/web3.js';

// Mock Solana connection
const mockConnection = {
  getSignatureStatus: jest.fn(),
  sendTransaction: jest.fn(),
  simulateTransaction: jest.fn(),
} as unknown as Connection;

describe('Solana Helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('retryWithBackoff', () => {
    it('should succeed on first attempt', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');
      
      const result = await retryWithBackoff(mockFn);
      
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      const mockFn = jest.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success');
      
      const result = await retryWithBackoff(mockFn, { maxRetries: 3 });
      
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('should fail after max retries', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Persistent error'));
      
      await expect(retryWithBackoff(mockFn, { maxRetries: 2 }))
        .rejects.toThrow('Persistent error');
      
      expect(mockFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('isRetryableError', () => {
    it('should identify network errors as retryable', () => {
      expect(isRetryableError({ code: 'ECONNRESET' })).toBe(true);
      expect(isRetryableError({ code: 'ETIMEDOUT' })).toBe(true);
    });

    it('should identify rate limiting as retryable', () => {
      expect(isRetryableError({ message: 'rate limit exceeded' })).toBe(true);
      expect(isRetryableError({ status: 429 })).toBe(true);
    });

    it('should identify blockheight errors as retryable', () => {
      expect(isRetryableError({ message: 'blockheight not found' })).toBe(true);
      expect(isRetryableError({ message: 'Blockhash not found' })).toBe(true);
    });

    it('should identify non-retryable errors', () => {
      expect(isRetryableError({ message: 'insufficient funds' })).toBe(false);
      expect(isRetryableError({ message: 'invalid account' })).toBe(false);
    });
  });

  describe('handleSolanaError', () => {
    it('should transform insufficient funds error', () => {
      expect(() => {
        handleSolanaError({ message: 'insufficient funds' }, 'test');
      }).toThrow('Insufficient SOL balance for transaction fees');
    });

    it('should transform simulation failure error', () => {
      expect(() => {
        handleSolanaError({ message: 'Transaction simulation failed: test' }, 'test');
      }).toThrow('Transaction would fail: Transaction simulation failed: test');
    });

    it('should transform blockheight error', () => {
      expect(() => {
        handleSolanaError({ message: 'blockheight error' }, 'test');
      }).toThrow('Blockchain synchronization issue, please try again');
    });

    it('should re-throw unknown errors', () => {
      const error = new Error('Unknown error');
      expect(() => {
        handleSolanaError(error, 'test');
      }).toThrow('Unknown error');
    });
  });

  describe('generateTxDedupKey', () => {
    it('should generate consistent keys for same parameters', () => {
      const params1 = { a: 1, b: 2, c: 3 };
      const params2 = { c: 3, a: 1, b: 2 }; // Different order
      
      const key1 = generateTxDedupKey(params1);
      const key2 = generateTxDedupKey(params2);
      
      expect(key1).toBe(key2);
    });

    it('should generate different keys for different parameters', () => {
      const params1 = { a: 1, b: 2 };
      const params2 = { a: 1, b: 3 };
      
      const key1 = generateTxDedupKey(params1);
      const key2 = generateTxDedupKey(params2);
      
      expect(key1).not.toBe(key2);
    });
  });

  describe('executeWithRetry', () => {
    it('should deduplicate concurrent requests', async () => {
      const mockFn = jest.fn().mockResolvedValue('result');
      const dedupKey = 'test-key';
      const cache = new Map(); // Use shared cache
      
      const [result1, result2] = await Promise.all([
        executeWithRetry(mockFn, dedupKey, cache),
        executeWithRetry(mockFn, dedupKey, cache)
      ]);
      
      expect(result1).toBe('result');
      expect(result2).toBe('result');
      expect(mockFn).toHaveBeenCalledTimes(1); // Should only call once due to deduplication
    });

    it('should execute without deduplication when no key provided', async () => {
      const mockFn = jest.fn().mockResolvedValue('result');
      
      const [result1, result2] = await Promise.all([
        executeWithRetry(mockFn),
        executeWithRetry(mockFn)
      ]);
      
      expect(result1).toBe('result');
      expect(result2).toBe('result');
      expect(mockFn).toHaveBeenCalledTimes(2); // Should call twice without deduplication
    });
  });

  describe('executeParallel', () => {
    it('should execute operations in parallel', async () => {
      const operations = [
        jest.fn().mockResolvedValue('result1'),
        jest.fn().mockResolvedValue('result2'),
        jest.fn().mockResolvedValue('result3')
      ];
      
      const results = await executeParallel(operations);
      
      expect(results).toEqual(['result1', 'result2', 'result3']);
      expect(operations[0]).toHaveBeenCalled();
      expect(operations[1]).toHaveBeenCalled();
      expect(operations[2]).toHaveBeenCalled();
    });

    it('should respect max concurrency limit', async () => {
      const operations = Array.from({ length: 15 }, (_, i) => 
        jest.fn().mockResolvedValue(`result${i}`)
      );
      
      const results = await executeParallel(operations, 5);
      
      expect(results).toHaveLength(15);
      expect(results[0]).toBe('result0');
      expect(results[14]).toBe('result14');
    });

    it('should handle operation failures', async () => {
      const operations = [
        jest.fn().mockResolvedValue('result1'),
        jest.fn().mockRejectedValue(new Error('Operation failed')),
        jest.fn().mockResolvedValue('result3')
      ];
      
      await expect(executeParallel(operations))
        .rejects.toThrow('Operation failed');
    });
  });

  describe('confirmTransaction', () => {
    it('should confirm transaction successfully', async () => {
      (mockConnection.getSignatureStatus as jest.Mock)
        .mockResolvedValueOnce({
          value: { confirmationStatus: 'confirmed' }
        });
      
      await expect(confirmTransaction(mockConnection, 'test-signature'))
        .resolves.not.toThrow();
    });

    it('should handle transaction failure', async () => {
      (mockConnection.getSignatureStatus as jest.Mock)
        .mockResolvedValueOnce({
          value: { err: { message: 'Transaction failed' } }
        });
      
      await expect(confirmTransaction(mockConnection, 'test-signature'))
        .rejects.toThrow('Transaction failed: {"message":"Transaction failed"}');
    });

    it('should timeout after specified time', async () => {
      (mockConnection.getSignatureStatus as jest.Mock)
        .mockResolvedValue({
          value: { confirmationStatus: 'processed' }
        });
      
      await expect(confirmTransaction(mockConnection, 'test-signature', 'confirmed', 100))
        .rejects.toThrow('Transaction confirmation timeout after 100ms');
    });
  });

  describe('sendAndConfirmTransaction', () => {
    it('should send and confirm transaction with preflight check', async () => {
      const mockTransaction = new Transaction();
      const mockSigners = [];
      
      (mockConnection.simulateTransaction as jest.Mock)
        .mockResolvedValueOnce({
          value: { unitsConsumed: 50000 }
        });
      
      (mockConnection.sendTransaction as jest.Mock)
        .mockResolvedValueOnce('test-signature');
      
      (mockConnection.getSignatureStatus as jest.Mock)
        .mockResolvedValueOnce({
          value: { confirmationStatus: 'confirmed' }
        });
      
      const signature = await sendAndConfirmTransaction(
        mockConnection,
        mockTransaction,
        mockSigners
      );
      
      expect(signature).toBe('test-signature');
      expect(mockConnection.simulateTransaction).toHaveBeenCalled();
      expect(mockConnection.sendTransaction).toHaveBeenCalled();
    });

    it('should retry on failure with rebroadcasting', async () => {
      const mockTransaction = new Transaction();
      const mockSigners = [];
      
      (mockConnection.simulateTransaction as jest.Mock)
        .mockResolvedValueOnce({
          value: { unitsConsumed: 50000 }
        });
      
      (mockConnection.sendTransaction as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce('test-signature');
      
      (mockConnection.getSignatureStatus as jest.Mock)
        .mockResolvedValueOnce({
          value: { confirmationStatus: 'confirmed' }
        });
      
      const signature = await sendAndConfirmTransaction(
        mockConnection,
        mockTransaction,
        mockSigners,
        { maxRetries: 2 }
      );
      
      expect(signature).toBe('test-signature');
      expect(mockConnection.sendTransaction).toHaveBeenCalledTimes(2);
    });
  });
});