import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { simpleWalletConnector, SimpleWallet } from "@/utils/simple-wallet-connector";

export default function SimpleWalletButton() {
  const [wallet, setWallet] = useState<SimpleWallet | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check for existing connection
    const currentWallet = simpleWalletConnector.getCurrentWallet();
    if (currentWallet) {
      setWallet(currentWallet);
    }

    // Check for mobile reconnection on page load
    setTimeout(() => {
      simpleWalletConnector.checkForMobileReconnection();
    }, 1000);

    // Set up event listeners
    const handleConnect = (connectedWallet: SimpleWallet) => {
      setWallet(connectedWallet);
      setIsConnecting(false);
      toast({
        title: "Wallet Connected! 🎉",
        description: `Connected to ${connectedWallet.name}`,
      });
    };

    const handleDisconnect = () => {
      setWallet(null);
      setIsConnecting(false);
      toast({
        title: "Wallet Disconnected",
        description: "Successfully disconnected from wallet",
      });
    };

    simpleWalletConnector.on('connect', handleConnect);
    simpleWalletConnector.on('disconnect', handleDisconnect);

    return () => {
      simpleWalletConnector.off('connect', handleConnect);
      simpleWalletConnector.off('disconnect', handleDisconnect);
    };
  }, [toast]);

  const handleConnect = async () => {
    if (isConnecting) return; // Prevent double clicks

    setIsConnecting(true);
    try {
      await simpleWalletConnector.connectWallet();
    } catch (error: any) {
      setIsConnecting(false);

      if (error.message.includes('Redirected to')) {
        toast({
          title: "Opening Wallet App",
          description: error.message,
        });
      } else if (error.message.includes('No wallet found')) {
        toast({
          title: "No Wallet Found",
          description: "Please install a Solana wallet (Phantom, Solflare, or Backpack)",
          action: (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('https://phantom.app', '_blank')}
            >
              Get Phantom
            </Button>
          )
        });
      } else {
        toast({
          title: "Connection Failed",
          description: error.message,
          variant: "destructive"
        });
      }
    }
  };

  const handleDisconnect = async () => {
    try {
      await simpleWalletConnector.disconnect();
    } catch (error: any) {
      toast({
        title: "Disconnect Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (wallet) {
    return (
      <div className="flex items-center space-x-2">
        <div className="flex flex-col items-end">
          <div className="text-xs text-gray-300 font-mono">
            {wallet.publicKey.slice(0, 4)}...{wallet.publicKey.slice(-4)}
          </div>
          <div className="text-xs text-green-400">{wallet.name}</div>
        </div>
        <Button
          onClick={handleDisconnect}
          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 text-sm"
          size="sm"
        >
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={handleConnect}
      disabled={isConnecting}
      className="bg-gradient-to-r from-purple-600 to-green-500 hover:opacity-80 px-4 py-2 text-sm font-medium text-white"
      size="sm"
    >
      {isConnecting ? "Connecting..." : "Connect Wallet"}
    </Button>
  );
}