/**
 * Email Service
 * Centralized email service for notifications
 */

import { envConfig } from '../config/environment';
import { logger } from '../utils/logger';

export interface EmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  from?: string;
}

export class EmailService {
  private apiKey: string | null = null;
  private enabled: boolean = false;

  constructor() {
    // Initialize email service based on provider
    this.apiKey = process.env.EMAIL_API_KEY || process.env.RESEND_API_KEY || null;
    this.enabled = !!this.apiKey && envConfig.isProduction;
  }

  /**
   * Send email
   */
  async send(options: EmailOptions): Promise<boolean> {
    if (!this.enabled) {
      logger.warn('Email service not enabled', { to: options.to });
      return false;
    }

    try {
      // Use Resend API (recommended)
      if (process.env.RESEND_API_KEY) {
        return await this.sendViaResend(options);
      }

      // Fallback to other providers
      logger.warn('No email provider configured');
      return false;
    } catch (error) {
      logger.error('Failed to send email', error, { to: options.to });
      return false;
    }
  }

  /**
   * Send via Resend API
   */
  private async sendViaResend(options: EmailOptions): Promise<boolean> {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: options.from || process.env.EMAIL_FROM || 'NFTSol <noreply@nftsol.com>',
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      }),
    });

    if (!response.ok) {
      throw new Error(`Resend API error: ${response.statusText}`);
    }

    logger.info('Email sent', { to: options.to, subject: options.subject });
    return true;
  }

  /**
   * Send transaction confirmation
   */
  async sendTransactionConfirmation(
    to: string,
    transaction: {
      type: string;
      amount: string;
      txHash: string;
      nftName?: string;
    }
  ): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Transaction Confirmed</h2>
        <p>Your ${transaction.type} transaction has been confirmed on Solana.</p>
        <ul>
          <li><strong>Type:</strong> ${transaction.type}</li>
          <li><strong>Amount:</strong> ${transaction.amount} SOL</li>
          ${transaction.nftName ? `<li><strong>NFT:</strong> ${transaction.nftName}</li>` : ''}
          <li><strong>Transaction:</strong> <a href="https://solscan.io/tx/${transaction.txHash}">View on Solscan</a></li>
        </ul>
      </div>
    `;

    return this.send({
      to,
      subject: `Transaction Confirmed: ${transaction.type}`,
      html,
    });
  }

  /**
   * Send price alert
   */
  async sendPriceAlert(
    to: string,
    alert: {
      nftName: string;
      currentPrice: string;
      targetPrice: string;
      direction: 'above' | 'below';
    }
  ): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>💰 Price Alert Triggered</h2>
        <p>The price of <strong>${alert.nftName}</strong> has ${alert.direction === 'above' ? 'risen above' : 'fallen below'} your target.</p>
        <ul>
          <li><strong>Current Price:</strong> ${alert.currentPrice} SOL</li>
          <li><strong>Target Price:</strong> ${alert.targetPrice} SOL</li>
        </ul>
        <p><a href="${process.env.FRONTEND_URL || 'https://nftsolmarket.netlify.app'}">View NFT</a></p>
      </div>
    `;

    return this.send({
      to,
      subject: `Price Alert: ${alert.nftName}`,
      html,
    });
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(
    to: string,
    username: string
  ): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to NFTSol! 🎉</h2>
        <p>Hi ${username},</p>
        <p>Welcome to the future of NFT marketplaces. You're now part of the Solana NFT revolution!</p>
        <p>Get started by:</p>
        <ul>
          <li>🎨 Minting your first NFT</li>
          <li>🏪 Exploring the marketplace</li>
          <li>⭐ Earning CLOUT tokens</li>
        </ul>
        <p><a href="${process.env.FRONTEND_URL || 'https://nftsolmarket.netlify.app'}">Start Exploring</a></p>
      </div>
    `;

    return this.send({
      to,
      subject: 'Welcome to NFTSol!',
      html,
    });
  }
}

export const emailService = new EmailService();

