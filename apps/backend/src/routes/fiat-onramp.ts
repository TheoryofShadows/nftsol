import { Router } from 'express';
import express from 'express';
import crypto from 'crypto';
import { getFiatOnrampService, PaymentProvider } from '../services/fiat-onramp.service';
import logger from '../utils/logger';
import { authenticate as verifyAuth } from '../middlewares/auth';
import { webhookLimiter } from '../middleware/rate-limiting';

const router = Router();

/**
 * POST /api/v1/fiat/session (also /create-session for backwards compat)
 * Create a new fiat onramp session
 */
async function handleCreateSession(req: express.Request, res: express.Response) {
  try {
    const userId = (req as any).user?.id;
    const { provider, amount, currency, walletAddress, cryptoCurrency = 'SOL' } = req.body;

    if (!provider || !amount || !currency || !walletAddress) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
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
        return res.status(400).json({ success: false, error: 'Invalid payment provider' });
    }

    if (!session) {
      return res.status(500).json({ success: false, error: 'Failed to create session' });
    }

    res.json({ success: true, data: session });
  } catch (error) {
    logger.error('Error creating fiat session:', error);
    res.status(500).json({ success: false, error: 'Failed to create fiat session' });
  }
}

router.post('/session', verifyAuth, handleCreateSession);
router.post('/create-session', verifyAuth, handleCreateSession);

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
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    res.json({ success: true, data: session });
  } catch (error) {
    logger.error('Error fetching session:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch session' });
  }
});

/**
 * GET /api/v1/fiat/user-sessions
 * Get user's fiat onramp sessions
 */
router.get('/user-sessions', verifyAuth, (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const fiatService = getFiatOnrampService();
    const sessions = fiatService.getUserSessions(userId);

    res.json({ success: true, data: sessions, total: sessions.length });
  } catch (error) {
    logger.error('Error fetching user sessions:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch user sessions' });
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

    res.json({ success: true, data: currencies });
  } catch (error) {
    logger.error('Error fetching supported currencies:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch supported currencies' });
  }
});

/**
 * GET /api/v1/fiat/exchange-rates (also /rates alias)
 * Get real-time exchange rates
 */
async function handleExchangeRates(req: express.Request, res: express.Response) {
  try {
    const fiatService = getFiatOnrampService();
    const rates = await fiatService.getExchangeRates();

    res.json({ success: true, data: rates, updatedAt: new Date().toISOString() });
  } catch (error) {
    logger.error('Error fetching exchange rates:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch exchange rates' });
  }
}

router.get('/exchange-rates', handleExchangeRates);
router.get('/rates', handleExchangeRates);

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
          try {
            const receivedBuf = Buffer.from(receivedSig, 'hex');
            const expectedBuf = Buffer.from(expectedSig, 'hex');
            if (receivedBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(receivedBuf, expectedBuf)) {
              logger.warn('Invalid Stripe webhook signature');
              return res.status(400).json({ error: 'Invalid webhook signature' });
            }
          } catch {
            logger.warn('Invalid Stripe webhook signature format');
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
        try {
          const sigBuf = Buffer.from(signature);
          const expectedBuf = Buffer.from(expectedSig);
          if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
            logger.warn('Invalid MoonPay webhook signature');
            return res.status(400).json({ error: 'Invalid webhook signature' });
          }
        } catch {
          logger.warn('Invalid MoonPay webhook signature format');
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
        try {
          const sigBuf = Buffer.from(signature);
          const expectedBuf = Buffer.from(expectedSig);
          if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
            logger.warn('Invalid AlchemyPay webhook signature');
            return res.status(400).json({ error: 'Invalid webhook signature' });
          }
        } catch {
          logger.warn('Invalid AlchemyPay webhook signature format');
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

    res.json({ success: true, data: providers });
  } catch (error) {
    logger.error('Error fetching providers:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch providers' });
  }
});

export default router;
