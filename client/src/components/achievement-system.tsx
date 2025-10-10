
import { useState, type ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Star, Target, Crown, Gift, Lock } from "lucide-react";

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: ReactNode;
  progress: number;
  maxProgress: number;
  reward: number;
  unlocked: boolean;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export default function AchievementSystem() {
  const [achievements] = useState<Achievement[]>([
    {
      id: '1',
      title: 'First Steps',
      description: 'Make your first NFT purchase',
      icon: <Target className="h-6 w-6" />,
      progress: 1,
      maxProgress: 1,
      reward: 100,
      unlocked: true,
      rarity: 'common'
    },
    {
      id: '2',
      title: 'Creator',
      description: 'Mint 5 NFTs',
      icon: <Star className="h-6 w-6" />,
      progress: 3,
      maxProgress: 5,
      reward: 500,
      unlocked: false,
      rarity: 'rare'
    },
    {
      id: '3',
      title: 'Trading Master',
      description: 'Complete 50 transactions',
      icon: <Trophy className="h-6 w-6" />,
      progress: 12,
      maxProgress: 50,
      reward: 2000,
      unlocked: false,
      rarity: 'epic'
    },
    {
      id: '4',
      title: 'CLOUT King',
      description: 'Earn 10,000 CLOUT tokens',
      icon: <Crown className="h-6 w-6" />,
      progress: 2340,
      maxProgress: 10000,
      reward: 5000,
      unlocked: false,
      rarity: 'legendary'
    }
  ]);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-400 border-gray-600';
      case 'rare': return 'text-blue-400 border-blue-600';
      case 'epic': return 'text-purple-400 border-purple-600';
      case 'legendary': return 'text-yellow-400 border-yellow-600';
      default: return 'text-gray-400 border-gray-600';
    }
  };

  const getRarityBg = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'from-gray-600/20 to-gray-700/20';
      case 'rare': return 'from-blue-600/20 to-blue-700/20';
      case 'epic': return 'from-purple-600/20 to-purple-700/20';
      case 'legendary': return 'from-yellow-600/20 to-yellow-700/20';
      default: return 'from-gray-600/20 to-gray-700/20';
    }
  };

  return (
    <Card className="bg-gradient-to-b from-gray-800/50 to-gray-900/50 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-400" />
          Achievements
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {achievements.map((achievement) => (
          <div
            key={achievement.id}
            className={`p-4 rounded-lg border bg-gradient-to-r ${getRarityBg(achievement.rarity)} ${getRarityColor(achievement.rarity)}`}
          >
            <div className="flex items-start justify-between mb-3 gap-3">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className={`flex-shrink-0 ${achievement.unlocked ? 'text-current' : 'text-gray-600'}`}>
                  {achievement.unlocked ? achievement.icon : <Lock className="h-6 w-6" />}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-white text-sm mb-1">{achievement.title}</h3>
                  <p className="text-xs text-gray-400 leading-tight">{achievement.description}</p>
                </div>
              </div>
              <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-600/50 text-xs whitespace-nowrap flex-shrink-0">
                +{achievement.reward} CLOUT
              </Badge>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Progress</span>
                <span className="text-white">{achievement.progress}/{achievement.maxProgress}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    achievement.unlocked ? 'bg-green-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${(achievement.progress / achievement.maxProgress) * 100}%` }}
                ></div>
              </div>
            </div>

            {achievement.unlocked && (
              <Button size="sm" className="mt-3 w-full bg-green-600 hover:bg-green-700">
                <Gift className="h-4 w-4 mr-2" />
                Claim Reward
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
