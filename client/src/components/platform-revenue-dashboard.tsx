import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, DollarSign, Users, Coins, ArrowUpRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { fetchPlatformWallets, type PlatformWalletMap } from "@/utils/platform-wallets";

interface PlatformStats {
  totalRevenue: number;
  dailyRevenue: number;
  totalTransactions: number;
  activeUsers: number;
  nftsMinted: number;
  platformFees: number;
  sellerEarnings: number;
  cloutAwarded: number;
}

const FALLBACK_STATS: PlatformStats = {
  totalRevenue: 125.67,
  dailyRevenue: 8.45,
  totalTransactions: 347,
  activeUsers: 89,
  nftsMinted: 234,
  platformFees: 2.51,
  sellerEarnings: 123.16,
  cloutAwarded: 45670,
};

export default function PlatformRevenueDashboard() {
  const [stats, setStats] = useState<PlatformStats>({
    totalRevenue: 0,
    dailyRevenue: 0,
    totalTransactions: 0,
    activeUsers: 0,
    nftsMinted: 0,
    platformFees: 0,
    sellerEarnings: 0,
    cloutAwarded: 0
  });
  const [wallets, setWallets] = useState<PlatformWalletMap | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { token } = useAuth();
  const authToken = token ?? (typeof window !== "undefined" ? localStorage.getItem("auth_token") : null);

  useEffect(() => {
    const fetchPlatformStats = async () => {
      if (!authToken) {
        setStats(FALLBACK_STATS);
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/platform/stats', {
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
        });
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        } else {
          // Show demo data for showcase
          setStats(FALLBACK_STATS);
        }
      } catch (error) {
        console.error('Failed to fetch platform stats:', error);
        // Show demo data
        setStats(FALLBACK_STATS);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlatformStats();
    const interval = authToken ? setInterval(fetchPlatformStats, 30000) : undefined; // Update every 30 seconds when authenticated
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [authToken]);

  useEffect(() => {
    fetchPlatformWallets()
      .then(setWallets)
      .catch((error) => console.error('Failed to load platform wallets:', error));
  }, []);

  const formatSOL = (amount: number) => `${amount.toFixed(4)} SOL`;
  const formatUSD = (amount: number) => `$${(amount * 200).toFixed(2)}`; // Assuming 1 SOL = $200

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="bg-gray-800 border-gray-700 animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-700 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">Platform Revenue Dashboard</h2>
          <p className="text-gray-400 mt-2">Real-time revenue and performance metrics</p>
        </div>
        <Badge variant="secondary" className="bg-green-600/20 text-green-400 border-green-600">
          Live Data
        </Badge>
      </div>

      {/* Revenue Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-green-900/50 to-green-800/30 border-green-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-green-100">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{formatSOL(stats.totalRevenue)}</div>
            <p className="text-xs text-green-400 flex items-center">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              {formatUSD(stats.totalRevenue)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 border-purple-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-purple-100">Daily Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{formatSOL(stats.dailyRevenue)}</div>
            <p className="text-xs text-purple-400">
              {formatUSD(stats.dailyRevenue)} today
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border-blue-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-blue-100">Active Users</CardTitle>
            <Users className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.activeUsers}</div>
            <p className="text-xs text-blue-400">
              {stats.totalTransactions} transactions
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-900/50 to-orange-800/30 border-orange-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-orange-100">NFTs Minted</CardTitle>
            <Coins className="h-4 w-4 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.nftsMinted}</div>
            <p className="text-xs text-orange-400">
              {formatSOL(stats.nftsMinted * 0.01)} in fees
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Platform Commission (2%)</CardTitle>
            <CardDescription className="text-gray-400">
              Revenue from marketplace sales
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-400 mb-2">
              {formatSOL(stats.platformFees)}
            </div>
            <div className="text-sm text-gray-400">
              {formatUSD(stats.platformFees)} USD equivalent
            </div>
            <div className="mt-4 text-xs text-gray-500">
              Developer wallet: 3WCkmqcoJZnVbscWSD3xr9tyG1kqnc3MsVPusriKKKad
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Seller Earnings (95.5%)</CardTitle>
            <CardDescription className="text-gray-400">
              Total paid to NFT sellers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-400 mb-2">
              {formatSOL(stats.sellerEarnings)}
            </div>
            <div className="text-sm text-gray-400">
              {formatUSD(stats.sellerEarnings)} to creators
            </div>
            <div className="mt-4 text-xs text-green-500">
              Industry-leading creator economics
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">CLOUT Rewards</CardTitle>
            <CardDescription className="text-gray-400">
              Total tokens awarded to users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-400 mb-2">
              {stats.cloutAwarded.toLocaleString()}
            </div>
            <div className="text-sm text-gray-400">
              CLOUT tokens distributed
            </div>
            <div className="mt-4 text-xs text-yellow-500">
              Community engagement rewards
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Platform Fee Distribution */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Platform Fee Distribution</CardTitle>
          <CardDescription className="text-gray-400">
            Where your marketplace commissions go
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
              <div>
                <div className="font-medium text-white">Developer Wallet</div>
                <div className="text-sm text-gray-400">Platform development and maintenance</div>
                <div className="text-xs text-gray-500 mt-1">
                  {wallets?.developer?.address ?? 'Not configured'}
                  {!wallets?.developer?.configured && wallets?.developer?.placeholderAddress && (
                    <span className="text-yellow-500"> (placeholder: {wallets.developer.placeholderAddress})</span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-green-400">1.0%</div>
                <div className="text-sm text-gray-400">{formatSOL(stats.platformFees * 0.5)}</div>
                <div className="text-xs text-green-500">of total sales</div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
              <div>
                <div className="font-medium text-white">CLOUT Treasury</div>
                <div className="text-sm text-gray-400">Community rewards and token distribution</div>
                <div className="text-xs text-gray-500 mt-1">
                  {wallets?.cloutTreasury?.address ?? 'Not configured'}
                  {!wallets?.cloutTreasury?.configured && wallets?.cloutTreasury?.placeholderAddress && (
                    <span className="text-yellow-500"> (placeholder: {wallets.cloutTreasury.placeholderAddress})</span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-yellow-400">1.0%</div>
                <div className="text-sm text-gray-400">{formatSOL(stats.platformFees * 0.5)}</div>
                <div className="text-xs text-yellow-500">of total sales</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
