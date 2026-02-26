import axios from 'axios';
import crypto from 'crypto';
import logger from '../utils/logger';


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
  checkoutUrl?: string;
}

export class FiatOnrampService {
  private sessions: Map<string, FiatOnrampSession> = new Map();
  private get stripeApiKey() { return process.env.STRIPE_SECRET_KEY; }
  private get moonpayApiKey() { return process.env.MOONPAY_SECRET_KEY; }
  private get moonpaySecretKey() { return process.env.MOONPAY_SECRET_KEY; }
  private get alchemyPayApiKey() { return process.env.ALCHEMY_PAY_API_KEY; }
  private get alchemyPaySecret() { return process.env.ALCHEMY_PAY_SECRET_KEY; }

  /**
   * Create fiat onramp session with Stripe Crypto Onramp
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

      // Fetch real-time rates for accurate crypto amount
      const rates = await this.getExchangeRates();
      const cryptoAmount = amount * (rates[cryptoCurrency] ?? this.estimateCryptoAmount(amount, cryptoCurrency) / amount);
      const sessionId = `stripe_${userId}_${Date.now()}`;

      // Call Stripe Crypto Onramp API
      let checkoutUrl: string | undefined;
      try {
        const params = new URLSearchParams({
          'wallet_addresses[solana]': walletAddress,
          'transaction_details[destination_currency]': cryptoCurrency.toLowerCase(),
          'transaction_details[destination_exchange_amount]': cryptoAmount.toFixed(6),
          'transaction_details[source_currency]': currency.toLowerCase(),
          lock_wallet_address: 'true',
        });

        const stripeResponse = await axios.post(
          'https://api.stripe.com/v1/crypto/onramp_sessions',
          params.toString(),
          {
            headers: {
              Authorization: `Bearer ${this.stripeApiKey}`,
              'Content-Type': 'application/x-www-form-urlencoded',
              'Stripe-Version': '2024-06-20',
            },
            timeout: 15000,
          }
        );
        checkoutUrl = stripeResponse.data?.redirect_url || stripeResponse.data?.url;
      } catch (stripeErr: unknown) {
        const msg = stripeErr instanceof Error ? stripeErr.message : String(stripeErr);
        logger.warn(`Stripe Crypto Onramp API call failed (session still created): ${msg}`);
      }

      const session: FiatOnrampSession = {
        id: sessionId,
        userId,
        provider: PaymentProvider.STRIPE,
        amount,
        currency,
        cryptoAmount,
        cryptoCurrency,
        walletAddress,
        status: 'pending',
        createdAt: Date.now(),
        checkoutUrl,
      };

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

      const rates = await this.getExchangeRates();
      const cryptoAmount = amount * (rates[cryptoCurrency] ?? this.estimateCryptoAmount(amount, cryptoCurrency) / amount);
      const sessionId = `moonpay_${userId}_${Date.now()}`;

      // Build MoonPay widget URL with HMAC signature
      let checkoutUrl: string | undefined;
      try {
        const baseParams = new URLSearchParams({
          apiKey: this.moonpayApiKey,
          currencyCode: cryptoCurrency.toLowerCase(),
          walletAddress,
          baseCurrencyAmount: amount.toString(),
          baseCurrencyCode: currency.toLowerCase(),
        });

        const urlToSign = `?${baseParams.toString()}`;

        if (this.moonpaySecretKey) {
          const signature = crypto
            .createHmac('sha256', this.moonpaySecretKey)
            .update(urlToSign)
            .digest('base64');
          baseParams.set('signature', signature);
        }

        checkoutUrl = `https://buy.moonpay.com${urlToSign}&signature=${encodeURIComponent(
          crypto.createHmac('sha256', this.moonpaySecretKey || '').update(urlToSign).digest('base64')
        )}`;
      } catch (moonpayErr: unknown) {
        const msg = moonpayErr instanceof Error ? moonpayErr.message : String(moonpayErr);
        logger.warn(`MoonPay URL generation failed (session still created): ${msg}`);
      }

      const session: FiatOnrampSession = {
        id: sessionId,
        userId,
        provider: PaymentProvider.MOONPAY,
        amount,
        currency,
        cryptoAmount,
        cryptoCurrency,
        walletAddress,
        status: 'pending',
        createdAt: Date.now(),
        checkoutUrl,
      };

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

      const rates = await this.getExchangeRates();
      const cryptoAmount = amount * (rates[cryptoCurrency] ?? this.estimateCryptoAmount(amount, cryptoCurrency) / amount);
      const sessionId = `alchemy_${userId}_${Date.now()}`;
      const timestamp = Date.now().toString();

      // Build Alchemy Pay order
      let checkoutUrl: string | undefined;
      try {
        const orderPayload = {
          appId: this.alchemyPayApiKey,
          timestamp,
          crypto: cryptoCurrency,
          network: 'SOL',
          address: walletAddress,
          fiat: currency,
          amount: amount.toString(),
          callbackUrl: process.env.ALCHEMY_PAY_CALLBACK_URL || '',
          orderId: sessionId,
        };

        // Generate Alchemy Pay signature
        const signStr = Object.keys(orderPayload)
          .sort()
          .map((k) => `${k}=${(orderPayload as Record<string, string>)[k]}`)
          .join('&');

        if (this.alchemyPaySecret) {
          const signature = crypto
            .createHmac('sha256', this.alchemyPaySecret)
            .update(signStr)
            .digest('hex');

          const alchemyResponse = await axios.post(
            'https://openapi.alchemypay.org/open/api/merchant/query/onrampUrl',
            { ...orderPayload, sign: signature },
            {
              headers: { 'Content-Type': 'application/json' },
              timeout: 15000,
            }
          );
          checkoutUrl = alchemyResponse.data?.data?.redirectUrl;
        }
      } catch (alchemyErr: unknown) {
        const msg = alchemyErr instanceof Error ? alchemyErr.message : String(alchemyErr);
        logger.warn(`Alchemy Pay API call failed (session still created): ${msg}`);
      }

      const session: FiatOnrampSession = {
        id: sessionId,
        userId,
        provider: PaymentProvider.ALCHEMY_PAY,
        amount,
        currency,
        cryptoAmount,
        cryptoCurrency,
        walletAddress,
        status: 'pending',
        createdAt: Date.now(),
        checkoutUrl,
      };

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
   * Estimate crypto amount based on fiat amount (fallback only)
   */
  private estimateCryptoAmount(fiatAmount: number, cryptoCurrency: string): number {
    const rates: Record<string, number> = {
      SOL: 0.005, // ~200 USD/SOL fallback
      USDC: 1,
    };
    const rate = rates[cryptoCurrency] || 0.005;
    return fiatAmount * rate;
  }

