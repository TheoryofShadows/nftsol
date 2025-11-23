/**
 * Push Protocol Service
 * Web3 native push notifications for NFT alerts
 *
 * Supports: Floor price alerts, outbid notifications, whale movements, collection pumps
 */

import logger from '../utils/logger';
import { pool } from '../lib/db';

// Push Protocol configuration
const PUSH_API_BASE = 'https://backend.push.org/apis';
const PUSH_CHANNEL = process.env.PUSH_CHANNEL_ADDRESS || '';

export type AlertType =
  | 'floor_drop'
  | 'floor_pump'
  | 'outbid'
  | 'whale_buy'
  | 'whale_sell'
  | 'collection_pump'
  | 'listing_sold'
  | 'bid_accepted'
  | 'new_listing';

export interface AlertSubscription {
  id: string;
  wallet: string;
  alertType: AlertType;
  collection?: string;
  targetPrice?: number;
  threshold?: number; // Percentage threshold for pumps/drops
  isActive: boolean;
  createdAt: number;
}

export interface PushNotification {
  title: string;
  body: string;
  cta?: string; // Call to action URL
  img?: string;
  type: AlertType;
  data?: Record<string, any>;
}

// In-memory store for quick access (backed by DB)
const subscriptionCache = new Map<string, AlertSubscription[]>();

class PushProtocolService {
  private channelKey: string | null;
  private initialized: boolean = false;

  constructor() {
    this.channelKey = process.env.PUSH_CHANNEL_PRIVATE_KEY || null;
  }

  /**
   * Initialize database tables
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS alert_subscriptions (
          id VARCHAR(36) PRIMARY KEY,
          wallet VARCHAR(44) NOT NULL,
          alert_type VARCHAR(30) NOT NULL,
          collection VARCHAR(100),
          target_price DECIMAL(20, 9),
          threshold DECIMAL(10, 4),
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_alert_subs_wallet
        ON alert_subscriptions(wallet)
      `);

      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_alert_subs_type
        ON alert_subscriptions(alert_type, is_active)
      `);

      // Notification history table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS notification_history (
          id SERIAL PRIMARY KEY,
          wallet VARCHAR(44) NOT NULL,
          alert_type VARCHAR(30) NOT NULL,
          title VARCHAR(200),
          body TEXT,
          sent_at TIMESTAMP DEFAULT NOW(),
          delivered BOOLEAN DEFAULT false
        )
      `);

      this.initialized = true;
      logger.info('Push Protocol tables initialized');
    } catch (error) {
      logger.error('Error initializing Push Protocol tables:', error);
    }
  }

  /**
   * Subscribe to alerts
   */
  async subscribe(
    wallet: string,
    alertType: AlertType,
    options: {
      collection?: string;
      targetPrice?: number;
      threshold?: number;
    } = {}
  ): Promise<AlertSubscription | null> {
    await this.initialize();

    try {
      const id = `${wallet}-${alertType}-${options.collection || 'all'}-${Date.now()}`.slice(0, 36);

      const subscription: AlertSubscription = {
        id,
        wallet,
        alertType,
        collection: options.collection,
        targetPrice: options.targetPrice,
        threshold: options.threshold || 10, // Default 10%
        isActive: true,
        createdAt: Date.now(),
      };

      await pool.query(
        `INSERT INTO alert_subscriptions (id, wallet, alert_type, collection, target_price, threshold)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, wallet, alertType, options.collection, options.targetPrice, options.threshold || 10]
      );

      // Update cache
      const cached = subscriptionCache.get(wallet) || [];
      cached.push(subscription);
      subscriptionCache.set(wallet, cached);

      logger.info(`Alert subscription created: ${alertType} for ${wallet}`);
      return subscription;
    } catch (error) {
      logger.error('Error creating alert subscription:', error);
      return null;
    }
  }

  /**
   * Unsubscribe from alerts
   */
  async unsubscribe(subscriptionId: string): Promise<boolean> {
    try {
      const result = await pool.query(
        `UPDATE alert_subscriptions SET is_active = false, updated_at = NOW()
         WHERE id = $1 RETURNING wallet`,
        [subscriptionId]
      );

      if (result.rows.length > 0) {
        // Update cache
        const wallet = result.rows[0].wallet;
        const cached = subscriptionCache.get(wallet) || [];
        const updated = cached.filter((s) => s.id !== subscriptionId);
        subscriptionCache.set(wallet, updated);
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Error unsubscribing:', error);
      return false;
    }
  }

  /**
   * Get user's subscriptions
   */
  async getSubscriptions(wallet: string): Promise<AlertSubscription[]> {
    await this.initialize();

    try {
      // Check cache
      if (subscriptionCache.has(wallet)) {
        return subscriptionCache.get(wallet)!;
      }

      const result = await pool.query(
        `SELECT * FROM alert_subscriptions WHERE wallet = $1 AND is_active = true`,
        [wallet]
      );

      const subscriptions: AlertSubscription[] = result.rows.map((row) => ({
        id: row.id,
        wallet: row.wallet,
        alertType: row.alert_type as AlertType,
        collection: row.collection,
        targetPrice: row.target_price ? parseFloat(row.target_price) : undefined,
        threshold: row.threshold ? parseFloat(row.threshold) : undefined,
        isActive: row.is_active,
        createdAt: new Date(row.created_at).getTime(),
      }));

      subscriptionCache.set(wallet, subscriptions);
      return subscriptions;
    } catch (error) {
      logger.error('Error getting subscriptions:', error);
      return [];
    }
  }

  /**
   * Send push notification via Push Protocol
   */
  async sendNotification(wallet: string, notification: PushNotification): Promise<boolean> {
    await this.initialize();

    try {
      // Store in history
      await pool.query(
        `INSERT INTO notification_history (wallet, alert_type, title, body)
         VALUES ($1, $2, $3, $4)`,
        [wallet, notification.type, notification.title, notification.body]
      );

      // If Push Protocol is not configured, just log
      if (!this.channelKey || !PUSH_CHANNEL) {
        logger.info(`[Mock Push] To ${wallet}: ${notification.title}`);
        return true;
      }

      // Send via Push Protocol API
      // Note: In production, you'd use @pushprotocol/restapi SDK
      const payload = {
        channel: PUSH_CHANNEL,
        recipients: [wallet],
        notification: {
          title: notification.title,
          body: notification.body,
        },
        payload: {
          title: notification.title,
          body: notification.body,
          cta: notification.cta || '',
          img: notification.img || '',
          additionalMeta: notification.data,
        },
      };

      const response = await fetch(`${PUSH_API_BASE}/v1/payloads/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.channelKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        logger.warn(`Push notification failed: ${response.status}`);
        return false;
      }

      // Mark as delivered
      await pool.query(
        `UPDATE notification_history SET delivered = true
         WHERE wallet = $1 ORDER BY sent_at DESC LIMIT 1`,
        [wallet]
      );

      return true;
    } catch (error) {
      logger.error('Error sending push notification:', error);
      return false;
    }
  }

