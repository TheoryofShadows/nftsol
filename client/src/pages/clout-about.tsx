import { useState } from "react";
import { Link } from 'wouter';
import { Share2, Twitter, Facebook, Linkedin, Copy, CheckCircle, Coins, TrendingUp, Users, Shield, Zap, Target, Star, Award, Crown, Gift, ArrowRight, Sparkles, Gem, Trophy, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import Logo from "@/components/logo";
import { AdaptiveSection } from "@/components/layout/adaptive-layout-system";
import { SmartSection } from "@/components/layout/layout-optimizer";
import LiveActivityFeed from "@/components/live-activity-feed";
import AchievementSystem from "@/components/achievement-system";
import CloutLeaderboard from "@/components/clout-leaderboard";

export default function CloutWelcomePage() {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const shareUrl = window.location.origin + "/clout-about";
  const shareText = "🚀 Welcome to NFTSol - Where Creators Earn CLOUT! The most rewarding NFT marketplace on Solana. Join thousands earning real tokens! 🎨✨";

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Share NFTSol with your friends",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Please copy the link manually",
        variant: "destructive"
      });
    }
  };

  const handleShare = async (platform: string) => {
    const urls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
    };

    if (urls[platform as keyof typeof urls]) {
      window.open(urls[platform as keyof typeof urls], '_blank', 'width=600,height=400');
    }
  };

  const features = [
    {
      icon: <Coins className="h-12 w-12 text-yellow-400" />,
      title: "Earn CLOUT Tokens",
      description: "Get rewarded for every NFT you create, buy, or sell. Real tokens with real value.",
      reward: "+50 CLOUT per creation",
      gradient: "from-yellow-500/20 to-orange-500/20"
    },
    {
      icon: <TrendingUp className="h-12 w-12 text-green-400" />,
      title: "Creator Bonuses",
      description: "Massive bonuses for first sales and milestone achievements. The most creator-friendly platform.",
      reward: "+300 CLOUT first sale",
      gradient: "from-green-500/20 to-emerald-500/20"
    },
    {
      icon: <Crown className="h-12 w-12 text-purple-400" />,
      title: "Premium Features",
      description: "Unlock exclusive tools, early access, and VIP features using your earned CLOUT tokens.",
      reward: "Exclusive access",
      gradient: "from-purple-500/20 to-violet-500/20"
    },
    {
      icon: <Users className="h-12 w-12 text-blue-400" />,
      title: "Community Driven",
      description: "Join a thriving community where creators support creators. Fair distribution, no whales.",
      reward: "Fair ecosystem",
      gradient: "from-blue-500/20 to-cyan-500/20"
    }
  ];

  const milestones = [
    { sales: 10, title: "Rising Creator", icon: <Star className="h-8 w-8" />, reward: 500, color: "text-yellow-400" },
    { sales: 50, title: "Established Creator", icon: <Trophy className="h-8 w-8" />, reward: 500, color: "text-orange-400" },
    { sales: 100, title: "Elite Creator", icon: <Gem className="h-8 w-8" />, reward: 500, color: "text-purple-400" },
    { sales: 500, title: "Legendary Creator", icon: <Rocket className="h-8 w-8" />, reward: 500, color: "text-green-400" },
    { sales: 1000, title: "Master Creator", icon: <Crown className="h-8 w-8" />, reward: 500, color: "text-red-400" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-green-900/20">
      {/* Hero Section with Revolutionary Layout */}
      <AdaptiveSection
        priority="hero"
        contentType="showcase"
        className="pt-24 pb-16"
      >
        <div className="flex flex-col items-center space-y-8 text-center max-w-6xl mx-auto px-4">
          {/* NFTSol Logo + CLOUT Branding */}
          <div className="flex flex-col items-center gap-6">
            <Logo size="lg" className="scale-125 mb-4" />
            <div className="flex items-center gap-4">
              <Crown className="h-16 w-16 text-yellow-400 animate-pulse" />
              <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent font-orbitron">
                CLOUT
              </h1>
            </div>
            <Badge variant="secondary" className="bg-purple-600/20 text-purple-300 border-purple-400/30 text-lg px-6 py-2">
              Revolutionary Token Economy System
            </Badge>
          </div>
          
          <div className="space-y-6">
            <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
              Where <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-green-400">Creators</span> Earn <span className="text-yellow-400">Real Rewards</span>
            </h2>
            
            <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
              Join the most rewarding NFT marketplace on Solana. Earn CLOUT tokens for every creation, sale, and milestone. 
              Turn your art into income with the first platform that truly pays creators what they deserve.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-8">
              <Link to="/create">
                <Button size="lg" className="bg-gradient-to-r from-purple-600 to-green-600 hover:from-purple-700 hover:to-green-700 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Start Creating & Earning
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">4,892 Creators Already Earning</span>
              </div>
            </div>

            {/* Token Address Display */}
            <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700 max-w-3xl mx-auto mt-8">
              <div className="p-6">
                <p className="text-gray-300 mb-3 font-medium text-center">Official CLOUT Token Address:</p>
                <div className="flex items-center justify-between bg-gray-900 rounded-lg p-4">
                  <code className="text-green-400 font-mono text-sm break-all">
                    Co7ufgDdi1QuegnQHwxSwq6b5y3mVuDERiF517ta6pXd
                  </code>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleCopyLink}
                    className="ml-3 text-gray-300 border-gray-600 hover:bg-gray-700"
                  >
                    {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-sm text-gray-400 mt-3 text-center">✅ Verified on Solscan • Always verify before transactions</p>
              </div>
            </Card>
          </div>
        </div>
      </AdaptiveSection>

      {/* Features Section */}
      <SmartSection
        title="Why Creators Choose NFTSol"
        subtitle="The most rewarding platform in the NFT space"
        variant="secondary"
        className="py-16"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto px-4">
          {features.map((feature, index) => (
            <Card 
              key={index}
              className={`bg-gradient-to-br ${feature.gradient} backdrop-blur-sm border-gray-700 hover:border-purple-500/50 transition-all duration-300 transform hover:scale-105 p-6`}
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-4 bg-gray-900/50 rounded-full">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-white">{feature.title}</h3>
                <p className="text-gray-300 leading-relaxed">{feature.description}</p>
                <Badge className="bg-green-600/20 text-green-400 border-green-600/50">
                  {feature.reward}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      </SmartSection>

      {/* Creator Milestones */}
      <SmartSection
        title="Creator Milestone Rewards"
        subtitle="Unlock exclusive badges and bonus CLOUT as you grow"
        variant="secondary"
        className="py-16 bg-gray-900/30"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 max-w-6xl mx-auto px-4">
          {milestones.map((milestone, index) => (
            <Card 
              key={index}
              className="bg-gradient-to-b from-gray-800/50 to-gray-900/50 border-gray-700 text-center hover:border-purple-500/50 transition-all duration-300 transform hover:scale-105"
            >
              <div className="p-6 space-y-4">
                <div className={`flex justify-center ${milestone.color}`}>
                  {milestone.icon}
                </div>
                <h3 className="text-white font-bold">{milestone.title}</h3>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-purple-400">{milestone.sales}</div>
                  <div className="text-sm text-gray-400">sales needed</div>
                  <Badge className="bg-green-600/20 text-green-400 border-green-600/50">
                    +{milestone.reward} CLOUT
                  </Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </SmartSection>

      {/* How It Works */}
      <SmartSection
        title="How CLOUT Works"
        subtitle="Simple, fair, and rewarding"
        variant="secondary"
        className="py-16"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto px-4">
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto border border-yellow-400/30">
              <span className="text-3xl font-bold text-yellow-400">1</span>
            </div>
            <h3 className="text-2xl font-bold text-white">Create & Mint</h3>
            <p className="text-gray-400 leading-relaxed">Upload your art and mint NFTs. Earn 50 CLOUT tokens instantly for each creation.</p>
          </div>

          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto border border-green-400/30">
              <span className="text-3xl font-bold text-green-400">2</span>
            </div>
            <h3 className="text-2xl font-bold text-white">Sell & Earn</h3>
            <p className="text-gray-400 leading-relaxed">Make your first sale and get a massive 300 CLOUT bonus. Keep earning with every transaction.</p>
          </div>

          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto border border-purple-400/30">
              <span className="text-3xl font-bold text-purple-400">3</span>
            </div>
            <h3 className="text-2xl font-bold text-white">Unlock & Grow</h3>
            <p className="text-gray-400 leading-relaxed">Use CLOUT for premium features, staking rewards, and exclusive creator tools.</p>
          </div>
        </div>
      </SmartSection>

      {/* Call to Action */}
      <AdaptiveSection
        priority="primary"
        contentType="showcase"
        className="py-16"
      >
        <Card className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 border-purple-600/50 max-w-4xl mx-auto">
          <div className="p-12 text-center space-y-8">
            <Gift className="h-20 w-20 text-yellow-400 mx-auto" />
            <h2 className="text-4xl md:text-5xl font-bold text-white">Ready to Start Earning?</h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Join the most creator-friendly NFT marketplace on Solana. Start earning CLOUT tokens today!
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/create">
                <Button size="lg" className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold px-8 py-4 text-lg transition-all duration-300 transform hover:scale-105 shadow-lg">
                  <Zap className="h-5 w-5 mr-2" />
                  Start Creating Now
                </Button>
              </Link>
              <Link to="/marketplace">
                <Button size="lg" variant="outline" className="border-2 border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-black px-8 py-4 text-lg transition-all duration-300">
                  <Target className="h-5 w-5 mr-2" />
                  Explore Marketplace
                </Button>
              </Link>
            </div>

            {/* Share Section */}
            <div className="pt-8 border-t border-gray-700">
              <p className="text-gray-400 mb-4">Share NFTSol with your network</p>
              <div className="flex justify-center gap-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleShare('twitter')}
                  className="text-blue-400 border-blue-400 hover:bg-blue-400 hover:text-black"
                >
                  <Twitter className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleShare('facebook')}
                  className="text-blue-600 border-blue-600 hover:bg-blue-600 hover:text-white"
                >
                  <Facebook className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleShare('linkedin')}
                  className="text-blue-500 border-blue-500 hover:bg-blue-500 hover:text-white"
                >
                  <Linkedin className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyLink}
                  className="text-green-400 border-green-400 hover:bg-green-400 hover:text-black"
                >
                  {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </AdaptiveSection>

      {/* Live Components */}
      <div className="container mx-auto px-4 py-16 space-y-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h3 className="text-2xl font-bold text-white mb-6 text-center">Live Activity Feed</h3>
            <LiveActivityFeed />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white mb-6 text-center">Creator Leaderboard</h3>
            <CloutLeaderboard />
          </div>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-white mb-6 text-center">Achievement System</h3>
          <AchievementSystem />
        </div>
      </div>
    </div>
  );
}