import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Brain, 
  BarChart3, 
  RefreshCw,
  DollarSign,
  Target,
  Info
} from "lucide-react";

interface PricingData {
  averagePrice: number;
  medianPrice: number;
  priceRange: { min: number; max: number };
  recentSales: number;
  marketTrend: 'rising' | 'falling' | 'stable';
  trendPercentage: number;
  suggestedPrice: number;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string[];
}

interface PricingSuggestionsProps {
  onPriceSelect: (price: string) => void;
  nftName?: string;
  nftDescription?: string;
  className?: string;
}

export default function PricingSuggestions({ 
  onPriceSelect, 
  nftName = "", 
  nftDescription = "",
  className = "" 
}: PricingSuggestionsProps) {
  const [pricingData, setPricingData] = useState<PricingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const { toast } = useToast();

  const fetchPricingSuggestions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/pricing/suggestions?timeframe=30d');
      if (response.ok) {
        const data = await response.json();
        setPricingData(data);
      }
    } catch (error) {
      console.error('Failed to fetch pricing suggestions:', error);
      toast({
        title: "Pricing Error",
        description: "Failed to load market pricing data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const analyzeSpecificNFT = async () => {
    if (!nftName.trim() && !nftDescription.trim()) {
      toast({
        title: "Analysis Required",
        description: "Please enter NFT name or description for personalized pricing",
        variant: "destructive"
      });
      return;
    }

    setAnalyzing(true);
    try {
      const response = await fetch('/api/pricing/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nftName,
          description: nftDescription,
          collection: 'NFTSol Collection'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setPricingData(data);
        toast({
          title: "Analysis Complete",
          description: `Found ${data.similarNFTs || 0} similar NFTs for comparison`,
        });
      }
    } catch (error) {
      console.error('Failed to analyze NFT pricing:', error);
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze your NFT pricing",
        variant: "destructive"
      });
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    fetchPricingSuggestions();
  }, []);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'rising': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'falling': return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <Minus className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getConfidenceBadge = (confidence: string) => {
    const variants = {
      high: 'bg-green-600/20 text-green-400 border-green-600',
      medium: 'bg-yellow-600/20 text-yellow-400 border-yellow-600',
      low: 'bg-red-600/20 text-red-400 border-red-600'
    };
    return variants[confidence as keyof typeof variants] || variants.medium;
  };

  const formatSOL = (amount: number) => `${amount.toFixed(3)} SOL`;

  return (
    <div className={`space-y-4 ${className}`}>
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center text-white">
            <Brain className="w-5 h-5 mr-2 text-purple-400" />
            AI Pricing Assistant
          </CardTitle>
          <CardDescription className="text-gray-400">
            Smart pricing suggestions based on real market data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-full bg-gray-700" />
              <Skeleton className="h-4 w-3/4 bg-gray-700" />
              <Skeleton className="h-8 w-1/2 bg-gray-700" />
            </div>
          ) : pricingData ? (
            <div className="space-y-4">
              {/* Market Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-700/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-400">Market Trend</span>
                    {getTrendIcon(pricingData.marketTrend)}
                  </div>
                  <div className="text-lg font-semibold text-white">
                    {pricingData.marketTrend === 'rising' ? '+' : pricingData.marketTrend === 'falling' ? '-' : ''}
                    {pricingData.trendPercentage.toFixed(1)}%
                  </div>
                </div>

                <div className="bg-gray-700/50 rounded-lg p-3">
                  <div className="text-sm text-gray-400 mb-1">Recent Sales</div>
                  <div className="text-lg font-semibold text-white">
                    {pricingData.recentSales}
                  </div>
                </div>

                <div className="bg-gray-700/50 rounded-lg p-3">
                  <div className="text-sm text-gray-400 mb-1">Price Range</div>
                  <div className="text-sm font-semibold text-white">
                    {formatSOL(pricingData.priceRange.min)} - {formatSOL(pricingData.priceRange.max)}
                  </div>
                </div>
              </div>

              {/* AI Suggestion */}
              <div className="bg-gradient-to-r from-purple-600/20 to-green-600/20 rounded-lg p-4 border border-purple-600/30">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <Target className="w-5 h-5 mr-2 text-purple-400" />
                    <span className="font-semibold text-white">Suggested Price</span>
                    <Badge className={`ml-2 ${getConfidenceBadge(pricingData.confidence)}`}>
                      {pricingData.confidence} confidence
                    </Badge>
                  </div>
                  <Button
                    onClick={() => onPriceSelect(pricingData.suggestedPrice.toString())}
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    Use This Price
                  </Button>
                </div>

                <div className="text-2xl font-bold text-white mb-3">
                  {formatSOL(pricingData.suggestedPrice)}
                </div>

                <div className="space-y-1">
                  {pricingData.reasoning.map((reason, index) => (
                    <div key={index} className="flex items-start text-sm text-gray-300">
                      <Info className="w-3 h-3 mt-0.5 mr-2 text-purple-400 flex-shrink-0" />
                      {reason}
                    </div>
                  ))}
                </div>
              </div>

              {/* Market Statistics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-700/30 rounded-lg p-3">
                  <div className="text-sm text-gray-400 mb-1">Market Average</div>
                  <div className="text-lg font-semibold text-white">
                    {formatSOL(pricingData.averagePrice)}
                  </div>
                </div>
                <div className="bg-gray-700/30 rounded-lg p-3">
                  <div className="text-sm text-gray-400 mb-1">Market Median</div>
                  <div className="text-lg font-semibold text-white">
                    {formatSOL(pricingData.medianPrice)}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={analyzeSpecificNFT}
                  disabled={analyzing}
                  variant="outline"
                  className="flex-1 border-gray-600 text-white hover:bg-gray-700"
                >
                  {analyzing ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <BarChart3 className="w-4 h-4 mr-2" />
                  )}
                  {analyzing ? 'Analyzing...' : 'Analyze My NFT'}
                </Button>

                <Button
                  onClick={fetchPricingSuggestions}
                  disabled={loading}
                  variant="outline"
                  className="border-gray-600 text-white hover:bg-gray-700"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-4">
                Failed to load pricing data
              </div>
              <Button onClick={fetchPricingSuggestions} variant="outline">
                Retry
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Price Options */}
      {pricingData && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center gap-2 text-lg">
              <DollarSign className="w-5 h-5 mr-2 text-green-400" />
              Quick Price Options
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Button
                onClick={() => onPriceSelect((pricingData.suggestedPrice * 0.9).toFixed(3))}
                variant="outline"
                className="h-auto p-4 border-gray-700 hover:border-green-500 text-left bg-gray-800/30 hover:bg-gray-700/50 transition-all duration-200"
              >
                <div className="w-full space-y-1">
                  <div className="font-semibold text-white text-sm">Conservative</div>
                  <div className="text-xl font-bold text-green-400">{formatSOL(pricingData.suggestedPrice * 0.9)}</div>
                  <div className="text-xs text-gray-400 leading-tight">Safe pricing for quick sale</div>
                </div>
              </Button>

              <Button
                onClick={() => onPriceSelect(pricingData.suggestedPrice.toString())}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <div className="w-full space-y-1">
                  <div className="font-semibold text-white text-sm">Suggested</div>
                  <div className="text-xl font-bold text-green-400">{formatSOL(pricingData.suggestedPrice)}</div>
                  <div className="text-xs text-purple-200 leading-tight">Market-based pricing</div>
                </div>
              </Button>

              <Button
                onClick={() => onPriceSelect((pricingData.suggestedPrice * 1.1).toFixed(3))}
                variant="outline"
                className="h-auto p-4 border-gray-700 hover:border-green-500 text-left bg-gray-800/30 hover:bg-gray-700/50 transition-all duration-200"
              >
                <div className="w-full space-y-1">
                  <div className="font-semibold text-white text-sm">Premium</div>
                  <div className="text-xl font-bold text-green-400">{formatSOL(pricingData.suggestedPrice * 1.1)}</div>
                  <div className="text-xs text-gray-400 leading-tight">Higher profit potential</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}