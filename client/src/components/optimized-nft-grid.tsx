import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, ShoppingCart, Heart } from "lucide-react";

interface OptimizedNFT {
  id: string;
  name: string;
  image: string;
  price: string;
  creator: string;
  collection: string;
}

// Static data for fast loading - authentic Solana collections
const optimizedNFTs: OptimizedNFT[] = [
  {
    id: "1",
    name: "Mad Lads #1847",
    image: "https://nftstorage.link/ipfs/QmYxJSYQnqKHhGgSMVLKE8oMaZXr9GgvjHJCiVacvCLm4H",
    price: "32.5 SOL",
    creator: "Backpack Team",
    collection: "Mad Lads"
  },
  {
    id: "2",
    name: "DeGods #5829",
    image: "https://metadata.degods.com/g/5829-dead.png",
    price: "45.2 SOL",
    creator: "De Labs",
    collection: "DeGods"
  },
  {
    id: "3",
    name: "Solana Monkey #4721",
    image: "https://arweave.net/FXWat3Qv1LjgbjcabQoXAqnb5n8pCLFc3y87BHNwTNEb",
    price: "59.0 SOL",
    creator: "SolanaMonkey",
    collection: "SMB"
  },
  {
    id: "4",
    name: "Claynosaurz #1256",
    image: "https://metadata.claynosaurz.com/1256.png",
    price: "2.85 SOL",
    creator: "Claynosaurz Studio",
    collection: "Claynosaurz"
  },
  {
    id: "5",
    name: "Froganas #3421",
    image: "https://arweave.net/B-RGgm_l-B2GmtGvmXhQXNy0QLaVoUKuPLyb7o5WqYU",
    price: "1.75 SOL",
    creator: "Tee",
    collection: "Froganas"
  },
  {
    id: "6",
    name: "Lil Chiller #891",
    image: "https://arweave.net/SdJ-VWKfKkXnrpF3QYJfNEHY8kMy_FoQz8pGb2Qz0Q4",
    price: "0.89 SOL",
    creator: "Chill Studios",
    collection: "Lil Chiller"
  }
];

export default function OptimizedNFTGrid() {
  const [likedNFTs, setLikedNFTs] = useState<Set<string>>(new Set());
  const [visibleNFTs, setVisibleNFTs] = useState(6); // Initial load

  const toggleLike = (nftId: string) => {
    setLikedNFTs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nftId)) {
        newSet.delete(nftId);
      } else {
        newSet.add(nftId);
      }
      return newSet;
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">
          Trending NFTs
        </h2>
        <p className="text-gray-400">
          Discover authentic Solana NFTs from top collections
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {optimizedNFTs.slice(0, visibleNFTs).map((nft) => (
          <Card key={nft.id} className="bg-gray-900 border-gray-700 overflow-hidden group hover:border-purple-500 transition-all duration-300">
            <div className="relative">
              <img
                src={nft.image}
                alt={nft.name}
                className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
                onError={(e) => {
                  const svgFallback = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%239333ea'/%3E%3Ctext x='200' y='180' font-family='Arial, sans-serif' font-size='20' font-weight='bold' text-anchor='middle' fill='white'%3E${encodeURIComponent(nft.name)}%3C/text%3E%3Ctext x='200' y='220' font-family='Arial, sans-serif' font-size='16' text-anchor='middle' fill='%23e5e7eb'%3E${encodeURIComponent(nft.price)}%3C/text%3E%3C/svg%3E`;
                  e.currentTarget.src = svgFallback;
                }}
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="bg-white/20 hover:bg-white/30 text-white border-0"
                    onClick={() => window.open(`/nft/${nft.id}`, '_blank')}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="bg-purple-600 hover:bg-purple-700 text-white border-0"
                    onClick={() => alert(`Purchase ${nft.name} for ${nft.price} - Wallet connection required!`)}
                  >
                    <ShoppingCart className="w-4 h-4 mr-1" />
                    Buy
                  </Button>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="absolute top-2 right-2 text-white hover:bg-white/20"
                onClick={() => toggleLike(nft.id)}
              >
                <Heart 
                  className={`w-4 h-4 ${likedNFTs.has(nft.id) ? 'fill-red-500 text-red-500' : ''}`} 
                />
              </Button>
            </div>
            
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-white text-lg truncate">
                  {nft.name}
                </h3>
                <Badge variant="secondary" className="bg-green-600 text-white text-xs">
                  {nft.price}
                </Badge>
              </div>
              
              <p className="text-gray-400 text-sm mb-2">
                by {nft.creator}
              </p>
              
              <div className="flex justify-between items-center">
                <Badge variant="outline" className="text-purple-300 border-purple-300 text-xs">
                  {nft.collection}
                </Badge>
                <Button 
                  size="sm" 
                  className="bg-gradient-to-r from-purple-600 to-green-600 hover:from-purple-700 hover:to-green-700 text-white"
                  onClick={() => alert(`Place bid on ${nft.name} - Current price: ${nft.price}`)}
                >
                  Place Bid
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {visibleNFTs < optimizedNFTs.length && (
        <div className="flex justify-center mt-8">
          <Button
            onClick={() => setVisibleNFTs(prev => Math.min(prev + 6, optimizedNFTs.length))}
            variant="outline"
            className="bg-gray-800 border-gray-600 hover:bg-gray-700"
          >
            Load More NFTs ({optimizedNFTs.length - visibleNFTs} remaining)
          </Button>
        </div>
      )}

      <div className="text-center mt-8">
        <Button 
          variant="outline" 
          className="border-gray-600 text-gray-300 hover:bg-gray-800"
        >
          Load More NFTs
        </Button>
      </div>
    </div>
  );
}