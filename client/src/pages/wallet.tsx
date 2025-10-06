import { useState, useEffect } from "react";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import WalletConnect from "@/components/wallet-connect";
import WalletDashboard from "@/components/wallet-dashboard";
import PlatformWalletDashboard from "@/components/platform-wallet-dashboard";
import WalletAnalytics from "@/components/wallet-analytics";

export default function WalletPage() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Get user ID from localStorage (set after login)
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      setUserId(storedUserId);
    } else {
      // If no user ID, redirect to auth page
      window.location.href = '/auth';
    }
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-3 py-3 md:px-4 md:py-4">
          <div className="flex flex-col space-y-3 md:flex-row md:items-center md:justify-between md:space-y-0">
            <div className="flex items-center space-x-2 md:space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                  <ArrowLeft className="w-4 h-4 mr-1 md:mr-2" />
                  <span className="hidden sm:inline">Back to Home</span>
                  <span className="sm:hidden">Back</span>
                </Button>
              </Link>
              <div className="text-lg md:text-2xl font-bold bg-gradient-to-r from-purple-600 to-green-500 bg-clip-text text-transparent">
                <span className="hidden sm:inline">Wallet Dashboard</span>
                <span className="sm:hidden">Wallet</span>
              </div>
            </div>
            
            <div className="flex items-center">
              <WalletConnect />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {userId ? (
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="personal">Personal Wallet</TabsTrigger>
              <TabsTrigger value="platform">Platform Management</TabsTrigger>
            </TabsList>
            
            <TabsContent value="personal" className="mt-6">
              <div className="space-y-6">
                <WalletDashboard userId={userId} />
                {/* Add Solscan-powered wallet analytics if connected */}
                {window.solana?.publicKey && (
                  <WalletAnalytics 
                    walletAddress={window.solana.publicKey.toString()} 
                    showAnalytics={true}
                  />
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="platform" className="mt-6">
              <PlatformWalletDashboard />
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400">Loading wallet dashboard...</p>
          </div>
        )}
      </main>
    </div>
  );
}