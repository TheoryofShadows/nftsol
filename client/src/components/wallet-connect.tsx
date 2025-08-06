import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { walletManager, UniversalWallet, WalletAdapter } from "@/utils/universal-wallet-adapter";

export default function WalletConnect() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectedWallet, setConnectedWallet] = useState<UniversalWallet | null>(null);
  const [availableWallets, setAvailableWallets] = useState<WalletAdapter[]>([]);
  const [showWalletSelector, setShowWalletSelector] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [cloutBalance, setCloutBalance] = useState<number | null>(null);
  const [retryAttempts, setRetryAttempts] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  useEffect(() => {
    initializeWallets();
  }, []);

  const initializeWallets = async () => {
    try {
      // Give wallets time to inject on mobile
      if (isMobile) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const wallets = walletManager.getAvailableWallets();
      setAvailableWallets(wallets);

      // Check for existing connection
      checkExistingConnection();

      // Setup event listeners
      setupEventListeners();

      // Handle mobile redirect recovery
      handleMobileRedirectRecovery();
    } catch (error) {
      console.error('Failed to initialize wallets:', error);
    }
  };

  const checkExistingConnection = () => {
    const currentWallet = walletManager.getCurrentWallet();
    if (currentWallet && currentWallet.isConnected && currentWallet.publicKey) {
      setIsConnected(true);
      setConnectedWallet({
        publicKey: currentWallet.publicKey,
        connected: true,
        connecting: false,
        disconnecting: false,
        wallet: null,
        connect: async () => {},
        disconnect: async () => {},
        sendTransaction: async () => '',
        signTransaction: async (tx) => tx,
        signAllTransactions: async (txs) => txs,
        signMessage: async (msg) => msg
      });
      fetchBalance(currentWallet.publicKey.toString());
    }
  };

  const setupEventListeners = () => {
    const handleWalletsChanged = (wallets: WalletAdapter[]) => {
      setAvailableWallets(wallets);
    };

    const handleConnect = (publicKey: any) => {
      setIsConnected(true);
      setIsConnecting(false);
      fetchBalance(publicKey.toString());
      toast({
        title: "Wallet Connected! 🎉",
        description: `Connected to ${publicKey.toString().slice(0, 4)}...${publicKey.toString().slice(-4)}`,
      });
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      setConnectedWallet(null);
      setBalance(null);
      setCloutBalance(null);
      setShowWalletSelector(false);
      setIsConnecting(false);
      toast({
        title: "Wallet Disconnected",
        description: "Successfully disconnected from wallet",
      });
    };

    const handleAccountChanged = (publicKey: any) => {
      if (publicKey) {
        fetchBalance(publicKey.toString());
        toast({
          title: "Account Switched",
          description: `Switched to ${publicKey.toString().slice(0, 6)}...${publicKey.toString().slice(-4)}`,
        });
      }
    };

    walletManager.on('walletsChanged', handleWalletsChanged);
    walletManager.on('connect', handleConnect);
    walletManager.on('disconnect', handleDisconnect);
    walletManager.on('accountChanged', handleAccountChanged);

    return () => {
      walletManager.off('walletsChanged', handleWalletsChanged);
      walletManager.off('connect', handleConnect);
      walletManager.off('disconnect', handleDisconnect);
      walletManager.off('accountChanged', handleAccountChanged);
    };
  };

  // Close dropdown when clicking outside and handle window focus for mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowWalletSelector(false);
      }
    };

    const handleWindowFocus = () => {
      // Check for wallet connection when returning from mobile wallet app
      if (isMobile) {
        setTimeout(() => {
          walletManager.detectWallets();
          checkExistingConnection();
        }, 500);
      }
    };

    if (showWalletSelector) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    // Add window focus listener for mobile wallet detection
    if (isMobile) {
      window.addEventListener('focus', handleWindowFocus);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (isMobile) {
        window.removeEventListener('focus', handleWindowFocus);
      }
    };
  }, [showWalletSelector, isMobile]);

  const fetchBalance = async (pubKey: string) => {
    try {
      const rpcUrl = import.meta.env.VITE_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getBalance',
          params: [pubKey]
        })
      });
      const data = await response.json();
      if (data.result) {
        setBalance(data.result.value / 1000000000); // Convert lamports to SOL
      }
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    }
  };

  const handleWalletSelect = async (walletId: string) => {
    try {
      setIsConnecting(true);
      setShowWalletSelector(false);
      setRetryAttempts(0);

      const wallet = await walletManager.connectWallet(walletId);
      setConnectedWallet(wallet);
      setIsConnected(true);

      if (wallet.publicKey) {
        await fetchBalance(wallet.publicKey.toString());
        await connectToBackendWallet(wallet.publicKey.toString());
      }

      toast({
        title: "Wallet Connected Successfully! 🎉",
        description: `Connected to ${wallet.wallet?.name}`,
      });
    } catch (error: any) {
      console.error('Wallet connection failed:', error);
      console.error('Error details:', { 
        message: error.message, 
        name: error.name, 
        stack: error.stack,
        walletId 
      });

      let errorMessage = "Failed to connect wallet";
      let showRetry = false;

      if (error.message.includes('not installed')) {
        const walletInfo = availableWallets.find(w => w.name.toLowerCase() === walletId);
        errorMessage = `${walletInfo?.name || 'Wallet'} is not installed. Redirecting to installation...`;
      } else if (error.message.includes('rejected') || error.message.includes('cancelled')) {
        errorMessage = "Connection cancelled by user";
      } else if (error.message.includes('Complete the connection') || error.message.includes('Opening Phantom app')) {
        errorMessage = error.message;
        if (isMobile) {
          showRetry = true;
          if (walletId === 'phantom') {
            errorMessage = "Opening Phantom app. If you don't have Phantom installed, install it first, then return here and retry.";
          }

          // The connection tracking is already set in the adapter

          // Set up enhanced mobile reconnection monitoring
          const checkMobileConnection = () => {
            walletManager.detectWallets();
            const currentWallet = walletManager.getCurrentWallet();

            if (currentWallet?.isConnected && currentWallet?.publicKey) {
              setIsConnected(true);
              setConnectedWallet({
                publicKey: currentWallet.publicKey,
                connected: true,
                connecting: false,
                disconnecting: false,
                wallet: { name: walletId, icon: '', url: '', readyState: 'Installed' },
                connect: async () => {},
                disconnect: async () => {},
                sendTransaction: async () => '',
                signTransaction: async (tx) => tx,
                signAllTransactions: async (txs) => txs,
                signMessage: async (msg) => msg
              });

              fetchBalance(currentWallet.publicKey.toString());
              connectToBackendWallet(currentWallet.publicKey.toString());
              localStorage.removeItem('pendingWalletConnection');
              localStorage.removeItem('connectionTimestamp');

              toast({
                title: "Wallet Connected! 🎉",
                description: `Successfully connected to ${walletId}`,
              });

              return true;
            }
            return false;
          };

          // Multiple reconnection attempts with exponential backoff
          const intervals = [2000, 5000, 10000, 20000, 30000];
          intervals.forEach((delay) => {
            setTimeout(checkMobileConnection, delay);
          });
        }
      } else if (error.message.includes('pending')) {
        errorMessage = "Please check your wallet - a connection request is pending";
        showRetry = true;
      } else {
        errorMessage = error.message || "Failed to connect wallet";
        showRetry = true;
      }

      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive",
        action: showRetry ? (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleWalletSelect(walletId)}
          >
            Retry
          </Button>
        ) : undefined
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const connectToBackendWallet = async (publicKey: string) => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) return;

      const response = await fetch('/api/wallet/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, publicKey })
      });

      if (response.ok) {
        const data = await response.json();
        setCloutBalance(data.wallet?.cloutBalance || 0);

        const rewards = [{
          amount: 100,
          reason: "Welcome bonus",
          timestamp: new Date()
        }];
        localStorage.setItem('pendingCloutRewards', JSON.stringify(rewards));

        toast({
          title: "🎊 Welcome Bonus Received!",
          description: `You've earned 100 CLOUT tokens! Total: ${data.wallet?.cloutBalance || 100} CLOUT`,
        });
      }
    } catch (error) {
      console.error('Failed to connect backend wallet:', error);
    }
  };

  const handleDisconnect = async () => {
    if (connectedWallet) {
      try {
        await connectedWallet.disconnect();
        // Events will handle state updates
      } catch (error) {
        console.error('Wallet disconnect failed:', error);
        toast({
          title: "Disconnect Failed",
          description: "Failed to disconnect wallet",
          variant: "destructive"
        });
      }
    }
  };

  const handleRefreshWallets = () => {
    window.location.reload();
  };

  const handleMobileRedirectRecovery = () => {
    if (isMobile) {
      const pendingConnection = localStorage.getItem('pendingWalletConnection');
      const connectionTime = localStorage.getItem('connectionTimestamp');
      const cachedPublicKey = localStorage.getItem('publicKey');
      const fromWallet = new URLSearchParams(window.location.search).get('fromWallet');
      const walletConnected = new URLSearchParams(window.location.search).get('walletConnected');

      if (pendingConnection && connectionTime) {
        const timeSinceConnection = Date.now() - parseInt(connectionTime);

        // If less than 5 minutes and we have a cached key, attempt recovery
        if (timeSinceConnection < 300000 && (cachedPublicKey || fromWallet || walletConnected === 'true')) {
          setIsConnecting(true);

          console.log('Attempting mobile wallet recovery...');

          // Clean URL if needed
          if (fromWallet || walletConnected) {
            window.history.replaceState({}, document.title, window.location.pathname);
          }

          // Give extra time for mobile wallets to initialize and inject
          setTimeout(async () => {
            try {
              const targetWallet = pendingConnection || fromWallet || 'phantom';

              // Check if wallet is already connected
              const currentWallet = walletManager.getCurrentWallet();
              if (currentWallet && currentWallet.isConnected) {
                setConnectedWallet(currentWallet);
                setIsConnected(true);
                setIsConnecting(false);

                // Update stored info
                if (currentWallet.publicKey) {
                  localStorage.setItem('publicKey', currentWallet.publicKey.toString());
                  localStorage.setItem('walletName', currentWallet.name || targetWallet);
                }

                toast({
                  title: "Wallet Restored! 🎉",
                  description: `Successfully restored connection to ${currentWallet.name || targetWallet}`,
                });
              } else {
                // Attempt to reconnect
                await handleConnect(targetWallet);
                toast({
                  title: "Wallet Reconnected! 🎉",
                  description: `Successfully reconnected to ${targetWallet}`,
                });
              }

              // Clean up recovery data
              localStorage.removeItem('pendingWalletConnection');
              localStorage.removeItem('connectionTimestamp');

            } catch (error) {
              console.error('Mobile wallet recovery failed:', error);
              setIsConnecting(false);

              // Clean up on failure
              localStorage.removeItem('pendingWalletConnection');
              localStorage.removeItem('connectionTimestamp');

              toast({
                title: "Connection Recovery Failed",
                description: "Please try connecting again manually",
                variant: "destructive",
              });
            }
          }, 1500);
        } else {
          // Clear old connection attempt
          localStorage.removeItem('pendingWalletConnection');
          localStorage.removeItem('connectionTimestamp');
          localStorage.removeItem('publicKey');
          localStorage.removeItem('walletName');
        }
      }
    }
  };

  if (isConnected && connectedWallet && connectedWallet.publicKey) {
    return (
      <div className="flex items-center space-x-2">
        <div className="flex flex-col items-end">
          <div className="text-xs text-gray-300 font-mono">
            {connectedWallet.publicKey.toString().slice(0, 4)}...{connectedWallet.publicKey.toString().slice(-4)}
          </div>
          {balance !== null && (
            <div className="text-xs text-green-400">
              {balance.toFixed(3)} SOL
            </div>
          )}
          {cloutBalance !== null && (
            <div className="text-xs text-purple-400">
              {cloutBalance.toLocaleString()} CLOUT
            </div>
          )}
        </div>
        <div className="relative" ref={dropdownRef}>
          <Button
            onClick={() => setShowWalletSelector(!showWalletSelector)}
            className="bg-gradient-to-r from-blue-600 to-purple-500 hover:opacity-80 px-2 py-1.5 rounded-md text-sm font-medium transition-all duration-300 text-white"
            title="Wallet Options"
            size="sm"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </Button>
          {showWalletSelector && (
            <div className={`
              ${isMobile 
                ? 'fixed bottom-4 left-4 right-4 z-[9999] max-h-[70vh]' 
                : 'absolute right-0 top-full mt-2 z-50 min-w-48'
              } 
              bg-gray-800/95 backdrop-blur border border-gray-600 rounded-lg shadow-lg p-3
            `}>
              <div className="text-sm text-gray-300 mb-3">Wallet Options:</div>
              <Button
                onClick={handleDisconnect}
                className="w-full bg-red-600 hover:bg-red-700 text-white text-sm py-2 px-3 rounded"
              >
                Disconnect Wallet
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const installedWallets = availableWallets.filter(w => w.readyState === 'Installed');
  const notDetectedWallets = availableWallets.filter(w => w.readyState === 'NotDetected');

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        onClick={() => setShowWalletSelector(!showWalletSelector)}
        disabled={isConnecting}
        className="bg-gradient-to-r from-purple-600 to-green-500 hover:opacity-80 px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 text-white"
        size="sm"
      >
        <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
        {isConnecting ? "Connecting..." : "Connect Wallet"}
      </Button>

      {showWalletSelector && (
        <div className={`
          ${isMobile 
            ? 'fixed bottom-4 left-4 right-4 z-[9999] max-h-[80vh]' 
            : 'absolute right-0 top-full mt-2 z-50 min-w-72 max-h-[80vh]'
          } 
          bg-gray-800/95 backdrop-blur border border-gray-600 rounded-lg shadow-lg p-4 overflow-y-auto
        `}>
          {/* Mobile Instructions */}
          {isMobile && (
            <div className="bg-blue-900/30 border border-blue-600 rounded-lg p-3 mb-4">
              <div className="text-xs text-blue-300 font-semibold mb-2">📱 Mobile Device</div>
              <div className="text-xs text-blue-200">
                {isIOS ? 
                  "On iOS, you'll be redirected to your wallet app. Return here after connecting." :
                  "You'll be redirected to complete the connection. Return here after connecting."
                }
              </div>
            </div>
          )}

          {/* Installed Wallets */}
          {installedWallets.length > 0 && (
            <div className="space-y-2 mb-4">
              <div className="text-sm text-green-400 mb-2">✅ Ready to Connect:</div>
              {installedWallets.map((wallet) => (
                <Button
                  key={wallet.name}
                  onClick={() => handleWalletSelect(wallet.name.toLowerCase())}
                  disabled={isConnecting}
                  className="w-full bg-green-600 hover:bg-green-700 text-white text-sm py-3 px-3 rounded flex items-center justify-between"
                >
                  <span className="truncate">{wallet.name}</span>
                  <span className="text-xs opacity-75">Connect</span>
                </Button>
              ))}
            </div>
          )}

          {/* Available Wallets */}
          {notDetectedWallets.length > 0 && (
            <div className="space-y-2 mb-4">
              <div className="text-sm text-orange-400 mb-2">
                {installedWallets.length > 0 ? "📱 More Options:" : "📱 Install a Wallet:"}
              </div>
              {notDetectedWallets.slice(0, 4).map((wallet) => (
                <Button
                  key={wallet.name}
                  onClick={() => handleWalletSelect(wallet.name.toLowerCase())}
                  disabled={isConnecting}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white text-sm py-3 px-3 rounded flex items-center justify-between"
                >
                  <span className="truncate">{wallet.name}</span>
                  <span className="text-xs opacity-75">
                    {isMobile ? "Get App" : "Install"}
                  </span>
                </Button>
              ))}
            </div>
          )}

          {/* Refresh Button */}
          <div className="border-t border-gray-700 pt-3">
            <Button
              onClick={handleRefreshWallets}
              variant="outline"
              className="w-full text-xs"
            >
              Refresh Page (if wallet was just installed)
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}