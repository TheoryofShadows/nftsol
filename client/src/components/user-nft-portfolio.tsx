import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { 
  Wallet, 
  Image as ImageIcon, 
  ExternalLink, 
  RefreshCw, 
  Upload,
  Eye,
  DollarSign
} from "lucide-react";

interface UserNFT {
  id: string;
  mintAddress: string;
  name: string;
  description?: string;
  image: string;
  collection?: string;
  status: 'minted' | 'listed' | 'sold' | 'unlisted';
  price?: string;
  creator: string;
  owner: string;
  createdAt: string;
}

interface UserNFTPortfolioProps {
  walletAddress: string;
  onListNFT?: (nft: UserNFT) => void;
}

export default function UserNFTPortfolio({ walletAddress, onListNFT }: UserNFTPortfolioProps) {
  const [, setLocation] = useLocation();
  const [nfts, setNfts] = useState<UserNFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const fetchUserNFTs = async (showRefreshToast = false) => {
    const isRefresh = showRefreshToast;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const response = await fetch(`/api/nfts/user/${walletAddress}`);
      if (response.ok) {
        const userNFTs = await response.json();
        setNfts(userNFTs);
        
        if (isRefresh) {
          toast({
            title: "Portfolio Updated",
            description: `Found ${userNFTs.length} NFTs in your wallet`,
          });
        }
      } else {
        throw new Error('Failed to fetch NFTs');
      }
    } catch (error) {
      console.error('Failed to fetch user NFTs:', error);
      toast({
        title: "Error Loading Portfolio",
        description: "Failed to load your NFT collection",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleListForSale = async (nft: UserNFT, price: string) => {
    try {
      const response = await fetch('/api/nfts/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mintAddress: nft.mintAddress,
          price: parseFloat(price),
          ownerWallet: walletAddress
        })
      });

      if (response.ok) {
        toast({
          title: "NFT Listed",
          description: `${nft.name} is now listed for ${price} SOL`,
        });
        await fetchUserNFTs();
      } else {
        throw new Error('Failed to list NFT');
      }
    } catch (error) {
      console.error('Failed to list NFT:', error);
      toast({
        title: "Listing Failed",
        description: "Failed to list your NFT for sale",
        variant: "destructive"
      });
    }
  };

  const handleUnlist = async (nft: UserNFT) => {
    try {
      const response = await fetch('/api/nfts/unlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mintAddress: nft.mintAddress,
          ownerWallet: walletAddress
        })
      });

      if (response.ok) {
        toast({
          title: "NFT Unlisted",
          description: `${nft.name} has been removed from marketplace`,
        });
        await fetchUserNFTs();
      }
    } catch (error) {
      console.error('Failed to unlist NFT:', error);
      toast({
        title: "Unlisting Failed",
        description: "Failed to remove NFT from marketplace",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (walletAddress) {
      fetchUserNFTs();
    }
  }, [walletAddress]);

  const getStatusBadge = (status: string) => {
    const variants = {
      minted: 'bg-blue-600/20 text-blue-400 border-blue-600',
      listed: 'bg-green-600/20 text-green-400 border-green-600', 
      sold: 'bg-gray-600/20 text-gray-400 border-gray-600',
      unlisted: 'bg-orange-600/20 text-orange-400 border-orange-600'
    };
    return variants[status as keyof typeof variants] || variants.minted;
  };

  const formatAddress = (address: string) => 
    `${address.slice(0, 4)}...${address.slice(-4)}`;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48 bg-gray-700" />
          <Skeleton className="h-10 w-32 bg-gray-700" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="bg-gray-800 border-gray-700">
              <Skeleton className="h-48 w-full bg-gray-700" />
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-6 w-3/4 bg-gray-700" />
                <Skeleton className="h-4 w-full bg-gray-700" />
                <Skeleton className="h-10 w-full bg-gray-700" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Wallet className="w-6 h-6 mr-3 text-purple-400" />
          <div>
            <h2 className="text-2xl font-bold text-white">My NFT Portfolio</h2>
            <p className="text-gray-400">
              {nfts.length} NFTs • Wallet: {formatAddress(walletAddress)}
            </p>
          </div>
        </div>
        
        <Button
          onClick={() => fetchUserNFTs(true)}
          disabled={refreshing}
          variant="outline"
          className="border-gray-600 text-white hover:bg-gray-700"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Syncing...' : 'Refresh'}
        </Button>
      </div>

      {/* Portfolio Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-center text-center">
              <div className="w-full">
                <ImageIcon className="w-6 h-6 mx-auto mb-2 text-blue-400" />
                <p className="text-sm text-gray-400">Total NFTs</p>
                <p className="text-xl font-bold text-white">{nfts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-center text-center">
              <div className="w-full">
                <DollarSign className="w-6 h-6 mx-auto mb-2 text-green-400" />
                <p className="text-sm text-gray-400">Listed</p>
                <p className="text-xl font-bold text-white">
                  {nfts.filter(nft => nft.status === 'listed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-center text-center">
              <div className="w-full">
                <Upload className="w-6 h-6 mx-auto mb-2 text-purple-400" />
                <p className="text-sm text-gray-400">Created</p>
                <p className="text-xl font-bold text-white">
                  {nfts.filter(nft => nft.creator === walletAddress).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-center text-center">
              <div className="w-full">
                <Eye className="w-6 h-6 mx-auto mb-2 text-yellow-400" />
                <p className="text-sm text-gray-400">Total Value</p>
                <p className="text-xl font-bold text-white">
                  {nfts
                    .filter(nft => nft.price && nft.status === 'listed')
                    .reduce((sum, nft) => sum + parseFloat(nft.price || '0'), 0)
                    .toFixed(2)} SOL
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* NFT Grid */}
      {nfts.length === 0 ? (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-12 text-center">
            <ImageIcon className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <h3 className="text-xl font-semibold text-white mb-2">No NFTs Found</h3>
            <p className="text-gray-400 mb-6">
              You don't have any NFTs in your wallet yet. Create your first NFT to get started!
            </p>
            <Button 
              onClick={() => setLocation('/create')}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Create Your First NFT
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {nfts.map((nft) => (
            <NFTCard 
              key={nft.id}
              nft={nft}
              onList={handleListForSale}
              onUnlist={handleUnlist}
              isOwner={true}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface NFTCardProps {
  nft: UserNFT;
  onList: (nft: UserNFT, price: string) => void;
  onUnlist: (nft: UserNFT) => void;
  isOwner: boolean;
}

function NFTCard({ nft, onList, onUnlist, isOwner }: NFTCardProps) {
  const [showPriceInput, setShowPriceInput] = useState(false);
  const [price, setPrice] = useState('');

  const handleList = () => {
    if (price && parseFloat(price) > 0) {
      onList(nft, price);
      setShowPriceInput(false);
      setPrice('');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      minted: 'bg-blue-600/20 text-blue-400 border-blue-600',
      listed: 'bg-green-600/20 text-green-400 border-green-600', 
      sold: 'bg-gray-600/20 text-gray-400 border-gray-600',
      unlisted: 'bg-orange-600/20 text-orange-400 border-orange-600'
    };
    return variants[status as keyof typeof variants] || variants.minted;
  };

  return (
    <Card className="bg-gray-800 border-gray-700 hover:border-purple-500/50 transition-colors">
      <div className="relative">
        <img 
          src={nft.image} 
          alt={nft.name}
          className="w-full h-48 object-cover rounded-t-lg"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = `data:image/svg+xml;base64,${btoa(`
              <svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
                <rect width="300" height="200" fill="#374151"/>
                <text x="150" y="100" text-anchor="middle" fill="#9CA3AF" font-family="Arial" font-size="14">
                  ${nft.name}
                </text>
              </svg>
            `)}`;
          }}
        />
        <Badge className={`absolute top-2 right-2 ${getStatusBadge(nft.status)}`}>
          {nft.status}
        </Badge>
      </div>
      
      <CardContent className="p-4">
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-white truncate">{nft.name}</h3>
            {nft.description && (
              <p className="text-sm text-gray-400 line-clamp-2">{nft.description}</p>
            )}
            {nft.collection && (
              <p className="text-xs text-purple-400">{nft.collection}</p>
            )}
          </div>

          {nft.status === 'listed' && nft.price && (
            <div className="bg-green-900/20 rounded-lg p-2 border border-green-800/30">
              <p className="text-sm text-gray-400">Listed for</p>
              <p className="text-lg font-bold text-green-400">{nft.price} SOL</p>
            </div>
          )}

          {isOwner && (
            <div className="space-y-2">
              {nft.status === 'minted' || nft.status === 'unlisted' ? (
                showPriceInput ? (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Price in SOL"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                      />
                      <Button onClick={handleList} size="sm" className="bg-green-600 hover:bg-green-700 cursor-pointer select-none">
                        List
                      </Button>
                    </div>
                    <Button 
                      onClick={() => {setShowPriceInput(false); setPrice('');}}
                      variant="outline" 
                      size="sm" 
                      className="w-full border-gray-600 text-gray-400 cursor-pointer select-none"
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button 
                    onClick={() => setShowPriceInput(true)}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white cursor-pointer select-none"
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    List for Sale
                  </Button>
                )
              ) : nft.status === 'listed' ? (
                <Button 
                  onClick={() => onUnlist(nft)}
                  variant="outline"
                  className="w-full border-orange-600 text-orange-400 hover:bg-orange-900/20 cursor-pointer select-none"
                >
                  Remove from Sale
                </Button>
              ) : null}
            </div>
          )}

          <Button 
            onClick={() => window.open(`https://solscan.io/token/${nft.mintAddress}?cluster=devnet`, '_blank')}
            variant="outline"
            size="sm"
            className="w-full border-gray-600 text-gray-400 hover:bg-gray-700 cursor-pointer select-none"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View on Solscan (Devnet)
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
