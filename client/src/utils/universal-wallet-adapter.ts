import { PublicKey, Transaction } from '@solana/web3.js';

// Polyfill Buffer for browser compatibility
import { Buffer } from 'buffer';
if (typeof window !== 'undefined' && !window.Buffer) {
  window.Buffer = Buffer;
}

export interface WalletAdapter {
  name: string;
  icon: string;
  url: string;
  readyState: 'Installed' | 'NotDetected' | 'Loadable' | 'Unsupported';
}

export interface UniversalWallet {
  publicKey: PublicKey | null;
  connected: boolean;
  connecting: boolean;
  disconnecting: boolean;
  wallet: WalletAdapter | null;
  name?: string;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  sendTransaction(transaction: Transaction): Promise<string>;
  signTransaction(transaction: Transaction): Promise<Transaction>;
  signAllTransactions(transactions: Transaction[]): Promise<Transaction[]>;
  signMessage(message: Uint8Array): Promise<Uint8Array>;
}

// Enhanced wallet detection with mobile support
export class SolanaWalletManager {
  private wallets: Map<string, any> = new Map();
  private currentWallet: any = null;
  private listeners: Map<string, Function[]> = new Map();
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    if (this.isInitialized) return;

    // Wait for page load on mobile
    if (document.readyState !== 'complete') {
      await new Promise(resolve => {
        window.addEventListener('load', resolve, { once: true });
      });
    }

    // Detect wallets with multiple attempts
    for (let i = 0; i < 5; i++) {
      this.detectWallets();
      await this.sleep(500);
    }

    this.setupEventListeners();
    this.isInitialized = true;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  detectWallets() {
    if (typeof window === 'undefined') return;

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

    // Don't clear if we already have connected wallets on mobile
    if (!isMobile || this.wallets.size === 0) {
      this.wallets.clear();
    }

    // Phantom Wallet Detection with better logic
    const phantom = window.phantom?.solana || window.solana;
    const phantomDetected = phantom?.isPhantom || (phantom && typeof phantom.connect === 'function');

    if (phantomDetected) {
      console.log('Phantom wallet detected:', phantom);
      this.wallets.set('phantom', {
        name: 'Phantom',
        icon: 'https://phantom.app/img/phantom-icon.svg',
        url: 'https://phantom.app',
        readyState: 'Installed',
        adapter: phantom,
        mobile: isMobile
      });
    } else {
      console.log('Phantom wallet not detected');
      // Add as available for installation
      this.wallets.set('phantom', {
        name: 'Phantom',
        icon: 'https://phantom.app/img/phantom-icon.svg',
        url: isIOS ? 'https://apps.apple.com/app/phantom-solana-wallet/id1598432977' : 'https://phantom.app/download',
        readyState: 'NotDetected',
        adapter: null,
        mobile: isMobile
      });
    }

    // Solflare Wallet Detection
    const solflare = window.solflare;
    if (solflare?.isSolflare) {
      this.wallets.set('solflare', {
        name: 'Solflare',
        icon: 'https://solflare.com/img/logo.svg',
        url: 'https://solflare.com',
        readyState: 'Installed',
        adapter: solflare,
        mobile: isMobile
      });
    } else {
      this.wallets.set('solflare', {
        name: 'Solflare',
        icon: 'https://solflare.com/img/logo.svg',
        url: isIOS ? 'https://apps.apple.com/app/solflare/id1580902717' : 'https://solflare.com/download',
        readyState: 'NotDetected',
        adapter: null,
        mobile: isMobile
      });
    }

    // Backpack Wallet Detection
    const backpack = window.backpack;
    if (backpack?.isBackpack) {
      this.wallets.set('backpack', {
        name: 'Backpack',
        icon: 'https://backpack.app/logo.png',
        url: 'https://backpack.app',
        readyState: 'Installed',
        adapter: backpack,
        mobile: isMobile
      });
    } else {
      this.wallets.set('backpack', {
        name: 'Backpack',
        icon: 'https://backpack.app/logo.png',
        url: 'https://backpack.app',
        readyState: 'NotDetected',
        adapter: null,
        mobile: isMobile
      });
    }

    // Coin98 Wallet Detection
    const coin98 = window.coin98?.sol;
    if (coin98) {
      this.wallets.set('coin98', {
        name: 'Coin98',
        icon: 'https://coin98.com/img/logo.svg',
        url: 'https://wallet.coin98.com',
        readyState: 'Installed',
        adapter: coin98,
        mobile: isMobile
      });
    } else {
      this.wallets.set('coin98', {
        name: 'Coin98',
        icon: 'https://coin98.com/img/logo.svg',
        url: 'https://wallet.coin98.com',
        readyState: 'NotDetected',
        adapter: null,
        mobile: isMobile
      });
    }

    this.emit('walletsChanged', Array.from(this.wallets.values()));
  }

