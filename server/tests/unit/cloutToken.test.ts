import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { CloutTokenService } from '../../src/services/cloutToken';
import { Connection, PublicKey } from '@solana/web3.js';

// Mock Solana dependencies
jest.mock('@solana/web3.js');
jest.mock('@solana/spl-token');

describe('CloutTokenService', () => {
  let cloutService: CloutTokenService;
  let mockConnection: jest.Mocked<Connection>;

  beforeEach(() => {
    mockConnection = {
      sendTransaction: jest.fn(),
      getAccountInfo: jest.fn(),
    } as any;

    cloutService = new CloutTokenService();
  });

  describe('distributeCloutRewards', () => {
    it('should distribute CLOUT rewards with honor multiplier', async () => {
      const recipientWallet = 'test-wallet-address';
      const baseAmount = 1000;
      const honorMultiplier = 1.5;

      const result = await cloutService.distributeCloutRewards(
        recipientWallet,
        baseAmount,
        honorMultiplier
      );

      expect(result.success).toBe(true);
      expect(result.amount).toBe(1500); // 1000 * 1.5
      expect(result.recipient).toBe(recipientWallet);
      expect(result.honorMultiplier).toBe(honorMultiplier);
    });

    it('should handle zero amount gracefully', async () => {
      const result = await cloutService.distributeCloutRewards(
        'test-wallet',
        0,
        1.0
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe('No CLOUT to distribute');
    });

    it('should handle negative multiplier', async () => {
      const result = await cloutService.distributeCloutRewards(
        'test-wallet',
        1000,
        -1.0
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe('No CLOUT to distribute');
    });
  });

  describe('getCloutBalance', () => {
    it('should return balance for existing account', async () => {
      const walletAddress = 'test-wallet';
      const mockBalance = 5000;

      // Mock the getAccount call
      const mockAccount = {
        amount: BigInt(mockBalance),
        mint: new PublicKey('4aHwytKbZnTJY5uNDSX75g2zChfYnC53GdNJHEZtwDPf'),
      };

      jest.spyOn(cloutService as any, 'getAccount').mockResolvedValue(mockAccount);

      const result = await cloutService.getCloutBalance(walletAddress);

      expect(result.balance).toBe(mockBalance);
      expect(result.wallet).toBe(walletAddress);
    });

    it('should return zero balance for non-existent account', async () => {
      const walletAddress = 'non-existent-wallet';

      jest.spyOn(cloutService as any, 'getAccount').mockRejectedValue(new Error('Account not found'));

      const result = await cloutService.getCloutBalance(walletAddress);

      expect(result.balance).toBe(0);
      expect(result.wallet).toBe(walletAddress);
    });
  });

  describe('calculateCloutBenefits', () => {
    it('should calculate correct benefits for high balance', async () => {
      const highBalance = 10000;
      const benefits = await cloutService.calculateCloutBenefits(highBalance);

      expect(benefits.feeReduction).toBe(50); // Max 50%
      expect(benefits.premiumFeatures).toBe(true);
      expect(benefits.governanceWeight).toBe(10); // 10000 / 1000
      expect(benefits.stakingRewards).toBe(10);
      expect(benefits.creatorBonuses).toBe(20); // 10000 / 500
    });

    it('should calculate correct benefits for medium balance', async () => {
      const mediumBalance = 2500;
      const benefits = await cloutService.calculateCloutBenefits(mediumBalance);

      expect(benefits.feeReduction).toBe(25); // 2500 / 100
      expect(benefits.premiumFeatures).toBe(false);
      expect(benefits.governanceWeight).toBe(2); // 2500 / 1000
      expect(benefits.stakingRewards).toBe(2);
      expect(benefits.creatorBonuses).toBe(5); // 2500 / 500
    });

    it('should calculate correct benefits for low balance', async () => {
      const lowBalance = 500;
      const benefits = await cloutService.calculateCloutBenefits(lowBalance);

      expect(benefits.feeReduction).toBe(0);
      expect(benefits.premiumFeatures).toBe(false);
      expect(benefits.governanceWeight).toBe(0);
      expect(benefits.stakingRewards).toBe(0);
      expect(benefits.creatorBonuses).toBe(1); // 500 / 500
    });
  });

  describe('getCloutTokenInfo', () => {
    it('should return correct token information', () => {
      const tokenInfo = cloutService.getCloutTokenInfo();

      expect(tokenInfo.name).toBe('CLOUT Token');
      expect(tokenInfo.symbol).toBe('CLOUT');
      expect(tokenInfo.decimals).toBe(9);
      expect(tokenInfo.totalSupply).toBe(1_000_000_000);
      expect(tokenInfo.utilities).toHaveLength(6);
      expect(tokenInfo.utilities).toContain('Fee reduction (up to 50%)');
      expect(tokenInfo.utilities).toContain('Premium marketplace features');
    });
  });
});
