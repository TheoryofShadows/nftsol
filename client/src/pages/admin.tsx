import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import Navbar from "@/components/navbar";
import { useAuth } from "@/hooks/use-auth";
import { 
  BarChart, 
  Users, 
  Wallet, 
  TrendingUp, 
  Shield, 
  Database,
  Activity,
  DollarSign,
  LogIn
} from "lucide-react";

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

interface UserStat {
  id: string;
  username: string;
  joinedDate: string;
  nftsOwned: number;
  totalSpent: number;
  isActive: boolean;
}

interface WalletBalance {
  address: string;
  balance: number;
  name: string;
  transactions: number;
}

export default function AdminPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { token } = useAuth();
  const authToken = token ?? (typeof window !== "undefined" ? localStorage.getItem("auth_token") : null);

  // Fetch current user data to check role
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ["/api/user/me"],
    queryFn: async () => {
      const userId = localStorage.getItem("userId");
      if (!userId) throw new Error("Not logged in");
      
      const response = await fetch(`/api/user/${userId}`);
      if (!response.ok) throw new Error("Failed to fetch user");
      const result = await response.json();
      return result.user; // Extract user from response
    },
    enabled: !!localStorage.getItem("userId"),
    retry: false, // Don't retry on auth failures
  });

  // Check if user is logged in and has admin role
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    const username = localStorage.getItem("username");
    
    if (userId && username && userData) {
      setCurrentUser(userData);
      // Only allow admin access if the user data from server confirms admin role
      setIsAdmin(userData.role === "admin");
    } else {
      // No fallback - require proper authentication through the server
      setCurrentUser(null);
      setIsAdmin(false);
    }
  }, [userData]);

  // Platform stats query
  const { data: stats, isLoading: statsLoading } = useQuery<PlatformStats>({
    queryKey: ["/api/platform/stats"],
    queryFn: async () => {
      const userId = localStorage.getItem("userId");
      const response = await fetch("/api/platform/stats", {
        headers: {
          "X-User-ID": userId || "",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        }
      });
      if (!response.ok) throw new Error("Failed to fetch stats");
      return response.json();
    },
    enabled: isAdmin && !!currentUser && !!authToken,
  });

  // Wallet balances query
  const { data: walletBalances, isLoading: walletsLoading } = useQuery<WalletBalance[]>({
    queryKey: ["/api/wallet/platform/stats"],
    queryFn: async () => {
      const userId = localStorage.getItem("userId");
      const response = await fetch("/api/wallet/platform/stats", {
        headers: {
          "X-User-ID": userId || "",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        }
      });
      if (!response.ok) throw new Error("Failed to fetch wallet stats");
      return response.json();
    },
    enabled: isAdmin && !!currentUser && !!authToken,
  });

  // Mock user data (in real implementation, this would come from an API)
  const { data: users } = useQuery<UserStat[]>({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      // Mock data for demonstration
      return [
        {
          id: "1",
          username: "creator_artist",
          joinedDate: "2025-01-15",
          nftsOwned: 12,
          totalSpent: 45.6,
          isActive: true,
        },
        {
          id: "2", 
          username: "collector_pro",
          joinedDate: "2025-01-10",
          nftsOwned: 28,
          totalSpent: 156.8,
          isActive: true,
        },
        {
          id: "3",
          username: "nft_trader",
          joinedDate: "2024-12-20",
          nftsOwned: 7,
          totalSpent: 23.4,
          isActive: false,
        },
      ];
    },
    enabled: isAdmin,
  });

  const handleLogout = () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
    localStorage.removeItem("token");
    setCurrentUser(null);
    setIsAdmin(false);
    toast({
      title: "Logged Out",
      description: "Session ended",
    });
  };

  // Show loading while checking authentication
  if (userLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
        <Navbar />
        <div className="pt-20 flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
        </div>
      </div>
    );
  }

  // Check authentication and admin privileges
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
        <Navbar />
        <div className="pt-20 flex items-center justify-center min-h-screen">
          <Card className="w-full max-w-md bg-black/80 border-white/10">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-orbitron text-white">
                Admin Access Required
              </CardTitle>
              <CardDescription className="text-gray-400">
                Please log in to access the admin dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <div className="space-y-2">
                <Shield className="w-16 h-16 mx-auto text-gray-400" />
                <p className="text-gray-400">
                  You need to be logged in with an admin account to access this area.
                </p>
              </div>
              <Link href="/auth">
                <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                  <LogIn className="w-4 h-4 mr-2" />
                  Go to Login
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
        <Navbar />
        <div className="pt-20 flex items-center justify-center min-h-screen">
          <Card className="w-full max-w-md bg-black/80 border-white/10">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-orbitron text-white">
                Access Denied
              </CardTitle>
              <CardDescription className="text-gray-400">
                Admin privileges required
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <div className="space-y-2">
                <Shield className="w-16 h-16 mx-auto text-red-400" />
                <p className="text-gray-400">
                  Hello <span className="text-white font-medium">{currentUser.username}</span>! 
                  You need admin privileges to access this dashboard.
                </p>
                <p className="text-sm text-gray-500">
                  Contact your administrator to request admin access.
                </p>
              </div>
              <Link href="/">
                <Button variant="outline" className="w-full border-white/20 text-white">
                  Return to Home
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      <Navbar />
      <div className="pt-20 px-4 sm:px-6 lg:px-8 pb-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-orbitron font-bold text-white">
                Admin Dashboard
              </h1>
              <p className="text-gray-400 mt-2">
                Manage NFTSol platform operations
              </p>
            </div>
            <div className="flex gap-4">
              <Link href="/admin/wallets">
                <Button variant="outline" className="border-purple-600 text-purple-400 hover:bg-purple-600/10">
                  <Wallet className="h-4 w-4 mr-2" />
                  Wallet Setup
                </Button>
              </Link>
              <Button 
                onClick={handleLogout}
                variant="outline"
                className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
              >
                Logout
              </Button>
            </div>
          </div>

          {/* Platform Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-black/40 border-white/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">
                  Total Revenue
                </CardTitle>
                <DollarSign className="h-4 w-4 text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {stats ? `${stats.totalRevenue.toFixed(2)} SOL` : "Loading..."}
                </div>
                <p className="text-xs text-gray-400">
                  Daily: {stats ? `${stats.dailyRevenue.toFixed(2)} SOL` : "..."}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-black/40 border-white/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">
                  Active Users
                </CardTitle>
                <Users className="h-4 w-4 text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {stats?.activeUsers || "Loading..."}
                </div>
                <p className="text-xs text-gray-400">
                  Total transactions: {stats?.totalTransactions || "..."}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-black/40 border-white/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">
                  NFTs Minted
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-purple-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {stats?.nftsMinted || "Loading..."}
                </div>
                <p className="text-xs text-gray-400">
                  Platform fees: {stats ? `${stats.platformFees.toFixed(2)} SOL` : "..."}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-black/40 border-white/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">
                  CLOUT Awarded
                </CardTitle>
                <Activity className="h-4 w-4 text-yellow-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {stats?.cloutAwarded ? stats.cloutAwarded.toLocaleString() : "Loading..."}
                </div>
                <p className="text-xs text-gray-400">
                  Community rewards
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Management Tabs */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4 bg-black/40 border-white/10">
              <TabsTrigger value="overview" className="data-[state=active]:bg-purple-600">
                Overview
              </TabsTrigger>
              <TabsTrigger value="users" className="data-[state=active]:bg-purple-600">
                Users
              </TabsTrigger>
              <TabsTrigger value="wallets" className="data-[state=active]:bg-purple-600">
                Wallets
              </TabsTrigger>
              <TabsTrigger value="analytics" className="data-[state=active]:bg-purple-600">
                Analytics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-black/40 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white">Platform Health</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Database Status</span>
                      <Badge className="bg-green-500">Connected</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">API Status</span>
                      <Badge className="bg-green-500">Operational</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Solana RPC</span>
                      <Badge className="bg-green-500">Healthy</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">IPFS Gateway</span>
                      <Badge className="bg-yellow-500">Slow</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-black/40 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white">Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm">
                      <p className="text-gray-400">Last NFT minted: 2 minutes ago</p>
                      <p className="text-gray-400">Last transaction: 5 minutes ago</p>
                      <p className="text-gray-400">New user registration: 15 minutes ago</p>
                      <p className="text-gray-400">CLOUT reward distributed: 1 hour ago</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="users" className="space-y-4">
              <Card className="bg-black/40 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">User Management</CardTitle>
                  <CardDescription className="text-gray-400">
                    Manage platform users and their activities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {users?.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                        <div>
                          <p className="text-white font-medium">{user.username}</p>
                          <p className="text-gray-400 text-sm">
                            Joined: {user.joinedDate} | NFTs: {user.nftsOwned} | Spent: {user.totalSpent} SOL
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={user.isActive ? "bg-green-500" : "bg-gray-500"}>
                            {user.isActive ? "Active" : "Inactive"}
                          </Badge>
                          <Button size="sm" variant="outline" className="border-white/20 text-white">
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="wallets" className="space-y-4">
              <Card className="bg-black/40 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Wallet className="w-5 h-5" />
                    Platform Wallets
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Monitor platform wallet balances and transactions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {walletsLoading ? (
                    <p className="text-gray-400">Loading wallet data...</p>
                  ) : (
                    <div className="space-y-4">
                      {walletBalances?.map((wallet) => (
                        <div key={wallet.address} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                          <div>
                            <p className="text-white font-medium">{wallet.name}</p>
                            <p className="text-gray-400 text-sm font-mono">
                              {wallet.address.slice(0, 8)}...{wallet.address.slice(-8)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-white font-medium">{wallet.balance.toFixed(4)} SOL</p>
                            <p className="text-gray-400 text-sm">{wallet.transactions} transactions</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <Card className="bg-black/40 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <BarChart className="w-5 h-5" />
                    Platform Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-white">
                        {stats ? `${((stats.platformFees / stats.totalRevenue) * 100).toFixed(1)}%` : "..."}
                      </p>
                      <p className="text-gray-400 text-sm">Platform Commission</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-white">
                        {stats ? `${(stats.totalRevenue / stats.totalTransactions).toFixed(2)}` : "..."}
                      </p>
                      <p className="text-gray-400 text-sm">Avg Transaction (SOL)</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-white">
                        {stats ? `${(stats.cloutAwarded / stats.activeUsers).toFixed(0)}` : "..."}
                      </p>
                      <p className="text-gray-400 text-sm">CLOUT per User</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
