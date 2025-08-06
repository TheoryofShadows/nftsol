
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { 
  Users, 
  TrendingUp, 
  Copy, 
  Heart, 
  MessageCircle, 
  Share2, 
  Trophy,
  Target,
  Eye,
  Star,
  UserPlus,
  Crown,
  Zap,
  Award,
  Filter,
  Search,
  Bell,
  Settings,
  BarChart3,
  Activity,
  Flame,
  TrendingDown,
  Clock,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Bookmark,
  Send,
  RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TopTrader {
  id: string;
  username: string;
  avatar: string;
  rank: number;
  totalPnL: number;
  weeklyPnL: number;
  winRate: number;
  followers: number;
  isFollowing: boolean;
  verified: boolean;
  trades: number;
  portfolioValue: number;
  streak: number;
  riskScore: number;
  averageHoldTime: number;
  specialties: string[];
  isOnline: boolean;
  lastActive: Date;
  badge?: 'diamond' | 'gold' | 'silver' | 'bronze';
}

interface TradingFeed {
  id: string;
  trader: TopTrader;
  action: 'buy' | 'sell' | 'list' | 'bid' | 'offer';
  nft: {
    id: string;
    name: string;
    image: string;
    price: number;
    collection: string;
    rarity: number;
    previousPrice?: number;
  };
  timestamp: Date;
  likes: number;
  comments: number;
  shares: number;
  bookmarks: number;
  isLiked: boolean;
  isBookmarked: boolean;
  analysis?: string;
  confidence: number;
  tags: string[];
  profitLoss?: number;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  comments_data?: Comment[];
}

interface Comment {
  id: string;
  user: {
    username: string;
    avatar: string;
    verified: boolean;
  };
  content: string;
  timestamp: Date;
  likes: number;
  isLiked: boolean;
}

interface CommunityChallenge {
  id: string;
  title: string;
  description: string;
  reward: number;
  participants: number;
  endDate: Date;
  progress: number;
  type: 'trading' | 'collecting' | 'social' | 'prediction' | 'streak';
  joined: boolean;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  requirements: string[];
  leaderboard: { username: string; score: number; rank: number }[];
  trending: boolean;
  timeLimit?: string;
  bonus_rewards?: number;
}

export default function SocialTradingHub() {
  const [topTraders, setTopTraders] = useState<TopTrader[]>([]);
  const [tradingFeed, setTradingFeed] = useState<TradingFeed[]>([]);
  const [challenges, setChallenges] = useState<CommunityChallenge[]>([]);
  const [activeTab, setActiveTab] = useState("feed");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [feedFilter, setFeedFilter] = useState("all");
  const [showComments, setShowComments] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");
  const [notifications, setNotifications] = useState<any[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const { toast } = useToast();

  useEffect(() => {
    fetchSocialData();
    
    // Auto-refresh every 30 seconds if enabled
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchSocialData(true);
      }, 30000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  useEffect(() => {
    // Simulate real-time notifications
    const notificationInterval = setInterval(() => {
      const randomEvents = [
        "CryptoMaster just bought a Mad Lads NFT",
        "New challenge: Weekly Profit Challenge starting soon",
        "NFTWhale achieved a 15% weekly gain"
      ];
      
      if (Math.random() > 0.8) {
        const newNotification = {
          id: Date.now(),
          message: randomEvents[Math.floor(Math.random() * randomEvents.length)],
          timestamp: new Date(),
          type: 'info'
        };
        
        setNotifications(prev => [newNotification, ...prev.slice(0, 4)]);
      }
    }, 10000);

    return () => clearInterval(notificationInterval);
  }, []);

  const fetchSocialData = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      
      // Fetch top traders
      const tradersResponse = await fetch('/api/social/top-traders');
      if (tradersResponse.ok) {
        const traders = await tradersResponse.json();
        setTopTraders(traders);
      }

      // Fetch trading feed
      const feedResponse = await fetch(`/api/social/trading-feed?filter=${feedFilter}&search=${searchQuery}`);
      if (feedResponse.ok) {
        const feed = await feedResponse.json();
        setTradingFeed(feed);
      }

      // Fetch challenges
      const challengesResponse = await fetch('/api/social/challenges');
      if (challengesResponse.ok) {
        const challenges = await challengesResponse.json();
        setChallenges(challenges);
      }
      
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch social data:', error);
    } finally {
      if (!isRefresh) setLoading(false);
    }
  };

  const followTrader = async (traderId: string) => {
    try {
      const userId = localStorage.getItem('userId');
      const response = await fetch('/api/social/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, traderId })
      });

      if (response.ok) {
        setTopTraders(prev => 
          prev.map(trader => 
            trader.id === traderId 
              ? { ...trader, isFollowing: !trader.isFollowing, followers: trader.followers + (trader.isFollowing ? -1 : 1) }
              : trader
          )
        );
        toast({
          title: "Success",
          description: "Trader followed successfully",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to follow trader",
        variant: "destructive"
      });
    }
  };

  const copyTrade = async (tradeId: string) => {
    try {
      const userId = localStorage.getItem('userId');
      const response = await fetch('/api/social/copy-trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, tradeId })
      });

      if (response.ok) {
        toast({
          title: "Trade Copied",
          description: "Trade has been copied to your portfolio",
        });
      }
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy trade",
        variant: "destructive"
      });
    }
  };

  const likeTrade = async (feedId: string) => {
    try {
      const userId = localStorage.getItem('userId');
      await fetch('/api/social/like-trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, feedId })
      });

      setTradingFeed(prev => 
        prev.map(feed => 
          feed.id === feedId 
            ? { ...feed, isLiked: !feed.isLiked, likes: feed.likes + (feed.isLiked ? -1 : 1) }
            : feed
        )
      );
    } catch (error) {
      console.error('Failed to like trade:', error);
    }
  };

  const joinChallenge = async (challengeId: string) => {
    try {
      const userId = localStorage.getItem('userId');
      const response = await fetch('/api/social/join-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, challengeId })
      });

      if (response.ok) {
        setChallenges(prev => 
          prev.map(challenge => 
            challenge.id === challengeId 
              ? { ...challenge, joined: true, participants: challenge.participants + 1 }
              : challenge
          )
        );
        toast({
          title: "Challenge Joined",
          description: "You've successfully joined the challenge",
        });
      }
    } catch (error) {
      toast({
        title: "Join Failed",
        description: "Failed to join challenge",
        variant: "destructive"
      });
    }
  };

  const bookmarkTrade = async (feedId: string) => {
    try {
      const userId = localStorage.getItem('userId');
      await fetch('/api/social/bookmark-trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, feedId })
      });

      setTradingFeed(prev => 
        prev.map(feed => 
          feed.id === feedId 
            ? { ...feed, isBookmarked: !feed.isBookmarked, bookmarks: feed.bookmarks + (feed.isBookmarked ? -1 : 1) }
            : feed
        )
      );
    } catch (error) {
      console.error('Failed to bookmark trade:', error);
    }
  };

  const shareTrade = async (feedId: string) => {
    try {
      const userId = localStorage.getItem('userId');
      await fetch('/api/social/share-trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, feedId })
      });

      setTradingFeed(prev => 
        prev.map(feed => 
          feed.id === feedId 
            ? { ...feed, shares: feed.shares + 1 }
            : feed
        )
      );

      toast({
        title: "Trade Shared",
        description: "Trade shared to your social networks",
      });
    } catch (error) {
      console.error('Failed to share trade:', error);
    }
  };

  const postComment = async (feedId: string) => {
    if (!newComment.trim()) return;

    try {
      const userId = localStorage.getItem('userId');
      const response = await fetch('/api/social/post-comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, feedId, content: newComment })
      });

      if (response.ok) {
        setTradingFeed(prev => 
          prev.map(feed => 
            feed.id === feedId 
              ? { ...feed, comments: feed.comments + 1 }
              : feed
          )
        );
        setNewComment("");
        toast({
          title: "Comment Posted",
          description: "Your comment has been added",
        });
      }
    } catch (error) {
      console.error('Failed to post comment:', error);
    }
  };

  const formatSOL = (amount: number) => `${amount.toFixed(2)} SOL`;
  const formatPnL = (amount: number) => {
    const sign = amount >= 0 ? '+' : '';
    const color = amount >= 0 ? 'text-green-400' : 'text-red-400';
    return <span className={color}>{sign}{formatSOL(amount)}</span>;
  };

  const getTraderBadge = (trader: TopTrader) => {
    if (trader.badge === 'diamond') return <Badge className="bg-blue-500">💎 Diamond</Badge>;
    if (trader.badge === 'gold') return <Badge className="bg-yellow-500">🥇 Gold</Badge>;
    if (trader.badge === 'silver') return <Badge className="bg-gray-400">🥈 Silver</Badge>;
    if (trader.badge === 'bronze') return <Badge className="bg-orange-600">🥉 Bronze</Badge>;
    return null;
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return <TrendingUp className="h-4 w-4 text-green-400" />;
      case 'bearish': return <TrendingDown className="h-4 w-4 text-red-400" />;
      default: return <Activity className="h-4 w-4 text-gray-400" />;
    }
  };

  const filteredFeed = tradingFeed.filter(feed => {
    if (feedFilter === 'following') return feed.trader.isFollowing;
    if (feedFilter === 'top') return feed.trader.rank <= 10;
    if (feedFilter === 'bullish') return feed.sentiment === 'bullish';
    if (feedFilter === 'bearish') return feed.sentiment === 'bearish';
    return true;
  }).filter(feed => 
    searchQuery === '' || 
    feed.nft.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    feed.trader.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    feed.nft.collection.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <Users className="h-16 w-16 text-purple-400 mx-auto mb-4 animate-pulse" />
          <h3 className="text-xl font-semibold text-gray-300">Loading Social Data...</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-2">
            <Users className="h-8 w-8 text-blue-400" />
            Social Trading Hub
          </h2>
          <p className="text-gray-400 mt-2">Follow top traders, copy strategies, and join community challenges</p>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Activity className="h-3 w-3" />
              Last updated: {lastUpdate.toLocaleTimeString()}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {tradingFeed.length} active traders
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={autoRefresh ? "default" : "outline"}
              onClick={() => setAutoRefresh(!autoRefresh)}
              className="border-gray-600"
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${autoRefresh ? 'animate-spin' : ''}`} />
              Auto Refresh
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => fetchSocialData(true)}
              className="border-gray-600"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          <Badge variant="secondary" className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-blue-400 border-blue-600">
            Community Feature
          </Badge>
        </div>
      </div>

      {/* Notifications Bar */}
      {notifications.length > 0 && (
        <Card className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border-blue-500/30">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-blue-400" />
              <div className="flex-1 overflow-hidden">
                <div className="animate-pulse text-sm text-blue-300">
                  {notifications[0]?.message}
                </div>
              </div>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => setNotifications([])}
                className="text-gray-400 hover:text-white"
              >
                ×
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-gray-800 border-gray-700">
          <TabsTrigger value="feed" className="data-[state=active]:bg-blue-600">
            <Eye className="h-4 w-4 mr-2" />
            Live Feed
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="data-[state=active]:bg-yellow-600">
            <Trophy className="h-4 w-4 mr-2" />
            Leaderboard
          </TabsTrigger>
          <TabsTrigger value="challenges" className="data-[state=active]:bg-green-600">
            <Target className="h-4 w-4 mr-2" />
            Challenges
          </TabsTrigger>
          <TabsTrigger value="copy-trading" className="data-[state=active]:bg-purple-600">
            <Copy className="h-4 w-4 mr-2" />
            Copy Trading
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-orange-600">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="feed" className="mt-6">
          {/* Feed Controls */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search trades, traders, or collections..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-800 border-gray-600 text-white"
                />
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                variant={feedFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setFeedFilter('all')}
                className="border-gray-600"
              >
                All
              </Button>
              <Button
                size="sm"
                variant={feedFilter === 'following' ? 'default' : 'outline'}
                onClick={() => setFeedFilter('following')}
                className="border-gray-600"
              >
                Following
              </Button>
              <Button
                size="sm"
                variant={feedFilter === 'top' ? 'default' : 'outline'}
                onClick={() => setFeedFilter('top')}
                className="border-gray-600"
              >
                Top 10
              </Button>
              <Button
                size="sm"
                variant={feedFilter === 'bullish' ? 'default' : 'outline'}
                onClick={() => setFeedFilter('bullish')}
                className="border-gray-600"
              >
                <TrendingUp className="h-3 w-3 mr-1" />
                Bullish
              </Button>
              <Button
                size="sm"
                variant={feedFilter === 'bearish' ? 'default' : 'outline'}
                onClick={() => setFeedFilter('bearish')}
                className="border-gray-600"
              >
                <TrendingDown className="h-3 w-3 mr-1" />
                Bearish
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {filteredFeed.map((feed) => (
              <Card key={feed.id} className="bg-gray-800 border-gray-700 hover:border-blue-500 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={feed.trader.avatar} alt={feed.trader.username} />
                      <AvatarFallback>{feed.trader.username[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{feed.trader.username}</span>
                        {feed.trader.verified && <Crown className="h-4 w-4 text-yellow-400" />}
                        {getTraderBadge(feed.trader)}
                        <Badge variant="outline" className="text-xs">#{feed.trader.rank}</Badge>
                        <div className="flex items-center gap-1">
                          {feed.trader.isOnline && <div className="w-2 h-2 bg-green-400 rounded-full" />}
                          <span className="text-sm text-gray-400">
                            {feed.action === 'buy' ? 'bought' : feed.action === 'sell' ? 'sold' : feed.action === 'list' ? 'listed' : feed.action === 'bid' ? 'bid on' : 'offered'}
                          </span>
                        </div>
                        <Badge className={`${
                          feed.action === 'buy' ? 'bg-green-600' : 
                          feed.action === 'sell' ? 'bg-red-600' : 
                          feed.action === 'bid' ? 'bg-yellow-600' :
                          feed.action === 'offer' ? 'bg-purple-600' :
                          'bg-blue-600'
                        }`}>
                          {feed.action.toUpperCase()}
                        </Badge>
                        {getSentimentIcon(feed.sentiment)}
                        <span className="text-xs text-gray-500">
                          {Math.floor((Date.now() - feed.timestamp.getTime()) / 60000)}m ago
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <img 
                            src={feed.nft.image} 
                            alt={feed.nft.name}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                          {feed.nft.rarity && feed.nft.rarity > 80 && (
                            <div className="absolute -top-1 -right-1 bg-yellow-500 text-black text-xs px-1 rounded">
                              RARE
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-white">{feed.nft.name}</h4>
                          <p className="text-sm text-gray-400">{feed.nft.collection}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-green-400 font-semibold">{formatSOL(feed.nft.price)}</span>
                            {feed.nft.previousPrice && (
                              <span className={`text-xs ${
                                feed.nft.price > feed.nft.previousPrice ? 'text-green-400' : 'text-red-400'
                              }`}>
                                ({feed.nft.price > feed.nft.previousPrice ? '+' : ''}
                                {((feed.nft.price - feed.nft.previousPrice) / feed.nft.previousPrice * 100).toFixed(1)}%)
                              </span>
                            )}
                          </div>
                          {feed.tags.length > 0 && (
                            <div className="flex gap-1 mt-1">
                              {feed.tags.slice(0, 3).map((tag, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs px-1 py-0">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-sm">
                            <span className="text-gray-400">Confidence:</span>
                            <span className={`font-semibold ${
                              feed.confidence > 80 ? 'text-green-400' : 
                              feed.confidence > 60 ? 'text-yellow-400' : 'text-red-400'
                            }`}>
                              {feed.confidence}%
                            </span>
                          </div>
                          {feed.profitLoss && (
                            <div className="text-sm mt-1">
                              P&L: {formatPnL(feed.profitLoss)}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {feed.analysis && (
                        <p className="text-gray-300 text-sm bg-gray-900 p-3 rounded-lg">
                          {feed.analysis}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Button
                            size="sm"
                            variant="outline"
                            className={`border-gray-600 ${feed.isLiked ? 'text-red-400 border-red-400' : ''}`}
                            onClick={() => likeTrade(feed.id)}
                          >
                            <Heart className={`h-4 w-4 mr-1 ${feed.isLiked ? 'fill-current' : ''}`} />
                            {feed.likes}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="border-gray-600"
                            onClick={() => setShowComments(showComments === feed.id ? null : feed.id)}
                          >
                            <MessageCircle className="h-4 w-4 mr-1" />
                            {feed.comments}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="border-gray-600"
                            onClick={() => shareTrade(feed.id)}
                          >
                            <Share2 className="h-4 w-4 mr-1" />
                            {feed.shares}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className={`border-gray-600 ${feed.isBookmarked ? 'text-yellow-400 border-yellow-400' : ''}`}
                            onClick={() => bookmarkTrade(feed.id)}
                          >
                            <Bookmark className={`h-4 w-4 mr-1 ${feed.isBookmarked ? 'fill-current' : ''}`} />
                            {feed.bookmarks}
                          </Button>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="border-purple-600 text-purple-400 hover:bg-purple-600"
                            onClick={() => copyTrade(feed.id)}
                          >
                            <Copy className="h-4 w-4 mr-1" />
                            Copy Trade
                          </Button>
                        </div>
                      </div>

                      {/* Comments Section */}
                      {showComments === feed.id && (
                        <div className="mt-4 pt-4 border-t border-gray-700">
                          <div className="space-y-3 mb-4">
                            {feed.comments_data?.slice(0, 3).map((comment) => (
                              <div key={comment.id} className="flex gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={comment.user.avatar} />
                                  <AvatarFallback>{comment.user.username[0]}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-white">
                                      {comment.user.username}
                                    </span>
                                    {comment.user.verified && <Crown className="h-3 w-3 text-yellow-400" />}
                                    <span className="text-xs text-gray-500">
                                      {Math.floor((Date.now() - comment.timestamp.getTime()) / 60000)}m ago
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-300 mt-1">{comment.content}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Button size="sm" variant="ghost" className="h-6 px-2 text-xs">
                                      <Heart className="h-3 w-3 mr-1" />
                                      {comment.likes}
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <Textarea
                              placeholder="Add a comment..."
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                              className="bg-gray-900 border-gray-600 text-white text-sm"
                              rows={2}
                            />
                            <Button 
                              size="sm"
                              onClick={() => postComment(feed.id)}
                              disabled={!newComment.trim()}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="leaderboard" className="mt-6">
          <div className="space-y-4">
            {topTraders.map((trader, index) => (
              <Card key={trader.id} className={`bg-gray-800 border-gray-700 ${index < 3 ? 'ring-2 ring-yellow-500/50' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-3">
                        <Badge className={`
                          ${index === 0 ? 'bg-yellow-600' : 
                            index === 1 ? 'bg-gray-400' : 
                            index === 2 ? 'bg-orange-600' : 'bg-gray-600'}
                        `}>
                          #{trader.rank}
                        </Badge>
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={trader.avatar} alt={trader.username} />
                          <AvatarFallback>{trader.username[0].toUpperCase()}</AvatarFallback>
                        </Avatar>
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{trader.username}</span>
                          {trader.verified && <Crown className="h-4 w-4 text-yellow-400" />}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span>Win Rate: {trader.winRate}%</span>
                          <span>Trades: {trader.trades}</span>
                          <span>Followers: {trader.followers}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-lg font-bold">
                        {formatPnL(trader.totalPnL)}
                      </div>
                      <div className="text-sm">
                        Weekly: {formatPnL(trader.weeklyPnL)}
                      </div>
                      <div className="text-xs text-gray-400">
                        Portfolio: {formatSOL(trader.portfolioValue)}
                      </div>
                    </div>
                    
                    <Button
                      className={`${trader.isFollowing ? 'bg-gray-600' : 'bg-blue-600 hover:bg-blue-700'}`}
                      onClick={() => followTrader(trader.id)}
                    >
                      {trader.isFollowing ? (
                        <>
                          <Eye className="h-4 w-4 mr-2" />
                          Following
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Follow
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="challenges" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {challenges.map((challenge) => (
              <Card key={challenge.id} className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-white">{challenge.title}</CardTitle>
                    <Badge className={`${
                      challenge.type === 'trading' ? 'bg-blue-600' :
                      challenge.type === 'collecting' ? 'bg-purple-600' : 'bg-green-600'
                    }`}>
                      {challenge.type}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-400">{challenge.description}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400">Progress</span>
                      <span className="text-white">{challenge.progress}%</span>
                    </div>
                    <Progress value={challenge.progress} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400">Reward</span>
                      <span className="text-yellow-400 font-semibold">
                        {challenge.reward.toLocaleString()} CLOUT
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400">Participants</span>
                      <span className="text-white">{challenge.participants}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400">Ends</span>
                      <span className="text-white">
                        {Math.ceil((challenge.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days
                      </span>
                    </div>
                  </div>
                  
                  <Button 
                    className={`w-full ${challenge.joined ? 'bg-gray-600' : 'bg-green-600 hover:bg-green-700'}`}
                    onClick={() => joinChallenge(challenge.id)}
                    disabled={challenge.joined}
                  >
                    {challenge.joined ? (
                      <>
                        <Award className="h-4 w-4 mr-2" />
                        Joined
                      </>
                    ) : (
                      <>
                        <Target className="h-4 w-4 mr-2" />
                        Join Challenge
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="copy-trading" className="mt-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Copy className="h-5 w-5 text-purple-400" />
                Copy Trading Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Copy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-300 mb-2">Copy Trading Dashboard</h3>
                <p className="text-gray-500">
                  Monitor your copied trades, manage auto-copy settings, and track performance
                  of traders you're following.
                </p>
                <Button className="mt-6 bg-purple-600 hover:bg-purple-700">
                  Configure Copy Trading
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Market Sentiment */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-orange-400" />
                  Market Sentiment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-green-400 flex items-center gap-1">
                      <TrendingUp className="h-4 w-4" />
                      Bullish
                    </span>
                    <span className="text-white font-semibold">67%</span>
                  </div>
                  <Progress value={67} className="h-2" />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-red-400 flex items-center gap-1">
                      <TrendingDown className="h-4 w-4" />
                      Bearish
                    </span>
                    <span className="text-white font-semibold">23%</span>
                  </div>
                  <Progress value={23} className="h-2" />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 flex items-center gap-1">
                      <Activity className="h-4 w-4" />
                      Neutral
                    </span>
                    <span className="text-white font-semibold">10%</span>
                  </div>
                  <Progress value={10} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Top Performing Collections */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Flame className="h-5 w-5 text-red-400" />
                  Trending Collections
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['Mad Lads', 'DeGods', 'y00ts', 'SMB', 'Okay Bears'].map((collection, idx) => (
                    <div key={collection} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">#{idx + 1}</Badge>
                        <span className="text-white text-sm">{collection}</span>
                      </div>
                      <span className="text-green-400 text-sm font-semibold">
                        +{(Math.random() * 20 + 5).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Trading Volume */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-400" />
                  24h Volume
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">
                      {formatSOL(45632.8)}
                    </div>
                    <div className="text-sm text-gray-400">Total Volume</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-400">Trades</div>
                      <div className="text-white font-semibold">2,847</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Avg Price</div>
                      <div className="text-white font-semibold">{formatSOL(16.02)}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Active Traders */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-400" />
                  Community Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-400">Active Traders</div>
                    <div className="text-white font-semibold">1,234</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Online Now</div>
                    <div className="text-green-400 font-semibold">456</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Total Follows</div>
                    <div className="text-white font-semibold">8,952</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Copy Trades</div>
                    <div className="text-purple-400 font-semibold">2,156</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Risk Metrics */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-400" />
                  Risk Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Market Risk</span>
                    <Badge className="bg-yellow-600">Medium</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Volatility</span>
                    <span className="text-red-400 font-semibold">High</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Liquidity</span>
                    <span className="text-green-400 font-semibold">Good</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Summary */}
            <Card className="bg-gray-800 border-gray-700 md:col-span-2 lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-400" />
                  Top Performer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={topTraders[0]?.avatar} />
                    <AvatarFallback>{topTraders[0]?.username?.[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-white">{topTraders[0]?.username}</div>
                    <div className="text-sm text-gray-400">24h Performance</div>
                    <div className="text-green-400 font-semibold">
                      {formatPnL(topTraders[0]?.weeklyPnL || 0)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
