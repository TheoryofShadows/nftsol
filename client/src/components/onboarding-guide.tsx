import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Circle, ArrowRight, Info, Shield, DollarSign, Users, Zap, Star } from "lucide-react";

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  content: string;
  completed: boolean;
}

export default function OnboardingGuide() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  
  const [steps, setSteps] = useState<OnboardingStep[]>([
    {
      id: 1,
      title: "Welcome to NFTSol",
      description: "The most transparent NFT marketplace on Solana",
      content: "NFTSol is built with complete transparency in mind. We show you exactly how everything works, from our 95.5% seller retention rate to our authentic market data from real Solana collections like Mad Lads, DeGods, and Solana Monkey Business.",
      completed: false
    },
    {
      id: 2,
      title: "Industry-Leading Seller Rates",
      description: "95.5% of sale proceeds go directly to sellers",
      content: "Unlike other platforms that take 5-10% fees, NFTSol only charges 2% platform fee + 2.5% creator royalties. This means sellers keep 95.5% of their earnings - the highest rate in the industry. We believe creators should be rewarded fairly.",
      completed: false
    },
    {
      id: 3,
      title: "CLOUT Rewards System",
      description: "Earn CLOUT tokens for every interaction",
      content: "Our CLOUT token rewards system gives you tokens for listing NFTs (50 CLOUT), making sales (100 CLOUT), and participating in the community. These tokens can be used for platform features and future governance voting.",
      completed: false
    },
    {
      id: 4,
      title: "AI-Powered Recommendations",
      description: "Personalized NFT discovery based on your preferences",
      content: "Our recommendation engine learns from your interactions and suggests NFTs you'll love. It uses real market data, price matching, collaborative filtering, and content analysis to find perfect matches for your taste and budget.",
      completed: false
    },
    {
      id: 5,
      title: "Complete Transparency",
      description: "Every transaction, fee, and process is fully visible",
      content: "We believe in complete transparency. You can see exactly where your money goes, how our algorithms work, and what data we use. No hidden fees, no surprise charges, no black box algorithms - everything is open and honest.",
      completed: false
    },
    {
      id: 6,
      title: "Platform Features",
      description: "Discover advanced filtering and search capabilities",
      content: "Use our advanced filters to find exactly what you're looking for: price ranges, rarity levels, specific artists, collections, and more. Our search supports real-time updates and shows authentic market data.",
      completed: false
    }
  ]);

  const platformFeatures = [
    {
      icon: <DollarSign className="w-6 h-6 text-green-500" />,
      title: "95.5% Seller Rate",
      description: "Highest payout rate in the industry",
      details: "Only 2% platform fee + 2.5% creator royalty = 95.5% to sellers"
    },
    {
      icon: <Shield className="w-6 h-6 text-blue-500" />,
      title: "Complete Transparency",
      description: "Every process is fully visible",
      details: "Open source algorithms, clear fee structure, real market data"
    },
    {
      icon: <Zap className="w-6 h-6 text-purple-500" />,
      title: "CLOUT Rewards",
      description: "Earn tokens for every action",
      details: "50 CLOUT for listings, 100 CLOUT for sales, community governance"
    },
    {
      icon: <Users className="w-6 h-6 text-orange-500" />,
      title: "Real Collections",
      description: "Authentic Solana NFT data",
      details: "Mad Lads, DeGods, SMB, Froganas - real market prices and stats"
    },
    {
      icon: <Star className="w-6 h-6 text-yellow-500" />,
      title: "AI Recommendations",
      description: "Personalized NFT discovery",
      details: "Machine learning algorithms match you with perfect NFTs"
    }
  ];

  const completeStep = (stepId: number) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, completed: true } : step
    ));
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      completeStep(steps[currentStep].id);
      setCurrentStep(currentStep + 1);
    } else {
      completeStep(steps[currentStep].id);
      setIsOpen(false);
    }
  };

  const progress = ((steps.filter(step => step.completed).length) / steps.length) * 100;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="bg-gradient-to-r from-purple-600 to-green-600 hover:from-purple-700 hover:to-green-700 border-0">
            <Info className="w-4 h-4 mr-2" />
            Platform Guide
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white">
              Welcome to NFTSol - The Transparent NFT Marketplace
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              Learn why NFTSol is different and how we put creators first
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-400">
                <span>Progress</span>
                <span>{Math.round(progress)}% Complete</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Current Step */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="bg-purple-600 text-white">
                    Step {currentStep + 1} of {steps.length}
                  </Badge>
                  <CardTitle className="text-white">{steps[currentStep].title}</CardTitle>
                </div>
                <CardDescription className="text-purple-300">
                  {steps[currentStep].description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 leading-relaxed mb-4">
                  {steps[currentStep].content}
                </p>
                <Button onClick={nextStep} className="bg-gradient-to-r from-purple-600 to-green-600 hover:from-purple-700 hover:to-green-700">
                  {currentStep === steps.length - 1 ? "Complete Guide" : "Next Step"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            {/* Platform Features Overview */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white">Why Choose NFTSol?</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {platformFeatures.map((feature, index) => (
                  <Card key={index} className="bg-gray-800 border-gray-700">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        {feature.icon}
                        <div>
                          <h4 className="font-semibold text-white">{feature.title}</h4>
                          <p className="text-sm text-gray-400 mb-1">{feature.description}</p>
                          <p className="text-xs text-gray-500">{feature.details}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Step Progress Overview */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-white">Guide Progress</h3>
              <div className="space-y-2">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex items-center space-x-3">
                    {step.completed ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-500" />
                    )}
                    <span className={`text-sm ${step.completed ? 'text-green-400' : 'text-gray-400'}`}>
                      {step.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mini floating guide button */}
      {!isOpen && (
        <div className="fixed bottom-4 right-4 z-50">
          <Button
            onClick={() => setIsOpen(true)}
            className="rounded-full w-12 h-12 bg-gradient-to-r from-purple-600 to-green-600 hover:from-purple-700 hover:to-green-700 shadow-lg"
            size="sm"
          >
            <Info className="w-5 h-5" />
          </Button>
        </div>
      )}
    </>
  );
}