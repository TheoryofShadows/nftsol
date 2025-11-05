/**
 * Unit Tests: Irys Upload Utility
 */

import { jest } from '@jest/globals';
import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  uploadMetadataToIrys,
  createIrysNode,
  uploadToIrys,
  uploadMetadata,
  checkIrysBalance,
  fundIrys,
} from '../../utils/irysUpload';
import { Connection, Keypair } from '@solana/web3.js';
import Irys from '@irys/sdk';

jest.mock('@irys/sdk');

const MockedIrys = Irys as jest.MockedClass<typeof Irys>;

describe('Irys Upload Utility', () => {
  let mockConnection: Connection;
  let mockKeypair: Keypair;

  beforeEach(() => {
    mockConnection = new Connection('https://api.devnet.solana.com');
    mockKeypair = Keypair.generate();

    // Mock Irys constructor
    const mockReady = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
    const mockUpload = jest.fn<() => Promise<{ id: string }>>().mockResolvedValue({ id: 'test-tx-id' });
    MockedIrys.mockImplementation(() => ({
      ready: mockReady,
      upload: mockUpload,
      getLoadedBalance: jest.fn(),
      fund: jest.fn(),
    } as any));
  });

  describe('createIrysNode', () => {
    it('should create Irys node for devnet', async () => {
      const irys = await createIrysNode({
        connection: mockConnection,
        keypair: mockKeypair,
        network: 'devnet',
      });

      expect(MockedIrys).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://devnet.irys.xyz',
          token: 'solana',
        })
      );
      expect(irys).toBeDefined();
    });

    it('should create Irys node for mainnet', async () => {
      await createIrysNode({
        connection: mockConnection,
        keypair: mockKeypair,
        network: 'mainnet-beta',
      });

      expect(MockedIrys).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://node1.irys.xyz',
        })
      );
    });
  });

  describe('uploadMetadataToIrys', () => {
    it('should upload metadata successfully', async () => {
      const mockMetadata = {
        name: 'Test NFT',
        description: 'Test description',
        image: 'https://example.com/image.jpg',
      };

      const mockReady = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
      const mockUpload = jest.fn<() => Promise<{ id: string }>>().mockResolvedValue({
        id: 'test-transaction-id',
      });
      const mockIrys = {
        ready: mockReady,
        upload: mockUpload,
      } as any;

      MockedIrys.mockImplementation(() => mockIrys);

      const result = await uploadMetadataToIrys(mockMetadata, {
        connection: mockConnection,
        keypair: mockKeypair,
        network: 'devnet',
      });

      expect(result.uri).toContain('arweave.net');
      expect(result.transactionId).toBe('test-transaction-id');
    });

    it('should throw error if metadata exceeds 90KB', async () => {
      const largeMetadata = {
        description: 'x'.repeat(100_000), // > 90KB
      };

      await expect(
        uploadMetadataToIrys(largeMetadata, {
          connection: mockConnection,
          keypair: mockKeypair,
          network: 'devnet',
        })
      ).rejects.toThrow('Metadata too large for Irys');
    });
  });

  describe('uploadToIrys', () => {
    it('should upload string data', async () => {
      const mockReady = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
      const mockUpload = jest.fn<() => Promise<{ id: string }>>().mockResolvedValue({
        id: 'test-tx-id',
      });
      MockedIrys.mockImplementation(() => ({
        ready: mockReady,
        upload: mockUpload,
      } as any));

      const result = await uploadToIrys('test string data', {
        connection: mockConnection,
        keypair: mockKeypair,
        network: 'devnet',
      });

      expect(result.uri).toContain('arweave.net');
      expect(result.transactionId).toBe('test-tx-id');
    });

    it('should upload Buffer data', async () => {
      const mockReady = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
      const mockUpload = jest.fn<() => Promise<{ id: string }>>().mockResolvedValue({
        id: 'test-tx-id',
      });
      MockedIrys.mockImplementation(() => ({
        ready: mockReady,
        upload: mockUpload,
      } as any));

      const buffer = Buffer.from('test buffer data');
      const result = await uploadToIrys(buffer, {
        connection: mockConnection,
        keypair: mockKeypair,
        network: 'devnet',
      });

      expect(result.uri).toContain('arweave.net');
      // Verify Buffer path was taken (line 71)
      expect(mockUpload).toHaveBeenCalled();
    });

    it('should upload Uint8Array data', async () => {
      const mockReady = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
      const mockUpload = jest.fn<() => Promise<{ id: string }>>().mockResolvedValue({
        id: 'test-tx-id',
      });
      MockedIrys.mockImplementation(() => ({
        ready: mockReady,
        upload: mockUpload,
      } as any));

      const uint8Array = new Uint8Array([1, 2, 3, 4, 5]);
      const result = await uploadToIrys(uint8Array, {
        connection: mockConnection,
        keypair: mockKeypair,
        network: 'devnet',
      });

      expect(result.uri).toContain('arweave.net');
    });

    it('should handle upload errors', async () => {
      const mockReady = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
      const mockUpload = jest.fn<() => Promise<{ id: string }>>().mockRejectedValue(
        new Error('Upload failed')
      );
      MockedIrys.mockImplementation(() => ({
        ready: mockReady,
        upload: mockUpload,
      } as any));

      await expect(
        uploadToIrys('test data', {
          connection: mockConnection,
          keypair: mockKeypair,
          network: 'devnet',
        })
      ).rejects.toThrow('Failed to upload to Irys');
    });
  });

  describe('uploadMetadata', () => {
    it('should upload metadata object', async () => {
      const mockReady = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
      const mockUpload = jest.fn<() => Promise<{ id: string }>>().mockResolvedValue({
        id: 'test-tx-id',
      });
      MockedIrys.mockImplementation(() => ({
        ready: mockReady,
        upload: mockUpload,
      } as any));

      const metadata = { name: 'Test', description: 'Test description' };
      const result = await uploadMetadata(metadata, {
        connection: mockConnection,
        keypair: mockKeypair,
        network: 'devnet',
      });

      expect(result.uri).toContain('arweave.net');
      expect(result.transactionId).toBe('test-tx-id');
    });
  });

  describe('checkIrysBalance', () => {
    it('should check balance successfully', async () => {
      const mockGetLoadedBalance = jest.fn<() => Promise<number>>().mockResolvedValue(1000000);
      const mockIrys = {
        getLoadedBalance: mockGetLoadedBalance,
      } as any;

      const result = await checkIrysBalance(mockIrys);
      expect(result).toBe(true);
    });

    it('should return false when balance is zero', async () => {
      const mockGetLoadedBalance = jest.fn<() => Promise<number>>().mockResolvedValue(0);
      const mockIrys = {
        getLoadedBalance: mockGetLoadedBalance,
      } as any;

      const result = await checkIrysBalance(mockIrys);
      expect(result).toBe(false);
    });

    it('should check balance with required bytes', async () => {
      const mockGetLoadedBalance = jest.fn<() => Promise<number>>().mockResolvedValue(500000);
      const mockIrys = {
        getLoadedBalance: mockGetLoadedBalance,
      } as any;

      const result = await checkIrysBalance(mockIrys, 100000);
      expect(result).toBe(true);
    });

    it('should return false when balance is insufficient', async () => {
      const mockGetLoadedBalance = jest.fn<() => Promise<number>>().mockResolvedValue(50000);
      const mockIrys = {
        getLoadedBalance: mockGetLoadedBalance,
      } as any;

      const result = await checkIrysBalance(mockIrys, 100000);
      expect(result).toBe(false);
    });

    it('should handle balance check errors', async () => {
      const mockGetLoadedBalance = jest.fn<() => Promise<number>>().mockRejectedValue(new Error('Balance check failed'));
      const mockIrys = {
        getLoadedBalance: mockGetLoadedBalance,
      } as any;

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const result = await checkIrysBalance(mockIrys);
      expect(result).toBe(false);
      consoleErrorSpy.mockRestore();
    });
  });

  describe('fundIrys', () => {
    it('should fund Irys successfully', async () => {
      const mockFund = jest.fn<(amount: number) => Promise<void>>().mockResolvedValue(undefined);
      const mockIrys = {
        fund: mockFund,
      } as any;

      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      await fundIrys(mockIrys, 0.1);
      expect(mockFund).toHaveBeenCalledWith(100000000); // 0.1 SOL in lamports
      consoleLogSpy.mockRestore();
    });

    it('should use default amount when not specified', async () => {
      const mockFund = jest.fn<(amount: number) => Promise<void>>().mockResolvedValue(undefined);
      const mockIrys = {
        fund: mockFund,
      } as any;

      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      await fundIrys(mockIrys);
      expect(mockFund).toHaveBeenCalledWith(100000000); // Default 0.1 SOL
      consoleLogSpy.mockRestore();
    });

    it('should handle funding errors', async () => {
      const mockFund = jest.fn<(amount: number) => Promise<void>>().mockRejectedValue(new Error('Funding failed'));
      const mockIrys = {
        fund: mockFund,
      } as any;

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      await expect(fundIrys(mockIrys, 0.1)).rejects.toThrow('Failed to fund Irys');
      consoleErrorSpy.mockRestore();
    });
  });
});

