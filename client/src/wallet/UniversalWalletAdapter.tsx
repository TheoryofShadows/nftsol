import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';

// Wallet provider types
interface WalletProvider {
  name: string;
  icon: string;
  isInstalled: boolean;
  connect: () => Promise<WalletConnection>;
  disconnect: () => Promise<void>;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
}

interface WalletConnection {
  publicKey: PublicKey;
  connected: boolean;
  connecting: boolean;
}

interface UniversalWalletContextType {
  // Connection state
  connected: boolean;
  connecting: boolean;
  publicKey: PublicKey | null;
  walletName: string | null;
  
  // Available wallets
  availableWallets: WalletProvider[];
  installedWallets: WalletProvider[];
  
  // Actions
  connect: (walletName: string) => Promise<void>;
  disconnect: () => Promise<void>;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
  
  // Utility
  getProvider: (walletName: string) => WalletProvider | null;
}

const UniversalWalletContext = createContext<UniversalWalletContextType | null>(null);

// Custom hook to use the wallet context
export const useWallet = () => {
  const context = useContext(UniversalWalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a UniversalWalletProvider');
  }
  return context;
};

// Enhanced wallet detection for mobile and desktop
const detectWallet = (walletName: string): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Check for mobile wallet detection
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  switch (walletName) {
    case 'phantom':
      // Enhanced Phantom detection for mobile and desktop
      return !!(
        (window as any).phantom?.solana?.isPhantom ||
        (window as any).solana?.isPhantom ||
        (isMobile && (window as any).phantom) ||
        (window as any).phantom
      );
    case 'solflare':
      // Enhanced Solflare detection
      return !!(
        (window as any).solflare?.isSolflare ||
        (window as any).solana?.isSolflare ||
        (isMobile && (window as any).solflare) ||
        (window as any).solflare
      );
    case 'backpack':
      return !!(
        (window as any).backpack ||
        (window as any).solana?.isBackpack
      );
    case 'glow':
      return !!(
        (window as any).glow ||
        (window as any).solana?.isGlow
      );
    case 'sollet':
      return !!(
        (window as any).sollet ||
        (window as any).solana?.isSollet
      );
    case 'slope':
      return !!(
        (window as any).Slope ||
        (window as any).solana?.isSlope
      );
    case 'torus':
      return !!(
        (window as any).torus ||
        (window as any).solana?.isTorus
      );
    case 'coinbase':
      return !!(
        (window as any).coinbaseSolana ||
        (window as any).solana?.isCoinbase
      );
    case 'ledger':
      return !!(
        (window as any).solana?.isLedger ||
        (window as any).ledger
      );
    default:
      return false;
  }
};

// Supported wallet providers with enhanced detection
const WALLET_PROVIDERS: WalletProvider[] = [
  {
    name: 'phantom',
    icon: '👻',
    isInstalled: detectWallet('phantom'),
    connect: async () => ({ publicKey: new PublicKey(''), connected: false, connecting: false }),
    disconnect: async () => {},
    signTransaction: async (tx) => tx,
    signAllTransactions: async (txs) => txs
  },
  {
    name: 'solflare',
    icon: '☀️',
    isInstalled: detectWallet('solflare'),
    connect: async () => ({ publicKey: new PublicKey(''), connected: false, connecting: false }),
    disconnect: async () => {},
    signTransaction: async (tx) => tx,
    signAllTransactions: async (txs) => txs
  },
  {
    name: 'backpack',
    icon: '🎒',
    isInstalled: detectWallet('backpack'),
    connect: async () => ({ publicKey: new PublicKey(''), connected: false, connecting: false }),
    disconnect: async () => {},
    signTransaction: async (tx) => tx,
    signAllTransactions: async (txs) => txs
  },
  {
    name: 'glow',
    icon: '✨',
    isInstalled: detectWallet('glow'),
    connect: async () => ({ publicKey: new PublicKey(''), connected: false, connecting: false }),
    disconnect: async () => {},
    signTransaction: async (tx) => tx,
    signAllTransactions: async (txs) => txs
  },
  {
    name: 'sollet',
    icon: '🔗',
    isInstalled: detectWallet('sollet'),
    connect: async () => ({ publicKey: new PublicKey(''), connected: false, connecting: false }),
    disconnect: async () => {},
    signTransaction: async (tx) => tx,
    signAllTransactions: async (txs) => txs
  },
  {
    name: 'slope',
    icon: '📈',
    isInstalled: detectWallet('slope'),
    connect: async () => ({ publicKey: new PublicKey(''), connected: false, connecting: false }),
    disconnect: async () => {},
    signTransaction: async (tx) => tx,
    signAllTransactions: async (txs) => txs
  },
  {
    name: 'coinbase',
    icon: '🔵',
    isInstalled: detectWallet('coinbase'),
    connect: async () => ({ publicKey: new PublicKey(''), connected: false, connecting: false }),
    disconnect: async () => {},
    signTransaction: async (tx) => tx,
    signAllTransactions: async (txs) => txs
  }
];

