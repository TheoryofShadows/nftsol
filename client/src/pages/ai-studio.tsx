import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AIDescriptionEnhancer } from '@/components/ai-description-enhancer';
import { AIPricingAnalyzer } from '@/components/ai-pricing-analyzer';
import { AISocialGenerator } from '@/components/ai-social-generator';
import { AIDebuggingPanel } from '@/components/ai-debugging-panel';
import { CLOUTTokenVerifier } from '@/components/clout-token-verifier';
import { Link } from 'wouter';
import { 
  Sparkles, 
  Wand2, 
  TrendingUp, 
  MessageCircle, 
  Target, 
  PieChart,
  Zap,
  Brain
} from 'lucide-react';

export default function AIStudioPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-green-900">
      <div className="container mx-auto py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-green-400 bg-clip-text text-transparent">
            AI Studio
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Harness the power of artificial intelligence to optimize your NFT strategy, enhance descriptions, analyze markets, and maximize your success
          </p>
        </div>

        {/* AI Tools Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card className="bg-gray-900/50 border-purple-500/20 hover:border-purple-500/40 transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Wand2 className="w-5 h-5 text-purple-400" />
                NFT Minting Wizard
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-400 text-sm">
                Upload an image and let AI generate perfect metadata, pricing, and attributes automatically
              </p>
              <Link to="/mint-wizard">
                <Button className="w-full bg-gradient-to-r from-purple-500 to-purple-600">
                  Launch Wizard
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-green-500/20 hover:border-green-500/40 transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Target className="w-5 h-5 text-green-400" />
                Description Enhancer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-400 text-sm">
                Transform basic descriptions into compelling copy with SEO keywords and social media captions
              </p>
              <div className="space-y-2">
                <Button className="w-full bg-gradient-to-r from-green-500 to-green-600">
                  Enhance Now
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-blue-500/20 hover:border-blue-500/40 transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                Smart Pricing Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-400 text-sm">
                Get AI-powered pricing recommendations based on market data and NFT characteristics
              </p>
              <Button 
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600"
                onClick={() => document.getElementById('pricing-section')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Analyze Pricing
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-yellow-500/20 hover:border-yellow-500/40 transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <MessageCircle className="w-5 h-5 text-yellow-400" />
                AI Assistant
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-400 text-sm">
                24/7 AI chatbot to help with minting, trading, and platform navigation
              </p>
              <div className="text-xs text-yellow-400 bg-yellow-500/10 p-2 rounded">
                💡 Look for the chat button in the bottom-right corner!
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-pink-500/20 hover:border-pink-500/40 transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <PieChart className="w-5 h-5 text-pink-400" />
                Collection Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-400 text-sm">
                Get strategic recommendations for your NFT collections and marketing campaigns
              </p>
              <Button className="w-full bg-gradient-to-r from-pink-500 to-pink-600" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-orange-500/20 hover:border-orange-500/40 transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Brain className="w-5 h-5 text-orange-400" />
                Market Intelligence
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-400 text-sm">
                AI-powered market analysis, trend predictions, and investment recommendations
              </p>
              <Button className="w-full bg-gradient-to-r from-orange-500 to-orange-600" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* AI Tools Sections */}
        <div className="space-y-12">
          {/* Description Enhancer */}
          <section>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Description Enhancer</h2>
              <p className="text-gray-400">Transform basic descriptions into compelling copy with SEO optimization</p>
            </div>
            <AIDescriptionEnhancer />
          </section>

          {/* Pricing Analyzer */}
          <section id="pricing-section">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Smart Pricing Analysis</h2>
              <p className="text-gray-400">Get AI-powered pricing recommendations based on market data</p>
            </div>
            <AIPricingAnalyzer />
          </section>

          {/* Social Content Generator */}
          <section id="social-section">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Social Media Generator</h2>
              <p className="text-gray-400">Create engaging social media posts and trending hashtags</p>
            </div>
            <AISocialGenerator />
          </section>

          {/* AI System Debugger */}
          <section id="debug-section">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">AI System Debugger</h2>
              <p className="text-gray-400">Advanced debugging and monitoring for all AI services</p>
            </div>
            <AIDebuggingPanel />
          </section>

          {/* CLOUT Token Verifier */}
          <section id="token-section">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">CLOUT Token Verifier</h2>
              <p className="text-gray-400">Verify and manage the CLOUT token deployment on Solana</p>
            </div>
            <CLOUTTokenVerifier />
          </section>
        </div>

        {/* AI Features Overview */}
        <Card className="bg-gray-900/30 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Sparkles className="w-5 h-5 text-purple-400" />
              What Makes Our AI Special?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center space-y-2">
                <Zap className="w-12 h-12 mx-auto text-yellow-400" />
                <h3 className="font-semibold text-white">Lightning Fast</h3>
                <p className="text-sm text-gray-400">Get AI insights in seconds, not minutes</p>
              </div>
              
              <div className="text-center space-y-2">
                <Target className="w-12 h-12 mx-auto text-green-400" />
                <h3 className="font-semibold text-white">NFT-Focused</h3>
                <p className="text-sm text-gray-400">Trained specifically for digital asset markets</p>
              </div>
              
              <div className="text-center space-y-2">
                <TrendingUp className="w-12 h-12 mx-auto text-blue-400" />
                <h3 className="font-semibold text-white">Market-Aware</h3>
                <p className="text-sm text-gray-400">Considers real market trends and data</p>
              </div>
              
              <div className="text-center space-y-2">
                <Brain className="w-12 h-12 mx-auto text-purple-400" />
                <h3 className="font-semibold text-white">Always Learning</h3>
                <p className="text-sm text-gray-400">Continuously improving with each interaction</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}