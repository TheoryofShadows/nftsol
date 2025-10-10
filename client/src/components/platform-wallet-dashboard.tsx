import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Shield, Wallet, TrendingUp, Users, Coins, DollarSign, Award, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  fetchPlatformWallets,
  type PlatformWalletMap,
} from "@/utils/platform-wallets";

interface SecurityHealth {
  status: string;
  activeWallets: number;
  totalTransactions: number;
  platformWallets: any;
  cloutToken: any;
}

export default function PlatformWalletDashboard() {
  const [wallets, setWallets] = useState<PlatformWalletMap | null>(null);
  const [securityHealth, setSecurityHealth] = useState<SecurityHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [testForm, setTestForm] = useState({
    buyerId: '',
    sellerId: '',
    creatorId: '',
    nftId: 'test-nft-001',
    priceSOL: '10',
    creatorRoyaltyRate: '0.025'
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchPlatformData();
  }, []);

  const fetchPlatformData = async () => {
    try {
      const [walletsData, securityRes] = await Promise.all([
        fetchPlatformWallets(true),
        fetch('/api/wallet/security/health')
      ]);

      if (securityRes.ok) {
        const securityData = await securityRes.json();
        setSecurityHealth(securityData);
      }

      setWallets(walletsData);
    } catch (error) {
      console.error('Failed to fetch platform data:', error);
    } finally {
      setLoading(false);
    }
  };

  const testNFTPurchase = async () => {
    try {
      const response = await fetch('/api/wallet/test/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testForm)
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Test Purchase Successful!",
          description: `Transaction ID: ${result.transactionId}`
        });
        
        // Show breakdown
        console.log('Purchase breakdown:', result.breakdown);
      } else {
        toast({
          title: "Test Purchase Failed",
          description: result.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Test Failed",
        description: "Network error occurred",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-3">
        <Shield className="h-8 w-8 text-purple-500" />
        <h1 className="text-3xl font-bold text-white">Platform Wallet Management</h1>
      </div>

      <Tabs defaultValue="wallets" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="wallets">Wallet Addresses</TabsTrigger>
          <TabsTrigger value="security">Security Health</TabsTrigger>
          <TabsTrigger value="testing">Transaction Testing</TabsTrigger>
        </TabsList>

        <TabsContent value="wallets" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-white">
                <Wallet className="h-5 w-5" />
                <span>Platform Wallet Addresses</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {wallets && Object.entries(wallets).map(([key, wallet]) => (
                <div key={key} className="p-4 bg-gray-900 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-white capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </h3>
                    <div className="flex items-center gap-2">
                      {(wallet.commissionRate ?? wallet.distributionRate) !== undefined && (
                        <Badge className="bg-green-600">
                          {(((wallet.commissionRate ?? wallet.distributionRate) || 0) * 100).toFixed(1)}%
                          {wallet.commissionRate !== undefined ? ' Commission' : ' Distribution'}
                        </Badge>
                      )}
                      <Badge className={wallet.configured ? 'bg-blue-600' : 'bg-red-600'}>
                        {wallet.configured ? 'Configured' : 'Needs .env update'}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-gray-400 mb-2">{wallet.purpose}</p>
                  {!wallet.configured && wallet.placeholderAddress && (
                    <p className="text-xs text-yellow-500 mb-2">
                      Placeholder address: {wallet.placeholderAddress}
                    </p>
                  )}
                  <div className="flex items-center space-x-2">
                    <code className="px-2 py-1 bg-gray-800 rounded text-sm text-green-400 font-mono">
                      {wallet.address ?? 'Not configured'}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!wallet.address}
                      onClick={() => wallet.address && navigator.clipboard.writeText(wallet.address)}
                    >
                      {wallet.address ? 'Copy' : 'Configure first'}
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-white">
                <Award className="h-5 w-5" />
                <span>CLOUT Token Distribution</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {securityHealth?.cloutToken && (
                <div className="space-y-3">
                  <div className="text-2xl font-bold text-purple-400">
                    {securityHealth.cloutToken.totalSupply.toLocaleString()} CLOUT
                    <span className="text-sm text-gray-400 ml-2">Total Supply</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-green-400">60%</div>
                      <div className="text-sm text-gray-400">Community Rewards</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-blue-400">20%</div>
                      <div className="text-sm text-gray-400">Team & Development</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-yellow-400">15%</div>
                      <div className="text-sm text-gray-400">Marketing</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-red-400">5%</div>
                      <div className="text-sm text-gray-400">Reserve Fund</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">System Status</CardTitle>
                <Shield className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-400">
                  {securityHealth?.status || 'Unknown'}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Active Wallets</CardTitle>
                <Users className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-400">
                  {securityHealth?.activeWallets || 0}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Total Transactions</CardTitle>
                <TrendingUp className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-400">
                  {securityHealth?.totalTransactions || 0}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-white">
                <Lock className="h-5 w-5" />
                <span>Wallet Configuration Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {securityHealth?.platformWallets && (
                <div className="space-y-3">
                  {Object.entries(securityHealth.platformWallets).map(([key, wallet]: [string, any]) => (
                    <div key={key} className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                      <div>
                        <h4 className="font-medium text-white capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </h4>
                        <p className="text-sm text-gray-400">{wallet.purpose}</p>
                        <code className="text-xs text-green-400">{wallet.address}</code>
                      </div>
                      <Badge className={wallet.configured ? "bg-green-600" : "bg-red-600"}>
                        {wallet.configured ? "Configured" : "Not Set"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testing" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-white">
                <DollarSign className="h-5 w-5" />
                <span>Test NFT Purchase Transaction</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="buyerId">Buyer ID</Label>
                  <Input
                    id="buyerId"
                    value={testForm.buyerId}
                    onChange={(e) => setTestForm({...testForm, buyerId: e.target.value})}
                    placeholder="Enter buyer user ID"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sellerId">Seller ID</Label>
                  <Input
                    id="sellerId"
                    value={testForm.sellerId}
                    onChange={(e) => setTestForm({...testForm, sellerId: e.target.value})}
                    placeholder="Enter seller user ID"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="creatorId">Creator ID (Optional)</Label>
                  <Input
                    id="creatorId"
                    value={testForm.creatorId}
                    onChange={(e) => setTestForm({...testForm, creatorId: e.target.value})}
                    placeholder="Original creator user ID"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priceSOL">Price (SOL)</Label>
                  <Input
                    id="priceSOL"
                    type="number"
                    step="0.1"
                    value={testForm.priceSOL}
                    onChange={(e) => setTestForm({...testForm, priceSOL: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="royaltyRate">Creator Royalty Rate</Label>
                  <Input
                    id="royaltyRate"
                    type="number"
                    step="0.005"
                    min="0"
                    max="0.1"
                    value={testForm.creatorRoyaltyRate}
                    onChange={(e) => setTestForm({...testForm, creatorRoyaltyRate: e.target.value})}
                    placeholder="0.025 (2.5%)"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nftId">NFT ID</Label>
                  <Input
                    id="nftId"
                    value={testForm.nftId}
                    onChange={(e) => setTestForm({...testForm, nftId: e.target.value})}
                  />
                </div>
              </div>

              <Separator />

              <div className="bg-gray-900 p-4 rounded-lg">
                <h4 className="font-medium text-white mb-2">Expected Distribution for {testForm.priceSOL} SOL:</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Developer Commission (2%):</span>
                    <span className="text-red-400">{(parseFloat(testForm.priceSOL) * 0.02).toFixed(3)} SOL</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Creator Royalty ({(parseFloat(testForm.creatorRoyaltyRate) * 100).toFixed(1)}%):</span>
                    <span className="text-blue-400">{(parseFloat(testForm.priceSOL) * parseFloat(testForm.creatorRoyaltyRate)).toFixed(3)} SOL</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Seller Receives:</span>
                    <span className="text-green-400 font-bold">
                      {(parseFloat(testForm.priceSOL) - (parseFloat(testForm.priceSOL) * 0.02) - (parseFloat(testForm.priceSOL) * parseFloat(testForm.creatorRoyaltyRate))).toFixed(3)} SOL
                      <span className="text-xs text-gray-500 ml-1">
                        ({(((parseFloat(testForm.priceSOL) - (parseFloat(testForm.priceSOL) * 0.02) - (parseFloat(testForm.priceSOL) * parseFloat(testForm.creatorRoyaltyRate))) / parseFloat(testForm.priceSOL)) * 100).toFixed(1)}%)
                      </span>
                    </span>
                  </div>
                  <div className="flex justify-between mt-2 pt-2 border-t border-gray-700">
                    <span className="text-gray-400">CLOUT Rewards:</span>
                    <span className="text-purple-400">
                      Buyer: +50, Seller: +100
                      {parseFloat(testForm.creatorRoyaltyRate) > 0 && <span className="block text-green-400">Creator: +200 (Enhanced!)</span>}
                    </span>
                  </div>
                </div>
              </div>

              <Button 
                onClick={testNFTPurchase} 
                className="w-full bg-gradient-to-r from-purple-600 to-green-500"
              >
                Test Transaction
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}