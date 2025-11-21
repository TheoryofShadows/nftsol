/**
 * Jupiter Limit Order Routes
 * Integration with Jupiter V6 for limit orders
 */

import { Router } from 'express';
import { getJupiterService, SOL_MINT, USDC_MINT } from '../services/jupiter.service';
import logger from '../utils/logger';

const router = Router();

/**
 * GET /api/jupiter/price/:token
 * Get token price
 */
router.get('/price/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const vsMint = (req.query.vs as string) || SOL_MINT;

    const jupiterService = getJupiterService();
    const price = await jupiterService.getPrice(token, vsMint);

    if (!price) {
      return res.status(404).json({
        success: false,
        error: 'Price not found',
        code: 'NOT_FOUND',
      });
    }

    res.json({ success: true, data: price });
  } catch (error) {
    logger.error('Error fetching Jupiter price:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch price' });
  }
});

/**
 * POST /api/jupiter/prices
 * Get multiple token prices
 */
router.post('/prices', async (req, res) => {
  try {
    const { tokens, vsMint } = req.body;

    if (!Array.isArray(tokens) || tokens.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'tokens array is required',
      });
    }

    const jupiterService = getJupiterService();
    const prices = await jupiterService.getPrices(tokens, vsMint || SOL_MINT);

    res.json({
      success: true,
      data: Object.fromEntries(prices),
    });
  } catch (error) {
    logger.error('Error fetching Jupiter prices:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch prices' });
  }
});

/**
 * POST /api/jupiter/limit-order/create
 * Create a limit order transaction
 */
router.post('/limit-order/create', async (req, res) => {
  try {
    const { inputMint, outputMint, inAmount, outAmount, expiredAt, maker } = req.body;

    if (!inputMint || !outputMint || !inAmount || !outAmount || !maker) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: inputMint, outputMint, inAmount, outAmount, maker',
      });
    }

    const jupiterService = getJupiterService();
    const result = await jupiterService.createLimitOrder({
      inputMint,
      outputMint,
      inAmount,
      outAmount,
      expiredAt,
      maker,
    });

    if (!result) {
      return res.status(400).json({
        success: false,
        error: 'Failed to create limit order',
        code: 'ORDER_CREATION_FAILED',
      });
    }

    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Error creating limit order:', error);
    res.status(500).json({ success: false, error: 'Failed to create order' });
  }
});

/**
 * POST /api/jupiter/limit-order/cancel
 * Cancel a limit order
 */
router.post('/limit-order/cancel', async (req, res) => {
  try {
    const { orderId, maker } = req.body;

    if (!orderId || !maker) {
      return res.status(400).json({
        success: false,
        error: 'orderId and maker are required',
      });
    }

    const jupiterService = getJupiterService();
    const result = await jupiterService.cancelOrder(orderId, maker);

    if (!result) {
      return res.status(400).json({
        success: false,
        error: 'Failed to cancel order',
      });
    }

    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Error cancelling order:', error);
    res.status(500).json({ success: false, error: 'Failed to cancel order' });
  }
});

/**
 * GET /api/jupiter/limit-order/open/:wallet
 * Get open orders for a wallet
 */
router.get('/limit-order/open/:wallet', async (req, res) => {
  try {
    const { wallet } = req.params;

    const jupiterService = getJupiterService();
    const orders = await jupiterService.getOpenOrders(wallet);

    res.json({ success: true, data: orders, total: orders.length });
  } catch (error) {
    logger.error('Error fetching open orders:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch orders' });
  }
});

/**
 * GET /api/jupiter/limit-order/history/:wallet
 * Get order history for a wallet
 */
router.get('/limit-order/history/:wallet', async (req, res) => {
  try {
    const { wallet } = req.params;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

    const jupiterService = getJupiterService();
    const orders = await jupiterService.getOrderHistory(wallet, limit);

    res.json({ success: true, data: orders, total: orders.length });
  } catch (error) {
    logger.error('Error fetching order history:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch history' });
  }
});

/**
 * POST /api/jupiter/quote
 * Get swap quote
 */
router.post('/quote', async (req, res) => {
  try {
    const { inputMint, outputMint, amount, slippageBps } = req.body;

    if (!inputMint || !outputMint || !amount) {
      return res.status(400).json({
        success: false,
        error: 'inputMint, outputMint, and amount are required',
      });
    }

    const jupiterService = getJupiterService();
    const quote = await jupiterService.getSwapQuote(inputMint, outputMint, amount, slippageBps);

    if (!quote) {
      return res.status(404).json({
        success: false,
        error: 'No quote available',
      });
    }

    res.json({ success: true, data: quote });
  } catch (error) {
    logger.error('Error fetching quote:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch quote' });
  }
});

/**
 * GET /api/jupiter/constants
 * Get useful constants (SOL mint, USDC mint, etc.)
 */
router.get('/constants', (req, res) => {
  res.json({
    success: true,
    data: {
      SOL_MINT,
      USDC_MINT,
    },
  });
});

export default router;
