import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { 
  TrendingUp, 
  DollarSign, 
  BarChart3, 
  Target, 
  RefreshCw,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface PricingAnalysis {
  suggestedPrice: number;
  priceRange: { min: number; max: number };
  reasoning: string;
  marketFactors: string[];
  competitorAnalysis: string;
  confidence: number;
}

const NFT_CATEGORIES = [
  'Art', 'Photography', 'Music', 'Gaming', 'Collectibles', 
  'Utility', 'Memes', 'Sports', 'Virtual Worlds', 'Fashion'
];

export function AIPricingAnalyzer() {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    attributes: [{ trait_type: '', value: '' }],
    marketData: {
      recentSales: [] as number[],
      floorPrice: 0,
      volume: 0
    }
  });
  const [analysis, setAnalysis] = useState<PricingAnalysis | null>(null);

  const addAttribute = () => {
    setFormData(prev => ({
      ...prev,
      attributes: [...prev.attributes, { trait_type: '', value: '' }]
    }));
  };

  const updateAttribute = (index: number, field: 'trait_type' | 'value', value: string) => {
    setFormData(prev => ({
      ...prev,
      attributes: prev.attributes.map((attr, i) => 
        i === index ? { ...attr, [field]: value } : attr
      )
    }));
  };

  const removeAttribute = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attributes: prev.attributes.filter((_, i) => i !== index)
    }));
  };

  const updateMarketData = (field: keyof typeof formData.marketData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      marketData: {
        ...prev.marketData,
        [field]: field === 'recentSales' 
          ? (value as string).split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v))
          : Number(value)
      }
    }));
  };

  const analyzePricing = async () => {
    if (!formData.title || !formData.description || !formData.category) {
      toast({
        title: "Missing Information",
        description: "Please fill in title, description, and category",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/ai-features/analyze-pricing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          attributes: formData.attributes.filter(attr => attr.trait_type && attr.value),
          marketData: formData.marketData.recentSales.length > 0 || formData.marketData.floorPrice > 0 
            ? formData.marketData 
            : undefined
        })
      });

      if (!response.ok) {
        throw new Error('Pricing analysis failed');
      }

      const result = await response.json();
      setAnalysis(result.analysis);
      
      toast({
        title: "Analysis Complete",
        description: "AI pricing analysis has been generated!"
      });

    } catch (error) {
      console.error('Pricing analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Unable to analyze pricing",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPriceConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-500';
    if (confidence >= 0.6) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-green-500 to-blue-500 bg-clip-text text-transparent">
          AI Pricing Analyzer
        </h1>
        <p className="text-muted-foreground">
          Get AI-powered pricing recommendations based on NFT characteristics and market data
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              NFT & Market Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">NFT Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter your NFT title..."
              />
            </div>

            <div>
              <Label htmlFor="description">NFT Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your NFT..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {NFT_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Attributes</Label>
              <div className="space-y-2">
                {formData.attributes.map((attr, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="Trait type"
                      value={attr.trait_type}
                      onChange={(e) => updateAttribute(index, 'trait_type', e.target.value)}
                    />
                    <Input
                      placeholder="Value"
                      value={attr.value}
                      onChange={(e) => updateAttribute(index, 'value', e.target.value)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeAttribute(index)}
                      disabled={formData.attributes.length === 1}
                    >
                      ×
                    </Button>
                  </div>
                ))}
                <Button variant="outline" onClick={addAttribute} size="sm">
                  Add Attribute
                </Button>
              </div>
            </div>

            <div className="border-t pt-4">
              <Label className="text-sm font-medium">Market Data (Optional)</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div>
                  <Label htmlFor="recentSales" className="text-xs">Recent Sales (SOL)</Label>
                  <Input
                    id="recentSales"
                    placeholder="0.5, 1.2, 0.8"
                    onChange={(e) => updateMarketData('recentSales', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="floorPrice" className="text-xs">Floor Price (SOL)</Label>
                  <Input
                    id="floorPrice"
                    type="number"
                    step="0.01"
                    placeholder="0.5"
                    onChange={(e) => updateMarketData('floorPrice', e.target.value)}
                  />
                </div>
              </div>
              <div className="mt-2">
                <Label htmlFor="volume" className="text-xs">24h Volume (SOL)</Label>
                <Input
                  id="volume"
                  type="number"
                  step="0.01"
                  placeholder="100.0"
                  onChange={(e) => updateMarketData('volume', e.target.value)}
                />
              </div>
            </div>

            <Button
              onClick={analyzePricing}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-green-500 to-blue-500"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Analyze Pricing
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Pricing Analysis Results
              {analysis && (
                <Badge variant="outline" className={`ml-auto ${getPriceConfidenceColor(analysis.confidence)}`}>
                  {Math.round(analysis.confidence * 100)}% confidence
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analysis ? (
              <div className="space-y-6">
                {/* Suggested Price */}
                <div className="text-center bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 p-6 rounded-lg">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <DollarSign className="w-6 h-6 text-green-500" />
                    <span className="text-sm text-muted-foreground">Suggested Price</span>
                  </div>
                  <div className="text-4xl font-bold text-green-500 mb-2">
                    {analysis.suggestedPrice} SOL
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Range: {analysis.priceRange.min} - {analysis.priceRange.max} SOL
                  </div>
                </div>

                {/* Confidence Score */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {analysis.confidence >= 0.7 ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-yellow-500" />
                    )}
                    <Label>AI Confidence Score</Label>
                  </div>
                  <Progress value={analysis.confidence * 100} className="h-3" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {analysis.confidence >= 0.8 ? 'High confidence' : 
                     analysis.confidence >= 0.6 ? 'Moderate confidence' : 
                     'Low confidence - consider adding more market data'}
                  </p>
                </div>

                {/* Analysis Reasoning */}
                <div>
                  <Label className="font-medium">AI Analysis</Label>
                  <div className="bg-muted p-4 rounded-lg mt-2">
                    <p className="text-sm">{analysis.reasoning}</p>
                  </div>
                </div>

                {/* Market Factors */}
                <div>
                  <Label className="font-medium">Key Market Factors</Label>
                  <div className="mt-2 space-y-2">
                    {analysis.marketFactors.map((factor, index) => (
                      <div key={index} className="flex items-start gap-2 text-sm">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span>{factor}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Competitor Analysis */}
                <div>
                  <Label className="font-medium">Competitor Analysis</Label>
                  <div className="bg-muted p-4 rounded-lg mt-2">
                    <p className="text-sm">{analysis.competitorAnalysis}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Enter your NFT information and click "Analyze Pricing" to get AI-powered pricing recommendations</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}