import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Sparkles, Heart, Eye, Users, Star } from "lucide-react";

interface QuickActionsProps {
  onAlgorithmChange: (algorithm: string) => void;
  activeAlgorithm: string;
}

export default function RecommendationQuickActions({ onAlgorithmChange, activeAlgorithm }: QuickActionsProps) {
  const algorithms = [
    {
      id: "personalized",
      name: "For You",
      icon: Sparkles,
      description: "AI-curated based on your activity",
      color: "purple"
    },
    {
      id: "trending",
      name: "Trending",
      icon: TrendingUp,
      description: "Popular NFTs right now",
      color: "green"
    },
    {
      id: "content",
      name: "Similar",
      icon: Heart,
      description: "Based on your preferences",
      color: "blue"
    },
    {
      id: "price",
      name: "Price Match",
      icon: Star,
      description: "In your price range",
      color: "yellow"
    },
    {
      id: "artist",
      name: "Artists",
      icon: Users,
      description: "From artists you like",
      color: "pink"
    }
  ];

  const getColorClasses = (color: string, isActive: boolean) => {
    const baseClasses = isActive ? "border-2" : "border border-gray-600 hover:border-opacity-50";
    
    switch (color) {
      case "purple":
        return `${baseClasses} ${isActive ? "border-purple-500 bg-purple-500/10" : "hover:border-purple-500"}`;
      case "green":
        return `${baseClasses} ${isActive ? "border-green-500 bg-green-500/10" : "hover:border-green-500"}`;
      case "blue":
        return `${baseClasses} ${isActive ? "border-blue-500 bg-blue-500/10" : "hover:border-blue-500"}`;
      case "yellow":
        return `${baseClasses} ${isActive ? "border-yellow-500 bg-yellow-500/10" : "hover:border-yellow-500"}`;
      case "pink":
        return `${baseClasses} ${isActive ? "border-pink-500 bg-pink-500/10" : "hover:border-pink-500"}`;
      default:
        return baseClasses;
    }
  };

  const getIconColor = (color: string) => {
    switch (color) {
      case "purple": return "text-purple-400";
      case "green": return "text-green-400";
      case "blue": return "text-blue-400";
      case "yellow": return "text-yellow-400";
      case "pink": return "text-pink-400";
      default: return "text-gray-400";
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      {algorithms.map((algorithm) => {
        const IconComponent = algorithm.icon;
        const isActive = activeAlgorithm === algorithm.id;
        
        return (
          <Card
            key={algorithm.id}
            className={`${getColorClasses(algorithm.color, isActive)} bg-gray-800 cursor-pointer transition-all duration-300 hover:scale-105`}
            onClick={() => onAlgorithmChange(algorithm.id)}
          >
            <CardContent className="p-4 text-center">
              <IconComponent className={`h-6 w-6 mx-auto mb-2 ${getIconColor(algorithm.color)}`} />
              <h3 className="font-semibold text-white text-sm mb-1">{algorithm.name}</h3>
              <p className="text-xs text-gray-400">{algorithm.description}</p>
              {isActive && (
                <Badge className="mt-2 bg-gray-700 text-gray-300">
                  Active
                </Badge>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}