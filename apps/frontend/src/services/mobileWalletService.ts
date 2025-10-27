/**
 * 📱 Mobile Wallet Service
 * Solana Mobile Stack (SMS) integration for mobile wallet support
 */

export interface MobileWalletInfo {
  name: string;
  icon: string;
  deepLink: string;
  appStoreUrl: string;
  playStoreUrl: string;
  supportedFeatures: string[];
  isInstalled: boolean;
}

export interface MobileTransaction {
  type: 'mint' | 'transfer' | 'swap' | 'stake';
  amount?: number;
  recipient?: string;
  tokenMint?: string;
  metadata?: any;
}

export interface MobileWalletConnection {
  wallet: MobileWalletInfo;
  publicKey: string;
  connected: boolean;
  sessionId?: string;
}

export class MobileWalletService {
  private static instance: MobileWalletService;
  private currentConnection: MobileWalletConnection | null = null;
  private supportedWallets: MobileWalletInfo[] = [];

  constructor() {
    this.initializeSupportedWallets();
  }

  static getInstance(): MobileWalletService {
    if (!MobileWalletService.instance) {
      MobileWalletService.instance = new MobileWalletService();
    }
    return MobileWalletService.instance;
  }

  private initializeSupportedWallets(): void {
    this.supportedWallets = [
      {
        name: 'Solflare',
        icon: 'https://solflare.com/favicon.ico',
        deepLink: 'solflare://',
        appStoreUrl: 'https://apps.apple.com/app/solflare/id1580902717',
        playStoreUrl: 'https://play.google.com/store/apps/details?id=com.solflare.mobile',
        supportedFeatures: ['mint', 'transfer', 'swap', 'stake'],
        isInstalled: false
      },
      {
        name: 'Phantom',
        icon: 'https://phantom.app/img/phantom-logo.png',
        deepLink: 'phantom://',
        appStoreUrl: 'https://apps.apple.com/app/phantom-solana-wallet/id1598432977',
        playStoreUrl: 'https://play.google.com/store/apps/details?id=app.phantom',
        supportedFeatures: ['mint', 'transfer', 'swap'],
        isInstalled: false
      },
      {
        name: 'Backpack',
        icon: 'https://backpack.app/favicon.ico',
        deepLink: 'backpack://',
        appStoreUrl: 'https://apps.apple.com/app/backpack-crypto-wallet/id1668960000',
        playStoreUrl: 'https://play.google.com/store/apps/details?id=app.backpack.mobile',
        supportedFeatures: ['mint', 'transfer', 'swap', 'stake'],
        isInstalled: false
      },
      {
        name: 'Glow',
        icon: 'https://glow.app/favicon.ico',
        deepLink: 'glow://',
        appStoreUrl: 'https://apps.apple.com/app/glow-solana-wallet/id1634118194',
        playStoreUrl: 'https://play.google.com/store/apps/details?id=com.glow.app',
        supportedFeatures: ['mint', 'transfer', 'swap'],
        isInstalled: false
      },
      {
        name: 'Trust Wallet',
        icon: 'https://trustwallet.com/favicon.ico',
        deepLink: 'trust://',
        appStoreUrl: 'https://apps.apple.com/app/trust-crypto-bitcoin-wallet/id1288339409',
        playStoreUrl: 'https://play.google.com/store/apps/details?id=com.wallet.crypto.trust',
        supportedFeatures: ['mint', 'transfer', 'swap'],
        isInstalled: false
      }
    ];

    this.detectInstalledWallets();
  }

  /**
   * Detect which mobile wallets are installed
   */
  private detectInstalledWallets(): void {
    // Check if we're on mobile
    if (!this.isMobile()) {
      return;
    }

    // For now, we'll assume all wallets are available
    // In a real implementation, you'd check for deep link availability
    this.supportedWallets.forEach(wallet => {
      wallet.isInstalled = this.canOpenDeepLink(wallet.deepLink);
    });
  }