// Phantom wallet implementation
class PhantomWalletProvider implements WalletProvider {
  name = 'phantom';
  icon = '👻';
  isInstalled = false;
  private provider: any = null;

  constructor() {
    this.detectProvider();
  }

  private detectProvider() {
    if (typeof window !== 'undefined' && 'phantom' in window) {
      this.provider = (window as any).phantom?.solana;
      this.isInstalled = !!this.provider?.isPhantom;
    }
  }

  async connect(): Promise<WalletConnection> {
    if (!this.provider) throw new Error('Phantom not installed');
    
    try {
      const response = await this.provider.connect();
      return {
        publicKey: response.publicKey,
        connected: true,
        connecting: false
      };
    } catch (error: any) {
      throw new Error(`Failed to connect to Phantom: ${error.message}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.provider) {
      await this.provider.disconnect();
    }
  }

  async signTransaction(transaction: Transaction): Promise<Transaction> {
    if (!this.provider) throw new Error('Phantom not connected');
    return await this.provider.signTransaction(transaction);
  }

  async signAllTransactions(transactions: Transaction[]): Promise<Transaction[]> {
    if (!this.provider) throw new Error('Phantom not connected');
    return await this.provider.signAllTransactions(transactions);
  }
}

// Solflare wallet implementation
class SolflareWalletProvider implements WalletProvider {
  name = 'solflare';
  icon = '☀️';
  isInstalled = false;
  private provider: any = null;

  constructor() {
    this.detectProvider();
  }

  private detectProvider() {
    if (typeof window !== 'undefined' && 'solflare' in window) {
      this.provider = (window as any).solflare;
      this.isInstalled = !!this.provider?.isSolflare;
    }
  }

  async connect(): Promise<WalletConnection> {
    if (!this.provider) throw new Error('Solflare not installed');
    
    try {
      const response = await this.provider.connect();
      return {
        publicKey: response.publicKey,
        connected: true,
        connecting: false
      };
    } catch (error: any) {
      throw new Error(`Failed to connect to Solflare: ${error.message}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.provider) {
      await this.provider.disconnect();
    }
  }

  async signTransaction(transaction: Transaction): Promise<Transaction> {
    if (!this.provider) throw new Error('Solflare not connected');
    return await this.provider.signTransaction(transaction);
  }

  async signAllTransactions(transactions: Transaction[]): Promise<Transaction[]> {
    if (!this.provider) throw new Error('Solflare not connected');
    return await this.provider.signAllTransactions(transactions);
  }
}

// Backpack wallet implementation
class BackpackWalletProvider implements WalletProvider {
  name = 'backpack';
  icon = '🎒';
  isInstalled = false;
  private provider: any = null;

  constructor() {
    this.detectProvider();
  }

  private detectProvider() {
    if (typeof window !== 'undefined' && 'backpack' in window) {
      this.provider = (window as any).backpack;
      this.isInstalled = !!this.provider;
    }
  }

