import { useState, useEffect } from "react";
import Footer from "@/components/footer";
import { 
  SmartPageLayout, 
  SmartSection, 
  SmartCard, 
  SmartGridLayout, 
  SmartText,
  LayoutPerformanceMonitor 
} from "@/components/layout/layout-optimizer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { 
  TrendingUp, 
  Coins, 
  Users, 
  Zap, 
  ArrowRight, 
  Star,
  Crown,
  Trophy,
  Target,
  Medal
} from "lucide-react";

/**
 * REVOLUTIONARY HOME PAGE
 * 
 * This demonstrates the complete elimination of duplicate layout patterns.
 * Every section uses the universal layout system - zero redundancy!
 */

export default function OptimizedHome() {
  const [platformStats] = useState({
    totalRewards: "2.5M",
    activeUsers: "12.8K",
    mintingRewards: "1.2M",
    dailyVolume: "847 SOL"
  });

  const featuredNFTs = [
    {
      id: 1,
      name: "Mad Lads #1847",
      creator: "Backpack Team",
      image: "https://nftstorage.link/ipfs/QmYxJSYQnqKHhGgSMVLKE8oMaZXr9GgvjHJCiVacvCLm4H",
      currentBid: "32.5 SOL",
      category: "PFP"
    },
    {
      id: 2,
      name: "Solana Monkey #4721",
      creator: "SolanaMonkey",
      image: "https://arweave.net/FXWat3Qv1LjgbjcabQoXAqnb5n8pCLFc3y87BHNwTNEb",
      currentBid: "59.0 SOL",
      category: "Art"
    },
    {
      id: 3,
      name: "Claynosaurz #1256",
      creator: "Claynosaurz Studio",
      image: "https://metadata.claynosaurz.com/1256.png",
      currentBid: "2.85 SOL",
      category: "Gaming"
    },
    {
      id: 4,
      name: "Froganas #3421",
      creator: "Tee",
      image: "https://arweave.net/B-RGgm_l-B2GmtGvmXhQXNy0QLaVoUKuPLyb7o5WqYU",
      currentBid: "1.75 SOL",
      category: "Music"
    }
  ];

  const topCreators = [
    {
      id: 1,
      name: "SolanaKing",
      avatar: "SK",
      totalSales: "2,340 SOL",
      totalNFTs: "156",
      cloutTokens: "50,000",
      badge: "👑"
    },
    {
      id: 2,
      name: "NFTMaster",
      avatar: "NM",
      totalSales: "1,987 SOL",
      totalNFTs: "134",
      cloutTokens: "42,300",
      badge: "🥈"
    },
    {
      id: 3,
      name: "CryptoArtist",
      avatar: "CA",
      totalSales: "1,756 SOL", 
      totalNFTs: "128",
      cloutTokens: "38,900",
      badge: "🥉"
    }
  ];

  const achievements = [
    {
      id: 1,
      title: "First Steps",
      description: "Make your first NFT purchase",
      icon: <Target className="w-6 h-6" />,
      reward: "100 CLOUT",
      rarity: "common"
    },
    {
      id: 2,
      title: "Creator",
      description: "Mint 5 NFTs",
      icon: <Star className="w-6 h-6" />,
      reward: "500 CLOUT",
      rarity: "rare"
    },
    {
      id: 3,
      title: "Trading Master",
      description: "Complete 50 transactions",
      icon: <Trophy className="w-6 h-6" />,
      reward: "2000 CLOUT",
      rarity: "epic"
    }
  ];

  return (
    <SmartPageLayout type="landing">
      {/* Revolutionary Hero Section - Zero Duplicate Code */}
      <SmartSection
        title="The Future of NFT Trading"
        subtitle="Discover, create, and trade NFTs on Solana with our revolutionary CLOUT rewards system. Earn tokens for every interaction and unlock exclusive benefits."
        variant="hero"
        centerContent={false}
      >
        {/* CLOUT Badge */}
        <div className="flex justify-center mb-8">
          <Badge className="bg-gradient-to-r from-purple-600/20 to-green-600/20 text-purple-300 border-purple-500/30 px-6 py-3 text-lg">
            <Coins className="w-5 h-5 mr-2" />
            Powered by CLOUT Token
          </Badge>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
          <Link href="/marketplace">
            <Button size="lg" className="bg-gradient-to-r from-purple-600 to-green-600 hover:opacity-80 px-8 py-4 text-lg">
              Start Trading
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
          <Link href="/clout-about">
            <Button variant="outline" size="lg" className="px-8 py-4 text-lg border-white/20 hover:border-purple-400">
              Learn About CLOUT
            </Button>
          </Link>
        </div>

        {/* Platform Stats - Smart Grid Auto-Layout */}
        <SmartGridLayout
          items={[
            { label: "Total Rewards", value: platformStats.totalRewards, icon: <Coins className="w-6 h-6 text-purple-400" /> },
            { label: "Active Users", value: platformStats.activeUsers, icon: <Users className="w-6 h-6 text-green-400" /> },
            { label: "Minting Rewards", value: platformStats.mintingRewards, icon: <Zap className="w-6 h-6 text-blue-400" /> },
            { label: "Daily Volume", value: platformStats.dailyVolume, icon: <TrendingUp className="w-6 h-6 text-yellow-400" /> }
          ]}
          renderItem={(stat, index) => (
            <SmartCard key={index} variant="stat">
              <div className="flex justify-center mb-3">
                <div className="p-3 bg-gradient-to-r from-gray-700/20 to-gray-800/20 rounded-full">
                  {stat.icon}
                </div>
              </div>
              <SmartText variant="title">{stat.value}</SmartText>
              <SmartText variant="caption">{stat.label}</SmartText>
            </SmartCard>
          )}
          type="stats"
          optimization="visual"
        />
      </SmartSection>

      {/* Featured NFTs - Smart Grid with Filters */}
      <SmartSection
        title="Featured NFTs"
        subtitle="Discover exceptional digital art from top creators on the Solana blockchain"
        variant="primary"
      >
        <SmartGridLayout
          items={featuredNFTs}
          renderItem={(nft, index) => (
            <SmartCard key={nft.id} variant="default" interactive={true}>
              <div className="relative overflow-hidden rounded-xl mb-4">
                <img
                  src={nft.image}
                  alt={nft.name}
                  className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.currentTarget.src = `https://via.placeholder.com/400x300/9333ea/ffffff?text=${encodeURIComponent(nft.name)}`;
                  }}
                />
                <Badge className="absolute top-3 left-3 bg-purple-600/80 text-white">
                  {nft.category}
                </Badge>
              </div>

              <SmartText variant="subtitle" className="mb-2">{nft.name}</SmartText>
              <SmartText variant="caption" className="mb-4">by {nft.creator}</SmartText>

              <div className="flex justify-between items-center">
                <div>
                  <SmartText variant="caption">Current Bid</SmartText>
                  <SmartText variant="subtitle" className="text-green-400">{nft.currentBid}</SmartText>
                </div>
                <Button size="sm" className="bg-gradient-to-r from-purple-600 to-green-600 hover:opacity-80">
                  Place Bid
                </Button>
              </div>
            </SmartCard>
          )}
          type="cards"
          optimization="engagement"
        />

        <div className="mt-8">
          <Link href="/marketplace">
            <Button variant="outline" size="lg">
              View All NFTs
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </SmartSection>

      {/* Top Creators - Intelligent Layout */}
      <SmartSection
        title="Top CLOUT Earners"
        subtitle="Meet the creators who are leading the CLOUT rewards ecosystem"
        variant="secondary"
      >
        <SmartGridLayout
          items={topCreators}
          renderItem={(creator, index) => (
            <SmartCard key={creator.id} variant="featured">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {creator.avatar}
                  </div>
                  {creator.badge && (
                    <div className="absolute -top-2 -right-2 text-2xl">
                      {creator.badge}
                    </div>
                  )}
                </div>
              </div>

              <SmartText variant="subtitle" className="mb-2">{creator.name}</SmartText>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">CLOUT Tokens</span>
                  <span className="text-purple-400 font-semibold">{creator.cloutTokens}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Total Sales</span>
                  <span className="text-green-400 font-semibold">{creator.totalSales}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">NFTs Created</span>
                  <span className="text-blue-400 font-semibold">{creator.totalNFTs}</span>
                </div>
              </div>

              <Button variant="outline" size="sm" className="w-full">
                Follow Creator
              </Button>
            </SmartCard>
          )}
          type="cards"
          optimization="visual"
        />
      </SmartSection>

      {/* Achievements System - Zero Duplicate Cards */}
      <SmartSection
        title="CLOUT Achievements"
        subtitle="Unlock rewards and climb the leaderboard with these challenges"
        variant="secondary"
      >
        <SmartGridLayout
          items={achievements}
          renderItem={(achievement, index) => (
            <SmartCard key={achievement.id} variant="default">
              <div className="flex justify-center mb-4">
                <div className={`p-4 rounded-full ${
                  achievement.rarity === 'common' ? 'bg-gray-600/20 text-gray-400' :
                  achievement.rarity === 'rare' ? 'bg-blue-600/20 text-blue-400' :
                  'bg-purple-600/20 text-purple-400'
                }`}>
                  {achievement.icon}
                </div>
              </div>

              <SmartText variant="subtitle" className="mb-2">{achievement.title}</SmartText>
              <SmartText variant="body" className="mb-4">{achievement.description}</SmartText>

              <Badge className={`${
                achievement.rarity === 'common' ? 'bg-gray-600/20 text-gray-300' :
                achievement.rarity === 'rare' ? 'bg-blue-600/20 text-blue-300' :
                'bg-purple-600/20 text-purple-300'
              }`}>
                {achievement.reward}
              </Badge>
            </SmartCard>
          )}
          type="cards"
          optimization="visual"
        />
      </SmartSection>

      {/* Call to Action - Smart Section */}
      <SmartSection
        title="Ready to Start Earning CLOUT?"
        subtitle="Join thousands of creators and collectors already earning rewards on NFTSol"
        variant="primary"
        centerContent={false}
      >
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/create">
            <Button size="lg" className="bg-gradient-to-r from-green-600 to-purple-600 hover:opacity-80 px-8 py-4 text-lg">
              <Star className="mr-2 w-5 h-5" />
              Start Creating
            </Button>
          </Link>
          <Link href="/marketplace">
            <Button variant="outline" size="lg" className="px-8 py-4 text-lg border-white/20 hover:border-green-400">
              <TrendingUp className="mr-2 w-5 h-5" />
              Start Trading
            </Button>
          </Link>
        </div>
      </SmartSection>

      <Footer />
    </SmartPageLayout>
  );
}