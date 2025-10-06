import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Coins, TrendingUp, Target, Gift } from "lucide-react";

export default function MobileCloutTracker() {
  const [userClout] = useState(2340);
  const [dailyGoal] = useState(500);
  const [todayEarned] = useState(180);

  return (
    <div className="md:hidden fixed bottom-20 left-4 right-4 z-40" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <Card className="bg-gradient-to-r from-yellow-600/95 to-orange-600/95 backdrop-blur border-yellow-500/50 gpu-accelerated">
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Coins className="h-4 w-4 text-yellow-100 flex-shrink-0" />
              <span className="text-sm text-yellow-100 font-semibold truncate">CLOUT</span>
            </div>
            <Badge className="bg-yellow-200/20 text-yellow-100 border-yellow-300/50 text-xs px-2 py-1 ml-2 flex-shrink-0">
              {userClout.toLocaleString()}
            </Badge>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-yellow-200">Daily Progress</span>
              <span className="text-yellow-100">{todayEarned}/{dailyGoal}</span>
            </div>
            <div className="w-full bg-yellow-800/30 rounded-full h-2">
              <div
                className="h-2 bg-yellow-200 rounded-full transition-all duration-300"
                style={{ width: `${(todayEarned / dailyGoal) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="flex gap-2 mt-3">
            <Button size="sm" className="flex-1 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-100 border-yellow-400/50">
              <Gift className="h-4 w-4 mr-1" />
              Claim
            </Button>
            <Button size="sm" className="flex-1 bg-orange-500/20 hover:bg-orange-500/30 text-yellow-100 border-orange-400/50">
              <Target className="h-4 w-4 mr-1" />
              Goals
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}