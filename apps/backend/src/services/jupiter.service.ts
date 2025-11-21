/**
 * Jupiter Limit Order Service
 * Integration with Jupiter V6 for limit orders on NFTs
 *
 * Docs: https://station.jup.ag/docs/limit-order
 */

import logger from '../utils/logger';

const JUPITER_API_BASE = 'https://jup.ag/api';
const JUPITER_PRICE_API = 'https://price.jup.ag/v6';
const JUPITER_LIMIT_ORDER_API = 'https://jup.ag/api/limit/v1';

// SOL mint address
const SOL_MINT = 'So11111111111111111111111111111111111111112';
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

export interface TokenPrice {
  id: string;
  mintSymbol: string;
  vsToken: string;
  vsTokenSymbol: string;
  price: number;
  timestamp: number;
}

export interface LimitOrderParams {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  expiredAt?: number;
  maker: string;
}

export interface LimitOrder {
  id: string;
  maker: string;
  inputMint: string;
  outputMint: string;
  makingAmount: string;
  takingAmount: string;
  expiredAt: number | null;
  createdAt: number;
  status: 'open' | 'filled' | 'cancelled' | 'expired';
}

export interface CreateOrderResponse {
  tx: string;
  orderId: string;
}

class JupiterService {
  /**
   * Get token price in SOL or USDC
   */
  async getPrice(tokenMint: string, vsMint: string = SOL_MINT): Promise<TokenPrice | null> {
    try {
      const response = await fetch(
        `${JUPITER_PRICE_API}/price?ids=${tokenMint}&vsToken=${vsMint}`
      );

      if (!response.ok) {
        logger.warn(`Jupiter price API error: ${response.status}`);
        return null;
      }

      const data = await response.json();
      const priceData = data.data?.[tokenMint];

      if (!priceData) {
        return null;
      }

      return {
        id: tokenMint,
        mintSymbol: priceData.mintSymbol || 'Unknown',
        vsToken: vsMint,
        vsTokenSymbol: vsMint === SOL_MINT ? 'SOL' : 'USDC',
        price: priceData.price || 0,
        timestamp: Date.now(),
      };
    } catch (error) {
      logger.error('Error fetching Jupiter price:', error);
      return null;
    }
  }

  /**
   * Get multiple token prices
   */
  async getPrices(tokenMints: string[], vsMint: string = SOL_MINT): Promise<Map<string, TokenPrice>> {
    const prices = new Map<string, TokenPrice>();

    try {
      const ids = tokenMints.join(',');
      const response = await fetch(
        `${JUPITER_PRICE_API}/price?ids=${ids}&vsToken=${vsMint}`
      );

      if (!response.ok) {
        return prices;
      }

      const data = await response.json();

      for (const [mint, priceData] of Object.entries(data.data || {})) {
        const pd = priceData as any;
        prices.set(mint, {
          id: mint,
          mintSymbol: pd.mintSymbol || 'Unknown',
          vsToken: vsMint,
          vsTokenSymbol: vsMint === SOL_MINT ? 'SOL' : 'USDC',
          price: pd.price || 0,
          timestamp: Date.now(),
        });
      }
    } catch (error) {
      logger.error('Error fetching Jupiter prices:', error);
    }

    return prices;
  }

