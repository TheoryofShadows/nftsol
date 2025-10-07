import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sparkles, Brain } from "lucide-react";
import Logo from "./logo";
import { useAuth } from "@/hooks/use-auth";
import UnifiedOnboardingGuide from "./unified-onboarding-guide";
import SimpleWalletButton from "@/components/simple-wallet-button";

export default function Navbar() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [userInfo, setUserInfo] = useState<{ userId: string | null; username: string | null }>({ userId: null, username: null });
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const { user, logout } = useAuth();

  useEffect(() => {
    setIsClient(true);
    try {
      setUserInfo({
        userId: localStorage.getItem("userId"),
        username: localStorage.getItem("username")
      });
    } catch (error) {
      console.warn("Failed to load user info from localStorage:", error);
    }
  }, []);

  useEffect(() => {
    if (user) {
      setUserInfo({ userId: user.id, username: user.username });
    }
  }, [user]);

  const handleSearch = (query: string) => {
    if (query.trim()) {
      setLocation(`/marketplace?search=${encodeURIComponent(query.trim())}`);
      setIsMobileMenuOpen(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(searchQuery);
  };

  const handleLogout = () => {
    logout();
    setUserInfo({ userId: null, username: null });
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-gray-900/95 backdrop-blur-md border-b border-gray-800">
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex justify-between items-center h-14 md:h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="text-lg md:text-xl font-orbitron font-bold text-white hover:text-purple-400 transition-colors">
              NFT<span className="text-purple-400">Sol</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-4">
            <Link to="/" className="text-white hover:text-green-400 transition-colors duration-300 text-sm font-medium">
              Home
            </Link>
            <Link to="/marketplace" className="text-gray-300 hover:text-white transition-colors duration-300 text-sm font-medium">
              Marketplace
            </Link>
            <Link to="/create" className="text-gray-300 hover:text-white transition-colors duration-300 text-sm font-medium">
              Create
            </Link>
            <Link to="/mint-wizard" className="text-gray-300 hover:text-purple-400 transition-colors duration-300 text-sm font-medium flex items-center gap-1">
              <Sparkles className="w-4 h-4 text-purple-400" aria-hidden="true" /> AI Mint
            </Link>
            <Link to="/ai-studio" className="text-gray-300 hover:text-cyan-400 transition-colors duration-300 text-sm font-medium flex items-center gap-1">
              <Brain className="w-4 h-4 text-cyan-400" aria-hidden="true" /> AI Studio
            </Link>
            <Link to="/portfolio" className="text-gray-300 hover:text-white transition-colors duration-300 text-sm font-medium">
              Portfolio
            </Link>
            <Link to="/clout-about" className="text-yellow-400 hover:text-yellow-300 transition-colors duration-300 text-sm font-medium">
              CLOUT
            </Link>
            <Link to="/wallet" className="text-gray-300 hover:text-white transition-colors duration-300 text-sm font-medium">
              Wallet
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-300 hover:text-white transition-colors duration-300"
              onClick={() => setIsGuideOpen(true)}
            >
              Guide
            </Button>

            {isClient && userInfo.userId ? (
              <div className="flex items-center gap-4">
                <span className="text-green-400">{userInfo.username}</span>
                <button
                  onClick={handleLogout}
                  className="text-red-400 hover:text-red-300 transition-colors duration-300 text-sm"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link href="/auth" className="modern-btn">
                Login
              </Link>
            )}
          </div>

          {/* Mobile Wallet */}
          <div className="flex lg:hidden items-center">
            <SimpleWalletButton />
          </div>

          {/* Desktop Search */}
          <div className="hidden lg:flex items-center space-x-3">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder="Search NFTs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="modern-input w-48 xl:w-64"
                onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit(e)}
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </form>
            <SimpleWalletButton />
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center space-x-2">
            <button
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className="text-white hover:text-green-400 transition-colors duration-300 p-3 touch-target"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden modern-nav border-t border-white/10 absolute top-full left-0 right-0 z-30">
          <div className="px-4 py-6 space-y-4">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder="Search NFTs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="modern-input w-full"
                onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit(e)}
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </form>

            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/"
                className="text-white hover:text-green-400 transition-colors duration-300 text-center py-3 rounded bg-gray-800/50"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/marketplace"
                className="text-gray-300 hover:text-white transition-colors duration-300 text-center py-3 rounded bg-gray-800/50"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Marketplace
              </Link>
              <Link
                href="/create"
                className="text-gray-300 hover:text-white transition-colors duration-300 text-center py-3 rounded bg-gray-800/50"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Create NFT
              </Link>
              <Link
                href="/portfolio"
                className="text-gray-300 hover:text-white transition-colors duration-300 text-center py-3 rounded bg-gray-800/50"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Portfolio
              </Link>
              <Link
                href="/clout-about"
                className="text-yellow-400 hover:text-yellow-300 transition-colors duration-300 text-center py-3 rounded bg-yellow-600/10"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                CLOUT Token
              </Link>
              <Link
                href="/wallet"
                className="text-gray-300 hover:text-white transition-colors duration-300 text-center py-3 rounded bg-gray-800/50"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Wallet
              </Link>
              <button
                type="button"
                className="text-gray-300 hover:text-white transition-colors duration-300 text-center py-3 rounded bg-gray-800/50"
                onClick={() => {
                  setIsGuideOpen(true);
                  setIsMobileMenuOpen(false);
                }}
              >
                Platform Guide
              </button>
              {isClient && userInfo.userId ? (
                <div className="flex items-center justify-between py-2 col-span-2">
                  <span className="text-green-400">{userInfo.username}</span>
                  <button
                    onClick={handleLogout}
                    className="text-red-400 hover:text-red-300 transition-colors duration-300 text-sm"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <Link
                  href="/auth"
                  className="modern-btn text-center block col-span-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      <UnifiedOnboardingGuide isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
    </nav>
  );
}
