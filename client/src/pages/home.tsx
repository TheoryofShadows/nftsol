
import { useState, useEffect } from "react";
import Navbar from "@/components/navbar";
import HeroSection from "@/components/hero-section";
import TrendingCollections from "@/components/trending-collections";
import FeaturedNFTs from "@/components/featured-nfts";
import CreatorSpotlight from "@/components/creator-spotlight";
import Newsletter from "@/components/newsletter";
import Footer from "@/components/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, Coins, Users, Zap, ArrowRight, Star } from "lucide-react";

export default function Home() {
  const [cloutStats, setCloutStats] = useState({
    totalRewards: "2.5M",
    activeUsers: "12.8K",
    mintingRewards: "1.2M"
  });

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navbar />
      
      {/* Enhanced Hero with CLOUT Integration */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-green-900/20" />
        <div className="relative max-w-7xl mx-auto text-center">
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-r from-purple-600 to-green-600 rounded-full flex items-center justify-center animate-pulse drop-shadow-2xl">
                <Coins className="w-12 h-12 md:w-16 md:h-16 text-white" />
              </div>
              <div className="absolute -inset-4 bg-gradient-to-r from-purple-600/20 to-green-600/20 rounded-full blur-xl animate-pulse" />
            </div>
          </div>
          
          <Badge className="mb-6 bg-gradient-to-r from-purple-600/20 to-green-600/20 text-purple-300 border-purple-500/30 px-4 py-2">
            <Coins className="w-4 h-4 mr-2" />
            Powered by CLOUT Token
          </Badge>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-8 bg-gradient-to-r from-white via-purple-200 to-green-200 bg-clip-text text-transparent leading-tight">
            The Future of
            <span className="block text-transparent bg-gradient-to-r from-purple-400 to-green-400 bg-clip-text">
              NFT Trading
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
            Discover, create, and trade NFTs on Solana with our revolutionary CLOUT rewards system. 
            Earn tokens for every interaction and unlock exclusive benefits.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Button size="lg" className="modern-btn px-8 py-4 text-lg">
              Start Trading
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button variant="outline" size="lg" className="px-8 py-4 text-lg border-white/20 hover:border-purple-400">
              Learn About CLOUT
            </Button>
          </div>
          
          {/* CLOUT Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="modern-card border-purple-500/20">
              <CardContent className="p-6 text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-gradient-to-r from-purple-600/20 to-purple-800/20 rounded-full">
                    <Coins className="w-8 h-8 text-purple-400" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">{cloutStats.totalRewards}</h3>
                <p className="text-muted-foreground">CLOUT Rewards Distributed</p>
              </CardContent>
            </Card>
            
            <Card className="modern-card border-green-500/20">
              <CardContent className="p-6 text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-gradient-to-r from-green-600/20 to-green-800/20 rounded-full">
                    <Users className="w-8 h-8 text-green-400" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">{cloutStats.activeUsers}</h3>
                <p className="text-muted-foreground">Active CLOUT Earners</p>
              </CardContent>
            </Card>
            
            <Card className="modern-card border-blue-500/20">
              <CardContent className="p-6 text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-gradient-to-r from-blue-600/20 to-blue-800/20 rounded-full">
                    <Zap className="w-8 h-8 text-blue-400" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">{cloutStats.mintingRewards}</h3>
                <p className="text-muted-foreground">Minting Rewards Earned</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CLOUT Features Highlight */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-purple-900/10 to-green-900/10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-gradient-to-r from-purple-600/20 to-green-600/20 text-purple-300">
              <Star className="w-4 h-4 mr-2" />
              CLOUT Token Benefits
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">
              Why Choose NFTSol?
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Experience the next generation of NFT trading with our innovative CLOUT rewards ecosystem
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Coins className="w-8 h-8" />,
                title: "Earn CLOUT",
                description: "Get rewarded for every NFT interaction",
                color: "purple"
              },
              {
                icon: <TrendingUp className="w-8 h-8" />,
                title: "Zero Fees",
                description: "Trade without platform fees using CLOUT",
                color: "green"
              },
              {
                icon: <Zap className="w-8 h-8" />,
                title: "Instant Rewards",
                description: "Immediate CLOUT distribution on trades",
                color: "blue"
              },
              {
                icon: <Users className="w-8 h-8" />,
                title: "Community Driven",
                description: "Governance rights with CLOUT holdings",
                color: "pink"
              }
            ].map((feature, index) => (
              <Card key={index} className="modern-card group hover:scale-105 transition-all duration-300">
                <CardContent className="p-6 text-center">
                  <div className={`flex justify-center mb-4 text-${feature.color}-400`}>
                    <div className={`p-3 bg-gradient-to-r from-${feature.color}-600/20 to-${feature.color}-800/20 rounded-full group-hover:scale-110 transition-transform`}>
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <HeroSection />
      <TrendingCollections />
      <FeaturedNFTs />
      <CreatorSpotlight />
      <Newsletter />
      <Footer />
    </div>
  );
}
