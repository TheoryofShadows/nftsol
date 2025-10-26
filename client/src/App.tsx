import { useState } from "react";
import { UniversalWalletProvider, WalletSelector } from "./wallet/UniversalWalletAdapter";
import { Button } from "./components/ui/button";
import { Card, CardContent } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Search, Menu, X } from "lucide-react";
import "./globals.css";

// Import existing components
import NFTMarketplace from "./components/NFTMarketplace";
import MintForm from "./components/MintForm";

export default function App() {
  const [activeTab, setActiveTab] = useState<'marketplace' | 'mint'>('marketplace');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <UniversalWalletProvider>
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-solana-dark to-black">
        {/* Header */}
        <header className="sticky top-0 z-50 w-full border-b border-solana-purple/20 bg-solana-dark/80 backdrop-blur-md">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              {/* Logo */}
              <div className="flex items-center space-x-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg solana-gradient">
                  <span className="text-lg font-bold text-white">N</span>
                </div>
                <span className="text-xl font-bold text-white">NFTSol</span>
              </div>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center space-x-8">
                <Button
                  variant={activeTab === 'marketplace' ? 'solana' : 'ghost'}
                  onClick={() => setActiveTab('marketplace')}
                  className="text-white"
                >
                  Marketplace
                </Button>
                <Button
                  variant={activeTab === 'mint' ? 'solana' : 'ghost'}
                  onClick={() => setActiveTab('mint')}
                  className="text-white"
                >
                  Mint NFT
                </Button>
              </nav>

              {/* Search Bar - Desktop */}
              <div className="hidden lg:flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search NFTs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64 pl-10 bg-solana-gray/50 border-solana-purple/20 text-white placeholder:text-muted-foreground"
                  />
                </div>
                <WalletSelector />
              </div>

              {/* Mobile Menu Button */}
              <div className="flex items-center space-x-2 md:hidden">
                <WalletSelector />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="text-white"
                >
                  {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </Button>
              </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
              <div className="md:hidden border-t border-solana-purple/20 py-4">
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search NFTs..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 bg-solana-gray/50 border-solana-purple/20 text-white placeholder:text-muted-foreground"
                    />
                  </div>
                  <div className="flex flex-col space-y-2">
                    <Button
                      variant={activeTab === 'marketplace' ? 'solana' : 'ghost'}
                      onClick={() => {
                        setActiveTab('marketplace');
                        setIsMobileMenuOpen(false);
                      }}
                      className="justify-start text-white"
                    >
                      Marketplace
                    </Button>
                    <Button
                      variant={activeTab === 'mint' ? 'solana' : 'ghost'}
                      onClick={() => {
                        setActiveTab('mint');
                        setIsMobileMenuOpen(false);
                      }}
                      className="justify-start text-white"
                    >
                      Mint NFT
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === 'marketplace' && (
            <div className="space-y-8">
              {/* Hero Section */}
              <div className="text-center space-y-4">
                <h1 className="text-4xl md:text-6xl font-bold text-white">
                  Discover & Trade
                  <span className="block solana-gradient bg-clip-text text-transparent">
                    Solana NFTs
                  </span>
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  Explore the most innovative NFT collections on Solana. 
                  Buy, sell, and mint with lightning-fast transactions.
                </p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="nft-card">
                  <CardContent className="p-6 text-center">
                    <div className="text-3xl font-bold text-solana-purple">1.2K+</div>
                    <div className="text-muted-foreground">NFTs Listed</div>
                  </CardContent>
                </Card>
                <Card className="nft-card">
                  <CardContent className="p-6 text-center">
                    <div className="text-3xl font-bold text-solana-teal">500+</div>
                    <div className="text-muted-foreground">Active Users</div>
                  </CardContent>
                </Card>
                <Card className="nft-card">
                  <CardContent className="p-6 text-center">
                    <div className="text-3xl font-bold text-solana-purple">2.5K</div>
                    <div className="text-muted-foreground">SOL Volume</div>
                  </CardContent>
                </Card>
              </div>

              {/* NFT Marketplace */}
              <NFTMarketplace searchQuery={searchQuery} />
            </div>
          )}

          {activeTab === 'mint' && (
            <div className="max-w-2xl mx-auto">
              <div className="text-center space-y-4 mb-8">
                <h1 className="text-4xl font-bold text-white">
                  Create Your
                  <span className="block solana-gradient bg-clip-text text-transparent">
                    Unique NFT
                  </span>
                </h1>
                <p className="text-xl text-muted-foreground">
                  Mint your own NFT on Solana with just a few clicks.
                </p>
              </div>
              <MintForm />
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-solana-purple/20 bg-solana-dark/50 backdrop-blur-md mt-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center text-muted-foreground">
              <p>&copy; 2024 NFTSol. Built on Solana with ❤️</p>
            </div>
          </div>
        </footer>
      </div>
    </UniversalWalletProvider>
  );
}
