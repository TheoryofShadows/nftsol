
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { 
  ShoppingCart, 
  Palette, 
  Award, 
  TrendingUp,
  Users,
  Zap
} from 'lucide-react';

interface Activity {
  id: string;
  type: 'purchase' | 'mint' | 'reward' | 'follow' | 'list';
  user: {
    name: string;
    avatar: string;
  };
  data: {
    nftTitle?: string;
    amount?: number;
    cloutEarned?: number;
    followerName?: string;
  };
  timestamp: Date;
}

export function RealTimeFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    // Simulate real-time activities
    const generateActivity = (): Activity => {
      const types = ['purchase', 'mint', 'reward', 'follow', 'list'] as const;
      const type = types[Math.floor(Math.random() * types.length)];
      
      return {
        id: Math.random().toString(),
        type,
        user: {
          name: `User${Math.floor(Math.random() * 1000)}`,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}`
        },
        data: {
          nftTitle: type === 'purchase' || type === 'mint' || type === 'list' ? `NFT #${Math.floor(Math.random() * 1000)}` : undefined,
          amount: type === 'purchase' || type === 'list' ? Math.random() * 20 + 1 : undefined,
          cloutEarned: type === 'reward' ? Math.floor(Math.random() * 100) + 10 : undefined,
          followerName: type === 'follow' ? `Creator${Math.floor(Math.random() * 100)}` : undefined
        },
        timestamp: new Date()
      };
    };

    // Add initial activities
    setActivities(Array.from({ length: 5 }, generateActivity));

    // Simulate real-time updates
    const interval = setInterval(() => {
      setActivities(prev => [generateActivity(), ...prev.slice(0, 9)]);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'purchase': return <ShoppingCart className="h-4 w-4" />;
      case 'mint': return <Palette className="h-4 w-4" />;
      case 'reward': return <Award className="h-4 w-4" />;
      case 'follow': return <Users className="h-4 w-4" />;
      case 'list': return <TrendingUp className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: Activity['type']) => {
    switch (type) {
      case 'purchase': return 'text-green-400';
      case 'mint': return 'text-purple-400';
      case 'reward': return 'text-yellow-400';
      case 'follow': return 'text-blue-400';
      case 'list': return 'text-orange-400';
    }
  };

  const getActivityText = (activity: Activity) => {
    switch (activity.type) {
      case 'purchase':
        return `purchased ${activity.data.nftTitle} for ${activity.data.amount?.toFixed(2)} SOL`;
      case 'mint':
        return `minted ${activity.data.nftTitle}`;
      case 'reward':
        return `earned ${activity.data.cloutEarned} CLOUT tokens`;
      case 'follow':
        return `started following ${activity.data.followerName}`;
      case 'list':
        return `listed ${activity.data.nftTitle} for ${activity.data.amount?.toFixed(2)} SOL`;
    }
  };

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-400" />
          Live Activity Feed
          <Badge className="bg-green-500/20 text-green-400 animate-pulse">
            Live
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-700/30 rounded-lg">
            <Avatar className="h-8 w-8">
              <AvatarImage src={activity.user.avatar} />
              <AvatarFallback>{activity.user.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`${getActivityColor(activity.type)}`}>
                  {getActivityIcon(activity.type)}
                </span>
                <span className="text-sm font-medium text-white">
                  {activity.user.name}
                </span>
              </div>
              <p className="text-sm text-gray-400 mt-1">
                {getActivityText(activity)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
