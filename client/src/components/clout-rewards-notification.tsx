import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Award, Gift, TrendingUp, X } from "lucide-react";

interface CloutReward {
  amount: number;
  reason: string;
  timestamp: Date;
}

export default function CloutRewardsNotification() {
  const [rewards, setRewards] = useState<CloutReward[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check for new CLOUT rewards in localStorage
    const checkForRewards = () => {
      const storedRewards = localStorage.getItem('pendingCloutRewards');
      if (storedRewards) {
        const parsedRewards = JSON.parse(storedRewards);
        setRewards(parsedRewards);
        setIsVisible(true);
        
        // Clear after showing
        setTimeout(() => {
          localStorage.removeItem('pendingCloutRewards');
        }, 1000);
      }
    };

    checkForRewards();
    
    // Check periodically for new rewards
    const interval = setInterval(checkForRewards, 2000);
    return () => clearInterval(interval);
  }, []);

  const dismissNotification = () => {
    setIsVisible(false);
    setRewards([]);
  };

  if (!isVisible || rewards.length === 0) return null;

  const totalRewards = rewards.reduce((sum, reward) => sum + reward.amount, 0);

  return (
    <div className="fixed top-20 right-4 z-40 animate-in slide-in-from-right duration-300">
      <Card className="bg-gradient-to-r from-purple-900/90 to-green-900/90 border-purple-500/50 backdrop-blur-md">
        <CardContent className="p-4 relative">
          <Button
            onClick={dismissNotification}
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 h-6 w-6 p-0 text-white/60 hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
          
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <Award className="h-8 w-8 text-yellow-400" />
            </div>
            
            <div className="flex-1">
              <h3 className="font-semibold text-white flex items-center space-x-2">
                <Gift className="h-4 w-4" />
                <span>CLOUT Rewards!</span>
              </h3>
              
              <div className="mt-2 space-y-1">
                {rewards.map((reward, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="text-gray-200">{reward.reason}</span>
                    <Badge className="bg-purple-600 text-white">
                      +{reward.amount} CLOUT
                    </Badge>
                  </div>
                ))}
              </div>
              
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center space-x-1 text-green-400">
                  <TrendingUp className="h-4 w-4" />
                  <span className="font-semibold">Total: +{totalRewards} CLOUT</span>
                </div>
              </div>
              
              <p className="text-xs text-gray-300 mt-2">
                Use CLOUT for exclusive NFT drops and reduced fees!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}