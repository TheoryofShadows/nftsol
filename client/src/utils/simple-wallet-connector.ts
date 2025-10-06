
interface SimpleWallet {
  publicKey: string;
  connected: boolean;
  name: string;
}

interface WalletProvider {
  isPhantom?: boolean;
  isSolflare?: boolean;
  isBackpack?: boolean;
  connect(): Promise<{ publicKey: { toString(): string } }>;
  disconnect(): Promise<void>;
  on(event: string, callback: Function): void;
  removeListener(event: string, callback: Function): void;
}

class SimpleWalletConnector {
  private currentWallet: SimpleWallet | null = null;
  private listeners: Map<string, Function[]> = new Map();

  async connectWallet(): Promise<SimpleWallet> {
    // Try each wallet provider directly
    const providers = [
      { name: 'Phantom', check: () => (window as any).phantom?.solana, prop: 'phantom' },
      { name: 'Solflare', check: () => (window as any).solflare, prop: 'solflare' },
      { name: 'Backpack', check: () => (window as any).backpack, prop: 'backpack' }
    ];

    for (const provider of providers) {
      const wallet = provider.check();
      if (wallet && typeof wallet.connect === 'function') {
        try {
          const response = await wallet.connect();
          const publicKey = response.publicKey?.toString() || response.toString();
          
          if (publicKey) {
            this.currentWallet = {
              publicKey,
              connected: true,
              name: provider.name
            };

            // Set up disconnect listener
            if (wallet.on) {
              wallet.on('disconnect', () => {
                this.currentWallet = null;
                this.emit('disconnect');
              });
            }

            this.emit('connect', this.currentWallet);
            return this.currentWallet;
          }
        } catch (error) {
          console.log(`${provider.name} connection failed:`, error);
          continue;
        }
      }
    }

    // If no wallet found, try mobile redirect approach
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
      const currentUrl = encodeURIComponent(window.location.href);
      
      // Store connection attempt
      localStorage.setItem('walletConnectionAttempt', Date.now().toString());
      
      // Try Phantom mobile
      window.open(`https://phantom.app/ul/browse/${currentUrl}`, '_blank');
      
      throw new Error('Redirected to Phantom mobile app. Please complete connection and return.');
    }

    throw new Error('No wallet found. Please install Phantom, Solflare, or Backpack wallet.');
  }

  async disconnect(): Promise<void> {
    if (this.currentWallet) {
      // Try to disconnect from the actual wallet
      const walletName = this.currentWallet.name.toLowerCase();
      const wallet = (window as any)[walletName] || (window as any).phantom?.solana;
      
      if (wallet && wallet.disconnect) {
        try {
          await wallet.disconnect();
        } catch (error) {
          console.log('Wallet disconnect error:', error);
        }
      }
    }

    this.currentWallet = null;
    localStorage.removeItem('walletConnectionAttempt');
    this.emit('disconnect');
  }

  getCurrentWallet(): SimpleWallet | null {
    return this.currentWallet;
  }

  checkForMobileReconnection(): void {
    const attemptTime = localStorage.getItem('walletConnectionAttempt');
    if (!attemptTime) return;

    // Check if attempt was recent (within 5 minutes)
    const timeSince = Date.now() - parseInt(attemptTime);
    if (timeSince > 300000) {
      localStorage.removeItem('walletConnectionAttempt');
      return;
    }

    // Check if any wallet is now connected
    const providers = [
      (window as any).phantom?.solana,
      (window as any).solflare,
      (window as any).backpack
    ];

    for (const wallet of providers) {
      if (wallet && wallet.publicKey && wallet.isConnected) {
        this.currentWallet = {
          publicKey: wallet.publicKey.toString(),
          connected: true,
          name: 'Mobile Wallet'
        };
        
        localStorage.removeItem('walletConnectionAttempt');
        this.emit('connect', this.currentWallet);
        break;
      }
    }
  }

  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }
}

// Global type declarations
declare global {
  interface Window {
    phantom?: { solana?: any };
    solflare?: any;
    backpack?: any;
  }
}

export const simpleWalletConnector = new SimpleWalletConnector();
export type { SimpleWallet };
