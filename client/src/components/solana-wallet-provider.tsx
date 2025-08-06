
import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { PublicKey } from '@solana/web3.js';
import { walletManager, UniversalWallet, WalletAdapter } from '../utils/universal-wallet-adapter';

interface UniversalWalletContextType {
  wallet: UniversalWallet | null;
  publicKey: PublicKey | null;
  connected: boolean;
  connecting: boolean;
  availableWallets: WalletAdapter[];
  connect: (walletName: string) => Promise<void>;
  disconnect: () => Promise<void>;
  sendTransaction: (transaction: any) => Promise<string>;
}

const UniversalWalletContext = createContext<UniversalWalletContextType>({
  wallet: null,
  publicKey: null,
  connected: false,
  connecting: false,
  availableWallets: [],
  connect: async () => {},
  disconnect: async () => {},
  sendTransaction: async () => ''
});

interface UniversalWalletProviderProps {
  children: ReactNode;
}

export function SolanaWalletProvider({ children }: UniversalWalletProviderProps) {
  const [wallet, setWallet] = useState<UniversalWallet | null>(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [availableWallets, setAvailableWallets] = useState<WalletAdapter[]>([]);
  const [isHydrating, setIsHydrating] = useState(true);

  useEffect(() => {
    // Initialize available wallets
    const wallets = walletManager.getAvailableWallets();
    setAvailableWallets(wallets);

    // Handle mobile redirect and localStorage hydration
    const handleWalletHydration = async () => {
      try {
        // Check for cached wallet info from mobile redirect
        const cachedPublicKey = localStorage.getItem('publicKey');
        const cachedWalletName = localStorage.getItem('walletName');
        const pendingConnection = localStorage.getItem('pendingWalletConnection');
        
        // Check if we're returning from a mobile wallet redirect
        const urlParams = new URLSearchParams(window.location.search);
        const fromWallet = urlParams.get('wallet') || pendingConnection;
        
        if (cachedPublicKey && fromWallet) {
          console.log('Attempting to restore wallet connection from mobile redirect');
          
          // Try to reconnect to the cached wallet
          try {
            const restoredWallet = await walletManager.connectWallet(fromWallet);
            if (restoredWallet && restoredWallet.publicKey?.toString() === cachedPublicKey) {
              setWallet(restoredWallet);
              setConnected(true);
              
              // Clean up URL params and pending connection
              window.history.replaceState({}, document.title, window.location.pathname);
              localStorage.removeItem('pendingWalletConnection');
              localStorage.removeItem('connectionTimestamp');
              
              console.log('Successfully restored wallet connection');
              return;
            }
          } catch (error) {
            console.log('Failed to restore cached wallet connection:', error);
          }
        }

        // Check for existing connection
        const currentWallet = walletManager.getCurrentWallet();
        if (currentWallet && currentWallet.isConnected) {
          setWallet(currentWallet);
          setConnected(true);
          
          // Store current connection info
          if (currentWallet.publicKey) {
            localStorage.setItem('publicKey', currentWallet.publicKey.toString());
            localStorage.setItem('walletName', currentWallet.name || 'unknown');
          }
        }
      } catch (error) {
        console.error('Error during wallet hydration:', error);
      } finally {
        setIsHydrating(false);
      }
    };

    // Delay hydration slightly to allow wallet injection
    const timer = setTimeout(handleWalletHydration, 500);
    return () => clearTimeout(timer);

    // Setup event listeners
    const handleConnect = (connectedWallet?: UniversalWallet) => {
      setConnected(true);
      setConnecting(false);
      
      // Store wallet info for mobile redirect recovery
      if (connectedWallet?.publicKey) {
        localStorage.setItem('publicKey', connectedWallet.publicKey.toString());
        localStorage.setItem('walletName', connectedWallet.name || 'unknown');
        localStorage.setItem('walletConnectedAt', Date.now().toString());
      }
    };

    const handleDisconnect = () => {
      setConnected(false);
      setWallet(null);
      setConnecting(false);
      
      // Clear stored wallet info
      localStorage.removeItem('publicKey');
      localStorage.removeItem('walletName');
      localStorage.removeItem('walletConnectedAt');
      localStorage.removeItem('pendingWalletConnection');
      localStorage.removeItem('connectionTimestamp');
    };

    const handleWalletsChanged = (wallets: WalletAdapter[]) => {
      setAvailableWallets(wallets);
    };

    walletManager.on('connect', handleConnect);
    walletManager.on('disconnect', handleDisconnect);
    walletManager.on('walletsChanged', handleWalletsChanged);

    return () => {
      walletManager.off('connect', handleConnect);
      walletManager.off('disconnect', handleDisconnect);
      walletManager.off('walletsChanged', handleWalletsChanged);
    };
  }, []);

  const connect = async (walletName: string) => {
    try {
      setConnecting(true);
      
      // Store pending connection for mobile redirect recovery
      localStorage.setItem('pendingWalletConnection', walletName);
      localStorage.setItem('connectionTimestamp', Date.now().toString());
      
      const connectedWallet = await walletManager.connectWallet(walletName);
      setWallet(connectedWallet);
      setConnected(true);
      
      // Store successful connection info
      if (connectedWallet?.publicKey) {
        localStorage.setItem('publicKey', connectedWallet.publicKey.toString());
        localStorage.setItem('walletName', walletName);
        localStorage.setItem('walletConnectedAt', Date.now().toString());
      }
      
      // Clear pending connection
      localStorage.removeItem('pendingWalletConnection');
      localStorage.removeItem('connectionTimestamp');
      
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      
      // Check if it's a mobile redirect scenario
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      if (isMobile && error.message?.includes('Redirected to')) {
        // Don't clear connecting state for mobile redirects
        console.log('Mobile wallet redirect initiated');
        return;
      }
      
      // Clear pending connection on real errors
      localStorage.removeItem('pendingWalletConnection');
      localStorage.removeItem('connectionTimestamp');
      throw error;
    } finally {
      // Only clear connecting if not a mobile redirect
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      if (!isMobile) {
        setConnecting(false);
      }
    }
  };

  const disconnect = async () => {
    try {
      if (wallet) {
        await wallet.disconnect();
      }
      setWallet(null);
      setConnected(false);
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
      throw error;
    }
  };

  const sendTransaction = async (transaction: any) => {
    if (!wallet) {
      throw new Error('Wallet not connected');
    }
    return await wallet.sendTransaction(transaction);
  };

  const value: UniversalWalletContextType = {
    wallet,
    publicKey: wallet?.publicKey || null,
    connected,
    connecting: connecting || isHydrating,
    availableWallets,
    connect,
    disconnect,
    sendTransaction
  };

  return (
    <UniversalWalletContext.Provider value={value}>
      {children}
    </UniversalWalletContext.Provider>
  );
}

export function useUniversalWallet() {
  const context = useContext(UniversalWalletContext);
  if (!context) {
    throw new Error('useUniversalWallet must be used within a SolanaWalletProvider');
  }
  return context;
}

// Legacy hook for backward compatibility
export function useSolanaWallet() {
  const endpoint = import.meta.env.VITE_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
  const { wallet, publicKey, connected } = useUniversalWallet();
  
  return {
    endpoint,
    wallet,
    publicKey,
    connected
  };
}
