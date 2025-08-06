import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import RealNFTMarketplace from "@/components/real-nft-marketplace";
import PlatformRevenueDashboard from "@/components/platform-revenue-dashboard";
import WalletConnect from "@/components/wallet-connect";

export default function MarketplacePage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="modern-nav sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white modern-btn">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
              <div className="text-2xl font-orbitron font-bold bg-gradient-to-r from-purple-400 to-green-400 bg-clip-text text-transparent">
                NFTSol
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <WalletConnect />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="space-y-12">
        <div className="w-full">
          <RealNFTMarketplace />
        </div>

        {/* Platform Revenue Section */}
        <section className="modern-section py-12 modern-nav">
          <div className="container mx-auto px-4">
            <PlatformRevenueDashboard />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="modern-nav mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-300">
            <p>&copy; 2025 NFTSol. Built on Solana blockchain with modern web3 technology.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}