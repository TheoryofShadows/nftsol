import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Sparkles, TrendingUp, Star, Check } from 'lucide-react';

interface AIAnalysisCardProps {
  analysis: {
    metadata: {
      title: string;
      description: string;
      category: string;
      attributes: Array<{ trait_type: string; value: string }>;
      tags: string[];
      priceRange: { min: number; max: number; suggested: number };
      confidence?: number;
    };
    reasoning: string;
    alternatives: {
      titles: string[];
      descriptions: string[];
      categories: string[];
    };
  };
  onApply: (metadata: any) => void;
  onReject: () => void;
}

export function AIAnalysisCard({ analysis, onApply, onReject }: AIAnalysisCardProps) {
  const { metadata, reasoning, alternatives } = analysis;

  return (
    <Card className="border-2 border-purple-200 dark:border-purple-800">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-500" />
          AI-Generated Metadata
          {metadata.confidence && (
            <Badge variant="outline" className="ml-auto">
              {Math.round(metadata.confidence * 100)}% confidence
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Main Suggestions */}
        <div className="bg-gradient-to-r from-purple-50 to-green-50 dark:from-purple-950 dark:to-green-950 p-4 rounded-lg">
          <h3 className="font-semibold text-lg mb-2">{metadata.title}</h3>
          <p className="text-sm text-muted-foreground mb-3">{metadata.description}</p>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Category:</span>
              <Badge variant="secondary" className="ml-2">{metadata.category}</Badge>
            </div>
            <div>
              <span className="font-medium">Suggested Price:</span>
              <span className="ml-2 font-mono">{metadata.priceRange.suggested} SOL</span>
            </div>
          </div>

          {metadata.confidence && (
            <div className="mt-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm font-medium">AI Confidence</span>
              </div>
              <Progress value={metadata.confidence * 100} className="h-2" />
            </div>
          )}
        </div>

        {/* Attributes Preview */}
        {metadata.attributes.length > 0 && (
          <div>
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Star className="w-4 h-4" />
              Suggested Attributes
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {metadata.attributes.slice(0, 4).map((attr, index) => (
                <div key={index} className="bg-muted p-2 rounded text-sm">
                  <span className="font-medium">{attr.trait_type}:</span>
                  <span className="ml-1">{attr.value}</span>
                </div>
              ))}
              {metadata.attributes.length > 4 && (
                <div className="bg-muted p-2 rounded text-sm text-center text-muted-foreground">
                  +{metadata.attributes.length - 4} more
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tags Preview */}
        {metadata.tags.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Recommended Tags</h4>
            <div className="flex flex-wrap gap-1">
              {metadata.tags.slice(0, 6).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {metadata.tags.length > 6 && (
                <Badge variant="outline" className="text-xs">
                  +{metadata.tags.length - 6} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* AI Reasoning */}
        <div className="bg-muted p-3 rounded-lg">
          <h4 className="font-medium mb-2">AI Analysis</h4>
          <p className="text-sm text-muted-foreground">{reasoning}</p>
        </div>

        {/* Alternative Suggestions Preview */}
        {alternatives.titles.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Alternative Titles</h4>
            <div className="space-y-1">
              {alternatives.titles.slice(0, 3).map((title, index) => (
                <div key={index} className="text-sm p-2 bg-muted rounded">
                  {title}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t">
          <Button
            onClick={() => onApply(metadata)}
            className="flex-1 bg-gradient-to-r from-purple-500 to-green-500"
          >
            <Check className="w-4 h-4 mr-2" />
            Apply AI Suggestions
          </Button>
          <Button variant="outline" onClick={onReject} className="px-6">
            Review More Options
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}