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

// Enhanced wallet detection
const detectWallet = (walletName: string): boolean => {
  if (typeof window === 'undefined') return false;
  
  switch (walletName) {
    case 'phantom':
      return !!(window as any).phantom?.solana?.isPhantom;
    case 'solflare':
      return !!(window as any).solflare?.isSolflare;
    case 'backpack':
      return !!(window as any).backpack;
    case 'glow':
      return !!(window as any).glow;
    case 'sollet':
      return !!(window as any).sollet;
    case 'slope':
      return !!(window as any).Slope;
    case 'torus':
      return !!(window as any).torus;
    case 'coinbase':
      return !!(window as any).coinbaseSolana;
    case 'ledger':
      return !!(window as any).solana?.isLedger;
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
    // Delay wallet detection to ensure window object is fully loaded
    const detectWallets = () => {
      const providers: WalletProvider[] = [
        new PhantomWalletProvider(),
        new SolflareWalletProvider(),
        new BackpackWalletProvider(),
        new GlowWalletProvider(),
      ];

      const installed = providers.filter(wallet => wallet.isInstalled);
      
      setAvailableWallets(providers);
      setInstalledWallets(installed);
      
      console.log(`🔗 Detected ${installed.length} wallet(s):`, installed.map(w => w.name));
    };

    // Detect wallets immediately and after a short delay
    detectWallets();
    const timeoutId = setTimeout(detectWallets, 1000);

    return () => clearTimeout(timeoutId);
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
    <div style={{ padding: 16, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
      <h3>🔗 Connect Wallet</h3>
      <p>Choose your preferred Solana wallet:</p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
        {installedWallets.map((wallet) => (
          <button
            key={wallet.name}
            onClick={() => connect(wallet.name)}
            disabled={connecting}
            style={{
              padding: '12px 16px',
              background: connecting ? '#f1f5f9' : '#3b82f6',
              color: connecting ? '#64748b' : 'white',
              border: 'none',
              borderRadius: 6,
              cursor: connecting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 16,
              fontWeight: 500
            }}
          >
            <span>{wallet.icon}</span>
            <span>Connect {wallet.name.charAt(0).toUpperCase() + wallet.name.slice(1)}</span>
          </button>
        ))}
      </div>

      {installedWallets.length === 0 && (
        <div style={{ padding: 16, background: '#fef3c7', borderRadius: 6, marginTop: 12 }}>
          <p style={{ margin: 0, color: '#92400e' }}>
            No Solana wallets detected. Please install Phantom, Solflare, or another Solana wallet.
          </p>
        </div>
      )}
    </div>
  );
}
