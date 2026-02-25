/**
 * Fiat On-Ramp Routes Tests
 * Tests webhook signature verification and session management
 */

import request from 'supertest';
import express from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

jest.mock('../../middlewares/auth', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    const header = req.headers['authorization'];
    if (!header) return _res.status(401).json({ success: false, error: 'Unauthorized' });
    try {
      const token = header.split(' ')[1];
      req.user = jwt.verify(token, 'test-secret');
      next();
    } catch {
      return _res.status(401).json({ success: false, error: 'Invalid token' });
    }
  },
}));

jest.mock('../../services/fiat-onramp.service', () => {
  const PaymentProvider = {
    STRIPE: 'stripe',
    MOONPAY: 'moonpay',
    ALCHEMY_PAY: 'alchemy_pay',
  };

  const mockSession = {
    id: 'stripe_user1_12345',
    userId: 'user1',
    provider: 'stripe',
    amount: 100,
    currency: 'USD',
    cryptoAmount: 0.5,
    cryptoCurrency: 'SOL',
    walletAddress: '11111111111111111111111111111111',
    status: 'pending',
    createdAt: Date.now(),
    checkoutUrl: 'https://buy.stripe.com/test',
  };

  const service = {
    createStripeSession: jest.fn().mockResolvedValue(mockSession),
    createMoonPaySession: jest.fn().mockResolvedValue({ ...mockSession, provider: 'moonpay', id: 'moonpay_user1_12345' }),
    createAlchemyPaySession: jest.fn().mockResolvedValue({ ...mockSession, provider: 'alchemy_pay', id: 'alchemy_user1_12345' }),
    getSessionStatus: jest.fn().mockReturnValue(mockSession),
    handlePaymentWebhook: jest.fn(),
    getSupportedCurrencies: jest.fn().mockReturnValue({
      stripe: ['USD', 'EUR', 'GBP'],
      moonpay: ['USD', 'EUR', 'GBP'],
      alchemy_pay: ['USD', 'EUR', 'GBP'],
    }),
    getExchangeRates: jest.fn().mockResolvedValue({ SOL: 0.005, USDC: 1 }),
    getUserSessions: jest.fn().mockReturnValue([mockSession]),
  };

  return {
    PaymentProvider,
    getFiatOnrampService: jest.fn(() => service),
    initializeFiatOnrampService: jest.fn(() => service),
  };
});

import fiatOnrampRoutes from '../fiat-onramp';

const app = express();
app.use(express.json());
app.use('/api/v1/fiat', fiatOnrampRoutes);

const userToken = jwt.sign({ id: 'user1', walletAddress: '11111111111111111111111111111111' }, 'test-secret', { expiresIn: '1h' });

describe('Fiat On-Ramp Routes', () => {
  describe('GET /api/v1/fiat/providers', () => {
    it('returns supported providers', async () => {
      const res = await request(app)
        .get('/api/v1/fiat/providers')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });
  });

  describe('GET /api/v1/fiat/rates', () => {
    it('returns exchange rates', async () => {
      const res = await request(app)
        .get('/api/v1/fiat/rates')
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  describe('POST /api/v1/fiat/session', () => {
    it('creates Stripe onramp session for authenticated user', async () => {
      const res = await request(app)
        .post('/api/v1/fiat/session')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ provider: 'stripe', amount: 100, currency: 'USD', walletAddress: '11111111111111111111111111111111', cryptoCurrency: 'SOL' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });

    it('returns 401 without auth', async () => {
      await request(app)
        .post('/api/v1/fiat/session')
        .send({ provider: 'stripe', amount: 100, currency: 'USD', walletAddress: '11111111111111111111111111111111' })
        .expect(401);
    });
  });

  describe('POST /api/v1/fiat/webhook/:provider', () => {
    describe('Stripe webhook', () => {
      it('processes valid Stripe webhook without signature requirement', async () => {
        // Without STRIPE_WEBHOOK_SECRET set, should process the webhook
        const payload = { status: 'completed', metadata: { sessionId: 'stripe_user1_12345' } };

        const res = await request(app)
          .post('/api/v1/fiat/webhook/stripe')
          .send(payload)
          .expect(200);

        expect(res.body.received).toBe(true);
      });

      it('rejects invalid Stripe webhook signature when secret is set', async () => {
        const secret = 'stripe_webhook_secret_test';
        process.env.STRIPE_WEBHOOK_SECRET = secret;

        const payload = JSON.stringify({ status: 'completed' });
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const invalidSig = `t=${timestamp},v1=invalidsignature`;

        const res = await request(app)
          .post('/api/v1/fiat/webhook/stripe')
          .set('stripe-signature', invalidSig)
          .set('Content-Type', 'application/json')
          .send(payload)
          .expect(400);

        expect(res.body.error).toMatch(/signature/i);
        delete process.env.STRIPE_WEBHOOK_SECRET;
      });

      it('accepts valid Stripe HMAC signature', async () => {
        const secret = 'stripe_webhook_secret_valid';
        process.env.STRIPE_WEBHOOK_SECRET = secret;

        const payload = JSON.stringify({ status: 'completed', metadata: { sessionId: 'stripe_user1_12345' } });
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const expectedSig = crypto
          .createHmac('sha256', secret)
          .update(`${timestamp}.${payload}`)
          .digest('hex');

        const res = await request(app)
          .post('/api/v1/fiat/webhook/stripe')
          .set('stripe-signature', `t=${timestamp},v1=${expectedSig}`)
          .set('Content-Type', 'application/json')
          .send(payload)
          .expect(200);

        expect(res.body.received).toBe(true);
        delete process.env.STRIPE_WEBHOOK_SECRET;
      });
    });

    describe('MoonPay webhook', () => {
      it('processes MoonPay webhook with valid signature', async () => {
        const secret = 'moonpay_secret';
        process.env.MOONPAY_WEBHOOK_SECRET = secret;

        const payload = JSON.stringify({ status: 'completed', orderId: 'moonpay_user1_12345' });
        const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

        const res = await request(app)
          .post('/api/v1/fiat/webhook/moonpay')
          .set('moonpay-signature-v2', signature)
          .set('Content-Type', 'application/json')
          .send(payload)
          .expect(200);

        expect(res.body.received).toBe(true);
        delete process.env.MOONPAY_WEBHOOK_SECRET;
      });
    });
  });

  describe('GET /api/v1/fiat/session/:sessionId', () => {
    it('returns session status for authenticated user', async () => {
      const res = await request(app)
        .get('/api/v1/fiat/session/stripe_user1_12345')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });
});
