import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Save, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PreferencesData {
  categories: string[];
  priceRangeMin: string;
  priceRangeMax: string;
  preferredArtists: string[];
  collectionTypes: string[];
  rarity: string | null;
}

interface MetadataResponse {
  categories: string[];
  artists: string[];
  collections: string[];
  rarities: string[];
}

interface RecommendationPreferencesProps {
  userId: string;
  onPreferencesUpdate?: () => void;
}

export default function RecommendationPreferences({ userId, onPreferencesUpdate }: RecommendationPreferencesProps) {
  const [preferences, setPreferences] = useState<PreferencesData>({
    categories: [],
    priceRangeMin: "0",
    priceRangeMax: "100",
    preferredArtists: [],
    collectionTypes: [],
    rarity: null
  });
  
  const [metadata, setMetadata] = useState<MetadataResponse>({
    categories: [],
    artists: [],
    collections: [],
    rarities: []
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const priceRange = [parseFloat(preferences.priceRangeMin), parseFloat(preferences.priceRangeMax)];

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch metadata
        const metadataResponse = await fetch('/api/recommendations/metadata');
        if (metadataResponse.ok) {
          const metadataData = await metadataResponse.json();
          setMetadata(metadataData);
        }

        // Fetch user preferences
        const preferencesResponse = await fetch(`/api/recommendations/preferences/${userId}`);
        if (preferencesResponse.ok) {
          const preferencesData = await preferencesResponse.json();
          setPreferences(preferencesData);
        }
      } catch (error) {
        console.error('Failed to fetch preferences data:', error);
        toast({
          title: "Error",
          description: "Failed to load preferences",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchData();
    }
  }, [userId, toast]);

  const handleSavePreferences = async () => {
    try {
      setSaving(true);
      const response = await fetch(`/api/recommendations/preferences/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences)
      });

      if (response.ok) {
        toast({
          title: "Preferences saved",
          description: "Your recommendation preferences have been updated",
        });
        onPreferencesUpdate?.();
      } else {
        throw new Error('Failed to save preferences');
      }
    } catch (error) {
      console.error('Failed to save preferences:', error);
      toast({
        title: "Error",
        description: "Failed to save preferences",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setPreferences({
      categories: [],
      priceRangeMin: "0",
      priceRangeMax: "100",
      preferredArtists: [],
      collectionTypes: [],
      rarity: null
    });
  };

  const handleCategoryToggle = (category: string) => {
    setPreferences(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  const handleArtistToggle = (artist: string) => {
    setPreferences(prev => ({
      ...prev,
      preferredArtists: prev.preferredArtists.includes(artist)
        ? prev.preferredArtists.filter(a => a !== artist)
        : [...prev.preferredArtists, artist]
    }));
  };

  const handlePriceRangeChange = (values: number[]) => {
    setPreferences(prev => ({
      ...prev,
      priceRangeMin: values[0].toString(),
      priceRangeMax: values[1].toString()
    }));
  };

  if (loading) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Recommendation Preferences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-700 rounded w-1/4"></div>
            <div className="grid grid-cols-3 gap-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-8 bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Settings className="h-5 w-5 text-purple-400" />
          Recommendation Preferences
        </CardTitle>
        <p className="text-gray-400 text-sm">
          Customize your NFT recommendations by setting your preferences
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Categories */}
        <div>
          <Label className="text-white font-medium mb-3 block">Preferred Categories</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {(metadata.categories || []).map((category) => (
              <div key={category} className="flex items-center space-x-2">
                <Checkbox
                  id={`category-${category}`}
                  checked={preferences.categories.includes(category)}
                  onCheckedChange={() => handleCategoryToggle(category)}
                  className="border-gray-500"
                />
                <Label 
                  htmlFor={`category-${category}`} 
                  className="text-sm text-gray-300 cursor-pointer"
                >
                  {category}
                </Label>
              </div>
            ))}
          </div>
          {preferences.categories.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {preferences.categories.map((category) => (
                <Badge key={category} variant="secondary" className="bg-purple-600/20 text-purple-400">
                  {category}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Price Range */}
        <div>
          <Label className="text-white font-medium mb-3 block">
            Price Range: {priceRange[0].toFixed(1)} - {priceRange[1].toFixed(1)} SOL
          </Label>
          <Slider
            value={priceRange}
            onValueChange={handlePriceRangeChange}
            max={100}
            min={0}
            step={0.5}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0 SOL</span>
            <span>100 SOL</span>
          </div>
        </div>

        {/* Rarity Preference */}
        <div>
          <Label className="text-white font-medium mb-3 block">Preferred Rarity</Label>
          <Select value={preferences.rarity || ""} onValueChange={(value) => 
            setPreferences(prev => ({ ...prev, rarity: value || null }))
          }>
            <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
              <SelectValue placeholder="Any rarity" />
            </SelectTrigger>
            <SelectContent className="bg-gray-700 border-gray-600">
              <SelectItem value="">Any rarity</SelectItem>
              {(metadata.rarities || []).map((rarity) => (
                <SelectItem key={rarity} value={rarity} className="text-white">
                  {rarity.charAt(0).toUpperCase() + rarity.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Preferred Artists */}
        <div>
          <Label className="text-white font-medium mb-3 block">Preferred Artists</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-32 overflow-y-auto">
            {(metadata.artists || []).map((artist) => (
              <div key={artist} className="flex items-center space-x-2">
                <Checkbox
                  id={`artist-${artist}`}
                  checked={preferences.preferredArtists.includes(artist)}
                  onCheckedChange={() => handleArtistToggle(artist)}
                  className="border-gray-500"
                />
                <Label 
                  htmlFor={`artist-${artist}`} 
                  className="text-sm text-gray-300 cursor-pointer"
                >
                  {artist}
                </Label>
              </div>
            ))}
          </div>
          {preferences.preferredArtists.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {preferences.preferredArtists.map((artist) => (
                <Badge key={artist} variant="secondary" className="bg-blue-600/20 text-blue-400">
                  {artist}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button 
            onClick={handleSavePreferences}
            disabled={saving}
            className="flex-1 bg-purple-600 hover:bg-purple-700"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Preferences'}
          </Button>
          <Button 
            onClick={handleReset}
            variant="outline"
            className="border-gray-600 hover:border-purple-500"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}