  private setupEventListeners() {
    if (typeof window === 'undefined') return;

    // Listen for wallet injections
    const originalPush = history.pushState;
    history.pushState = function(...args) {
      originalPush.apply(history, args);
      setTimeout(() => walletManager.detectWallets(), 100);
    };

    // Listen for window focus (user returning from wallet app)
    window.addEventListener('focus', () => {
      setTimeout(() => {
        this.detectWallets();
        this.checkForReconnection();
      }, 500);
    });

    // Check for wallet injections periodically with exponential backoff
    let attempts = 0;
    const checkInterval = setInterval(() => {
      if (attempts < 5) {
        this.detectWallets();
      }
      attempts++;
      if (attempts > 5) clearInterval(checkInterval);
    }, 2000);
  }

  private async checkForReconnection() {
    // Check if any wallet is now connected after returning from mobile app
    for (const [id, walletInfo] of Array.from(this.wallets.entries())) {
      if (walletInfo.adapter && walletInfo.adapter.isConnected && walletInfo.adapter.publicKey) {
        this.currentWallet = walletInfo.adapter;
        this.emit('connect', walletInfo.adapter.publicKey);
        break;
      }
    }
  }

  getAvailableWallets(): WalletAdapter[] {
    return Array.from(this.wallets.values()).map(w => ({
      name: w.name,
      icon: w.icon,
      url: w.url,
      readyState: w.readyState
    }));
  }

  getInstalledWallets(): WalletAdapter[] {
    return this.getAvailableWallets().filter(w => w.readyState === 'Installed');
  }

  // Utility to detect if we're returning from a mobile wallet redirect
  private isMobileWalletRedirect(): boolean {
    const urlParams = new URLSearchParams(window.location.search);
    const referrer = document.referrer;
    const fromWallet = urlParams.get('wallet');
    const connected = urlParams.get('connected');

    // Check for wallet app referrers
    const walletReferrers = ['phantom.app', 'solflare.com', 'backpack.app'];
    const fromWalletApp = walletReferrers.some(domain => referrer.includes(domain));

    return !!(fromWallet || connected || fromWalletApp);
  }

  async connectWallet(walletId: string): Promise<UniversalWallet> {
    console.log(`Attempting to connect to wallet: ${walletId}`);

    // Check if this is a mobile redirect return
    const isMobileRedirect = this.isMobileWalletRedirect();
    if (isMobileRedirect) {
      console.log('Detected mobile wallet redirect return');

      // Try to restore connection from existing wallet state
      const cachedPublicKey = localStorage.getItem('publicKey');
      if (cachedPublicKey) {
        // Check if any wallet is already connected with matching key
        const providers = [
          { name: 'phantom', adapter: (window as any).phantom?.solana },
          { name: 'solflare', adapter: (window as any).solflare },
          { name: 'backpack', adapter: (window as any).backpack }
        ];

        for (const provider of providers) {
          if (provider.adapter && provider.adapter.publicKey?.toString() === cachedPublicKey) {
            const universalWallet = this.createUniversalWallet(provider.adapter, provider.adapter.publicKey, {
              name: provider.name,
              icon: '',
              url: '',
              readyState: 'Installed',
            });
            this.currentWallet = universalWallet;
            return universalWallet;
          }
        }
      }
    }

    const walletInfo = this.wallets.get(walletId);

    if (!walletInfo) {
      throw new Error(`Wallet ${walletId} not found`);
    }

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

    // Handle mobile wallet connections
    if (isMobile && walletInfo.readyState === 'NotDetected') {
      return this.handleMobileWalletConnection(walletId, walletInfo, isIOS);
    }

    // Handle desktop wallet connections
    if (walletInfo.readyState !== 'Installed') {
      window.open(walletInfo.url, '_blank');
      throw new Error(`${walletInfo.name} is not installed. Please install it first.`);
    }

    const adapter = walletInfo.adapter;
    if (!adapter) {
      throw new Error(`${walletInfo.name} adapter not found`);
    }

    try {
      let response;
      let publicKey;

      // Enhanced connection logic for different wallet types
      if (walletId === 'phantom' && adapter.connect) {
        // Phantom specific connection
        response = await adapter.connect();
        publicKey = response?.publicKey || adapter.publicKey;
      } else if (adapter.connect) {
        // Generic wallet connection
        response = await adapter.connect({ onlyIfTrusted: false });
        publicKey = response?.publicKey || adapter.publicKey;
      } else if (adapter.enable) {
        response = await adapter.enable();
        publicKey = response?.publicKey || adapter.publicKey;
      } else {
        throw new Error('Wallet does not support connection');
      }

      if (!publicKey) {
        throw new Error('Failed to get public key from wallet');
      }

      const universalWallet = this.createUniversalWallet(adapter, publicKey, walletInfo);
      this.currentWallet = universalWallet;
      this.setupWalletEventListeners(adapter);

      return universalWallet;
    } catch (error: any) {
      console.error(`Failed to connect to ${walletInfo.name}:`, error);
      console.error('Adapter details:', { 
        hasConnect: !!adapter.connect, 
        hasEnable: !!adapter.enable,
        isConnected: adapter.isConnected,
        publicKey: adapter.publicKey
      });

      // Provide user-friendly error messages
      if (error.message?.includes('User rejected') || error.message?.includes('rejected')) {
        throw new Error('Connection was cancelled by user');
      } else if (error.message?.includes('already pending')) {
        throw new Error('Please check your wallet - a connection request is already pending');
      } else if (!error.message || error.message === '') {
        throw new Error(`Failed to connect to ${walletInfo.name}. Please make sure your wallet is unlocked and try again.`);
      }

      throw error;
    }
  }

