
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Crown, Medal, Award, TrendingUp } from "lucide-react";

interface LeaderboardEntry {
  rank: number;
  username: string;
  cloutTokens: number;
  nftsSold: number;
  totalVolume: number;
  badge?: string;
}

export default function CloutLeaderboard() {
  const [leaderboard] = useState<LeaderboardEntry[]>([
    {
      rank: 1,
      username: "SolanaKing",
      cloutTokens: 50000,
      nftsSold: 156,
      totalVolume: 2340.5,
      badge: "👑"
    },
    {
      rank: 2,
      username: "NFTMaster",
      cloutTokens: 42300,
      nftsSold: 134,
      totalVolume: 1987.2,
      badge: "🥈"
    },
    {
      rank: 3,
      username: "CryptoArtist",
      cloutTokens: 38900,
      nftsSold: 128,
      totalVolume: 1756.8,
      badge: "🥉"
    },
    {
      rank: 4,
      username: "DigitalCreator",
      cloutTokens: 35200,
      nftsSold: 98,
      totalVolume: 1432.1
    },
    {
      rank: 5,
      username: "NFTCollector",
      cloutTokens: 31800,
      nftsSold: 87,
      totalVolume: 1298.7
    }
  ]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="h-5 w-5 text-yellow-400" />;
      case 2: return <Medal className="h-5 w-5 text-gray-400" />;
      case 3: return <Award className="h-5 w-5 text-orange-400" />;
      default: return <TrendingUp className="h-5 w-5 text-blue-400" />;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-gradient-to-r from-yellow-600/20 to-yellow-500/20 border-yellow-500/50';
      case 2: return 'bg-gradient-to-r from-gray-600/20 to-gray-500/20 border-gray-500/50';
      case 3: return 'bg-gradient-to-r from-orange-600/20 to-orange-500/20 border-orange-500/50';
      default: return 'bg-gray-800/30 border-gray-700/50';
    }
  };

  return (
    <Card className="bg-gradient-to-b from-gray-800/50 to-gray-900/50 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Crown className="h-5 w-5 text-yellow-400" />
          CLOUT Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {leaderboard.map((entry) => (
          <div
            key={entry.rank}
            className={`p-4 rounded-lg border ${getRankColor(entry.rank)}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {getRankIcon(entry.rank)}
                  <span className="text-white font-bold text-lg">#{entry.rank}</span>
                  {entry.badge && <span className="text-xl">{entry.badge}</span>}
                </div>
                
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-purple-600 text-white">
                    {entry.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div>
                  <h3 className="font-semibold text-white">{entry.username}</h3>
                  <div className="text-sm text-gray-400">
                    {entry.nftsSold} NFTs sold • {entry.totalVolume} SOL volume
                  </div>
                </div>
              </div>
              
              <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-600/50 text-lg px-3 py-1">
                {entry.cloutTokens.toLocaleString()} CLOUT
              </Badge>
            </div>
          </div>
        ))}
        
        <div className="text-center pt-4 border-t border-gray-700">
          <p className="text-sm text-gray-400">
            Your current rank: <span className="text-white font-semibold">#47</span> with{" "}
            <span className="text-yellow-400">2,340 CLOUT</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
