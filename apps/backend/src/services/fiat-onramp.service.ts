import axios from 'axios';
import { createLogger } from '../lib/logger';

const logger = createLogger('fiat-onramp-service');

export enum PaymentProvider {
  STRIPE = 'stripe',
  MOONPAY = 'moonpay',
  ALCHEMY_PAY = 'alchemy_pay',
}

export interface FiatOnrampSession {
  id: string;
  userId: string;
  provider: PaymentProvider;
  amount: number;
  currency: 'USD' | 'EUR' | 'GBP';
  cryptoAmount: number;
  cryptoCurrency: 'SOL' | 'USDC';
  walletAddress: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  createdAt: number;
  completedAt?: number;
  transactionHash?: string;
  orderId?: string;
}

export class FiatOnrampService {
  private sessions: Map<string, FiatOnrampSession> = new Map();
  private stripeApiKey = process.env.STRIPE_SECRET_KEY;
  private moonpayApiKey = process.env.MOONPAY_SECRET_KEY;
  private alchemyPayApiKey = process.env.ALCHEMY_PAY_SECRET_KEY;

  /**
   * Create fiat onramp session with Stripe
   */
  public async createStripeSession(
    userId: string,
    amount: number,
    currency: 'USD' | 'EUR' | 'GBP',
    walletAddress: string,
    cryptoCurrency: 'SOL' | 'USDC' = 'SOL'
  ): Promise<FiatOnrampSession | null> {
    try {
      if (!this.stripeApiKey) {
        logger.error('Stripe API key not configured');
        return null;
      }

      // Estimate crypto amount (in production, use live rates)
      const cryptoAmount = this.estimateCryptoAmount(amount, cryptoCurrency);

      const session: FiatOnrampSession = {
        id: `stripe_${userId}_${Date.now()}`,
        userId,
        provider: PaymentProvider.STRIPE,
        amount,
        currency,
        cryptoAmount,
        cryptoCurrency,
        walletAddress,
        status: 'pending',
        createdAt: Date.now(),
      };

      // TODO: Call Stripe API to create Payment Link
      // const stripeSession = await stripe.paymentLinks.create({...});

      this.sessions.set(session.id, session);
      logger.info(`Created Stripe onramp session: ${session.id}`);
      return session;
    } catch (error) {
      logger.error('Error creating Stripe session:', error);
      return null;
    }
  }

  /**
   * Create fiat onramp session with MoonPay
   */
  public async createMoonPaySession(
    userId: string,
    amount: number,
    currency: 'USD' | 'EUR' | 'GBP',
    walletAddress: string,
    cryptoCurrency: 'SOL' | 'USDC' = 'SOL'
  ): Promise<FiatOnrampSession | null> {
    try {
      if (!this.moonpayApiKey) {
        logger.error('MoonPay API key not configured');
        return null;
      }

      const cryptoAmount = this.estimateCryptoAmount(amount, cryptoCurrency);

      const session: FiatOnrampSession = {
        id: `moonpay_${userId}_${Date.now()}`,
        userId,
        provider: PaymentProvider.MOONPAY,
        amount,
        currency,
        cryptoAmount,
        cryptoCurrency,
        walletAddress,
        status: 'pending',
        createdAt: Date.now(),
      };

      // TODO: Call MoonPay API
      // const moonpayUrl = `https://buy.moonpay.com?apiKey=${this.moonpayApiKey}&...`;

      this.sessions.set(session.id, session);
      logger.info(`Created MoonPay onramp session: ${session.id}`);
      return session;
    } catch (error) {
      logger.error('Error creating MoonPay session:', error);
      return null;
    }
  }

  /**
   * Create fiat onramp session with Alchemy Pay
   */
  public async createAlchemyPaySession(
    userId: string,
    amount: number,
    currency: 'USD' | 'EUR' | 'GBP',
    walletAddress: string,
    cryptoCurrency: 'SOL' | 'USDC' = 'SOL'
  ): Promise<FiatOnrampSession | null> {
    try {
      if (!this.alchemyPayApiKey) {
        logger.error('Alchemy Pay API key not configured');
        return null;
      }

      const cryptoAmount = this.estimateCryptoAmount(amount, cryptoCurrency);

      const session: FiatOnrampSession = {
        id: `alchemy_${userId}_${Date.now()}`,
        userId,
        provider: PaymentProvider.ALCHEMY_PAY,
        amount,
        currency,
        cryptoAmount,
        cryptoCurrency,
        walletAddress,
        status: 'pending',
        createdAt: Date.now(),
      };

      // TODO: Call Alchemy Pay API
      // const alchemyResponse = await axios.post('https://api.alchemypay.org/v1/orders', {...});

      this.sessions.set(session.id, session);
      logger.info(`Created Alchemy Pay onramp session: ${session.id}`);
      return session;
    } catch (error) {
      logger.error('Error creating Alchemy Pay session:', error);
      return null;
    }
  }

