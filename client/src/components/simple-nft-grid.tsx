import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Heart, Eye, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface SimpleNFT {
  mintAddress: string;
  name: string;
  description: string;
  image: string;
  creator: string;
  collection: string;
  price: number;
  listed: boolean;
  category: string;
  verified: boolean;
  rarity?: string;
}

export default function SimpleNFTGrid() {
  const [likedNFTs, setLikedNFTs] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  // Fetch NFTs with category and search filtering
  const { data: nfts = [], isLoading, error, refetch } = useQuery({
    queryKey: ['/api/nfts/marketplace', selectedCategory, searchTerm],
    queryFn: async () => {
      console.log("Fetching NFTs...", { selectedCategory, searchTerm });
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (searchTerm) params.append('search', searchTerm);
      
      const response = await fetch(`/api/nfts/marketplace?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }
      const data = await response.json();
      console.log("NFTs fetched:", data.length, "for category:", selectedCategory);
      return data;
    },
    retry: 2,
    staleTime: 30000,
  });

  const handleLike = (mintAddress: string) => {
    setLikedNFTs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(mintAddress)) {
        newSet.delete(mintAddress);
      } else {
        newSet.add(mintAddress);
      }
      return newSet;
    });
  };

  const handleAction = (action: string, nft: SimpleNFT) => {
    toast({
      title: `${action} NFT`,
      description: `${action} ${nft.name} for ${nft.price} SOL`,
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold text-center mb-8">Loading Solana NFTs...</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-800 rounded-xl p-4 animate-pulse">
              <div className="w-full h-64 bg-gray-700 rounded-lg mb-4"></div>
              <div className="h-4 bg-gray-700 rounded mb-2"></div>
              <div className="h-4 bg-gray-700 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold text-red-400 mb-4">Failed to Load NFTs</h2>
        <p className="text-gray-400 mb-4">Error: {error.message}</p>
        <Button onClick={() => window.location.reload()} variant="outline">
          Reload Page
        </Button>
      </div>
    );
  }

  if (!nfts || nfts.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-400 mb-4">No NFTs Available</h2>
        <p className="text-gray-500">Check back later for new listings</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent mb-4">
          NFTSol - Authentic Solana NFTs
        </h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Discover real NFTs from verified Solana collections. {nfts.length} authentic listings available.
        </p>
        
        {/* Search and Filter Controls */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-center mt-8 max-w-4xl mx-auto">
          <input
            type="text"
            placeholder="Search NFTs, creators, collections..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
          />
          
          <div className="flex gap-2 flex-wrap">
            {[
              { id: 'all', label: 'All' },
              { id: 'art', label: 'Art' },
              { id: 'collectibles', label: 'Collectibles' },
              { id: 'gaming', label: 'Gaming' },
              { id: 'music', label: 'Music' }
            ].map((category) => (
              <Button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                className={selectedCategory === category.id 
                  ? "bg-purple-600 hover:bg-purple-700 text-white" 
                  : "border-gray-600 text-gray-400 hover:bg-gray-700 hover:text-white"
                }
              >
                {category.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {nfts.map((nft: SimpleNFT) => (
          <div key={nft.mintAddress} className="group bg-gray-900/50 rounded-xl overflow-hidden hover:transform hover:scale-105 transition-all duration-300 border border-gray-800 hover:border-purple-500">
            <div className="relative">
              <img
                src={nft.image}
                alt={nft.name}
                className="w-full h-64 object-cover"
                loading="lazy"
                onError={(e) => {
                  console.log("Image failed to load:", nft.image);
                  e.currentTarget.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%239333ea'/%3E%3Ctext x='200' y='180' font-family='Arial, sans-serif' font-size='18' font-weight='bold' text-anchor='middle' fill='white'%3E${encodeURIComponent(nft.collection)}%3C/text%3E%3Ctext x='200' y='220' font-family='Arial, sans-serif' font-size='14' text-anchor='middle' fill='%23e5e7eb'%3E${encodeURIComponent(nft.name)}%3C/text%3E%3C/svg%3E`;
                }}
              />
              
              <div className="absolute top-3 right-3">
                <button
                  onClick={() => handleLike(nft.mintAddress)}
                  className={`p-2 rounded-full backdrop-blur-sm transition-colors ${
                    likedNFTs.has(nft.mintAddress)
                      ? 'bg-red-500/80 text-white'
                      : 'bg-black/50 text-gray-300 hover:bg-red-500/80 hover:text-white'
                  }`}
                >
                  <Heart className="h-4 w-4" fill={likedNFTs.has(nft.mintAddress) ? 'currentColor' : 'none'} />
                </button>
              </div>

              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleAction('View', nft)}
                    className="bg-white/20 backdrop-blur-sm hover:bg-white/30"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  {nft.listed && (
                    <Button
                      size="sm"
                      onClick={() => handleAction('Buy', nft)}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <ShoppingCart className="h-4 w-4 mr-1" />
                      Buy
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-white truncate flex-1">{nft.name}</h3>
                {nft.verified && (
                  <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center ml-2">
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}
              </div>
              
              <p className="text-gray-400 text-sm mb-2 truncate">{nft.creator}</p>
              
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-xs text-gray-500">Price</p>
                  <p className="text-lg font-bold text-purple-400">{nft.price.toFixed(2)} SOL</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Rarity</p>
                  <p className="text-sm text-yellow-400">{nft.rarity || 'Common'}</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs px-2 py-1 bg-gray-700 rounded-full text-gray-300 capitalize">
                  {nft.category}
                </span>
                {nft.listed && (
                  <div className="flex items-center text-xs text-green-400">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                    Listed
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center mt-12">
        <p className="text-gray-400">
          Showing {nfts.length} authentic Solana NFTs from top collections
        </p>
      </div>
    </div>
  );
}