  /**
   * Check if the current device is mobile
   */
  isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  /**
   * Check if a deep link can be opened
   */
  private canOpenDeepLink(deepLink: string): boolean {
    // In a real implementation, you'd test if the deep link can be opened
    // For now, we'll return true for all wallets
    return true;
  }

  /**
   * Get all supported mobile wallets
   */
  getSupportedWallets(): MobileWalletInfo[] {
    return this.supportedWallets;
  }

  /**
   * Get installed mobile wallets
   */
  getInstalledWallets(): MobileWalletInfo[] {
    return this.supportedWallets.filter(wallet => wallet.isInstalled);
  }

  /**
   * Connect to a mobile wallet
   */
  async connectWallet(wallet: MobileWalletInfo): Promise<MobileWalletConnection> {
    try {
      console.log(`📱 Connecting to ${wallet.name}...`);

      // Generate a session ID for the connection
      const sessionId = this.generateSessionId();

      // Create deep link URL for wallet connection
      const deepLinkUrl = this.createConnectionDeepLink(wallet, sessionId);

      // Open the deep link
      this.openDeepLink(deepLinkUrl);

      // For now, we'll simulate a successful connection
      // In a real implementation, you'd wait for the wallet to respond
      const connection: MobileWalletConnection = {
        wallet,
        publicKey: 'mock-public-key-' + Date.now(),
        connected: true,
        sessionId
      };

      this.currentConnection = connection;
      console.log(`✅ Connected to ${wallet.name}`);

      return connection;
    } catch (error) {
      console.error(`❌ Failed to connect to ${wallet.name}:`, error);
      throw error;
    }
  }

  /**
   * Disconnect from the current mobile wallet
   */
  disconnectWallet(): void {
    if (this.currentConnection) {
      console.log(`📱 Disconnecting from ${this.currentConnection.wallet.name}...`);
      this.currentConnection = null;
      console.log('✅ Disconnected from mobile wallet');
    }
  }

  /**
   * Get current mobile wallet connection
   */
  getCurrentConnection(): MobileWalletConnection | null {
    return this.currentConnection;
  }

  /**
   * Check if a mobile wallet is connected
   */
  isConnected(): boolean {
    return this.currentConnection?.connected || false;
  }

  /**
   * Send a transaction through mobile wallet
   */
  async sendTransaction(transaction: MobileTransaction): Promise<string> {
    if (!this.currentConnection) {
      throw new Error('No mobile wallet connected');
    }

    try {
      console.log(`📱 Sending transaction through ${this.currentConnection.wallet.name}...`);

      // Create deep link URL for the transaction
      const deepLinkUrl = this.createTransactionDeepLink(transaction);

      // Open the deep link
      this.openDeepLink(deepLinkUrl);

      // For now, we'll simulate a successful transaction
      // In a real implementation, you'd wait for the wallet to respond
      const signature = 'mock-signature-' + Date.now();
      console.log(`✅ Transaction sent: ${signature}`);

      return signature;
    } catch (error) {
      console.error('❌ Failed to send transaction:', error);
      throw error;
    }
  }

  /**
   * Mint an NFT through mobile wallet
   */
  async mintNFT(metadata: any, collectionMint?: string): Promise<string> {
    const transaction: MobileTransaction = {
      type: 'mint',
      metadata,
      tokenMint: collectionMint
    };

    return this.sendTransaction(transaction);
  }

  /**
   * Transfer tokens through mobile wallet
   */
  async transferTokens(amount: number, recipient: string, tokenMint?: string): Promise<string> {
    const transaction: MobileTransaction = {
      type: 'transfer',
      amount,
      recipient,
      tokenMint
    };

    return this.sendTransaction(transaction);
  }

