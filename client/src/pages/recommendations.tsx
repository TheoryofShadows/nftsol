import { useState } from "react";
import NFTRecommendations from "@/components/nft-recommendations";
import RecommendationPreferences from "@/components/recommendation-preferences";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, Sparkles, TrendingUp, Users } from "lucide-react";
// Mock user for demo since auth is not required for recommendations
const mockUser = { id: "demo-user-123", name: "Demo User" };

export default function RecommendationsPage() {
  const user = mockUser;
  const [showPreferences, setShowPreferences] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handlePreferencesUpdate = () => {
    setRefreshKey(prev => prev + 1);
    setShowPreferences(false);
  };

  // Always show content since we have mock user
  if (false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 p-6">
        <div className="max-w-4xl mx-auto text-center py-20">
          <Sparkles className="h-16 w-16 text-purple-400 mx-auto mb-6" />
          <h1 className="text-4xl font-bold text-white mb-4">Personalized NFT Recommendations</h1>
          <p className="text-xl text-gray-400 mb-8">
            Sign in to get AI-powered NFT recommendations tailored just for you
          </p>
          <Button 
            onClick={() => window.location.href = '/api/login'}
            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 text-lg"
          >
            Sign In to Get Started
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white flex items-center gap-3">
              <Sparkles className="h-10 w-10 text-purple-400" />
              AI Recommendations
            </h1>
            <p className="text-gray-400 mt-2 text-lg">
              Discover NFTs curated specifically for your taste and preferences
            </p>
          </div>
          <Button
            onClick={() => setShowPreferences(!showPreferences)}
            variant="outline"
            className="border-purple-600 text-purple-400 hover:bg-purple-600/10"
          >
            <Settings className="h-4 w-4 mr-2" />
            {showPreferences ? 'Hide' : 'Customize'} Preferences
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 border-purple-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-purple-100">Recommendation Engine</CardTitle>
              <Sparkles className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">AI Powered</div>
              <p className="text-xs text-purple-400">
                Machine learning algorithms
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-900/50 to-green-800/30 border-green-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-green-100">Trending Analysis</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">Real-time</div>
              <p className="text-xs text-green-400">
                Live market trends
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border-blue-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-blue-100">Personalization</CardTitle>
              <Users className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">Adaptive</div>
              <p className="text-xs text-blue-400">
                Learns from your activity
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Preferences Panel */}
        {showPreferences && (
          <RecommendationPreferences 
            userId={user.id} 
            onPreferencesUpdate={handlePreferencesUpdate}
          />
        )}

        {/* Recommendations */}
        <NFTRecommendations key={refreshKey} userId={user.id} />
      </div>
    </div>
  );
}