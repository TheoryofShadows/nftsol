import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Coins, TrendingUp, Shield, Clock, Award } from "lucide-react";

interface WalletInfo {
  publicKey: string;
  solBalance: number;
  cloutBalance: number;
  totalRewards: number;
  securityLevel: 'basic' | 'enhanced' | 'premium';
  isConnected: boolean;
  lastActivity: string;
}

interface Transaction {
  id: string;
  fromWallet: string;
  toWallet: string;
  amount: number;
  tokenType: 'SOL' | 'CLOUT';
  transactionType: 'purchase' | 'reward' | 'commission' | 'transfer';
  nftId?: string;
  timestamp: string;
  status: 'pending' | 'confirmed' | 'failed';
}

export default function WalletDashboard({ userId }: { userId: string }) {
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchWalletInfo();
    fetchTransactions();
  }, [userId]);

  const fetchWalletInfo = async () => {
    try {
      const response = await fetch(`/api/wallet/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setWalletInfo(data);
      } else if (response.status === 404) {
        // Wallet not found, try to create one if user has connected a Solana wallet
        if (window.solana?.isConnected && window.solana.publicKey) {
          await createWallet();
        }
      }
    } catch (error) {
      console.error('Failed to fetch wallet info:', error);
    } finally {
      setLoading(false);
    }
  };

  const createWallet = async () => {
    try {
      if (!window.solana?.publicKey) return;
      
      const response = await fetch('/api/wallet/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          publicKey: window.solana.publicKey.toString()
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setWalletInfo(data.wallet);
        toast({
          title: "Wallet Connected!",
          description: "Your wallet has been connected and you've received 100 CLOUT welcome bonus!"
        });
      }
    } catch (error) {
      console.error('Failed to create wallet:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await fetch(`/api/wallet/${userId}/transactions`);
      if (response.ok) {
        const data = await response.json();
        setTransactions(data);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    }
  };

  const getSecurityLevelColor = (level: string) => {
    switch (level) {
      case 'basic': return 'bg-yellow-500';
      case 'enhanced': return 'bg-blue-500';
      case 'premium': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getSecurityProgress = (level: string) => {
    switch (level) {
      case 'basic': return 33;
      case 'enhanced': return 66;
      case 'premium': return 100;
      default: return 0;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!walletInfo) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6 text-center">
          <p className="text-gray-400">Wallet not connected. Please connect your wallet first.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Wallet Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">SOL Balance</CardTitle>
            <Coins className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{walletInfo.solBalance.toFixed(4)}</div>
            <p className="text-xs text-gray-400 mt-1">Solana</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">CLOUT Tokens</CardTitle>
            <Award className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{walletInfo.cloutBalance.toLocaleString()}</div>
            <p className="text-xs text-gray-400 mt-1">Community Rewards</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Rewards</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{walletInfo.totalRewards.toLocaleString()}</div>
            <p className="text-xs text-gray-400 mt-1">CLOUT Earned</p>
          </CardContent>
        </Card>
      </div>

      {/* Security Status */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-blue-500" />
            <span>Security Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Security Level</span>
              <Badge className={`${getSecurityLevelColor(walletInfo.securityLevel)} text-white`}>
                {walletInfo.securityLevel.toUpperCase()}
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Protection Level</span>
                <span className="text-gray-300">{getSecurityProgress(walletInfo.securityLevel)}%</span>
              </div>
              <Progress value={getSecurityProgress(walletInfo.securityLevel)} className="h-2" />
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <Clock className="h-4 w-4" />
              <span>Last activity: {new Date(walletInfo.lastActivity).toLocaleDateString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for detailed view */}
      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <p className="text-gray-400 text-center py-4">No transactions yet</p>
              ) : (
                <div className="space-y-3">
                  {transactions.slice(0, 10).map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`h-2 w-2 rounded-full ${
                          tx.status === 'confirmed' ? 'bg-green-500' : 
                          tx.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />
                        <div>
                          <p className="text-sm font-medium text-white">{tx.transactionType}</p>
                          <p className="text-xs text-gray-400">{new Date(tx.timestamp).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-white">
                          {tx.amount} {tx.tokenType}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {tx.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rewards" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle>CLOUT Rewards System</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-700 rounded-lg">
                    <h4 className="font-medium text-white">Daily Login</h4>
                    <p className="text-2xl font-bold text-purple-500">10 CLOUT</p>
                  </div>
                  <div className="p-3 bg-gray-700 rounded-lg">
                    <h4 className="font-medium text-white">NFT Purchase</h4>
                    <p className="text-2xl font-bold text-purple-500">50 CLOUT</p>
                  </div>
                  <div className="p-3 bg-gray-700 rounded-lg">
                    <h4 className="font-medium text-white">NFT Sale</h4>
                    <p className="text-2xl font-bold text-purple-500">100 CLOUT</p>
                  </div>
                  <div className="p-3 bg-gray-700 rounded-lg">
                    <h4 className="font-medium text-white">Referral</h4>
                    <p className="text-2xl font-bold text-purple-500">25 CLOUT</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle>Wallet Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-white">Public Key</h4>
                  <p className="text-sm text-gray-400 font-mono">
                    {walletInfo.publicKey.slice(0, 8)}...{walletInfo.publicKey.slice(-8)}
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Copy
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-white">Enhanced Security</h4>
                  <p className="text-sm text-gray-400">Enable additional security features</p>
                </div>
                <Button variant="outline" size="sm">
                  Upgrade
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}