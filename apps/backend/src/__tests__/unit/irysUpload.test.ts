/**
 * Unit Tests: Irys Upload Utility
 */

import { jest, beforeEach } from '@jest/globals';
import { describe, it, expect } from '@jest/globals';
import {
  uploadMetadataToIrys,
  createIrysNode,
  uploadToIrys,
  uploadMetadata,
  checkIrysBalance,
  fundIrys,
} from '../../utils/irysUpload';
import { Connection, Keypair } from '@solana/web3.js';
import Irys from '@irys/query';
import logger from '../../utils/logger';

// Mock the Irys module
jest.mock('@irys/query');
const MockedIrys = Irys as jest.MockedClass<typeof Irys>;

describe('Irys Upload Utility', () => {
  const mockConnection = new Connection('https://api.devnet.solana.com');
  const mockKeypair = Keypair.generate();

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('createIrysNode', () => {
    it('should create Irys node for devnet', async () => {
      await createIrysNode({
        connection: mockConnection,
        keypair: mockKeypair,
        network: 'devnet',
      });

      expect(MockedIrys).toHaveBeenCalledWith({
        url: 'https://devnet.irys.xyz',
      });
    });
  });

  describe('uploadToIrys', () => {
    it('should return mock upload response', async () => {
      const result = await uploadToIrys('test data', {
        connection: mockConnection,
        keypair: mockKeypair,
      });

      expect(result).toEqual({
        uri: expect.stringContaining('https://arweave.net/'),
        transactionId: expect.any(String),
      });
    });
  });

  describe('uploadMetadata', () => {
    it('should upload metadata successfully', async () => {
      const metadata = { name: 'Test NFT', description: 'Test Description' };
      const result = await uploadMetadata(metadata, {
        connection: mockConnection,
        keypair: mockKeypair,
      });

      expect(result).toEqual({
        uri: expect.stringContaining('https://arweave.net/'),
        transactionId: expect.any(String),
      });
    });
  });

  describe('uploadMetadataToIrys', () => {
    it('should upload metadata successfully', async () => {
      const metadata = { name: 'Test NFT', description: 'Test Description' };
      const result = await uploadMetadataToIrys(metadata, {
        connection: mockConnection,
        keypair: mockKeypair,
      });

      expect(result).toEqual({
        uri: expect.stringContaining('https://arweave.net/'),
        transactionId: expect.any(String),
      });
    });
  });

  describe('checkIrysBalance', () => {
    it('should always return true in mock implementation', async () => {
      const mockIrys = new MockedIrys();
      const result = await checkIrysBalance(mockIrys);
      expect(result).toBe(true);
    });
  });

  describe('fundIrys', () => {
    it('should log funding message', async () => {
      const mockIrys = new MockedIrys();
      const loggerSpy = jest.spyOn(logger, 'info').mockImplementation(() => logger);

      await fundIrys(mockIrys, 0.1);

      expect(loggerSpy).toHaveBeenCalledWith('[MOCK] Would fund Irys node with 0.1 SOL');
      loggerSpy.mockRestore();
    });
  });
});