  async connect(): Promise<WalletConnection> {
    if (!this.provider) throw new Error('Backpack not installed');
    
    try {
      const response = await this.provider.connect();
      return {
        publicKey: response.publicKey,
        connected: true,
        connecting: false
      };
    } catch (error: any) {
      throw new Error(`Failed to connect to Backpack: ${error.message}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.provider) {
      await this.provider.disconnect();
    }
  }

  async signTransaction(transaction: Transaction): Promise<Transaction> {
    if (!this.provider) throw new Error('Backpack not connected');
    return await this.provider.signTransaction(transaction);
  }

  async signAllTransactions(transactions: Transaction[]): Promise<Transaction[]> {
    if (!this.provider) throw new Error('Backpack not connected');
    return await this.provider.signAllTransactions(transactions);
  }
}

// Glow wallet implementation
class GlowWalletProvider implements WalletProvider {
  name = 'glow';
  icon = '✨';
  isInstalled = false;
  private provider: any = null;

  constructor() {
    this.detectProvider();
  }

  private detectProvider() {
    if (typeof window !== 'undefined' && 'glow' in window) {
      this.provider = (window as any).glow;
      this.isInstalled = !!this.provider;
    }
  }

  async connect(): Promise<WalletConnection> {
    if (!this.provider) throw new Error('Glow not installed');
    
    try {
      const response = await this.provider.connect();
      return {
        publicKey: response.publicKey,
        connected: true,
        connecting: false
      };
    } catch (error: any) {
      throw new Error(`Failed to connect to Glow: ${error.message}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.provider) {
      await this.provider.disconnect();
    }
  }

  async signTransaction(transaction: Transaction): Promise<Transaction> {
    if (!this.provider) throw new Error('Glow not connected');
    return await this.provider.signTransaction(transaction);
  }

  async signAllTransactions(transactions: Transaction[]): Promise<Transaction[]> {
    if (!this.provider) throw new Error('Glow not connected');
    return await this.provider.signAllTransactions(transactions);
  }
}

// Universal Wallet Provider Component
export function UniversalWalletProvider({ children }: { children: React.ReactNode }) {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null);
  const [walletName, setWalletName] = useState<string | null>(null);
  const [currentProvider, setCurrentProvider] = useState<WalletProvider | null>(null);

  // Initialize wallet providers
  const [availableWallets, setAvailableWallets] = useState<WalletProvider[]>([]);
  const [installedWallets, setInstalledWallets] = useState<WalletProvider[]>([]);

  useEffect(() => {
    // Enhanced wallet detection with multiple attempts for mobile
    const detectWallets = () => {
      const providers: WalletProvider[] = [
        new PhantomWalletProvider(),
        new SolflareWalletProvider(),
        new BackpackWalletProvider(),
        new GlowWalletProvider(),
      ];

      // Re-detect wallet installation status
      providers.forEach(provider => {
        if (provider instanceof PhantomWalletProvider) {
          provider.isInstalled = detectWallet('phantom') || !!(window as any).phantomDetected;
        } else if (provider instanceof SolflareWalletProvider) {
          provider.isInstalled = detectWallet('solflare') || !!(window as any).solflareDetected;
        } else if (provider instanceof BackpackWalletProvider) {
          provider.isInstalled = detectWallet('backpack') || !!(window as any).backpackDetected;
        } else if (provider instanceof GlowWalletProvider) {
          provider.isInstalled = detectWallet('glow') || !!(window as any).glowDetected;
        }
      });

      const installed = providers.filter(wallet => wallet.isInstalled);
      
      setAvailableWallets(providers);
      setInstalledWallets(installed);
      
      console.log(`🔗 Detected ${installed.length} wallet(s):`, installed.map(w => w.name));
      console.log('🔍 All available wallets:', providers.map(w => `${w.name}: ${w.isInstalled ? '✅' : '❌'}`));
    };

    // Listen for mobile wallet detection events
    const handleMobileWalletsDetected = (event: any) => {
      console.log('📱 Mobile wallets detected:', event.detail);
      detectWallets();
    };

    // Detect wallets immediately and with multiple delays for mobile
    detectWallets();
    const timeoutId1 = setTimeout(detectWallets, 500);
    const timeoutId2 = setTimeout(detectWallets, 1500);
    const timeoutId3 = setTimeout(detectWallets, 3000);

    // Listen for mobile wallet detection events
    window.addEventListener('mobileWalletsDetected', handleMobileWalletsDetected);

    return () => {
      clearTimeout(timeoutId1);
      clearTimeout(timeoutId2);
      clearTimeout(timeoutId3);
      window.removeEventListener('mobileWalletsDetected', handleMobileWalletsDetected);
    };
  }, []);

  // Connect to a specific wallet
  const connect = useCallback(async (walletName: string) => {
    setConnecting(true);
    try {
      const provider = availableWallets.find(w => w.name === walletName);
      if (!provider) throw new Error(`Wallet ${walletName} not found`);

      const connection = await provider.connect();
      
      setConnected(connection.connected);
      setPublicKey(connection.publicKey);
      setWalletName(walletName);
      setCurrentProvider(provider);
      
    } catch (error: any) {
      console.error('Connection failed:', error);
      throw error;
    } finally {
      setConnecting(false);
    }
  }, [availableWallets]);

