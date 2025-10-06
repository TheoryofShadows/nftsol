import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { 
  Share2, 
  Copy, 
  Check, 
  RefreshCw, 
  Twitter, 
  Instagram, 
  MessageCircle,
  Hash,
  Sparkles
} from 'lucide-react';

interface SocialContent {
  [platform: string]: {
    content: string;
    hashtags: string[];
  };
}

const NFT_CATEGORIES = [
  'Art', 'Photography', 'Music', 'Gaming', 'Collectibles', 
  'Utility', 'Memes', 'Sports', 'Virtual Worlds', 'Fashion'
];

const PLATFORMS = [
  { value: 'all', label: 'All Platforms', icon: Share2 },
  { value: 'twitter', label: 'Twitter', icon: Twitter },
  { value: 'instagram', label: 'Instagram', icon: Instagram },
  { value: 'discord', label: 'Discord', icon: MessageCircle }
];

export function AISocialGenerator() {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    nftTitle: '',
    category: '',
    platform: 'all'
  });
  const [socialContent, setSocialContent] = useState<SocialContent | null>(null);
  const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set());

  const generateSocialContent = async () => {
    if (!formData.nftTitle || !formData.category) {
      toast({
        title: "Missing Information",
        description: "Please fill in NFT title and category",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/ai-features/social-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nftTitle: formData.nftTitle,
          category: formData.category,
          platform: formData.platform
        })
      });

      if (!response.ok) {
        throw new Error('Social content generation failed');
      }

      const result = await response.json();
      setSocialContent(result.content);
      
      toast({
        title: "Content Generated",
        description: "AI-powered social media content is ready!"
      });

    } catch (error) {
      console.error('Social content generation error:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Unable to generate social content",
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

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'twitter':
        return Twitter;
      case 'instagram':
        return Instagram;
      case 'discord':
        return MessageCircle;
      default:
        return Share2;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
          AI Social Content Generator
        </h1>
        <p className="text-muted-foreground">
          Create engaging social media posts and hashtags optimized for maximum reach
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Input Form */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Content Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="nftTitle">NFT Title *</Label>
              <Input
                id="nftTitle"
                value={formData.nftTitle}
                onChange={(e) => setFormData(prev => ({ ...prev, nftTitle: e.target.value }))}
                placeholder="Enter your NFT title..."
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
              <Label htmlFor="platform">Target Platform</Label>
              <Select
                value={formData.platform}
                onValueChange={(value) => setFormData(prev => ({ ...prev, platform: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((platform) => {
                    const Icon = platform.icon;
                    return (
                      <SelectItem key={platform.value} value={platform.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          {platform.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={generateSocialContent}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 mr-2" />
                  Generate Content
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              Generated Social Content
            </CardTitle>
          </CardHeader>
          <CardContent>
            {socialContent ? (
              <Tabs defaultValue={Object.keys(socialContent)[0]} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  {Object.keys(socialContent).map((platform) => {
                    const Icon = getPlatformIcon(platform);
                    return (
                      <TabsTrigger key={platform} value={platform} className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        <span className="capitalize">{platform}</span>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                {Object.entries(socialContent).map(([platform, data]) => (
                  <TabsContent key={platform} value={platform} className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="font-medium capitalize">{platform} Post</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(data.content, `${platform}-content`)}
                        >
                          {copiedItems.has(`${platform}-content`) ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                      <div className="bg-muted p-4 rounded-lg">
                        <p className="text-sm whitespace-pre-wrap">{data.content}</p>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="font-medium flex items-center gap-2">
                          <Hash className="w-4 h-4" />
                          Trending Hashtags
                        </Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(data.hashtags.join(' '), `${platform}-hashtags`)}
                        >
                          {copiedItems.has(`${platform}-hashtags`) ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {data.hashtags.map((hashtag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            #{hashtag}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
                      <h4 className="font-medium text-sm mb-1">Platform Tips:</h4>
                      <p className="text-xs text-muted-foreground">
                        {platform === 'twitter' && "Keep posts under 280 characters. Use 1-2 hashtags for best engagement."}
                        {platform === 'instagram' && "Include 5-10 relevant hashtags. Use stories and reels for maximum reach."}
                        {platform === 'discord' && "Engage with the community first. Share in relevant channels only."}
                      </p>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Share2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Enter your NFT details and click "Generate Content" to create social media posts</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}