  /**
   * Handle webhook from payment provider
   */
  public handlePaymentWebhook(provider: PaymentProvider, payload: Record<string, unknown>): void {
    try {
      const sessionId = (payload.metadata as Record<string, string> | undefined)?.sessionId
        || payload.orderId as string | undefined
        || payload.order_id as string | undefined;

      if (!sessionId) {
        logger.warn('Webhook received without session ID');
        return;
      }

      const session = this.sessions.get(sessionId);
      if (!session) {
        logger.warn(`Session not found: ${sessionId}`);
        return;
      }

      const status = payload.status as string | undefined;
      switch (status) {
        case 'completed':
        case 'succeeded':
        case 'COMPLETE':
          this.completeSession(
            sessionId,
            (payload.transactionHash || payload.txHash || payload.tx_hash) as string | undefined,
            (payload.orderId || payload.order_id) as string | undefined
          );
          logger.info(`Payment completed for session ${sessionId}`);
          break;
        case 'failed':
        case 'FAILED':
          this.failSession(sessionId);
          logger.warn(`Payment failed for session ${sessionId}`);
          break;
        case 'pending':
        case 'PENDING':
        case 'processing':
          session.status = 'processing';
          logger.info(`Payment processing for session ${sessionId}`);
          break;
        default:
          logger.debug(`Unhandled webhook status ${status} for session ${sessionId}`);
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
   * Get real-time exchange rates from CoinGecko
   */
  public async getExchangeRates(): Promise<Record<string, number>> {
    try {
      const response = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
        params: {
          ids: 'solana,usd-coin',
          vs_currencies: 'usd',
        },
        timeout: 8000,
      });

      return {
        SOL: 1 / response.data.solana.usd,
        USDC: 1 / response.data['usd-coin'].usd,
      };
    } catch (error) {
      logger.error('Error fetching exchange rates:', error);
      return { SOL: 0.005, USDC: 1 };
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
