import UserNFTPortfolio from "@/components/user-nft-portfolio";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, AlertCircle } from "lucide-react";
import SimpleWalletButton from "@/components/simple-wallet-button";
import { useSolanaWallet } from "@/hooks/use-solana-wallet";

export default function Portfolio() {
  const { connected, walletAddress } = useSolanaWallet();

  if (!connected) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center justify-center text-white text-2xl">
                <Wallet className="w-8 h-8 mr-3 text-purple-400" />
                Connect Your Wallet
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-center">
                <AlertCircle className="w-16 h-16 text-yellow-500" />
              </div>
              
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-white">
                  View Your NFT Portfolio
                </h3>
                <p className="text-gray-400">
                  Connect your Solana wallet to view, manage, and list your NFTs on the marketplace.
                </p>
              </div>

              <div className="space-y-4">
                <div className="w-full flex justify-center">
                  <SimpleWalletButton />
                </div>
                
                <p className="text-sm text-gray-500">
                  Supported wallets: Phantom, Backpack, Solflare, Glow, and more
                </p>
              </div>

              <div className="border-t border-gray-700 pt-4">
                <h4 className="font-semibold text-white mb-3">What you can do:</h4>
                <ul className="text-left text-gray-400 space-y-2">
                  <li>• View all your Solana NFTs in one place</li>
                  <li>• List NFTs for sale on the marketplace</li>
                  <li>• Manage pricing and availability</li>
                  <li>• Track your portfolio value</li>
                  <li>• See transaction history</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <UserNFTPortfolio walletAddress={walletAddress || ""} />
    </div>
  );
}