  /**
   * Create a limit order transaction
   * Returns serialized transaction for client to sign
   */
  async createLimitOrder(params: LimitOrderParams): Promise<CreateOrderResponse | null> {
    try {
      const response = await fetch(`${JUPITER_LIMIT_ORDER_API}/createOrder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          owner: params.maker,
          inAmount: params.inAmount,
          outAmount: params.outAmount,
          inputMint: params.inputMint,
          outputMint: params.outputMint,
          expiredAt: params.expiredAt || null,
          base: params.inputMint, // Use input as base
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.warn(`Jupiter createOrder failed: ${response.status} - ${errorText}`);
        return null;
      }

      const data = await response.json();

      return {
        tx: data.tx,
        orderId: data.order || data.orderId || 'pending',
      };
    } catch (error) {
      logger.error('Error creating Jupiter limit order:', error);
      return null;
    }
  }

  /**
   * Cancel a limit order
   */
  async cancelOrder(orderId: string, maker: string): Promise<{ tx: string } | null> {
    try {
      const response = await fetch(`${JUPITER_LIMIT_ORDER_API}/cancelOrder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          owner: maker,
          orderPubkey: orderId,
        }),
      });

      if (!response.ok) {
        logger.warn(`Jupiter cancelOrder failed: ${response.status}`);
        return null;
      }

      const data = await response.json();
      return { tx: data.tx };
    } catch (error) {
      logger.error('Error cancelling Jupiter order:', error);
      return null;
    }
  }

  /**
   * Get open orders for a wallet
   */
  async getOpenOrders(wallet: string): Promise<LimitOrder[]> {
    try {
      const response = await fetch(
        `${JUPITER_LIMIT_ORDER_API}/openOrders?wallet=${wallet}`
      );

      if (!response.ok) {
        return [];
      }

      const data = await response.json();

      return (data.orders || data || []).map((order: any) => ({
        id: order.publicKey || order.id,
        maker: order.maker || wallet,
        inputMint: order.inputMint || order.inMint,
        outputMint: order.outputMint || order.outMint,
        makingAmount: order.makingAmount || order.inAmount,
        takingAmount: order.takingAmount || order.outAmount,
        expiredAt: order.expiredAt,
        createdAt: order.createdAt || Date.now(),
        status: 'open' as const,
      }));
    } catch (error) {
      logger.error('Error fetching Jupiter open orders:', error);
      return [];
    }
  }

  /**
   * Get order history for a wallet
   */
  async getOrderHistory(wallet: string, limit: number = 50): Promise<LimitOrder[]> {
    try {
      const response = await fetch(
        `${JUPITER_LIMIT_ORDER_API}/orderHistory?wallet=${wallet}&limit=${limit}`
      );

      if (!response.ok) {
        return [];
      }

      const data = await response.json();

      return (data.orders || data || []).map((order: any) => ({
        id: order.publicKey || order.id,
        maker: order.maker || wallet,
        inputMint: order.inputMint || order.inMint,
        outputMint: order.outputMint || order.outMint,
        makingAmount: order.makingAmount || order.inAmount,
        takingAmount: order.takingAmount || order.outAmount,
        expiredAt: order.expiredAt,
        createdAt: order.createdAt || Date.now(),
        status: order.status || 'filled',
      }));
    } catch (error) {
      logger.error('Error fetching Jupiter order history:', error);
      return [];
    }
  }

  /**
   * Calculate limit order price for NFT floor target
   * Helper for "buy when floor drops to X" feature
   */
  calculateNftFloorOrder(
    currentFloorSol: number,
    targetFloorSol: number,
    amountSol: number
  ): {
    inputAmount: string;
    outputAmount: string;
    priceDrop: number;
    priceDropPercent: number;
  } {
    const priceDrop = currentFloorSol - targetFloorSol;
    const priceDropPercent = (priceDrop / currentFloorSol) * 100;

    // Convert SOL to lamports
    const inputLamports = Math.floor(amountSol * 1e9);

    // Calculate how many NFTs you could buy at target price
    const nftCount = Math.floor(amountSol / targetFloorSol);
    const outputLamports = Math.floor(nftCount * targetFloorSol * 1e9);

    return {
      inputAmount: inputLamports.toString(),
      outputAmount: outputLamports.toString(),
      priceDrop,
      priceDropPercent,
    };
  }

  /**
   * Get Jupiter swap quote (for reference pricing)
   */
  async getSwapQuote(
    inputMint: string,
    outputMint: string,
    amount: string,
    slippageBps: number = 50
  ): Promise<any | null> {
    try {
      const response = await fetch(
        `https://quote-api.jup.ag/v6/quote?` +
          `inputMint=${inputMint}&` +
          `outputMint=${outputMint}&` +
          `amount=${amount}&` +
          `slippageBps=${slippageBps}`
      );

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      logger.error('Error fetching Jupiter swap quote:', error);
      return null;
    }
  }
}

// Singleton instance
let jupiterService: JupiterService;

export function getJupiterService(): JupiterService {
  if (!jupiterService) {
    jupiterService = new JupiterService();
  }
  return jupiterService;
}

export { JupiterService, SOL_MINT, USDC_MINT };
export default getJupiterService;
