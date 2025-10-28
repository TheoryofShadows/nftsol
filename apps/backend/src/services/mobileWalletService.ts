import { Connection, PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';

// Mobile wallet adapter interface
export interface MobileWalletAdapter {
  // Basic wallet properties
  publicKey: PublicKey | null;
  connected: boolean;
  
  // Mobile-specific methods
  connectMobile(): Promise<void>;
  disconnectMobile(): Promise<void>;
  signTransactionMobile(transaction: Transaction): Promise<Transaction>;
  signAllTransactionsMobile(transactions: Transaction[]): Promise<Transaction[]>;
  signMessageMobile(message: Uint8Array): Promise<Uint8Array>;
  requestAirdropMobile(publicKey: PublicKey, amount: number): Promise<string>;
}

// Mobile wallet service for handling mobile-specific functionality
export class MobileWalletService {
  private connection: Connection;
  private mobileWalletAdapter: MobileWalletAdapter | null = null;
  private pushNotificationService: PushNotificationService | null = null;

  constructor(connection: Connection) {
    this.connection = connection;
    this.initializeMobileServices();
  }

  private async initializeMobileServices() {
    try {
      // Initialize push notification service
      this.pushNotificationService = new PushNotificationService();
      
      console.log('✅ Mobile wallet service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize mobile wallet service:', error);
    }
  }

  /**
   * Connect to mobile wallet
   */
  async connectMobileWallet(): Promise<{ publicKey: PublicKey; signature: string }> {
    try {
      console.log('📱 Connecting to mobile wallet...');

      if (!this.mobileWalletAdapter) {
        throw new Error('Mobile wallet adapter not available');
      }

      await this.mobileWalletAdapter.connectMobile();

      if (!this.mobileWalletAdapter.publicKey) {
        throw new Error('Failed to get public key from mobile wallet');
      }

      // Send push notification
      await this.pushNotificationService?.sendNotification({
        title: 'Wallet Connected',
        body: `Successfully connected to mobile wallet: ${this.mobileWalletAdapter.publicKey.toString().slice(0, 8)}...`,
        data: {
          type: 'wallet_connected',
          publicKey: this.mobileWalletAdapter.publicKey.toString()
        }
      });

      return {
        publicKey: this.mobileWalletAdapter.publicKey,
        signature: 'mobile_connection_signature'
      };

    } catch (error) {
      console.error('❌ Failed to connect mobile wallet:', error);
      throw error;
    }
  }

  /**
   * Disconnect from mobile wallet
   */
  async disconnectMobileWallet(): Promise<void> {
    try {
      console.log('📱 Disconnecting from mobile wallet...');

      if (!this.mobileWalletAdapter) {
        throw new Error('Mobile wallet adapter not available');
      }

      await this.mobileWalletAdapter.disconnectMobile();

      // Send push notification
      await this.pushNotificationService?.sendNotification({
        title: 'Wallet Disconnected',
        body: 'Successfully disconnected from mobile wallet',
        data: {
          type: 'wallet_disconnected'
        }
      });

    } catch (error) {
      console.error('❌ Failed to disconnect mobile wallet:', error);
      throw error;
    }
  }

  /**
   * Sign transaction on mobile
   */
  async signTransactionMobile(transaction: Transaction): Promise<Transaction> {
    try {
      console.log('📱 Signing transaction on mobile...');

      if (!this.mobileWalletAdapter) {
        throw new Error('Mobile wallet adapter not available');
      }

      const signedTransaction = await this.mobileWalletAdapter.signTransactionMobile(transaction);

      // Send push notification
      await this.pushNotificationService?.sendNotification({
        title: 'Transaction Signed',
        body: 'Transaction successfully signed on mobile wallet',
        data: {
          type: 'transaction_signed',
          signature: signedTransaction.signature?.toString()
        }
      });

      return signedTransaction;

    } catch (error) {
      console.error('❌ Failed to sign transaction on mobile:', error);
      throw error;
    }
  }

  /**
   * Sign multiple transactions on mobile
   */
  async signAllTransactionsMobile(transactions: Transaction[]): Promise<Transaction[]> {
    try {
      console.log(`📱 Signing ${transactions.length} transactions on mobile...`);

      if (!this.mobileWalletAdapter) {
        throw new Error('Mobile wallet adapter not available');
      }

      const signedTransactions = await this.mobileWalletAdapter.signAllTransactionsMobile(transactions);

      // Send push notification
      await this.pushNotificationService?.sendNotification({
        title: 'Transactions Signed',
        body: `Successfully signed ${transactions.length} transactions on mobile wallet`,
        data: {
          type: 'transactions_signed',
          count: transactions.length
        }
      });

      return signedTransactions;

    } catch (error) {
      console.error('❌ Failed to sign transactions on mobile:', error);
      throw error;
    }
  }

  /**
   * Sign message on mobile
   */
  async signMessageMobile(message: Uint8Array): Promise<Uint8Array> {
    try {
      console.log('📱 Signing message on mobile...');

      if (!this.mobileWalletAdapter) {
        throw new Error('Mobile wallet adapter not available');
      }

      const signedMessage = await this.mobileWalletAdapter.signMessageMobile(message);

      // Send push notification
      await this.pushNotificationService?.sendNotification({
        title: 'Message Signed',
        body: 'Message successfully signed on mobile wallet',
        data: {
          type: 'message_signed'
        }
      });

      return signedMessage;

    } catch (error) {
      console.error('❌ Failed to sign message on mobile:', error);
      throw error;
    }
  }

  /**
   * Request airdrop on mobile
   */
  async requestAirdropMobile(publicKey: PublicKey, amount: number): Promise<string> {
    try {
      console.log(`📱 Requesting ${amount} SOL airdrop on mobile...`);

      if (!this.mobileWalletAdapter) {
        throw new Error('Mobile wallet adapter not available');
      }

      const signature = await this.mobileWalletAdapter.requestAirdropMobile(publicKey, amount);

      // Send push notification
      await this.pushNotificationService?.sendNotification({
        title: 'Airdrop Requested',
        body: `Requested ${amount} SOL airdrop`,
        data: {
          type: 'airdrop_requested',
          amount: amount,
          signature: signature
        }
      });

      return signature;

    } catch (error) {
      console.error('❌ Failed to request airdrop on mobile:', error);
      throw error;
    }
  }

  /**
   * Check if mobile wallet is connected
   */
  isMobileWalletConnected(): boolean {
    return this.mobileWalletAdapter?.connected || false;
  }

  /**
   * Get mobile wallet public key
   */
  getMobileWalletPublicKey(): PublicKey | null {
    return this.mobileWalletAdapter?.publicKey || null;
  }

  /**
   * Set mobile wallet adapter
   */
  setMobileWalletAdapter(adapter: MobileWalletAdapter): void {
    this.mobileWalletAdapter = adapter;
    console.log('✅ Mobile wallet adapter set');
  }
}

// Push notification service for mobile
export class PushNotificationService {
  private isSupported: boolean = false;

  constructor() {
    this.checkSupport();
  }

  private checkSupport() {
    // Check if push notifications are supported (server-side check)
    this.isSupported = false; // Disabled on server-side
    console.log(`📱 Push notifications supported: ${this.isSupported}`);
  }

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<boolean> {
    if (!this.isSupported) {
      console.warn('⚠️ Push notifications not supported on server-side');
      return false;
    }

    // Server-side implementation would integrate with push notification service
    console.log('📱 Notification permission requested (server-side)');
    return false;
  }

  /**
   * Send push notification
   */
  async sendNotification(notification: {
    title: string;
    body: string;
    data?: any;
  }): Promise<void> {
    if (!this.isSupported) {
      console.warn('⚠️ Push notifications not supported on server-side');
      return;
    }

    // Server-side implementation would integrate with push notification service
    console.log(`📱 Push notification sent (server-side): ${notification.title}`);
    console.log(`   Body: ${notification.body}`);
    console.log(`   Data:`, notification.data);
  }

  /**
   * Send transaction notification
   */
  async sendTransactionNotification(signature: string, type: 'success' | 'error'): Promise<void> {
    const title = type === 'success' ? 'Transaction Successful' : 'Transaction Failed';
    const body = type === 'success' 
      ? `Transaction confirmed: ${signature.slice(0, 8)}...`
      : `Transaction failed: ${signature}`;

    await this.sendNotification({
      title,
      body,
      data: {
        type: 'transaction',
        signature,
        status: type
      }
    });
  }

  /**
   * Send fair launch notification
   */
  async sendFairLaunchNotification(fairLaunch: string, type: 'started' | 'ended' | 'finalized'): Promise<void> {
    const titles = {
      started: 'Fair Launch Started',
      ended: 'Fair Launch Ended',
      finalized: 'Fair Launch Finalized'
    };

    const bodies = {
      started: 'A new fair launch has started! Participate now.',
      ended: 'The fair launch has ended. Check your allocation.',
      finalized: 'Fair launch finalized. You can now claim your tokens.'
    };

    await this.sendNotification({
      title: titles[type],
      body: bodies[type],
      data: {
        type: 'fair_launch',
        fairLaunch,
        status: type
      }
    });
  }
}

// Deep linking service for mobile
export class DeepLinkService {
  /**
   * Generate deep link for mobile wallet connection
   */
  generateWalletConnectionLink(walletType: string, returnUrl: string): string {
    const baseUrl = 'solana://wallet';
    const params = new URLSearchParams({
      action: 'connect',
      wallet: walletType,
      returnUrl: returnUrl
    });
    
    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Generate deep link for transaction signing
   */
  generateTransactionLink(transactionData: string, returnUrl: string): string {
    const baseUrl = 'solana://wallet';
    const params = new URLSearchParams({
      action: 'sign',
      transaction: transactionData,
      returnUrl: returnUrl
    });
    
    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Generate deep link for fair launch participation
   */
  generateFairLaunchLink(fairLaunch: string, returnUrl: string): string {
    const baseUrl = 'solana://dapp';
    const params = new URLSearchParams({
      action: 'fair_launch',
      fairLaunch: fairLaunch,
      returnUrl: returnUrl
    });
    
    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Handle deep link callback
   */
  handleDeepLinkCallback(url: string): { action: string; data: any } | null {
    try {
      const urlObj = new URL(url);
      const params = new URLSearchParams(urlObj.search);
      
      return {
        action: params.get('action') || 'unknown',
        data: Object.fromEntries(params.entries())
      };
    } catch (error) {
      console.error('❌ Failed to handle deep link callback:', error);
      return null;
    }
  }
}

// Export singleton instances
let mobileWalletService: MobileWalletService | null = null;
let pushNotificationService: PushNotificationService | null = null;
let deepLinkService: DeepLinkService | null = null;

export function getMobileWalletService(connection: Connection): MobileWalletService {
  if (!mobileWalletService) {
    mobileWalletService = new MobileWalletService(connection);
  }
  return mobileWalletService;
}

export function getPushNotificationService(): PushNotificationService {
  if (!pushNotificationService) {
    pushNotificationService = new PushNotificationService();
  }
  return pushNotificationService;
}

export function getDeepLinkService(): DeepLinkService {
  if (!deepLinkService) {
    deepLinkService = new DeepLinkService();
  }
  return deepLinkService;
}