  /**
   * Get session status
   */
  public getSessionStatus(sessionId: string): FiatOnrampSession | null {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Mark session as completed
   */
  public completeSession(sessionId: string, transactionHash?: string, orderId?: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = 'completed';
      session.completedAt = Date.now();
      if (transactionHash) session.transactionHash = transactionHash;
      if (orderId) session.orderId = orderId;
      logger.info(`Session ${sessionId} marked as completed`);
    }
  }

  /**
   * Mark session as failed
   */
  public failSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = 'failed';
      logger.warn(`Session ${sessionId} marked as failed`);
    }
  }

  /**
   * Get user's sessions
   */
  public getUserSessions(userId: string): FiatOnrampSession[] {
    return Array.from(this.sessions.values()).filter(s => s.userId === userId);
  }

  /**
   * Estimate crypto amount based on fiat amount
   */
  private estimateCryptoAmount(fiatAmount: number, cryptoCurrency: string): number {
    // In production, fetch real-time rates from an oracle
    const rates: Record<string, number> = {
      SOL: 0.025, // 1 SOL ≈ 40 USD (adjust as needed)
      USDC: 0.001, // 1 USDC = 1 USD
    };

    const rate = rates[cryptoCurrency] || 0.025;
    return fiatAmount * rate;
  }

  /**
   * Handle webhook from payment provider
   */
  public handlePaymentWebhook(provider: PaymentProvider, payload: any): void {
    try {
      const sessionId = payload.metadata?.sessionId || payload.orderId;
      if (!sessionId) {
        logger.warn('Webhook received without session ID');
        return;
      }

      const session = this.sessions.get(sessionId);
      if (!session) {
        logger.warn(`Session not found: ${sessionId}`);
        return;
      }

      switch (payload.status) {
        case 'completed':
        case 'succeeded':
          this.completeSession(sessionId, payload.transactionHash || payload.txHash, payload.orderId);
          logger.info(`Payment completed for session ${sessionId}`);
          break;
        case 'failed':
          this.failSession(sessionId);
          logger.warn(`Payment failed for session ${sessionId}`);
          break;
        case 'pending':
          session.status = 'processing';
          logger.info(`Payment processing for session ${sessionId}`);
          break;
      }
    } catch (error) {
      logger.error('Error handling payment webhook:', error);
    }
  }

  /**
   * Get supported currencies for each provider
   */
  public getSupportedCurrencies(): Record<PaymentProvider, string[]> {
    return {
      [PaymentProvider.STRIPE]: ['USD', 'EUR', 'GBP'],
      [PaymentProvider.MOONPAY]: ['USD', 'EUR', 'GBP'],
      [PaymentProvider.ALCHEMY_PAY]: ['USD', 'EUR', 'GBP'],
    };
  }

  /**
   * Get real-time exchange rates
   */
  public async getExchangeRates(): Promise<Record<string, number>> {
    try {
      // In production, use a proper oracle like Chainlink or CoinGecko
      const response = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
        params: {
          ids: 'solana,usd-coin',
          vs_currencies: 'usd',
        },
      });

      return {
        SOL: 1 / response.data.solana.usd,
        USDC: 1 / response.data['usd-coin'].usd,
      };
    } catch (error) {
      logger.error('Error fetching exchange rates:', error);
      // Return defaults on error
      return { SOL: 0.025, USDC: 0.001 };
    }
  }
}

let fiatOnrampService: FiatOnrampService;

export function getFiatOnrampService(): FiatOnrampService {
  if (!fiatOnrampService) {
    fiatOnrampService = new FiatOnrampService();
  }
  return fiatOnrampService;
}

export function initializeFiatOnrampService(): FiatOnrampService {
  if (!fiatOnrampService) {
    fiatOnrampService = new FiatOnrampService();
  }
  return fiatOnrampService;
}
