/**
 * Alert Routes
 * Push notification alerts for NFT events
 */

import { Router } from 'express';
import { getPushService, AlertType } from '../services/push-protocol.service';
import logger from '../utils/logger';

const router = Router();

/**
 * GET /api/alerts/types
 * Get available alert types
 */
router.get('/types', (req, res) => {
  try {
    const pushService = getPushService();
    const types = pushService.getAlertTypes();

    res.json({
      success: true,
      data: types,
    });
  } catch (error) {
    logger.error('Error fetching alert types:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch alert types',
    });
  }
});

/**
 * GET /api/alerts/subscriptions/:wallet
 * Get user's alert subscriptions
 */
router.get('/subscriptions/:wallet', async (req, res) => {
  try {
    const { wallet } = req.params;

    if (!wallet || wallet.length < 32 || wallet.length > 44) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address',
        code: 'INVALID_ADDRESS',
      });
    }

    const pushService = getPushService();
    const subscriptions = await pushService.getSubscriptions(wallet);

    res.json({
      success: true,
      data: subscriptions,
      total: subscriptions.length,
    });
  } catch (error) {
    logger.error('Error fetching subscriptions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch subscriptions',
    });
  }
});

/**
 * POST /api/alerts/subscribe
 * Subscribe to an alert
 */
router.post('/subscribe', async (req, res) => {
  try {
    const { wallet, alertType, collection, targetPrice, threshold } = req.body;

    if (!wallet || wallet.length < 32 || wallet.length > 44) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address',
        code: 'INVALID_ADDRESS',
      });
    }

    const validTypes: AlertType[] = [
      'floor_drop',
      'floor_pump',
      'outbid',
      'whale_buy',
      'whale_sell',
      'collection_pump',
      'listing_sold',
      'bid_accepted',
      'new_listing',
    ];

    if (!alertType || !validTypes.includes(alertType as AlertType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid alert type',
        code: 'INVALID_ALERT_TYPE',
      });
    }

    const pushService = getPushService();
    const subscription = await pushService.subscribe(wallet, alertType as AlertType, {
      collection,
      targetPrice: targetPrice ? parseFloat(targetPrice) : undefined,
      threshold: threshold ? parseFloat(threshold) : undefined,
    });

    if (!subscription) {
      return res.status(500).json({
        success: false,
        error: 'Failed to create subscription',
        code: 'SUBSCRIPTION_FAILED',
      });
    }

    res.json({
      success: true,
      data: subscription,
      message: 'Alert subscription created successfully',
    });
  } catch (error) {
    logger.error('Error creating subscription:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create subscription',
    });
  }
});

/**
 * DELETE /api/alerts/unsubscribe/:subscriptionId
 * Unsubscribe from an alert
 */
router.delete('/unsubscribe/:subscriptionId', async (req, res) => {
  try {
    const { subscriptionId } = req.params;

    if (!subscriptionId) {
      return res.status(400).json({
        success: false,
        error: 'Subscription ID is required',
        code: 'MISSING_ID',
      });
    }

    const pushService = getPushService();
    const success = await pushService.unsubscribe(subscriptionId);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Subscription not found',
        code: 'NOT_FOUND',
      });
    }

    res.json({
      success: true,
      message: 'Unsubscribed successfully',
    });
  } catch (error) {
    logger.error('Error unsubscribing:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unsubscribe',
    });
  }
});

/**
 * GET /api/alerts/history/:wallet
 * Get notification history
 */
router.get('/history/:wallet', async (req, res) => {
  try {
    const { wallet } = req.params;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

    if (!wallet || wallet.length < 32 || wallet.length > 44) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address',
        code: 'INVALID_ADDRESS',
      });
    }

    const pushService = getPushService();
    const history = await pushService.getNotificationHistory(wallet, limit);

    res.json({
      success: true,
      data: history,
      total: history.length,
    });
  } catch (error) {
    logger.error('Error fetching notification history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch history',
    });
  }
});

/**
 * POST /api/alerts/test
 * Send a test notification (for development)
 */
router.post('/test', async (req, res) => {
  try {
    const { wallet, message } = req.body;

    if (!wallet) {
      return res.status(400).json({
        success: false,
        error: 'Wallet address is required',
      });
    }

    const pushService = getPushService();
    const sent = await pushService.sendNotification(wallet, {
      title: 'Test Notification',
      body: message || 'This is a test notification from NFTSol',
      type: 'floor_drop',
      cta: 'https://nftsol.app',
    });

    res.json({
      success: true,
      data: { sent },
      message: sent ? 'Test notification sent' : 'Notification queued (Push Protocol not configured)',
    });
  } catch (error) {
    logger.error('Error sending test notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send test notification',
    });
  }
});

export default router;
