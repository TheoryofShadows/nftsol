import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { privacyAuditor } from '../src/utils/privacyAuditor';

// Mock axios for testing
jest.mock('axios');
const mockedAxios = require('axios');

// Mock near-api-js for testing
jest.mock('near-api-js', () => ({
  connect: jest.fn(() => Promise.resolve({
    account: jest.fn(() => Promise.resolve({
      viewFunction: jest.fn(() => Promise.resolve({
        fee: 0.001,
        time: '2-5s',
        anon_gain: 80,
        liquidity: '$56.6M'
      }))
    }))
  }))
}));

describe('PrivacyAuditor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('auditWallet', () => {
    it('should perform privacy audit successfully', async () => {
      // Mock successful RPC responses
      mockedAxios.post.mockResolvedValueOnce({
        data: { result: { value: 1000000000 } } // 1 SOL in lamports
      }).mockResolvedValueOnce({
        data: { result: [{ signature: 'test1' }, { signature: 'test2' }] } // 2 transactions
      });

      const result = await privacyAuditor.auditWallet('11111111111111111111111111111111');

      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('wallet_address');
      expect(result).toHaveProperty('transaction_count');
      expect(result).toHaveProperty('privacy_risks');
      expect(result).toHaveProperty('recommendations');
      expect(result.wallet_address).toBe('11111111111111111111111111111111');
    });

    it('should handle RPC errors gracefully', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('RPC Error'));

      await expect(privacyAuditor.auditWallet('11111111111111111111111111111111'))
        .rejects.toThrow('Privacy audit failed');
    });
  });

  describe('simulateZcashBridge', () => {
    it('should simulate Zolana bridge successfully', async () => {
      const mockAudit = {
        score: 50,
        wallet_address: '11111111111111111111111111111111',
        transaction_count: 10,
        public_connections: 2,
        privacy_risks: [],
        recommendations: [],
        timestamp: new Date()
      };

      // Mock successful balance check
      mockedAxios.post.mockResolvedValueOnce({
        data: { result: { value: 2000000000 } } // 2 SOL in lamports
      });

      const result = await privacyAuditor.simulateZcashBridge('11111111111111111111111111111111', mockAudit);

      expect(result).toHaveProperty('feasible');
      expect(result).toHaveProperty('details');
      expect(result).toHaveProperty('new_score');
      expect(result.feasible).toBe(true);
    });

    it('should reject bridge for insufficient balance', async () => {
      const mockAudit = {
        score: 50,
        wallet_address: '11111111111111111111111111111111',
        transaction_count: 10,
        public_connections: 2,
        privacy_risks: [],
        recommendations: [],
        timestamp: new Date()
      };

      // Mock insufficient balance
      mockedAxios.post.mockResolvedValueOnce({
        data: { result: { value: 500000000 } } // 0.5 SOL in lamports
      });

      const result = await privacyAuditor.simulateZcashBridge('11111111111111111111111111111111', mockAudit);

      expect(result.feasible).toBe(false);
      expect(result.error).toContain('Insufficient SOL');
    });
  });

  describe('generateZashiIntent', () => {
    it('should generate Zashi intent successfully', async () => {
      const result = await privacyAuditor.generateZashiIntent('11111111111111111111111111111111', 1.5);

      expect(result).toHaveProperty('action', 'bridge_to_zec');
      expect(result).toHaveProperty('params');
      expect(result).toHaveProperty('uri');
      expect(result.params.wallet).toBe('11111111111111111111111111111111');
      expect(result.params.amount).toBe(1.5);
      expect(result.uri).toContain('zashi://intent');
    });
  });
});