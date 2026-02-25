/**
 * Unit Tests: Fiat On-Ramp Service
 * Tests real Stripe/MoonPay/AlchemyPay integration with mocked HTTP calls
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import axios from 'axios';
import { FiatOnrampService, PaymentProvider } from '../../services/fiat-onramp.service';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('FiatOnrampService', () => {
  let service: FiatOnrampService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new FiatOnrampService();
  });

  describe('createStripeSession', () => {
    it('creates session with checkout URL when Stripe API succeeds', async () => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_123';

      mockedAxios.get.mockResolvedValueOnce({
        data: { solana: { usd: 200 }, 'usd-coin': { usd: 1 } },
      });

      mockedAxios.post.mockResolvedValueOnce({
        data: { redirect_url: 'https://buy.stripe.com/test-session' },
      });

      const session = await service.createStripeSession(
        'user-1', 100, 'USD', '11111111111111111111111111111111', 'SOL'
      );

      expect(session).not.toBeNull();
      expect(session?.provider).toBe(PaymentProvider.STRIPE);
      expect(session?.checkoutUrl).toBe('https://buy.stripe.com/test-session');
      expect(session?.amount).toBe(100);
      expect(session?.currency).toBe('USD');

      delete process.env.STRIPE_SECRET_KEY;
    });

    it('creates session without checkout URL when Stripe API fails', async () => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_456';

      mockedAxios.get.mockResolvedValueOnce({
        data: { solana: { usd: 150 }, 'usd-coin': { usd: 1 } },
      });

      mockedAxios.post.mockRejectedValueOnce(new Error('Stripe API error'));

      const session = await service.createStripeSession(
        'user-2', 50, 'EUR', '11111111111111111111111111111112', 'SOL'
      );

      expect(session).not.toBeNull();
      expect(session?.checkoutUrl).toBeUndefined();
      expect(session?.status).toBe('pending');

      delete process.env.STRIPE_SECRET_KEY;
    });

    it('returns null when no API key configured', async () => {
      delete process.env.STRIPE_SECRET_KEY;
      const session = await service.createStripeSession(
        'user-3', 100, 'USD', '11111111111111111111111111111113', 'SOL'
      );
      expect(session).toBeNull();
    });
  });

  describe('createMoonPaySession', () => {
    it('creates MoonPay session with signed URL', async () => {
      process.env.MOONPAY_SECRET_KEY = 'moonpay_test_secret';

      mockedAxios.get.mockResolvedValueOnce({
        data: { solana: { usd: 180 }, 'usd-coin': { usd: 1 } },
      });

      const session = await service.createMoonPaySession(
        'user-4', 200, 'USD', '11111111111111111111111111111114', 'SOL'
      );

      expect(session).not.toBeNull();
      expect(session?.provider).toBe(PaymentProvider.MOONPAY);
      expect(session?.checkoutUrl).toContain('moonpay.com');

      delete process.env.MOONPAY_SECRET_KEY;
    });

    it('returns null when no API key configured', async () => {
      delete process.env.MOONPAY_SECRET_KEY;
      const session = await service.createMoonPaySession(
        'user-5', 100, 'USD', '11111111111111111111111111111115', 'SOL'
      );
      expect(session).toBeNull();
    });
  });

  describe('handlePaymentWebhook', () => {
    it('marks session as completed on success webhook', async () => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_webhook';

      mockedAxios.get.mockResolvedValue({ data: { solana: { usd: 200 }, 'usd-coin': { usd: 1 } } });
      mockedAxios.post.mockResolvedValue({ data: { redirect_url: 'https://buy.stripe.com/t' } });

      const session = await service.createStripeSession(
        'user-6', 100, 'USD', '11111111111111111111111111111116', 'SOL'
      );
      expect(session).not.toBeNull();

      service.handlePaymentWebhook(PaymentProvider.STRIPE, {
        status: 'completed',
        metadata: { sessionId: session!.id },
        transactionHash: '0xabc123',
      });

      const updated = service.getSessionStatus(session!.id);
      expect(updated?.status).toBe('completed');
      expect(updated?.transactionHash).toBe('0xabc123');

      delete process.env.STRIPE_SECRET_KEY;
    });

    it('marks session as failed on failure webhook', async () => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_fail';
      mockedAxios.get.mockResolvedValue({ data: { solana: { usd: 200 }, 'usd-coin': { usd: 1 } } });
      mockedAxios.post.mockResolvedValue({ data: {} });

      const session = await service.createStripeSession(
        'user-7', 100, 'USD', '11111111111111111111111111111117', 'SOL'
      );

      service.handlePaymentWebhook(PaymentProvider.STRIPE, {
        status: 'failed',
        metadata: { sessionId: session!.id },
      });

      const updated = service.getSessionStatus(session!.id);
      expect(updated?.status).toBe('failed');

      delete process.env.STRIPE_SECRET_KEY;
    });
  });

  describe('getExchangeRates', () => {
    it('returns rates from CoinGecko', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { solana: { usd: 210 }, 'usd-coin': { usd: 1 } },
      });

      const rates = await service.getExchangeRates();
      expect(rates.SOL).toBeCloseTo(1 / 210, 5);
      expect(rates.USDC).toBe(1);
    });

    it('returns fallback rates when CoinGecko fails', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));

      const rates = await service.getExchangeRates();
      expect(rates.SOL).toBeDefined();
      expect(rates.USDC).toBeDefined();
    });
  });

  describe('getSupportedCurrencies', () => {
    it('returns currencies for all providers', () => {
      const currencies = service.getSupportedCurrencies();
      expect(currencies[PaymentProvider.STRIPE]).toContain('USD');
      expect(currencies[PaymentProvider.MOONPAY]).toContain('EUR');
      expect(currencies[PaymentProvider.ALCHEMY_PAY]).toContain('GBP');
    });
  });

  describe('getUserSessions', () => {
    it('returns only sessions for the specified user', async () => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_filter';
      mockedAxios.get.mockResolvedValue({ data: { solana: { usd: 200 }, 'usd-coin': { usd: 1 } } });
      mockedAxios.post.mockResolvedValue({ data: {} });

      await service.createStripeSession('alice', 100, 'USD', '11111111111111111111111111111118', 'SOL');
      await service.createStripeSession('bob', 50, 'USD', '11111111111111111111111111111119', 'SOL');

      const aliceSessions = service.getUserSessions('alice');
      const bobSessions = service.getUserSessions('bob');

      expect(aliceSessions.every((s) => s.userId === 'alice')).toBe(true);
      expect(bobSessions.every((s) => s.userId === 'bob')).toBe(true);

      delete process.env.STRIPE_SECRET_KEY;
    });
  });
});
