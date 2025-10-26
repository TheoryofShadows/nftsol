import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import type { Mock } from 'jest-mock';
import {
  retryWithBackoff,
  confirmTransaction,
  isRetryableError,
  executeWithRetry
} from '../../src/utils/solanaHelpers';
import type { Connection } from '@solana/web3.js';

describe('Solana Helper Utilities', () => {
  describe('retryWithBackoff', () => {
    it('should succeed on first attempt', async () => {
      const fn = async () => 'success';
      const result = await retryWithBackoff(fn);
      
      expect(result).toBe('success');
    });

    it('should respect max retry limit', async () => {
      const fn = async () => {
        throw new Error('Always fails');
      };
      
      await expect(retryWithBackoff(fn, { maxRetries: 2 })).rejects.toThrow('Always fails');
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

    it('should not identify other errors as retryable', () => {
      expect(isRetryableError({ message: 'insufficient funds' })).toBe(false);
      expect(isRetryableError({ message: 'invalid signature' })).toBe(false);
    });
  });

  describe('executeWithRetry', () => {
    it('should deduplicate concurrent requests', async () => {
      const fn = jest.fn().mockResolvedValue('result');
      const dedupKey = 'test-key';
      
      const [result1, result2] = await Promise.all([
        executeWithRetry(fn, dedupKey),
        executeWithRetry(fn, dedupKey)
      ]);
      
      expect(result1).toBe('result');
      expect(result2).toBe('result');
      expect(fn).toHaveBeenCalledTimes(1); // Should only call once
    });

    it('should execute without deduplication when no key provided', async () => {
      const fn = jest.fn().mockResolvedValue('result');
      
      const [result1, result2] = await Promise.all([
        executeWithRetry(fn),
        executeWithRetry(fn)
      ]);
      
      expect(result1).toBe('result');
      expect(result2).toBe('result');
      expect(fn).toHaveBeenCalledTimes(2); // Should call twice
    });

    it('should retry on retryable errors', async () => {
      let attempts = 0;
      const fn = jest.fn().mockImplementation(async () => {
        attempts++;
        if (attempts < 2) {
          throw { code: 'ECONNRESET' }; // Retryable error
        }
        return 'success';
      });

      const result = await executeWithRetry(fn);
      
      expect(result).toBe('success');
      expect(attempts).toBe(2);
    });
  });

  describe('confirmTransaction', () => {
    it('should confirm transaction successfully', async () => {
      const mockConnection = {
        getSignatureStatus: jest.fn()
          .mockResolvedValueOnce({ value: { confirmationStatus: 'confirmed' } })
      } as any as Connection;

      const signature = 'test-signature';
      
      await expect(confirmTransaction(mockConnection, signature as any, 'confirmed', 1000))
        .resolves.toBeUndefined();
      
      expect(mockConnection.getSignatureStatus).toHaveBeenCalledWith(signature);
    });

    it('should throw on transaction error', async () => {
      const mockConnection = {
        getSignatureStatus: jest.fn()
          .mockResolvedValue({ value: { err: 'Transaction failed' } })
      } as any as Connection;

      await expect(confirmTransaction(mockConnection, 'signature' as any))
        .rejects.toThrow('Transaction failed');
    });

    it('should timeout if transaction not confirmed', async () => {
      const mockConnection = {
        getSignatureStatus: jest.fn()
          .mockResolvedValue({ value: { confirmationStatus: 'processed' } })
      } as any as Connection;

      await expect(
        confirmTransaction(mockConnection, 'signature' as any, 'confirmed', 1000)
      ).rejects.toThrow('Transaction confirmation timeout');
    });
  });
});
