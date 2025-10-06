import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { 
  Wand2, 
  Copy, 
  Check, 
  RefreshCw, 
  TrendingUp, 
  Hash, 
  Share2,
  Target,
  MessageSquare
} from 'lucide-react';

interface EnhancementResult {
  enhancedDescription: string;
  seoKeywords: string[];
  marketingCopy: string;
  socialMediaCaptions: {
    twitter: string;
    instagram: string;
    discord: string;
  };
  confidence: number;
}

const NFT_CATEGORIES = [
  'Art', 'Photography', 'Music', 'Gaming', 'Collectibles', 
  'Utility', 'Memes', 'Sports', 'Virtual Worlds', 'Fashion'
];

export function AIDescriptionEnhancer() {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    attributes: [{ trait_type: '', value: '' }]
  });
  const [enhancement, setEnhancement] = useState<EnhancementResult | null>(null);
  const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set());

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

  const enhanceDescription = async () => {
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
      const response = await fetch('/api/ai-features/enhance-description', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          attributes: formData.attributes.filter(attr => attr.trait_type && attr.value)
        })
      });

      if (!response.ok) {
        throw new Error('Enhancement failed');
      }

      const result = await response.json();
      setEnhancement(result.enhancement);
      
      toast({
        title: "Enhancement Complete",
        description: "Your NFT description has been enhanced with AI!"
      });

    } catch (error) {
      console.error('Enhancement error:', error);
      toast({
        title: "Enhancement Failed",
        description: error instanceof Error ? error.message : "Unable to enhance description",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string, itemKey: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItems(prev => new Set(prev).add(itemKey));
      
      setTimeout(() => {
        setCopiedItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(itemKey);
          return newSet;
        });
      }, 2000);

      toast({
        title: "Copied!",
        description: "Content copied to clipboard"
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Unable to copy to clipboard",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-green-500 bg-clip-text text-transparent">
          AI Description Enhancer
        </h1>
        <p className="text-muted-foreground">
          Transform your NFT descriptions with AI-powered copywriting and marketing insights
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              NFT Information
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
              <Label htmlFor="description">Current Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter your current NFT description..."
                rows={4}
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
              <Label>Attributes (Optional)</Label>
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

            <Button
              onClick={enhanceDescription}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-500 to-green-500"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Enhancing...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Enhance with AI
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
              AI Enhancement Results
              {enhancement && (
                <Badge variant="outline" className="ml-auto">
                  {Math.round(enhancement.confidence * 100)}% confidence
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {enhancement ? (
              <Tabs defaultValue="description" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="description">Description</TabsTrigger>
                  <TabsTrigger value="keywords">SEO</TabsTrigger>
                  <TabsTrigger value="marketing">Marketing</TabsTrigger>
                  <TabsTrigger value="social">Social</TabsTrigger>
                </TabsList>

                <TabsContent value="description" className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Enhanced Description</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(enhancement.enhancedDescription, 'description')}
                      >
                        {copiedItems.has('description') ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-sm">{enhancement.enhancedDescription}</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="keywords" className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Hash className="w-4 h-4" />
                      <Label>SEO Keywords</Label>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {enhancement.seoKeywords.map((keyword, index) => (
                        <Badge key={index} variant="secondary">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="marketing" className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Marketing Copy</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(enhancement.marketingCopy, 'marketing')}
                      >
                        {copiedItems.has('marketing') ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-sm">{enhancement.marketingCopy}</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="social" className="space-y-4">
                  <div className="space-y-4">
                    {Object.entries(enhancement.socialMediaCaptions).map(([platform, caption]) => (
                      <div key={platform}>
                        <div className="flex items-center justify-between mb-2">
                          <Label className="capitalize flex items-center gap-2">
                            <Share2 className="w-4 h-4" />
                            {platform}
                          </Label>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(caption, platform)}
                          >
                            {copiedItems.has(platform) ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                        <div className="bg-muted p-3 rounded-lg">
                          <p className="text-sm">{caption}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Enter your NFT information and click "Enhance with AI" to get started</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}