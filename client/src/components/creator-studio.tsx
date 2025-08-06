
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  Palette, 
  Upload, 
  Settings, 
  BarChart3, 
  Coins, 
  Users,
  TrendingUp,
  Eye,
  Heart,
  Share2
} from 'lucide-react';

export function CreatorStudio() {
  const [activeTab, setActiveTab] = useState('create');

  const creatorStats = {
    totalEarnings: 156.7,
    nftsCreated: 23,
    totalViews: 12547,
    followers: 892,
    averagePrice: 6.8,
    successRate: 87
  };

  const recentNFTs = [
    {
      id: '1',
      title: 'Digital Dreams #001',
      price: 12.5,
      views: 234,
      likes: 45,
      status: 'sold'
    },
    {
      id: '2',
      title: 'Cosmic Journey #015',
      price: 8.2,
      views: 156,
      likes: 32,
      status: 'listed'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Creator Studio</h1>
        <Badge className="bg-gradient-to-r from-purple-500 to-pink-500">
          Pro Creator
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-gray-800/50">
          <TabsTrigger value="create" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Create
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="earnings" className="flex items-center gap-2">
            <Coins className="h-4 w-4" />
            Earnings
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Create New NFT
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-300">Title</label>
                    <Input 
                      placeholder="Enter NFT title..." 
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-300">Description</label>
                    <Textarea 
                      placeholder="Describe your NFT..." 
                      className="bg-gray-700 border-gray-600 text-white min-h-[120px]"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-300">Price (SOL)</label>
                    <Input 
                      type="number" 
                      placeholder="0.00" 
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
                    <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-400">Drop your image here or click to browse</p>
                    <Button variant="outline" className="mt-4">
                      Select File
                    </Button>
                  </div>
                </div>
              </div>
              <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500">
                Create NFT
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Total Views</p>
                    <p className="text-2xl font-bold text-white">{creatorStats.totalViews.toLocaleString()}</p>
                  </div>
                  <Eye className="h-8 w-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Followers</p>
                    <p className="text-2xl font-bold text-white">{creatorStats.followers}</p>
                  </div>
                  <Users className="h-8 w-8 text-green-400" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Success Rate</p>
                    <p className="text-2xl font-bold text-white">{creatorStats.successRate}%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Recent NFTs Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentNFTs.map((nft) => (
                  <div key={nft.id} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-white">{nft.title}</h4>
                      <p className="text-sm text-gray-400">{nft.price} SOL</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-400">{nft.views}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Heart className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-400">{nft.likes}</span>
                      </div>
                      <Badge variant={nft.status === 'sold' ? 'default' : 'secondary'}>
                        {nft.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="earnings" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Total Earnings</p>
                    <p className="text-3xl font-bold text-green-400">{creatorStats.totalEarnings} SOL</p>
                  </div>
                  <Coins className="h-8 w-8 text-green-400" />
                </div>
                <div className="mt-4">
                  <p className="text-sm text-gray-400">Average per NFT: {creatorStats.averagePrice} SOL</p>
                  <Progress value={75} className="mt-2" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">NFTs Created</p>
                    <p className="text-3xl font-bold text-white">{creatorStats.nftsCreated}</p>
                  </div>
                  <Palette className="h-8 w-8 text-purple-400" />
                </div>
                <div className="mt-4">
                  <p className="text-sm text-gray-400">This month: +5 NFTs</p>
                  <Progress value={60} className="mt-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Creator Profile Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-300">Creator Name</label>
                <Input 
                  placeholder="Your creator name..." 
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300">Bio</label>
                <Textarea 
                  placeholder="Tell people about yourself..." 
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300">Default Royalty (%)</label>
                <Input 
                  type="number" 
                  placeholder="5" 
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <Button className="w-full">Save Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
