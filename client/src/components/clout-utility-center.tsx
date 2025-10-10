
import { useState, useEffect, useMemo } from "react";
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
import { useAuth } from "@/hooks/use-auth";
import { useSolanaRewards } from "@/hooks/use-solana-rewards";

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

function renderOnchainPosition(position: OnchainPosition, loading: boolean) {
  if (loading) {
    return <p className="text-sm text-gray-500">Loading position…</p>;
  }
  if (!position) {
    return <p className="text-sm text-gray-500">No stake detected for this wallet.</p>;
  }

  return (
    <div className="space-y-2 text-sm">
      <div className="flex justify-between">
        <span className="text-gray-400">Staked</span>
        <span className="font-semibold text-white">{position.amount}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-400">Pending Rewards</span>
        <span className="font-semibold text-green-400">{position.pendingRewards}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-400">Last Stake</span>
        <span className="font-semibold text-gray-200">
          {formatTimestamp(position.lastStakeTs)}
        </span>
      </div>
    </div>
  );
}

function formatTimestamp(value: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return "—";
  }
  return new Date(parsed * 1000).toLocaleString();
}

type OnchainPosition = {
  owner: string;
  pool: string;
  amount: string;
  rewardPerTokenPaid: string;
  pendingRewards: string;
  lastStakeTs: string;
} | null;

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
  const [stakeAmounts, setStakeAmounts] = useState<Record<string, string>>({});
  const [onchainStakeAmount, setOnchainStakeAmount] = useState<string>("0");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const {
    pool: onchainPool,
    position: onchainPosition,
    loading: onchainLoading,
    error: onchainError,
    requestStake: submitOnchainStake,
    requestUnstake: submitOnchainUnstake,
    requestHarvest: submitOnchainHarvest,
  } = useSolanaRewards();
  const pendingOnchainRewards = useMemo(() => {
    if (!onchainPosition) return 0;
    const value = Number(onchainPosition.pendingRewards);
    return Number.isFinite(value) ? value : 0;
  }, [onchainPosition]);
  const userId = useMemo(() => {
    if (user?.id) return user.id;
    const stored = localStorage.getItem("userId");
    if (stored) return stored;
    const generated = `demo-user-${Math.random().toString(36).slice(2, 11)}`;
    localStorage.setItem("userId", generated);
    return generated;
  }, [user]);

  useEffect(() => {
    fetchCloutData();
  }, [userId]);

  const fetchCloutData = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
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
    if (!userId || !Number.isFinite(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Enter a valid amount of CLOUT to stake.",
        variant: "destructive"
      });
      return;
    }

    if (amount > cloutBalance.available) {
      toast({
        title: "Insufficient Balance",
        description: "You do not have enough available CLOUT to stake that amount.",
        variant: "destructive"
      });
      return;
    }

    try {
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
        setStakeAmounts(prev => ({ ...prev, [poolId]: "" }));
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

  const handleOnchainStake = async () => {
    const parsed = Number(onchainStakeAmount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Enter a valid number of CLOUT tokens to stake on-chain.",
        variant: "destructive",
      });
      return;
    }
    try {
      await submitOnchainStake(parsed);
      setOnchainStakeAmount("0");
    } catch (error: any) {
      toast({
        title: "On-chain Staking Failed",
        description: error?.message ?? "Failed to submit stake transaction.",
        variant: "destructive",
      });
    }
  };

  const handleOnchainUnstake = async () => {
    const parsed = Number(onchainStakeAmount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Enter a valid number of CLOUT tokens to unstake.",
        variant: "destructive",
      });
      return;
    }
    try {
      await submitOnchainUnstake(parsed);
      setOnchainStakeAmount("0");
    } catch (error: any) {
      toast({
        title: "On-chain Unstake Failed",
        description: error?.message ?? "Failed to submit unstake transaction.",
        variant: "destructive",
      });
    }
  };

  const handleOnchainHarvest = async () => {
    try {
      await submitOnchainHarvest();
      toast({
        title: "Harvest Submitted",
        description: "Reward harvest transaction signed successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Harvest Failed",
        description: error?.message ?? "Failed to submit harvest transaction.",
        variant: "destructive",
      });
    }
  };

  const claimRewards = async (poolId: string) => {
    if (!userId) return;

    try {
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
    if (!userId) return;

    try {
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
        <TabsList className="grid w-full grid-cols-5 bg-gray-800 border-gray-700">
          <TabsTrigger value="overview" className="data-[state=active]:bg-yellow-600">
            Overview
          </TabsTrigger>
          <TabsTrigger value="staking" className="data-[state=active]:bg-purple-600">
            <Lock className="h-4 w-4 mr-2" />
            Staking
          </TabsTrigger>
          <TabsTrigger value="onchain" className="data-[state=active]:bg-cyan-600">
            <Zap className="h-4 w-4 mr-2" />
            On-chain
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
                          value={stakeAmounts[pool.id] ?? ""}
                          onChange={(e) => setStakeAmounts(prev => ({ ...prev, [pool.id]: e.target.value }))}
                          className="bg-gray-900 border-gray-600"
                        />
                        <Button 
                          size="sm" 
                          className="w-full bg-purple-600 hover:bg-purple-700"
                          onClick={() => stakeTokens(pool.id, parseFloat(stakeAmounts[pool.id] ?? "0"))}
                          disabled={
                            !stakeAmounts[pool.id] ||
                            parseFloat(stakeAmounts[pool.id] ?? "0") < pool.minStake ||
                            parseFloat(stakeAmounts[pool.id] ?? "0") > cloutBalance.available
                          }
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

        <TabsContent value="onchain" className="mt-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle className="text-white flex items-center gap-2">
                  <Crown className="h-5 w-5 text-cyan-400" />
                  On-chain Staking (Devnet Beta)
                </CardTitle>
                <p className="text-sm text-gray-400">
                  Generate and sign Anchor transactions directly from your wallet.
                </p>
              </div>
              <Badge variant="outline" className="border-cyan-500 text-cyan-300">
                Beta
              </Badge>
            </CardHeader>
            <CardContent className="space-y-6">
              {onchainError && (
                <div className="rounded-md border border-red-500/60 bg-red-500/10 p-3 text-sm text-red-200">
                  {onchainError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-gray-900/60 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-sm text-gray-300">Pool Snapshot</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {onchainPool ? (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Total Staked</span>
                          <span className="text-cyan-300 font-semibold">
                            {onchainPool.totalStaked}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Reward Rate / Slot</span>
                          <span className="text-cyan-300 font-semibold">
                            {onchainPool.rewardRate}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Last Update</span>
                          <span className="text-cyan-300 font-semibold">
                            {formatTimestamp(onchainPool.lastUpdateTs)}
                          </span>
                        </div>
                      </>
                    ) : (
                      <p className="text-gray-500">
                        {onchainLoading ? "Fetching pool state…" : "Pool unavailable."}
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-gray-900/60 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-sm text-gray-300">Your Position</CardTitle>
                  </CardHeader>
                  <CardContent>{renderOnchainPosition(onchainPosition, onchainLoading)}</CardContent>
                </Card>
              </div>

              <div className="rounded-lg border border-gray-700 bg-gray-900/40 p-4 space-y-3">
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
                  Manage Position
                </h3>
                <div className="flex flex-col gap-3 md:flex-row">
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    value={onchainStakeAmount}
                    onChange={(e) => setOnchainStakeAmount(e.target.value)}
                    className="bg-gray-900 border-gray-700 flex-1"
                    placeholder="Amount (whole tokens)"
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleOnchainStake} disabled={onchainLoading}>
                      Stake
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleOnchainUnstake}
                      disabled={onchainLoading}
                      className="border-gray-600 text-gray-200"
                    >
                      Unstake
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleOnchainHarvest}
                      disabled={onchainLoading || pendingOnchainRewards <= 0}
                      className="border-cyan-500 text-cyan-300"
                    >
                      Harvest
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Transactions are generated by the backend Anchor client and require signing in
                  your connected wallet. Ensure you are connected to the correct network and hold
                  CLOUT tokens in your associated token account.
                </p>
                {pendingOnchainRewards > 0 && (
                  <p className="text-xs text-cyan-300">
                    Pending rewards available: {pendingOnchainRewards}
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  Some transactions are pre-signed by platform authorities; your wallet will be
                  asked to co-sign before submission.
                </p>
              </div>
            </CardContent>
          </Card>
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
