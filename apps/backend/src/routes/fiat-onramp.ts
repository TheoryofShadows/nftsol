import { Router } from 'express';
import { getFiatOnrampService, PaymentProvider } from '../services/fiat-onramp.service';
import { createLogger } from '../lib/logger';
import { verifyAuth } from '../middleware/auth';

const router = Router();
const logger = createLogger('fiat-onramp-route');

/**
 * POST /api/v1/fiat/create-session
 * Create a new fiat onramp session
 */
router.post('/create-session', verifyAuth, (req, res) => {
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
router.post('/webhook/:provider', (req, res) => {
  try {
    const { provider } = req.params;
    const fiatService = getFiatOnrampService();

    // Verify webhook signature (provider-specific)
    // TODO: Implement webhook verification

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
