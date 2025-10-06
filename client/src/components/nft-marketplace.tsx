import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { fetchPublicSolanaNFTs, searchNFTs, filterByCollection, getUniqueCollections, type PublicNFT } from "@/utils/public-solana-api";

interface NFT {
  id: string;
  name: string;
  image: string;
  price: number;
  creator: string;
  description: string;
  collection: string;
  mint?: string;
  owner?: string;
}

export default function NFTMarketplace() {
  const [allNfts, setAllNfts] = useState<PublicNFT[]>([]);
  const [selectedNFT, setSelectedNFT] = useState<PublicNFT | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCollection, setSelectedCollection] = useState("all");
  const [availableCollections, setAvailableCollections] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadRealNFTs();
  }, []);

  const loadRealNFTs = async () => {
    setIsLoading(true);
    try {
      toast({
        title: "Loading Live NFT Data",
        description: "Fetching real Solana NFTs from public APIs...",
        variant: "default"
      });

      const response = await fetch('/api/magic-eden/collections');
      if (!response.ok) throw new Error('Failed to fetch NFTs');
      const data = await response.json();

      // Transform Magic Eden data to our format
      const transformedNFTs = data.collections?.slice(0, 20).map((collection: any) => ({
        id: collection.id,
        name: collection.name,
        image: collection.image,
        price: collection.floorPrice || 0,
        creator: collection.authority,
        description: collection.description || 'No description',
        collection: collection.name,
        mint: collection.mint,
      }));
      setAllNfts(transformedNFTs);
      setAvailableCollections(getUniqueCollections(transformedNFTs));

      toast({
        title: "✅ Live NFT Data Loaded",
        description: `Found ${transformedNFTs.length} real Solana NFTs from popular collections`,
        variant: "default"
      });
    } catch (error) {
      console.error("Error loading NFTs:", error);
      toast({
        title: "API Error",
        description: "Failed to load live NFT data. Please try refreshing.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filter NFTs based on search and collection
  const filteredNFTs = React.useMemo(() => {
    let filtered = allNfts;

    if (searchTerm) {
      filtered = searchNFTs(filtered, searchTerm);
    }

    if (selectedCollection !== "all") {
      filtered = filterByCollection(filtered, selectedCollection);
    }

    return filtered;
  }, [allNfts, searchTerm, selectedCollection]);

  // Add debugging
  React.useEffect(() => {
    console.log('Total NFTs loaded:', allNfts.length);
    console.log('Filtered NFTs:', filteredNFTs.length);
  }, [allNfts, filteredNFTs]);

  const handleRefresh = () => {
    loadRealNFTs();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-green-500 bg-clip-text text-transparent mb-4">
          Live Solana NFT Marketplace
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Discover real NFTs from the Solana blockchain
        </p>
      </div>

      {/* Search and Filter Controls */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search NFTs by name or collection..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
          />
        </div>
        <select
          value={selectedCollection}
          onChange={(e) => setSelectedCollection(e.target.value)}
          className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-600 text-white focus:border-purple-500 focus:outline-none"
        >
          <option value="all">All Collections ({allNfts.length})</option>
          {availableCollections.map(collection => (
            <option key={collection} value={collection.toLowerCase()}>
              {collection}
            </option>
          ))}
        </select>
        <Button
          onClick={handleRefresh}
          disabled={isLoading}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {isLoading ? "Loading..." : "Refresh"}
        </Button>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="bg-gray-800 border-gray-700 animate-pulse">
              <div className="aspect-square bg-gray-700 rounded-t-lg"></div>
              <CardContent className="p-4">
                <div className="h-4 bg-gray-700 rounded mb-2"></div>
                <div className="h-3 bg-gray-700 rounded mb-3 w-2/3"></div>
                <div className="h-6 bg-gray-700 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {filteredNFTs.map((nft, index) => (
            <Card key={nft.mint || `nft-${index}`} className="bg-gray-800 border-gray-700 hover:border-purple-500 transition-all duration-200 cursor-pointer">
              <div 
                className="aspect-square overflow-hidden rounded-t-lg relative"
                onClick={() => setSelectedNFT(nft)}
              >
                <img
                  src={nft.image}
                  alt={nft.name}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `https://via.placeholder.com/400x400/9333ea/ffffff?text=${encodeURIComponent(nft.name)}`;
                  }}
                  loading="lazy"
                />
              </div>

              <CardContent className="p-3 md:p-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="text-sm md:text-lg font-semibold text-white truncate">
                      {nft.name}
                    </h3>
                    <Badge variant="secondary" className="bg-purple-600 text-white text-xs shrink-0">
                      {nft.collection}
                    </Badge>
                  </div>

                  <p className="text-gray-400 text-xs md:text-sm line-clamp-2">
                    {nft.description}
                  </p>

                  <div className="flex justify-between items-center text-xs md:text-sm">
                    <span className="text-gray-400">Creator</span>
                    <span className="text-white font-medium truncate max-w-[100px]">
                      {nft.creator}
                    </span>
                  </div>

                  {nft.mint && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-400">Mint</span>
                      <span className="text-white font-mono">
                        {nft.mint.slice(0, 8)}...
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-2 border-t border-gray-700">
                    <div>
                      <p className="text-purple-400 text-sm md:text-lg font-bold">
                        {typeof nft.price === 'number' ? nft.price.toFixed(2) : nft.price} SOL
                      </p>
                      <p className="text-gray-400 text-xs">
                        ~${(Number(nft.price) * 23.45).toFixed(2)}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        toast({
                          title: "Purchase Initiated",
                          description: `Starting purchase for ${nft.name}`,
                          variant: "default"
                        });
                      }}
                      disabled={isLoading}
                      className="bg-purple-600 hover:bg-purple-700 text-xs md:text-sm"
                    >
                      Buy Now
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* No results message */}
      {!isLoading && filteredNFTs.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-xl text-gray-400 mb-2">No NFTs found</h3>
          <p className="text-gray-500">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
}