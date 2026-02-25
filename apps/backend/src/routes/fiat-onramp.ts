import { Router } from 'express';
import crypto from 'crypto';
import { getFiatOnrampService, PaymentProvider } from '../services/fiat-onramp.service';
import logger from '../utils/logger';
import { authenticate as verifyAuth } from '../middlewares/auth';
import { webhookLimiter } from '../middleware/rate-limiting';

const router = Router();

/**
 * POST /api/v1/fiat/create-session
 * Create a new fiat onramp session
 */
router.post('/create-session', verifyAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { provider, amount, currency, walletAddress, cryptoCurrency = 'SOL' } = req.body;

    if (!provider || !amount || !currency || !walletAddress) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const fiatService = getFiatOnrampService();
    let session;

    switch (provider) {
      case PaymentProvider.STRIPE:
        session = await fiatService.createStripeSession(
          userId,
          amount,
          currency,
          walletAddress,
          cryptoCurrency
        );
        break;
      case PaymentProvider.MOONPAY:
        session = await fiatService.createMoonPaySession(
          userId,
          amount,
          currency,
          walletAddress,
          cryptoCurrency
        );
        break;
      case PaymentProvider.ALCHEMY_PAY:
        session = await fiatService.createAlchemyPaySession(
          userId,
          amount,
          currency,
          walletAddress,
          cryptoCurrency
        );
        break;
      default:
        return res.status(400).json({ error: 'Invalid payment provider' });
    }

    if (!session) {
      return res.status(500).json({ error: 'Failed to create session' });
    }

    res.json({ session });
  } catch (error) {
    logger.error('Error creating fiat session:', error);
    res.status(500).json({ error: 'Failed to create fiat session' });
  }
});

/**
 * GET /api/v1/fiat/session/:sessionId
 * Get session details and status
 */
router.get('/session/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    const fiatService = getFiatOnrampService();
    const session = fiatService.getSessionStatus(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({ session });
  } catch (error) {
    logger.error('Error fetching session:', error);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

/**
 * GET /api/v1/fiat/user-sessions
 * Get user's fiat onramp sessions
 */
router.get('/user-sessions', verifyAuth, (req, res) => {
  try {
    const userId = req.user?.id;
    const fiatService = getFiatOnrampService();
    const sessions = fiatService.getUserSessions(userId);

    res.json({ data: sessions, total: sessions.length });
  } catch (error) {
    logger.error('Error fetching user sessions:', error);
    res.status(500).json({ error: 'Failed to fetch user sessions' });
  }
});

/**
 * GET /api/v1/fiat/supported-currencies
 * Get supported currencies for each provider
 */
router.get('/supported-currencies', (req, res) => {
  try {
    const fiatService = getFiatOnrampService();
    const currencies = fiatService.getSupportedCurrencies();

    res.json({ currencies });
  } catch (error) {
    logger.error('Error fetching supported currencies:', error);
    res.status(500).json({ error: 'Failed to fetch supported currencies' });
  }
});

/**
 * GET /api/v1/fiat/exchange-rates
 * Get real-time exchange rates
 */
router.get('/exchange-rates', async (req, res) => {
  try {
    const fiatService = getFiatOnrampService();
    const rates = await fiatService.getExchangeRates();

    res.json({ rates, updatedAt: new Date().toISOString() });
  } catch (error) {
    logger.error('Error fetching exchange rates:', error);
    res.status(500).json({ error: 'Failed to fetch exchange rates' });
  }
});

/**
 * POST /api/v1/fiat/webhook/:provider
 * Handle payment provider webhooks
 */
router.post('/webhook/:provider', webhookLimiter, (req, res) => {
  try {
    const { provider } = req.params;
    const rawBody = JSON.stringify(req.body);

    // Verify webhook signature per provider
    if (provider === PaymentProvider.STRIPE) {
      const stripeSecret = process.env.STRIPE_WEBHOOK_SECRET;
      const signature = req.headers['stripe-signature'] as string;
      if (stripeSecret && signature) {
        // Stripe uses HMAC-SHA256 with timestamp to prevent replay attacks
        const [tPart, v1Part] = signature.split(',');
        const timestamp = tPart?.split('=')[1];
        const receivedSig = v1Part?.split('=')[1];
        if (timestamp && receivedSig) {
          const expectedSig = crypto
            .createHmac('sha256', stripeSecret)
            .update(`${timestamp}.${rawBody}`)
            .digest('hex');
          if (!crypto.timingSafeEqual(Buffer.from(receivedSig, 'hex'), Buffer.from(expectedSig, 'hex'))) {
            logger.warn('Invalid Stripe webhook signature');
            return res.status(400).json({ error: 'Invalid webhook signature' });
          }
        }
      }
    } else if (provider === PaymentProvider.MOONPAY) {
      const moonpaySecret = process.env.MOONPAY_WEBHOOK_SECRET;
      const signature = req.headers['moonpay-signature-v2'] as string;
      if (moonpaySecret && signature) {
        const expectedSig = crypto
          .createHmac('sha256', moonpaySecret)
          .update(rawBody)
          .digest('hex');
        if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
          logger.warn('Invalid MoonPay webhook signature');
          return res.status(400).json({ error: 'Invalid webhook signature' });
        }
      }
    } else if (provider === PaymentProvider.ALCHEMY_PAY) {
      const alchemySecret = process.env.ALCHEMY_PAY_WEBHOOK_SECRET;
      const signature = req.headers['x-api-signature'] as string;
      if (alchemySecret && signature) {
        const expectedSig = crypto
          .createHmac('sha256', alchemySecret)
          .update(rawBody)
          .digest('hex');
        if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
          logger.warn('Invalid AlchemyPay webhook signature');
          return res.status(400).json({ error: 'Invalid webhook signature' });
        }
      }
    }

    const fiatService = getFiatOnrampService();
    fiatService.handlePaymentWebhook(provider as PaymentProvider, req.body);
    res.json({ received: true });
  } catch (error) {
    logger.error('Error handling webhook:', error);
    res.status(500).json({ error: 'Failed to handle webhook' });
  }
});

/**
 * GET /api/v1/fiat/providers
 * Get available payment providers
 */
router.get('/providers', (req, res) => {
  try {
    const providers = [
      {
        name: 'Stripe',
        id: 'stripe',
        icon: '💳',
        minAmount: 10,
        maxAmount: 50000,
        currencies: ['USD', 'EUR', 'GBP'],
        fees: '1-2%',
      },
      {
        name: 'MoonPay',
        id: 'moonpay',
        icon: '🌙',
        minAmount: 20,
        maxAmount: 100000,
        currencies: ['USD', 'EUR', 'GBP'],
        fees: '1-3%',
      },
      {
        name: 'Alchemy Pay',
        id: 'alchemy_pay',
        icon: '⚗️',
        minAmount: 5,
        maxAmount: 50000,
        currencies: ['USD', 'EUR', 'GBP'],
        fees: '1-2%',
      },
    ];

    res.json({ providers });
  } catch (error) {
    logger.error('Error fetching providers:', error);
    res.status(500).json({ error: 'Failed to fetch providers' });
  }
});

export default router;
