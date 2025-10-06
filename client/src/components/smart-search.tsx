
import React, { useState, useEffect } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { 
  Search, 
  Filter, 
  SlidersHorizontal,
  Star,
  TrendingUp,
  Clock,
  DollarSign
} from 'lucide-react';

interface SearchResult {
  id: string;
  type: 'nft' | 'creator' | 'collection';
  title: string;
  subtitle: string;
  image: string;
  price?: number;
  trending?: boolean;
  verified?: boolean;
}

export function SmartSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    type: 'all',
    priceRange: 'all',
    timeframe: 'all',
    verified: false
  });

  const trendingSearches = [
    'Digital Art', 'Gaming NFTs', 'Music', 'Photography', 'Abstract', 'Anime'
  ];

  useEffect(() => {
    if (query.length > 2) {
      setLoading(true);
      // Simulate search API call
      setTimeout(() => {
        setResults([
          {
            id: '1',
            type: 'nft',
            title: 'Cosmic Dreams #001',
            subtitle: 'by CryptoArtist',
            image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100',
            price: 12.5,
            trending: true,
            verified: true
          },
          {
            id: '2',
            type: 'collection',
            title: 'Digital Souls Collection',
            subtitle: '156 items • 23.5 SOL volume',
            image: 'https://images.unsplash.com/photo-1634973357973-f2ed2657db3c?w=100',
            verified: true
          },
          {
            id: '3',
            type: 'creator',
            title: 'CryptoMaster',
            subtitle: '45 NFTs created • 892 followers',
            image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=creator1',
            verified: true
          }
        ]);
        setLoading(false);
      }, 500);
    } else {
      setResults([]);
    }
  }, [query, filters]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'nft': return '🎨';
      case 'collection': return '📁';
      case 'creator': return '👤';
      default: return '🔍';
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search NFTs, collections, creators..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 pr-20 bg-gray-800/50 border-gray-600 text-white"
        />
        <Button
          onClick={() => setShowFilters(!showFilters)}
          variant="ghost"
          size="sm"
          className="absolute right-2 top-1/2 transform -translate-y-1/2"
        >
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      </div>

      {/* Trending Searches */}
      {!query && (
        <div className="space-y-2">
          <p className="text-sm text-gray-400">Trending searches:</p>
          <div className="flex flex-wrap gap-2">
            {trendingSearches.map((term) => (
              <Badge
                key={term}
                variant="outline"
                className="cursor-pointer hover:bg-gray-700"
                onClick={() => setQuery(term)}
              >
                <TrendingUp className="h-3 w-3 mr-1" />
                {term}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm text-gray-400">Type</label>
                <select 
                  className="w-full mt-1 bg-gray-700 border-gray-600 rounded text-white text-sm p-2"
                  value={filters.type}
                  onChange={(e) => setFilters(f => ({...f, type: e.target.value}))}
                >
                  <option value="all">All Types</option>
                  <option value="nft">NFTs</option>
                  <option value="collection">Collections</option>
                  <option value="creator">Creators</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-400">Price Range</label>
                <select 
                  className="w-full mt-1 bg-gray-700 border-gray-600 rounded text-white text-sm p-2"
                  value={filters.priceRange}
                  onChange={(e) => setFilters(f => ({...f, priceRange: e.target.value}))}
                >
                  <option value="all">Any Price</option>
                  <option value="0-1">0-1 SOL</option>
                  <option value="1-10">1-10 SOL</option>
                  <option value="10+">10+ SOL</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-400">Time</label>
                <select 
                  className="w-full mt-1 bg-gray-700 border-gray-600 rounded text-white text-sm p-2"
                  value={filters.timeframe}
                  onChange={(e) => setFilters(f => ({...f, timeframe: e.target.value}))}
                >
                  <option value="all">All Time</option>
                  <option value="24h">Last 24h</option>
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                </select>
              </div>
              <div className="flex items-end">
                <label className="flex items-center space-x-2 text-sm text-gray-400">
                  <input
                    type="checkbox"
                    checked={filters.verified}
                    onChange={(e) => setFilters(f => ({...f, verified: e.target.checked}))}
                    className="rounded"
                  />
                  <span>Verified only</span>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Results */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg animate-pulse">
              <div className="w-12 h-12 bg-gray-700 rounded-lg"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                <div className="h-3 bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-gray-400">{results.length} results found</p>
          <div className="space-y-3">
            {results.map((result) => (
              <div key={result.id} className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 transition-colors cursor-pointer">
                <div className="relative">
                  <img 
                    src={result.image} 
                    alt={result.title}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div className="absolute -top-1 -right-1 text-xs">
                    {getTypeIcon(result.type)}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-white">{result.title}</h4>
                    {result.verified && (
                      <Star className="h-4 w-4 text-blue-400 fill-current" />
                    )}
                    {result.trending && (
                      <Badge variant="secondary" className="bg-red-500/20 text-red-400 text-xs">
                        Trending
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-400">{result.subtitle}</p>
                </div>
                {result.price && (
                  <div className="text-right">
                    <p className="font-semibold text-white">{result.price} SOL</p>
                    <p className="text-xs text-gray-400">Current price</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