  // Disconnect from current wallet
  const disconnect = useCallback(async () => {
    if (currentProvider) {
      await currentProvider.disconnect();
    }
    
    setConnected(false);
    setPublicKey(null);
    setWalletName(null);
    setCurrentProvider(null);
  }, [currentProvider]);

  // Sign a transaction
  const signTransaction = useCallback(async (transaction: Transaction): Promise<Transaction> => {
    if (!currentProvider) throw new Error('No wallet connected');
    return await currentProvider.signTransaction(transaction);
  }, [currentProvider]);

  // Sign multiple transactions
  const signAllTransactions = useCallback(async (transactions: Transaction[]): Promise<Transaction[]> => {
    if (!currentProvider) throw new Error('No wallet connected');
    return await currentProvider.signAllTransactions(transactions);
  }, [currentProvider]);

  // Get a specific provider
  const getProvider = useCallback((walletName: string): WalletProvider | null => {
    return availableWallets.find(w => w.name === walletName) || null;
  }, [availableWallets]);

  const contextValue: UniversalWalletContextType = {
    connected,
    connecting,
    publicKey,
    walletName,
    availableWallets,
    installedWallets,
    connect,
    disconnect,
    signTransaction,
    signAllTransactions,
    getProvider
  };

  return (
    <UniversalWalletContext.Provider value={contextValue}>
      {children}
    </UniversalWalletContext.Provider>
  );
}

// Hook to use the universal wallet
export function useUniversalWallet(): UniversalWalletContextType {
  const context = useContext(UniversalWalletContext);
  if (!context) {
    throw new Error('useUniversalWallet must be used within UniversalWalletProvider');
  }
  return context;
}

// Wallet selector component
export function WalletSelector() {
  const { installedWallets, connect, connecting, connected, walletName, disconnect } = useUniversalWallet();

  if (connected) {
    return (
      <div style={{ padding: 16, background: '#f0f9ff', borderRadius: 8, border: '1px solid #0ea5e9' }}>
        <h3>🔗 Connected Wallet</h3>
        <p><strong>Wallet:</strong> {walletName}</p>
        <button 
          onClick={disconnect}
          style={{ 
            padding: '8px 16px', 
            background: '#ef4444', 
            color: 'white', 
            border: 'none', 
            borderRadius: 4,
            cursor: 'pointer'
          }}
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '20px', 
      background: 'rgba(255, 255, 255, 0.95)', 
      borderRadius: '12px', 
      border: '1px solid rgba(153, 69, 255, 0.2)',
      maxWidth: '400px',
      width: '100%',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h3 style={{ 
          margin: '0 0 8px 0', 
          color: '#1a1a1a', 
          fontSize: '1.2rem',
          fontWeight: '600'
        }}>🔗 Connect Wallet</h3>
        <p style={{ 
          margin: 0, 
          color: '#666', 
          fontSize: '0.9rem' 
        }}>Choose your preferred Solana wallet:</p>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {installedWallets.map((wallet) => (
          <button
            key={wallet.name}
            onClick={() => connect(wallet.name)}
            disabled={connecting}
            style={{
              padding: '16px 20px',
              background: connecting ? '#f1f5f9' : 'linear-gradient(135deg, #9945FF 0%, #14F195 100%)',
              color: connecting ? '#64748b' : 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: connecting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              fontSize: '16px',
              fontWeight: '600',
              transition: 'all 0.3s ease',
              boxShadow: connecting ? 'none' : '0 4px 16px rgba(153, 69, 255, 0.3)'
            }}
            onMouseEnter={(e) => {
              if (!connecting) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(153, 69, 255, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              if (!connecting) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(153, 69, 255, 0.3)';
              }
            }}
          >
            <span style={{ fontSize: '20px' }}>{wallet.icon}</span>
            <span>Connect {wallet.name.charAt(0).toUpperCase() + wallet.name.slice(1)}</span>
          </button>
        ))}
      </div>

      {installedWallets.length === 0 && (
        <div style={{ 
          padding: '16px', 
          background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', 
          borderRadius: '8px', 
          marginTop: '16px',
          border: '1px solid #f59e0b'
        }}>
          <p style={{ 
            margin: 0, 
            color: '#92400e', 
            fontSize: '0.9rem',
            textAlign: 'center',
            fontWeight: '500'
          }}>
            🔍 No Solana wallets detected. Please install Phantom, Solflare, or another Solana wallet from your app store.
          </p>
        </div>
      )}
    </div>
  );
}