  /**
   * Trigger floor drop alert for matching subscriptions
   */
  async triggerFloorDropAlert(
    collection: string,
    currentFloor: number,
    previousFloor: number
  ): Promise<number> {
    const dropPercent = ((previousFloor - currentFloor) / previousFloor) * 100;
    let notified = 0;

    try {
      // Find matching subscriptions
      const result = await pool.query(
        `SELECT DISTINCT wallet FROM alert_subscriptions
         WHERE alert_type = 'floor_drop' AND is_active = true
         AND (collection = $1 OR collection IS NULL)
         AND (threshold IS NULL OR threshold <= $2)`,
        [collection, dropPercent]
      );

      for (const row of result.rows) {
        const sent = await this.sendNotification(row.wallet, {
          title: `Floor Drop Alert: ${collection}`,
          body: `Floor price dropped ${dropPercent.toFixed(1)}% to ${currentFloor.toFixed(2)} SOL`,
          type: 'floor_drop',
          cta: `https://nftsol.app/collection/${collection}`,
          data: { collection, currentFloor, previousFloor, dropPercent },
        });
        if (sent) notified++;
      }
    } catch (error) {
      logger.error('Error triggering floor drop alerts:', error);
    }

    return notified;
  }

  /**
   * Trigger whale activity alert
   */
  async triggerWhaleAlert(
    type: 'whale_buy' | 'whale_sell',
    wallet: string,
    collection: string,
    amount: number,
    nftCount: number
  ): Promise<number> {
    let notified = 0;

    try {
      const result = await pool.query(
        `SELECT DISTINCT wallet FROM alert_subscriptions
         WHERE alert_type = $1 AND is_active = true
         AND (collection = $2 OR collection IS NULL)`,
        [type, collection]
      );

      const action = type === 'whale_buy' ? 'bought' : 'sold';
      const shortWallet = `${wallet.slice(0, 4)}...${wallet.slice(-4)}`;

      for (const row of result.rows) {
        const sent = await this.sendNotification(row.wallet, {
          title: `Whale ${type === 'whale_buy' ? 'Buy' : 'Sell'} Alert`,
          body: `${shortWallet} ${action} ${nftCount} NFT(s) from ${collection} for ${amount.toFixed(2)} SOL`,
          type,
          cta: `https://nftsol.app/collection/${collection}`,
          data: { whaleWallet: wallet, collection, amount, nftCount },
        });
        if (sent) notified++;
      }
    } catch (error) {
      logger.error('Error triggering whale alerts:', error);
    }

    return notified;
  }

