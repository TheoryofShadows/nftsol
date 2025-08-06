import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Wallet, 
  Zap, 
  TrendingUp, 
  Users, 
  ChevronRight, 
  ChevronLeft,
  X,
  Sparkles,
  Star,
  Shield,
  Target,
  Gift,
  Trophy,
  PiggyBank,
  Rocket,
  Heart,
  Brain,
  Palette,
  DollarSign,
  BookOpen
} from "lucide-react";

interface UnifiedOnboardingGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UnifiedOnboardingGuide({ isOpen, onClose }: UnifiedOnboardingGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [mode, setMode] = useState<'quick' | 'detailed'>('quick');
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  // Quick overview highlights
  const quickHighlights = [
    {
      icon: <TrendingUp className="h-6 w-6 text-green-400" />,
      title: "95.5% Seller Rate",
      description: "Industry-leading creator economics - keep more of your earnings than any other platform",
      stat: "vs 92.5% on OpenSea"
    },
    {
      icon: <Zap className="h-6 w-6 text-yellow-400" />,
      title: "CLOUT Rewards",
      description: "Earn valuable CLOUT tokens for every transaction, interaction, and milestone",
      stat: "Up to 50 CLOUT per NFT"
    },
    {
      icon: <Shield className="h-6 w-6 text-blue-400" />,
      title: "Full Transparency", 
      description: "Real-time analytics, open transaction history, and verified creator profiles",
      stat: "100% Verified Data"
    },
    {
      icon: <Brain className="h-6 w-6 text-purple-400" />,
      title: "AI-Powered Discovery",
      description: "Smart recommendations help you find NFTs that match your taste and investment goals",
      stat: "5 Recommendation Engines"
    },
    {
      icon: <Users className="h-6 w-6 text-pink-400" />,
      title: "Social Trading",
      description: "Follow top collectors, copy successful strategies, and build your network",
      stat: "Live Community Features"
    },
    {
      icon: <Rocket className="h-6 w-6 text-cyan-400" />,
      title: "Lightning Fast",
      description: "Built on Solana for instant transactions with minimal fees (under $0.01)",
      stat: "Sub-second confirmations"
    }
  ];

  // Detailed walkthrough steps
  const detailedSteps = [
    {
      id: 0,
      title: "Welcome to NFTSol",
      icon: <Sparkles className="h-8 w-8 text-purple-400" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-300 text-lg leading-relaxed">
            Welcome to the future of NFT trading! NFTSol combines cutting-edge AI, superior economics, 
            and seamless user experience on the Solana blockchain.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-gray-800 border-purple-500/20">
              <CardContent className="p-4 text-center">
                <DollarSign className="h-6 w-6 text-green-400 mx-auto mb-2" />
                <p className="text-sm text-gray-300">Save 1% on every sale vs competitors</p>
              </CardContent>
            </Card>
            <Card className="bg-gray-800 border-blue-500/20">
              <CardContent className="p-4 text-center">
                <Zap className="h-6 w-6 text-yellow-400 mx-auto mb-2" />
                <p className="text-sm text-gray-300">Earn CLOUT tokens for participation</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    },
    {
      id: 1,
      title: "Connect Your Wallet",
      icon: <Wallet className="h-8 w-8 text-blue-400" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-300">
            Connect your Solana wallet to start trading. We support all major wallets:
          </p>
          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
              <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                <Wallet className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="font-medium text-white">Phantom Wallet</p>
                <p className="text-sm text-gray-400">Most popular Solana wallet</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
              <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center">
                <Wallet className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="font-medium text-white">Solflare Wallet</p>
                <p className="text-sm text-gray-400">Feature-rich with staking</p>
              </div>
            </div>
          </div>
          <Badge variant="secondary" className="bg-green-600/20 text-green-400">
            Secure & encrypted connection
          </Badge>
        </div>
      )
    },
    {
      id: 2,
      title: "Discover AI Recommendations",
      icon: <Brain className="h-8 w-8 text-purple-400" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-300">
            Our AI analyzes your preferences and market trends to suggest perfect NFTs:
          </p>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Target className="h-5 w-5 text-green-400" />
              <span className="text-gray-300">Content-based filtering matches your taste</span>
            </div>
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-blue-400" />
              <span className="text-gray-300">Collaborative filtering finds community favorites</span>
            </div>
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-yellow-400" />
              <span className="text-gray-300">Trending analysis spots hot collections</span>
            </div>
            <div className="flex items-center gap-3">
              <PiggyBank className="h-5 w-5 text-purple-400" />
              <span className="text-gray-300">Price matching finds value opportunities</span>
            </div>
            <div className="flex items-center gap-3">
              <Heart className="h-5 w-5 text-pink-400" />
              <span className="text-gray-300">Artist recommendations from your favorites</span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 3,
      title: "Earn CLOUT Rewards",
      icon: <Gift className="h-8 w-8 text-yellow-400" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-300">
            CLOUT is our utility token that rewards active participation:
          </p>
          <div className="grid grid-cols-1 gap-3">
            <Card className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border-yellow-500/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Trophy className="h-5 w-5 text-yellow-400" />
                    <span className="text-white">Trading Activity</span>
                  </div>
                  <Badge variant="secondary" className="bg-yellow-600/20 text-yellow-400">
                    +10-50 CLOUT
                  </Badge>
                </div>
                <p className="text-sm text-gray-300 mt-2">Earn CLOUT for buying, selling, and creating NFTs</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-purple-500/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Star className="h-5 w-5 text-purple-400" />
                    <span className="text-white">Social Engagement</span>
                  </div>
                  <Badge variant="secondary" className="bg-purple-600/20 text-purple-400">
                    +5-25 CLOUT
                  </Badge>
                </div>
                <p className="text-sm text-gray-300 mt-2">Like, share, and interact with the community</p>
              </CardContent>
            </Card>
          </div>
          <div className="p-3 bg-blue-600/10 border border-blue-500/30 rounded-lg">
            <p className="text-sm text-blue-300">
              💡 <strong>Pro Tip:</strong> Use CLOUT to unlock premium features, boost your NFT listings, 
              and participate in exclusive drops!
            </p>
          </div>
        </div>
      )
    },
    {
      id: 4,
      title: "Explore Social Trading",
      icon: <Users className="h-8 w-8 text-blue-400" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-300">
            Connect with successful traders and learn from the community:
          </p>
          <div className="space-y-3">
            <Card className="bg-gray-800 border-blue-500/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="h-5 w-5 text-blue-400" />
                  <span className="font-medium text-white">Follow Top Traders</span>
                </div>
                <p className="text-sm text-gray-300">
                  See what successful collectors are buying and selling
                </p>
              </CardContent>
            </Card>
            <Card className="bg-gray-800 border-green-500/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="h-5 w-5 text-green-400" />
                  <span className="font-medium text-white">Copy Strategies</span>
                </div>
                <p className="text-sm text-gray-300">
                  Automatically mirror trades from profitable portfolios
                </p>
              </CardContent>
            </Card>
            <Card className="bg-gray-800 border-purple-500/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Trophy className="h-5 w-5 text-purple-400" />
                  <span className="font-medium text-white">Leaderboards</span>
                </div>
                <p className="text-sm text-gray-300">
                  Compete for top collector and trader rankings
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    },
    {
      id: 5,
      title: "Create & List NFTs",
      icon: <Palette className="h-8 w-8 text-green-400" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-300">
            Become a creator and start earning with industry-leading rates:
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-gradient-to-br from-green-600/20 to-blue-600/20 border-green-500/30">
              <CardContent className="p-4 text-center">
                <h4 className="text-2xl font-bold text-green-400 mb-1">95.5%</h4>
                <p className="text-sm text-gray-300">Creator earnings on NFTSol</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-red-600/20 to-orange-600/20 border-red-500/30">
              <CardContent className="p-4 text-center">
                <h4 className="text-2xl font-bold text-red-400 mb-1">92.5%</h4>
                <p className="text-sm text-gray-300">Creator earnings on OpenSea</p>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Zap className="h-4 w-4 text-yellow-400" />
              <span className="text-sm text-gray-300">AI-powered pricing suggestions</span>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="h-4 w-4 text-blue-400" />
              <span className="text-sm text-gray-300">Secure IPFS storage included</span>
            </div>
            <div className="flex items-center gap-3">
              <TrendingUp className="h-4 w-4 text-green-400" />
              <span className="text-sm text-gray-300">Automatic promotion to collectors</span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 6,
      title: "Start Trading!",
      icon: <Rocket className="h-8 w-8 text-cyan-400" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-300 text-lg">
            You're ready to experience the future of NFT trading! 🚀
          </p>
          <div className="grid grid-cols-1 gap-3">
            <Button 
              variant="outline" 
              className="justify-start h-auto p-4 bg-purple-600/10 border-purple-500/30 hover:bg-purple-600/20"
            >
              <BookOpen className="h-5 w-5 text-purple-400 mr-3" />
              <div className="text-left">
                <div className="font-medium text-white">Browse Marketplace</div>
                <div className="text-sm text-gray-400">Discover amazing NFTs with AI recommendations</div>
              </div>
            </Button>
            <Button 
              variant="outline" 
              className="justify-start h-auto p-4 bg-green-600/10 border-green-500/30 hover:bg-green-600/20"
            >
              <Palette className="h-5 w-5 text-green-400 mr-3" />
              <div className="text-left">
                <div className="font-medium text-white">Create Your First NFT</div>
                <div className="text-sm text-gray-400">Start earning with 95.5% creator rates</div>
              </div>
            </Button>
            <Button 
              variant="outline" 
              className="justify-start h-auto p-4 bg-blue-600/10 border-blue-500/30 hover:bg-blue-600/20"
            >
              <Users className="h-5 w-5 text-blue-400 mr-3" />
              <div className="text-left">
                <div className="font-medium text-white">Join Social Trading</div>
                <div className="text-sm text-gray-400">Follow top collectors and learn strategies</div>
              </div>
            </Button>
          </div>
          <div className="p-4 bg-gradient-to-r from-yellow-600/10 to-green-600/10 border border-yellow-500/30 rounded-lg">
            <p className="text-sm text-yellow-300 font-medium mb-1">🎉 Welcome Bonus</p>
            <p className="text-sm text-gray-300">
              Complete your first transaction to earn <strong>100 CLOUT tokens</strong> and unlock premium features!
            </p>
          </div>
        </div>
      )
    }
  ];

  const handleStepComplete = (stepId: number) => {
    setCompletedSteps(prev => new Set([...Array.from(prev), stepId]));
  };

  const nextStep = () => {
    if (mode === 'quick') return;
    if (currentStep < detailedSteps.length - 1) {
      handleStepComplete(currentStep);
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const switchToDetailed = () => {
    setMode('detailed');
    setCurrentStep(0);
  };

  const switchToQuick = () => {
    setMode('quick');
    setCurrentStep(0);
  };

  if (!isOpen) return null;

  useEffect(() => {
    // Don't auto-show guide to avoid blocking UI
    const hasSeenGuide = localStorage.getItem('nftsol_guide_seen');
    // Guide will only open when user clicks the guide button
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-700">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
          <div>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-green-400 bg-clip-text text-transparent">
              Welcome to NFTSol
            </DialogTitle>
            <DialogDescription className="text-gray-400 mt-2">
              {mode === 'quick' 
                ? "Quick overview of what makes NFTSol special" 
                : `Step ${currentStep + 1} of ${detailedSteps.length} - Complete walkthrough`
              }
            </DialogDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        {/* Mode Toggle */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={mode === 'quick' ? 'default' : 'outline'}
            size="sm"
            onClick={switchToQuick}
            className={mode === 'quick' ? 'bg-purple-600 hover:bg-purple-700' : ''}
          >
            Quick Overview
          </Button>
          <Button
            variant={mode === 'detailed' ? 'default' : 'outline'}
            size="sm"
            onClick={switchToDetailed}
            className={mode === 'detailed' ? 'bg-green-600 hover:bg-green-700' : ''}
          >
            Detailed Guide
          </Button>
        </div>

        {mode === 'quick' ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {quickHighlights.map((highlight, index) => (
                <Card key={index} className="bg-gray-800 border-gray-700 hover:border-purple-500/50 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      {highlight.icon}
                      <CardTitle className="text-lg text-white">{highlight.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-gray-300 mb-3">
                      {highlight.description}
                    </CardDescription>
                    <Badge variant="secondary" className="bg-purple-600/20 text-purple-400 border-purple-500/30">
                      {highlight.stat}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                onClick={switchToDetailed}
                className="flex-1 bg-gradient-to-r from-purple-600 to-green-600 hover:opacity-90"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Take Detailed Tour
              </Button>
              <Button variant="outline" onClick={onClose} className="px-8">
                Start Trading
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Progress</span>
                <span className="text-purple-400">{currentStep + 1} of {detailedSteps.length}</span>
              </div>
              <Progress 
                value={((currentStep + 1) / detailedSteps.length) * 100} 
                className="h-2"
              />
            </div>

            {/* Current Step Content */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <div className="flex items-center gap-4">
                  {detailedSteps[currentStep].icon}
                  <CardTitle className="text-xl text-white">
                    {detailedSteps[currentStep].title}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {detailedSteps[currentStep].content}
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex justify-between items-center pt-4">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 0}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>

              <div className="flex gap-2">
                <Button variant="ghost" onClick={switchToQuick} size="sm">
                  Quick View
                </Button>
                <Button variant="ghost" onClick={onClose} size="sm">
                  Skip Guide
                </Button>
              </div>

              {currentStep < detailedSteps.length - 1 ? (
                <Button
                  onClick={nextStep}
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={onClose}
                  className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-blue-600 hover:opacity-90"
                >
                  <Rocket className="h-4 w-4" />
                  Start Trading!
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}