  private async handleMobileWalletConnection(walletId: string, walletInfo: any, isIOS: boolean): Promise<UniversalWallet> {
    const currentUrl = encodeURIComponent(window.location.href);

    if (walletId === 'phantom') {
      if (isIOS) {
        // iOS deep linking
        const phantomApp = `phantom://ul/browse/${currentUrl}?ref=nftsol`;
        const phantomStore = 'https://apps.apple.com/app/phantom-solana-wallet/id1598432977';

        // Try to open app, fallback to store
        try {
          window.location.href = phantomApp;
          // Set a timeout to redirect to store if app doesn't open
          setTimeout(() => {
            window.open(phantomStore, '_blank');
          }, 2500);
        } catch {
          window.open(phantomStore, '_blank');
        }
      } else {
        // Android
        const phantomUrl = `https://phantom.app/ul/browse/${currentUrl}?ref=nftsol`;
        window.open(phantomUrl, '_blank');
      }

      // Set connection tracking for mobile
      localStorage.setItem('pendingWalletConnection', walletId);
      localStorage.setItem('connectionTimestamp', Date.now().toString());

      throw new Error('Opening Phantom app. Complete the connection and return to this page.');
    }

    if (walletId === 'solflare') {
      if (isIOS) {
        const solflareApp = `solflare://ul/browse/${currentUrl}?ref=nftsol`;
        const solflareStore = 'https://apps.apple.com/app/solflare/id1580902717';

        try {
          window.location.href = solflareApp;
          setTimeout(() => {
            window.open(solflareStore, '_blank');
          }, 2500);
        } catch {
          window.open(solflareStore, '_blank');
        }
      } else {
        const solflareUrl = `https://solflare.com/access?target=${currentUrl}&ref=nftsol`;
        window.open(solflareUrl, '_blank');
      }

      throw new Error('Complete the connection in your Solflare app, then return to this page');
    }

    // Default: open wallet installation page
    window.open(walletInfo.url, '_blank');
    throw new Error(`Please install ${walletInfo.name} first, then refresh this page`);
  }

  private setupWalletEventListeners(adapter: any) {
    if (!adapter.on) return;

    // Remove existing listeners to prevent duplicates
    if (adapter.removeAllListeners) {
      adapter.removeAllListeners();
    }

    adapter.on('connect', (publicKey: any) => {
      this.emit('connect', this.currentWallet ?? publicKey);
    });

    adapter.on('disconnect', () => {
      this.currentWallet = null;
      this.emit('disconnect');
    });

    adapter.on('accountChanged', (publicKey: any) => {
      this.emit('accountChanged', publicKey);
    });
  }

  private createUniversalWallet(adapter: any, publicKey: any, walletInfo: any): UniversalWallet {
    return {
      publicKey: new PublicKey(publicKey.toString()),
      connected: adapter.isConnected || true,
      connecting: false,
      disconnecting: false,
      name: walletInfo.name,
      wallet: {
        name: walletInfo.name,
        icon: walletInfo.icon,
        url: walletInfo.url,
        readyState: 'Installed'
      },

      async connect() {
        if (adapter.connect) {
          await adapter.connect();
        }
      },

      async disconnect() {
        if (adapter.disconnect) {
          await adapter.disconnect();
        }
        walletManager.currentWallet = null;
      },

      async sendTransaction(transaction: Transaction) {
        if (adapter.sendTransaction) {
          return await adapter.sendTransaction(transaction);
        } else if (adapter.signAndSendTransaction) {
          const result = await adapter.signAndSendTransaction(transaction);
          return result.signature || result;
        }
        throw new Error('Wallet does not support sending transactions');
      },

      async signTransaction(transaction: Transaction) {
        if (adapter.signTransaction) {
          return await adapter.signTransaction(transaction);
        }
        throw new Error('Wallet does not support signing transactions');
      },

      async signAllTransactions(transactions: Transaction[]) {
        if (adapter.signAllTransactions) {
          return await adapter.signAllTransactions(transactions);
        }
        throw new Error('Wallet does not support signing multiple transactions');
      },

      async signMessage(message: Uint8Array) {
        if (adapter.signMessage) {
          return await adapter.signMessage(message);
        }
        throw new Error('Wallet does not support message signing');
      }
    };
  }

  getCurrentWallet(): any {
    return this.currentWallet;
  }

  isWalletConnected(): boolean {
    return !!this.currentWallet && this.currentWallet.isConnected;
  }

  // Event system
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, ...args: any[]) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`Error in wallet event ${event}:`, error);
        }
      });
    }
  }
}

// Global type declarations
declare global {
  interface Window {
    solana?: any;
    phantom?: { solana?: any };
    solflare?: any;
    backpack?: any;
    Slope?: any;
    coin98?: any;
  }
}

// Export singleton instance
export const walletManager = new SolanaWalletManager();


