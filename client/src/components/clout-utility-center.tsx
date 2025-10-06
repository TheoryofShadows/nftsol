
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { 
  Coins, 
  Lock, 
  TrendingUp, 
  Vote, 
  Star, 
  Gift, 
  Zap, 
  Crown,
  ArrowUpRight,
  Timer,
  Target,
  Award
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CloutBalance {
  total: number;
  staked: number;
  available: number;
  pending: number;
}

interface StakingPool {
  id: string;
  name: string;
  apy: number;
  minStake: number;
  lockPeriod: number; // days
  totalStaked: number;
  userStaked: number;
  rewards: number;
  status: 'active' | 'coming_soon' | 'ended';
}

interface PremiumFeature {
  id: string;
  name: string;
  description: string;
  cost: number;
  duration: number; // days
  benefits: string[];
  owned: boolean;
  popular: boolean;
}

export default function CloutUtilityCenter() {
  const [cloutBalance, setCloutBalance] = useState<CloutBalance>({
    total: 0,
    staked: 0,
    available: 0,
    pending: 0
  });
  const [stakingPools, setStakingPools] = useState<StakingPool[]>([]);
  const [premiumFeatures, setPremiumFeatures] = useState<PremiumFeature[]>([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [stakeAmount, setStakeAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchCloutData();
  }, []);

  const fetchCloutData = async () => {
    try {
      setLoading(true);
      let userId = localStorage.getItem('userId');
      
      // If no userId exists, create a temporary demo user ID
      if (!userId) {
        userId = 'demo-user-' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('userId', userId);
      }
      
      // Fetch CLOUT balance with timeout
      const balanceController = new AbortController();
      const balanceTimeout = setTimeout(() => balanceController.abort(), 5000);
      
      try {
        const balanceResponse = await fetch(`/api/clout/balance/${userId}`, {
          signal: balanceController.signal
        });
        clearTimeout(balanceTimeout);
        
        if (balanceResponse.ok) {
          const balance = await balanceResponse.json();
          setCloutBalance(balance);
        } else {
          console.warn('Failed to fetch CLOUT balance:', balanceResponse.status);
        }
      } catch (err) {
        clearTimeout(balanceTimeout);
        console.warn('CLOUT balance request failed:', err);
      }

      // Fetch staking pools with timeout
      const poolsController = new AbortController();
      const poolsTimeout = setTimeout(() => poolsController.abort(), 5000);
      
      try {
        const poolsResponse = await fetch(`/api/clout/staking-pools?userId=${userId}`, {
          signal: poolsController.signal
        });
        clearTimeout(poolsTimeout);
        
        if (poolsResponse.ok) {
          const pools = await poolsResponse.json();
          setStakingPools(pools);
        } else {
          console.warn('Failed to fetch staking pools:', poolsResponse.status);
        }
      } catch (err) {
        clearTimeout(poolsTimeout);
        console.warn('Staking pools request failed:', err);
      }

      // Fetch premium features with timeout
      const featuresController = new AbortController();
      const featuresTimeout = setTimeout(() => featuresController.abort(), 5000);
      
      try {
        const featuresResponse = await fetch(`/api/clout/premium-features?userId=${userId}`, {
          signal: featuresController.signal
        });
        clearTimeout(featuresTimeout);
        
        if (featuresResponse.ok) {
          const features = await featuresResponse.json();
          setPremiumFeatures(features);
        } else {
          console.warn('Failed to fetch premium features:', featuresResponse.status);
        }
      } catch (err) {
        clearTimeout(featuresTimeout);
        console.warn('Premium features request failed:', err);
      }
      
    } catch (error) {
      console.error('Failed to fetch CLOUT data:', error);
    } finally {
      setLoading(false);
    }
  };

  const stakeTokens = async (poolId: string, amount: number) => {
    try {
      const userId = localStorage.getItem('userId');
      const response = await fetch('/api/clout/stake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, poolId, amount })
      });

      if (response.ok) {
        toast({
          title: "Staking Successful",
          description: `${amount} CLOUT tokens staked successfully`,
        });
        fetchCloutData();
        setStakeAmount("");
      } else {
        throw new Error('Staking failed');
      }
    } catch (error) {
      toast({
        title: "Staking Failed",
        description: "Failed to stake tokens. Please try again.",
        variant: "destructive"
      });
    }
  };

  const claimRewards = async (poolId: string) => {
    try {
      const userId = localStorage.getItem('userId');
      const response = await fetch('/api/clout/claim-rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, poolId })
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Rewards Claimed",
          description: `${result.amount} CLOUT tokens claimed`,
        });
        fetchCloutData();
      }
    } catch (error) {
      toast({
        title: "Claim Failed",
        description: "Failed to claim rewards",
        variant: "destructive"
      });
    }
  };

  const purchaseFeature = async (featureId: string) => {
    try {
      const userId = localStorage.getItem('userId');
      const response = await fetch('/api/clout/purchase-feature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, featureId })
      });

      if (response.ok) {
        toast({
          title: "Feature Unlocked",
          description: "Premium feature activated successfully",
        });
        fetchCloutData();
      } else {
        throw new Error('Purchase failed');
      }
    } catch (error) {
      toast({
        title: "Purchase Failed",
        description: "Insufficient CLOUT balance or feature unavailable",
        variant: "destructive"
      });
    }
  };

  const formatClout = (amount: number) => {
    return new Intl.NumberFormat().format(amount);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <Coins className="h-16 w-16 text-purple-400 mx-auto mb-4 animate-spin" />
          <h3 className="text-xl font-semibold text-gray-300">Loading CLOUT Data...</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-2">
            <Coins className="h-8 w-8 text-yellow-400" />
            CLOUT Utility Center
          </h2>
          <p className="text-gray-400 mt-2">Stake, earn, and unlock premium features with CLOUT tokens</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-yellow-400">
            {formatClout(cloutBalance.total)} CLOUT
          </div>
          <div className="text-sm text-gray-400">
            Available: {formatClout(cloutBalance.available)}
          </div>
        </div>
      </div>

      {/* Balance Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border-yellow-600/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-yellow-400" />
              <span className="text-sm text-gray-300">Total Balance</span>
            </div>
            <div className="text-2xl font-bold text-yellow-400 mt-1">
              {formatClout(cloutBalance.total)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-purple-600/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-purple-400" />
              <span className="text-sm text-gray-300">Staked</span>
            </div>
            <div className="text-2xl font-bold text-purple-400 mt-1">
              {formatClout(cloutBalance.staked)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-600/20 to-blue-600/20 border-green-600/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-400" />
              <span className="text-sm text-gray-300">Pending Rewards</span>
            </div>
            <div className="text-2xl font-bold text-green-400 mt-1">
              {formatClout(cloutBalance.pending)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border-blue-600/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-400" />
              <span className="text-sm text-gray-300">Available</span>
            </div>
            <div className="text-2xl font-bold text-blue-400 mt-1">
              {formatClout(cloutBalance.available)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-gray-800 border-gray-700">
          <TabsTrigger value="overview" className="data-[state=active]:bg-yellow-600">
            Overview
          </TabsTrigger>
          <TabsTrigger value="staking" className="data-[state=active]:bg-purple-600">
            <Lock className="h-4 w-4 mr-2" />
            Staking
          </TabsTrigger>
          <TabsTrigger value="premium" className="data-[state=active]:bg-blue-600">
            <Crown className="h-4 w-4 mr-2" />
            Premium
          </TabsTrigger>
          <TabsTrigger value="governance" className="data-[state=active]:bg-green-600">
            <Vote className="h-4 w-4 mr-2" />
            Governance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Actions */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-400" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full bg-purple-600 hover:bg-purple-700">
                  Stake CLOUT for Rewards
                </Button>
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  Unlock Premium Features
                </Button>
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  Participate in Governance
                </Button>
                <Button variant="outline" className="w-full border-yellow-600 text-yellow-400">
                  Earn More CLOUT
                </Button>
              </CardContent>
            </Card>

            {/* Earnings Summary */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Award className="h-5 w-5 text-green-400" />
                  Earnings Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">This Week</span>
                    <span className="text-green-400 font-semibold">+{formatClout(245)} CLOUT</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">This Month</span>
                    <span className="text-green-400 font-semibold">+{formatClout(1089)} CLOUT</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">All Time</span>
                    <span className="text-green-400 font-semibold">+{formatClout(15627)} CLOUT</span>
                  </div>
                  <Progress value={65} className="h-2" />
                  <p className="text-xs text-gray-400">
                    65% to next tier bonus (1,500 CLOUT needed)
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="staking" className="mt-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stakingPools.map((pool) => (
                <Card key={pool.id} className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-white">{pool.name}</CardTitle>
                      <Badge className={`${pool.status === 'active' ? 'bg-green-600' : 'bg-gray-600'}`}>
                        {pool.apy}% APY
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Your Stake</span>
                        <span className="text-white">{formatClout(pool.userStaked)} CLOUT</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Pending Rewards</span>
                        <span className="text-green-400">{formatClout(pool.rewards)} CLOUT</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Lock Period</span>
                        <span className="text-white">{pool.lockPeriod} days</span>
                      </div>
                    </div>

                    {pool.userStaked > 0 ? (
                      <div className="space-y-2">
                        <Button 
                          size="sm" 
                          className="w-full bg-green-600 hover:bg-green-700"
                          onClick={() => claimRewards(pool.id)}
                        >
                          Claim Rewards
                        </Button>
                        <Button size="sm" variant="outline" className="w-full border-gray-600">
                          Unstake
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Input
                          type="number"
                          placeholder={`Min: ${pool.minStake} CLOUT`}
                          value={stakeAmount}
                          onChange={(e) => setStakeAmount(e.target.value)}
                          className="bg-gray-900 border-gray-600"
                        />
                        <Button 
                          size="sm" 
                          className="w-full bg-purple-600 hover:bg-purple-700"
                          onClick={() => stakeTokens(pool.id, parseFloat(stakeAmount))}
                          disabled={!stakeAmount || parseFloat(stakeAmount) < pool.minStake}
                        >
                          Stake CLOUT
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="premium" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {premiumFeatures.map((feature) => (
              <Card key={feature.id} className={`bg-gray-800 border-gray-700 ${feature.popular ? 'ring-2 ring-yellow-500' : ''}`}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-white flex items-center gap-2">
                      {feature.popular && <Star className="h-4 w-4 text-yellow-400" />}
                      {feature.name}
                    </CardTitle>
                    {feature.owned && <Badge className="bg-green-600">Owned</Badge>}
                  </div>
                  <p className="text-sm text-gray-400">{feature.description}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {feature.benefits.map((benefit, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-gray-300">
                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                        {benefit}
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-lg font-bold text-yellow-400">
                        {formatClout(feature.cost)} CLOUT
                      </div>
                      <div className="text-xs text-gray-400">
                        {feature.duration} days access
                      </div>
                    </div>
                    
                    <Button 
                      size="sm"
                      className={feature.owned ? "bg-gray-600" : "bg-blue-600 hover:bg-blue-700"}
                      onClick={() => purchaseFeature(feature.id)}
                      disabled={feature.owned || cloutBalance.available < feature.cost}
                    >
                      {feature.owned ? "Owned" : "Unlock"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="governance" className="mt-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Vote className="h-5 w-5 text-green-400" />
                Governance Proposals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Vote className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-300 mb-2">Governance Coming Soon</h3>
                <p className="text-gray-500">
                  CLOUT token holders will soon be able to vote on platform decisions,
                  feature requests, and treasury allocations.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
