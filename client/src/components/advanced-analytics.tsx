
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Activity,
  Download,
  Calendar,
  Target,
  Zap
} from 'lucide-react';

export function AdvancedAnalytics() {
  const [timeframe, setTimeframe] = useState('7d');

  const volumeData = [
    { date: '2024-01-01', volume: 125, transactions: 45 },
    { date: '2024-01-02', volume: 189, transactions: 67 },
    { date: '2024-01-03', volume: 156, transactions: 52 },
    { date: '2024-01-04', volume: 234, transactions: 78 },
    { date: '2024-01-05', volume: 278, transactions: 89 },
    { date: '2024-01-06', volume: 312, transactions: 94 },
    { date: '2024-01-07', volume: 345, transactions: 102 }
  ];

  const categoryData = [
    { name: 'Art', value: 45, color: '#8B5CF6' },
    { name: 'Gaming', value: 30, color: '#06D6A0' },
    { name: 'Music', value: 15, color: '#F72585' },
    { name: 'Photography', value: 10, color: '#FFD166' }
  ];

  const topCollections = [
    { name: 'Cosmic Dreams', volume: 89.5, change: 12.5 },
    { name: 'Digital Souls', volume: 67.2, change: -3.2 },
    { name: 'Neon Nights', volume: 45.8, change: 8.7 },
    { name: 'Abstract Flow', volume: 34.1, change: 15.3 }
  ];

  const metrics = {
    totalVolume: 1234.56,
    totalUsers: 5678,
    avgPrice: 12.34,
    totalTransactions: 9876,
    platformFees: 24.69,
    activeCreators: 234
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Advanced Analytics</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button 
              variant={timeframe === '24h' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setTimeframe('24h')}
            >
              24h
            </Button>
            <Button 
              variant={timeframe === '7d' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setTimeframe('7d')}
            >
              7d
            </Button>
            <Button 
              variant={timeframe === '30d' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setTimeframe('30d')}
            >
              30d
            </Button>
          </div>
          <Button className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">Total Volume</p>
                <p className="text-lg font-bold text-white">{metrics.totalVolume} SOL</p>
                <p className="text-xs text-green-400">+12.5%</p>
              </div>
              <DollarSign className="h-6 w-6 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">Active Users</p>
                <p className="text-lg font-bold text-white">{metrics.totalUsers.toLocaleString()}</p>
                <p className="text-xs text-blue-400">+8.3%</p>
              </div>
              <Users className="h-6 w-6 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">Avg Price</p>
                <p className="text-lg font-bold text-white">{metrics.avgPrice} SOL</p>
                <p className="text-xs text-purple-400">+5.7%</p>
              </div>
              <Target className="h-6 w-6 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">Transactions</p>
                <p className="text-lg font-bold text-white">{metrics.totalTransactions.toLocaleString()}</p>
                <p className="text-xs text-yellow-400">+15.2%</p>
              </div>
              <Activity className="h-6 w-6 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">Platform Fees</p>
                <p className="text-lg font-bold text-white">{metrics.platformFees} SOL</p>
                <p className="text-xs text-green-400">+12.5%</p>
              </div>
              <Zap className="h-6 w-6 text-orange-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">Creators</p>
                <p className="text-lg font-bold text-white">{metrics.activeCreators}</p>
                <p className="text-xs text-pink-400">+9.1%</p>
              </div>
              <Users className="h-6 w-6 text-pink-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="volume" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-gray-800/50">
          <TabsTrigger value="volume">Volume Analysis</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="collections">Collections</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="volume" className="space-y-6">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Trading Volume Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={volumeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px'
                      }}
                    />
                    <Line type="monotone" dataKey="volume" stroke="#8B5CF6" strokeWidth={3} />
                    <Line type="monotone" dataKey="transactions" stroke="#06D6A0" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Category Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Category Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categoryData.map((category) => (
                    <div key={category.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="text-white">{category.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-semibold">{category.value}%</p>
                        <p className="text-xs text-gray-400">of total volume</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="collections" className="space-y-6">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Top Collections</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topCollections.map((collection, index) => (
                  <div key={collection.name} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className="text-gray-300">
                        #{index + 1}
                      </Badge>
                      <div>
                        <h4 className="font-semibold text-white">{collection.name}</h4>
                        <p className="text-sm text-gray-400">{collection.volume} SOL volume</p>
                      </div>
                    </div>
                    <Badge 
                      variant={collection.change > 0 ? 'default' : 'destructive'}
                      className={collection.change > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}
                    >
                      {collection.change > 0 ? '+' : ''}{collection.change}%
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Platform Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-400">Revenue Growth</span>
                      <span className="text-green-400">+23.5%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-green-400 h-2 rounded-full w-3/4"></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-400">User Retention</span>
                      <span className="text-blue-400">89.2%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-blue-400 h-2 rounded-full w-5/6"></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-400">Creator Satisfaction</span>
                      <span className="text-purple-400">94.7%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-purple-400 h-2 rounded-full w-11/12"></div>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-gray-700/50 rounded-lg">
                    <h4 className="font-semibold text-white mb-2">Key Insights</h4>
                    <ul className="space-y-2 text-sm text-gray-400">
                      <li>• Art category showing strongest growth</li>
                      <li>• Weekend trading volume 40% higher</li>
                      <li>• New creators up 15% this month</li>
                      <li>• Mobile traffic increasing 25%</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
