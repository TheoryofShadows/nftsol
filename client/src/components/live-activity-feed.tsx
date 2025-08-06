
import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, TrendingUp, Users, Zap } from "lucide-react";

interface ActivityItem {
  id: string;
  type: 'sale' | 'listing' | 'mint' | 'clout';
  user: string;
  nft?: string;
  amount?: number;
  clout?: number;
  timestamp: Date;
}

export default function LiveActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([
    {
      id: '1',
      type: 'sale',
      user: 'CryptoArtist',
      nft: 'Solana Monkey #1234',
      amount: 15.5,
      clout: 200,
      timestamp: new Date(Date.now() - 30000)
    },
    {
      id: '2',
      type: 'mint',
      user: 'DigitalCreator',
      nft: 'Space Warriors #001',
      clout: 50,
      timestamp: new Date(Date.now() - 120000)
    },
    {
      id: '3',
      type: 'listing',
      user: 'NFTCollector',
      nft: 'DeGods #5678',
      amount: 89.2,
      timestamp: new Date(Date.now() - 180000)
    }
  ]);

  const getActivityIcon = useCallback((type: string) => {
    switch (type) {
      case 'sale': return <TrendingUp className="h-4 w-4 text-green-400" />;
      case 'mint': return <Zap className="h-4 w-4 text-yellow-400" />;
      case 'listing': return <Activity className="h-4 w-4 text-blue-400" />;
      default: return <Users className="h-4 w-4 text-purple-400" />;
    }
  }, []);

  const getActivityColor = useCallback((type: string) => {
    switch (type) {
      case 'sale': return 'bg-green-600/20 text-green-400 border-green-600/50';
      case 'mint': return 'bg-yellow-600/20 text-yellow-400 border-yellow-600/50';
      case 'listing': return 'bg-blue-600/20 text-blue-400 border-blue-600/50';
      default: return 'bg-purple-600/20 text-purple-400 border-purple-600/50';
    }
  }, []);

  const formatTimeAgo = useCallback((timestamp: Date) => {
    const seconds = Math.floor((Date.now() - timestamp.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  }, []);

  // Memoize activities to prevent unnecessary re-renders
  const memoizedActivities = useMemo(() => activities.slice(0, 10), [activities]);

  return (
    <Card className="bg-gradient-to-b from-gray-800/50 to-gray-900/50 border-gray-700">
      <CardHeader className="pb-4">
        <CardTitle className="text-white flex items-center gap-2">
          <Activity className="h-5 w-5 text-purple-400" />
          Live Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 max-h-96 overflow-y-auto">
        {memoizedActivities.map((activity) => (
          <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg border border-gray-700/50">
            <div className="flex items-center gap-3">
              {getActivityIcon(activity.type)}
              <div>
                <div className="text-sm text-white font-medium">{activity.user}</div>
                <div className="text-xs text-gray-400">
                  {activity.type === 'sale' && `Sold ${activity.nft} for ${activity.amount} SOL`}
                  {activity.type === 'mint' && `Minted ${activity.nft}`}
                  {activity.type === 'listing' && `Listed ${activity.nft} for ${activity.amount} SOL`}
                </div>
              </div>
            </div>
            <div className="text-right">
              {activity.clout && (
                <Badge className={getActivityColor(activity.type)}>
                  +{activity.clout} CLOUT
                </Badge>
              )}
              <div className="text-xs text-gray-500 mt-1">
                {formatTimeAgo(activity.timestamp)}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