  /**
   * Create a deep link for wallet connection
   */
  private createConnectionDeepLink(wallet: MobileWalletInfo, sessionId: string): string {
    const baseUrl = window.location.origin;
    const callbackUrl = `${baseUrl}/mobile-callback?session=${sessionId}`;
    
    // Create wallet-specific connection URL
    switch (wallet.name.toLowerCase()) {
      case 'solflare':
        return `solflare://connect?dapp=${encodeURIComponent(baseUrl)}&callback=${encodeURIComponent(callbackUrl)}`;
      case 'phantom':
        return `phantom://connect?dapp=${encodeURIComponent(baseUrl)}&callback=${encodeURIComponent(callbackUrl)}`;
      case 'backpack':
        return `backpack://connect?dapp=${encodeURIComponent(baseUrl)}&callback=${encodeURIComponent(callbackUrl)}`;
      case 'glow':
        return `glow://connect?dapp=${encodeURIComponent(baseUrl)}&callback=${encodeURIComponent(callbackUrl)}`;
      case 'trust wallet':
        return `trust://connect?dapp=${encodeURIComponent(baseUrl)}&callback=${encodeURIComponent(callbackUrl)}`;
      default:
        return wallet.deepLink;
    }
  }

  /**
   * Create a deep link for transaction
   */
  private createTransactionDeepLink(transaction: MobileTransaction): string {
    if (!this.currentConnection) {
      throw new Error('No mobile wallet connected');
    }

    const baseUrl = window.location.origin;
    const callbackUrl = `${baseUrl}/mobile-callback?type=transaction`;
    
    // Create wallet-specific transaction URL
    switch (this.currentConnection.wallet.name.toLowerCase()) {
      case 'solflare':
        return `solflare://transaction?type=${transaction.type}&callback=${encodeURIComponent(callbackUrl)}`;
      case 'phantom':
        return `phantom://transaction?type=${transaction.type}&callback=${encodeURIComponent(callbackUrl)}`;
      case 'backpack':
        return `backpack://transaction?type=${transaction.type}&callback=${encodeURIComponent(callbackUrl)}`;
      case 'glow':
        return `glow://transaction?type=${transaction.type}&callback=${encodeURIComponent(callbackUrl)}`;
      case 'trust wallet':
        return `trust://transaction?type=${transaction.type}&callback=${encodeURIComponent(callbackUrl)}`;
      default:
        return this.currentConnection.wallet.deepLink;
    }
  }

  /**
   * Open a deep link
   */
  private openDeepLink(url: string): void {
    try {
      // Try to open the deep link
      window.location.href = url;
    } catch (error) {
      console.error('❌ Failed to open deep link:', error);
      throw error;
    }
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Handle mobile wallet callback
   */
  handleCallback(params: URLSearchParams): void {
    const sessionId = params.get('session');
    const type = params.get('type');
    const success = params.get('success') === 'true';
    const error = params.get('error');

    if (sessionId && this.currentConnection?.sessionId === sessionId) {
      if (success) {
        console.log('✅ Mobile wallet operation successful');
        // Handle successful operation
      } else {
        console.error('❌ Mobile wallet operation failed:', error);
        // Handle failed operation
      }
    }
  }

  /**
   * Get mobile-optimized UI recommendations
   */
  getMobileUIRecommendations(): {
    showQRCode: boolean;
    useBottomSheet: boolean;
    compactLayout: boolean;
    touchOptimized: boolean;
  } {
    return {
      showQRCode: !this.isMobile(),
      useBottomSheet: this.isMobile(),
      compactLayout: this.isMobile(),
      touchOptimized: this.isMobile()
    };
  }

  /**
   * Check if a feature is supported by the current wallet
   */
  isFeatureSupported(feature: string): boolean {
    if (!this.currentConnection) {
      return false;
    }

    return this.currentConnection.wallet.supportedFeatures.includes(feature);
  }

  /**
   * Get wallet-specific configuration
   */
  getWalletConfig(walletName: string): any {
    const wallet = this.supportedWallets.find(w => w.name.toLowerCase() === walletName.toLowerCase());
    
    if (!wallet) {
      return null;
    }

    return {
      name: wallet.name,
      icon: wallet.icon,
      deepLink: wallet.deepLink,
      appStoreUrl: wallet.appStoreUrl,
      playStoreUrl: wallet.playStoreUrl,
      isInstalled: wallet.isInstalled,
      supportedFeatures: wallet.supportedFeatures
    };
  }
}

// Export singleton instance
export const mobileWalletService = MobileWalletService.getInstance();
