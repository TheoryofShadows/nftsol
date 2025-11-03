import React, { useMemo, useState, useEffect } from 'react';

interface Activity {
  id: string;
  type: 'mint' | 'sale' | 'transfer' | 'listing';
  title: string;
  description: string;
  timestamp: Date;
  amount?: string;
}

export default function ActivityFeed() {
  // Force re-render every minute to update relative times
  const [, setUpdateTrigger] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setUpdateTrigger((prev) => prev + 1);
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Mock activity data - in production, this would come from your API
  // Use useState to capture timestamp at mount, avoiding purity warnings
  const [mountTime] = useState(() => Date.now());
  
  const activities: Activity[] = useMemo(() => {
    const now = mountTime;
    return [
      {
        id: '1',
        type: 'mint' as const,
        title: 'NFT Minted',
        description: 'You minted "Digital Dream #42"',
        timestamp: new Date(now - 2 * 60 * 60 * 1000), // 2 hours ago
        amount: '0.5 SOL',
      },
      {
        id: '2',
        type: 'sale' as const,
        title: 'NFT Sold',
        description: 'Digital Dream #42 was sold',
        timestamp: new Date(now - 5 * 60 * 60 * 1000), // 5 hours ago
        amount: '2.5 SOL',
      },
      {
        id: '3',
        type: 'listing' as const,
        title: 'NFT Listed',
        description: 'You listed "Cool Art #123"',
        timestamp: new Date(now - 24 * 60 * 60 * 1000), // 1 day ago
        amount: '1.0 SOL',
      },
    ];
  }, [mountTime]);

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'mint':
        return '✨';
      case 'sale':
        return '💰';
      case 'transfer':
        return '🔄';
      case 'listing':
        return '📋';
      default:
        return '⚡';
    }
  };

  const getActivityColor = (type: Activity['type']) => {
    switch (type) {
      case 'mint':
        return 'bg-purple-500/20 text-purple-400';
      case 'sale':
        return 'bg-green-500/20 text-green-400';
      case 'transfer':
        return 'bg-blue-500/20 text-blue-400';
      case 'listing':
        return 'bg-cyan-500/20 text-cyan-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  // Use state to track current time for relative timestamps
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  
  // Update current time every minute for fresh relative times
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, []);
  
  const formatTimeAgo = (date: Date) => {
    // Use the state-tracked current time
    const seconds = Math.floor((currentTime - date.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold gradient-text-primary">Recent Activity</h2>
        <button className="text-sm text-gray-400 hover:text-white transition-colors">
          View All
        </button>
      </div>

      <div className="space-y-4">
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">📭</div>
            <p className="text-gray-400 text-sm">No recent activity</p>
          </div>
        ) : (
          activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start space-x-4 p-3 rounded-lg hover:bg-white/5 transition-colors group cursor-pointer"
            >
              <div
                className={`w-10 h-10 rounded-lg ${getActivityColor(activity.type)} flex items-center justify-center text-lg flex-shrink-0`}
              >
                {getActivityIcon(activity.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-1">
                  <h3 className="font-semibold text-white text-sm group-hover:text-purple-400 transition-colors">
                    {activity.title}
                  </h3>
                  {activity.amount && (
                    <span className="text-xs font-bold gradient-text-primary ml-2 flex-shrink-0">
                      {activity.amount}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mb-1">{activity.description}</p>
                <p className="text-xs text-gray-500">
                  {formatTimeAgo(activity.timestamp)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {activities.length > 0 && (
        <button className="w-full mt-4 py-2 text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors">
          View All Activity →
        </button>
      )}
    </div>
  );
}
