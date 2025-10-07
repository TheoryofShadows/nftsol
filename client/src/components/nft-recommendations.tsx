import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, Eye, Share2, TrendingUp, Star, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import RecommendationQuickActions from "./recommendation-quick-actions";

interface NFTRecommendation {
  id: string;
  name: string;
  category: string;
  artist: string;
  price: number;
  rarity: string;
  description: string;
  imageUrl: string;
  collection: string;
  tags: string[];
  viewCount: number;
  likeCount: number;
  trending: boolean;
  score: number;
  reason: string;
}

interface NFTRecommendationsProps {
  userId: string;
}

export default function NFTRecommendations({ userId }: NFTRecommendationsProps) {
  const [, setLocation] = useLocation();
  const [recommendations, setRecommendations] = useState<NFTRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("personalized");
  const [likedNfts, setLikedNfts] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const fetchRecommendations = async (algorithm: string = "personalized") => {
    try {
      setLoading(true);
      const response = await fetch(`/api/recommendations/${userId}?algorithm=${algorithm}&limit=12`);
      
      if (response.ok) {
        const data = await response.json();
        setRecommendations(data);
      } else {
        // Fallback to demo data
        setRecommendations([]);
      }
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchRecommendations(activeTab);
    }
  }, [userId, activeTab]);

  const handleInteraction = async (nftId: string, interactionType: string) => {
    try {
      await fetch('/api/recommendations/interaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          nftId,
          interactionType,
          duration: interactionType === 'view' ? 30 : undefined
        })
      });
      
      if (interactionType === 'like') {
        const isCurrentlyLiked = likedNfts.has(nftId);
        if (isCurrentlyLiked) {
          // Unlike/unfavorite
          setLikedNfts(prev => {
            const newSet = new Set(Array.from(prev));
            newSet.delete(nftId);
            return newSet;
          });
          toast({
            title: "Removed from favorites",
            description: "This NFT has been unfavorited",
          });
        } else {
          // Like/favorite
          setLikedNfts(prev => new Set(Array.from(prev).concat(nftId)));
          toast({
            title: "Added to favorites",
            description: "This will help improve your recommendations",
          });
        }
      }
    } catch (error) {
      console.error('Failed to track interaction:', error);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-500';
      case 'uncommon': return 'bg-green-500';
      case 'rare': return 'bg-blue-500';
      case 'epic': return 'bg-purple-500';
      case 'legendary': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const formatSOL = (amount: number) => `${amount.toFixed(2)} SOL`;

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white mb-6">Personalized Recommendations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="bg-gray-800 border-gray-700 animate-pulse">
              <div className="h-48 bg-gray-700 rounded-t-lg"></div>
              <CardContent className="p-4">
                <div className="h-4 bg-gray-700 rounded mb-2"></div>
                <div className="h-3 bg-gray-700 rounded mb-4 w-2/3"></div>
                <div className="h-8 bg-gray-700 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-purple-400" />
            Recommended for You
          </h2>
          <p className="text-gray-400 mt-2">Curated NFTs based on your preferences and activity</p>
        </div>
        <Badge variant="secondary" className="bg-purple-600/20 text-purple-400 border-purple-600">
          AI Powered
        </Badge>
      </div>

      <RecommendationQuickActions 
        onAlgorithmChange={setActiveTab}
        activeAlgorithm={activeTab}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-gray-800 border-gray-700">
          <TabsTrigger value="personalized" className="data-[state=active]:bg-purple-600">
            For You
          </TabsTrigger>
          <TabsTrigger value="trending" className="data-[state=active]:bg-green-600">
            Trending
          </TabsTrigger>
          <TabsTrigger value="content" className="data-[state=active]:bg-blue-600">
            Similar
          </TabsTrigger>
          <TabsTrigger value="price" className="data-[state=active]:bg-yellow-600">
            Price Match
          </TabsTrigger>
          <TabsTrigger value="artist" className="data-[state=active]:bg-pink-600">
            Artists
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {recommendations.length === 0 ? (
            <div className="text-center py-12">
              <Sparkles className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-300 mb-2">No recommendations yet</h3>
              <p className="text-gray-500">Start browsing and liking NFTs to get personalized recommendations!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {recommendations.map((nft) => (
                <Card 
                  key={nft.id} 
                  className="bg-gray-800 border-gray-700 hover:border-purple-500 transition-all duration-300 group cursor-pointer"
                  onClick={() => {
                    handleInteraction(nft.id, 'view');
                    // Navigate to detailed view
                    setLocation(`/marketplace?nft=${nft.id}`);
                  }}
                >
                  <div className="relative overflow-hidden rounded-t-lg">
                    <img 
                      src={nft.imageUrl} 
                      alt={nft.name}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {nft.trending && (
                      <Badge className="absolute top-2 left-2 bg-green-600 text-white">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Trending
                      </Badge>
                    )}
                    <Badge 
                      className={`absolute top-2 right-2 text-white ${getRarityColor(nft.rarity)}`}
                    >
                      {nft.rarity}
                    </Badge>
                  </div>
                  
                  <CardContent className="p-4">
                    <div className="mb-3">
                      <h3 className="font-semibold text-white text-lg mb-1 group-hover:text-purple-400 transition-colors">
                        {nft.name}
                      </h3>
                      <p className="text-sm text-gray-400">by {nft.artist}</p>
                      <p className="text-xs text-purple-400 mt-1">{nft.reason}</p>
                    </div>

                    <div className="flex items-center justify-between mb-3">
                      <div className="text-lg font-bold text-green-400">
                        {formatSOL(nft.price)}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Star className="h-3 w-3 fill-current" />
                        {nft.score.toFixed(2)}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {nft.viewCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        {nft.likeCount}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {nft.category}
                      </Badge>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        className="flex-1 bg-purple-600 hover:bg-purple-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleInteraction(nft.id, 'purchase');
                          // Redirect to marketplace with the NFT
                          setLocation(`/marketplace?highlight=${nft.id}`);
                          toast({
                            title: "Redirecting to marketplace",
                            description: `Opening ${nft.name} for purchase`,
                          });
                        }}
                      >
                        Buy Now
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className={`border-gray-600 hover:border-purple-500 ${
                          likedNfts.has(nft.id) ? 'bg-red-600/20 border-red-500' : ''
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleInteraction(nft.id, 'like');
                        }}
                        title={likedNfts.has(nft.id) ? "Remove from favorites" : "Add to favorites"}
                      >
                        <Heart className={`h-4 w-4 ${likedNfts.has(nft.id) ? 'fill-red-500 text-red-500' : ''}`} />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="border-gray-600 hover:border-purple-500"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleInteraction(nft.id, 'share');
                          // Copy NFT link to clipboard
                          navigator.clipboard.writeText(`${window.location.origin}/marketplace?nft=${nft.id}`);
                          toast({
                            title: "Link copied",
                            description: "NFT link copied to clipboard",
                          });
                        }}
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {recommendations.length > 0 && (
        <div className="text-center">
          <Button 
            variant="outline" 
            onClick={() => fetchRecommendations(activeTab)}
            className="border-purple-600 text-purple-400 hover:bg-purple-600/10"
          >
            Refresh Recommendations
          </Button>
        </div>
      )}
    </div>
  );
}