  /**
   * Trigger outbid notification
   */
  async triggerOutbidAlert(
    wallet: string,
    collection: string,
    nftName: string,
    newBidAmount: number
  ): Promise<boolean> {
    return this.sendNotification(wallet, {
      title: 'You have been outbid!',
      body: `Someone outbid you on ${nftName} with ${newBidAmount.toFixed(2)} SOL`,
      type: 'outbid',
      cta: `https://nftsol.app/collection/${collection}`,
      data: { collection, nftName, newBidAmount },
    });
  }

  /**
   * Trigger price target alert
   */
  async triggerPriceTargetAlert(
    collection: string,
    currentFloor: number
  ): Promise<number> {
    let notified = 0;

    try {
      const result = await pool.query(
        `SELECT wallet, target_price FROM alert_subscriptions
         WHERE alert_type IN ('floor_drop', 'floor_pump') AND is_active = true
         AND collection = $1
         AND target_price IS NOT NULL
         AND target_price >= $2`,
        [collection, currentFloor]
      );

      for (const row of result.rows) {
        const sent = await this.sendNotification(row.wallet, {
          title: 'Price Target Reached!',
          body: `${collection} floor hit your target of ${parseFloat(row.target_price).toFixed(2)} SOL (now ${currentFloor.toFixed(2)} SOL)`,
          type: 'floor_drop',
          cta: `https://nftsol.app/collection/${collection}`,
          data: { collection, currentFloor, targetPrice: parseFloat(row.target_price) },
        });

        // Deactivate one-time alerts
        if (sent) {
          notified++;
          await this.unsubscribe(row.id);
        }
      }
    } catch (error) {
      logger.error('Error triggering price target alerts:', error);
    }

    return notified;
  }

  /**
   * Get notification history for wallet
   */
  async getNotificationHistory(wallet: string, limit: number = 50): Promise<any[]> {
    try {
      const result = await pool.query(
        `SELECT * FROM notification_history
         WHERE wallet = $1
         ORDER BY sent_at DESC
         LIMIT $2`,
        [wallet, limit]
      );

      return result.rows.map((row) => ({
        id: row.id,
        type: row.alert_type,
        title: row.title,
        body: row.body,
        sentAt: new Date(row.sent_at).getTime(),
        delivered: row.delivered,
      }));
    } catch (error) {
      logger.error('Error getting notification history:', error);
      return [];
    }
  }

  /**
   * Get available alert types with descriptions
   */
  getAlertTypes(): Array<{ type: AlertType; name: string; description: string }> {
    return [
      { type: 'floor_drop', name: 'Floor Drop', description: 'Alert when collection floor drops by X%' },
      { type: 'floor_pump', name: 'Floor Pump', description: 'Alert when collection floor increases by X%' },
      { type: 'outbid', name: 'Outbid', description: 'Alert when you are outbid on an NFT' },
      { type: 'whale_buy', name: 'Whale Buy', description: 'Alert when a whale buys from a collection' },
      { type: 'whale_sell', name: 'Whale Sell', description: 'Alert when a whale sells from a collection' },
      { type: 'collection_pump', name: 'Collection Pump', description: 'Alert when collection volume spikes' },
      { type: 'listing_sold', name: 'Listing Sold', description: 'Alert when your listing sells' },
      { type: 'bid_accepted', name: 'Bid Accepted', description: 'Alert when your bid is accepted' },
      { type: 'new_listing', name: 'New Listing', description: 'Alert for new listings in a collection' },
    ];
  }
}

// Singleton instance
let pushService: PushProtocolService;

export function getPushService(): PushProtocolService {
  if (!pushService) {
    pushService = new PushProtocolService();
  }
  return pushService;
}

export { PushProtocolService };
export default getPushService;
