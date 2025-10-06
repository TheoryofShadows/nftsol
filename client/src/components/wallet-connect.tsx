import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { walletManager, type UniversalWallet, type WalletAdapter } from "@/utils/universal-wallet-adapter";

function formatWalletAddress(address: string) {
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

export default function WalletConnect() {
  const { toast } = useToast();
  const [connectedWallet, setConnectedWallet] = useState<UniversalWallet | null>(null);
  const [availableWallets, setAvailableWallets] = useState<WalletAdapter[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showWalletSelector, setShowWalletSelector] = useState(false);

  useEffect(() => {
    setAvailableWallets(walletManager.getAvailableWallets());

    const current = walletManager.getCurrentWallet() as UniversalWallet | null;
    if (current?.publicKey) {
      setConnectedWallet(current);
    }

    const handleWalletsChanged = (wallets: WalletAdapter[]) => {
      setAvailableWallets(wallets);
    };

    const handleConnect = () => {
      const active = walletManager.getCurrentWallet() as UniversalWallet | null;
      if (active?.publicKey) {
        setConnectedWallet(active);
        setIsConnecting(false);
        toast({
          title: "Wallet connected",
          description: formatWalletAddress(active.publicKey.toString()),
        });
      }
    };

    const handleDisconnect = () => {
      setConnectedWallet(null);
      setIsConnecting(false);
      toast({
        title: "Wallet disconnected",
        description: "You can reconnect at any time.",
      });
    };

    walletManager.on("walletsChanged", handleWalletsChanged);
    walletManager.on("connect", handleConnect);
    walletManager.on("disconnect", handleDisconnect);

    return () => {
      walletManager.off("walletsChanged", handleWalletsChanged);
      walletManager.off("connect", handleConnect);
      walletManager.off("disconnect", handleDisconnect);
    };
  }, [toast]);

  const installedWallets = useMemo(
    () => availableWallets.filter((wallet) => wallet.readyState === "Installed"),
    [availableWallets],
  );

  const detectableWallets = useMemo(
    () => availableWallets.filter((wallet) => wallet.readyState !== "Installed").slice(0, 4),
    [availableWallets],
  );

  const handleWalletSelect = async (walletId: string) => {
    try {
      setIsConnecting(true);
      const wallet = await walletManager.connectWallet(walletId);
      if (wallet?.publicKey) {
        setConnectedWallet(wallet);
        toast({
          title: "Wallet connected",
          description: formatWalletAddress(wallet.publicKey.toString()),
        });
      }
      setShowWalletSelector(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to connect wallet";
      toast({
        title: "Connection failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      if (connectedWallet) {
        await connectedWallet.disconnect();
      }
      setConnectedWallet(null);
      toast({
        title: "Wallet disconnected",
        description: "Wallet connection has been closed.",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to disconnect wallet";
      toast({
        title: "Disconnect failed",
        description: message,
        variant: "destructive",
      });
    }
  };

  const toggleSelector = () => setShowWalletSelector((prev) => !prev);

  if (connectedWallet?.publicKey) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="outline" className="text-xs sm:text-sm" disabled>
          {connectedWallet.wallet?.name || "Wallet"} · {formatWalletAddress(connectedWallet.publicKey.toString())}
        </Button>
        <Button variant="ghost" size="sm" onClick={handleDisconnect}>
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <div className="relative">
      <Button
        onClick={toggleSelector}
        disabled={isConnecting}
        className="bg-gradient-to-r from-purple-600 to-green-500 hover:opacity-80 text-white text-sm"
      >
        {isConnecting ? "Connecting..." : "Connect Wallet"}
      </Button>

      {showWalletSelector && (
        <div className="absolute right-0 mt-2 w-72 max-w-xs rounded-lg border border-gray-600 bg-gray-900 p-3 shadow-xl">
          <div className="text-sm font-medium text-white mb-2">Available Wallets</div>

          {installedWallets.length > 0 ? (
            <div className="space-y-2 mb-3">
              {installedWallets.map((wallet) => (
                <Button
                  key={wallet.name}
                  onClick={() => handleWalletSelect(wallet.name.toLowerCase())}
                  disabled={isConnecting}
                  className="w-full justify-between bg-green-600 hover:bg-green-700 text-white text-sm"
                >
                  <span>{wallet.name}</span>
                  <span className="text-xs opacity-80">Connect</span>
                </Button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 mb-3">No wallets detected. Install one to get started.</p>
          )}

          {detectableWallets.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-300">Install a Wallet</div>
              {detectableWallets.map((wallet) => (
                <Button
                  key={wallet.name}
                  onClick={() => handleWalletSelect(wallet.name.toLowerCase())}
                  disabled={isConnecting}
                  variant="outline"
                  className="w-full justify-between text-xs"
                >
                  <span>{wallet.name}</span>
                  <span className="opacity-70">Install</span>
                </Button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

