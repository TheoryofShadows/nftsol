import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import NFTCard, { NFTData } from './NFTCard';
import { Search, Grid, List, Loader2 } from 'lucide-react';

interface NFTMarketplaceProps {
  searchQuery?: string;
}

// Mock data for demonstration
const mockNFTs: NFTData[] = [
  {
    id: '1',
    name: 'Cosmic Solana #001',
    description: 'A rare cosmic-themed NFT from the Solana universe.',
    image: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=400&h=400&fit=crop',
    price: 2.5,
    currency: 'SOL',
    rarity: {
      rank: 1,
      total: 1000,
      tier: 'Legendary'
    },
    collection: {
      name: 'Cosmic Solana',
      verified: true
    },
    isListed: true,
    isLiked: false
  },
  {
    id: '2',
    name: 'Digital Phoenix #042',
    description: 'Rising from the digital ashes, this phoenix represents rebirth.',
    image: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400&h=400&fit=crop',
    price: 1.8,
    currency: 'SOL',
    rarity: {
      rank: 42,
      total: 500,
      tier: 'Epic'
    },
    collection: {
      name: 'Digital Creatures',
      verified: true
    },
    isListed: true,
    isLiked: true
  },
  {
    id: '3',
    name: 'Neon Dreams #156',
    description: 'A vibrant piece that captures the essence of digital art.',
    image: 'https://images.unsplash.com/photo-1642790104077-9d89d7b0e5f1?w=400&h=400&fit=crop',
    price: 0.9,
    currency: 'SOL',
    rarity: {
      rank: 156,
      total: 1000,
      tier: 'Rare'
    },
    collection: {
      name: 'Neon Collection',
      verified: false
    },
    isListed: true,
    isLiked: false
  },
  {
    id: '4',
    name: 'Abstract Waves #789',
    description: 'Fluid and dynamic, this abstract piece represents innovation.',
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=400&fit=crop',
    price: 0.5,
    currency: 'SOL',
    rarity: {
      rank: 789,
      total: 1000,
      tier: 'Common'
    },
    collection: {
      name: 'Abstract Art',
      verified: false
    },
    isListed: false,
    isLiked: false
  }
];

const NFTMarketplace: React.FC<NFTMarketplaceProps> = ({ searchQuery = '' }) => {
  const [nfts, setNfts] = useState<NFTData[]>([]);
  const [filteredNFTs, setFilteredNFTs] = useState<NFTData[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'price' | 'rarity' | 'newest'>('newest');

  // Load NFTs
  useEffect(() => {
    const loadNFTs = async () => {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setNfts(mockNFTs);
      setLoading(false);
    };

    loadNFTs();
  }, []);

  // Filter and search NFTs
  useEffect(() => {
    let filtered = [...nfts];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(nft =>
        nft.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        nft.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        nft.collection?.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return a.price - b.price;
        case 'rarity':
          return (a.rarity?.rank || 999) - (b.rarity?.rank || 999);
        case 'newest':
        default:
          return parseInt(b.id) - parseInt(a.id);
      }
    });

    setFilteredNFTs(filtered);
  }, [nfts, searchQuery, sortBy]);

  const handleBuy = (nft: NFTData) => {
    console.log('Buying NFT:', nft);
    // TODO: Implement buy logic with Metaplex
  };

  const handleLike = (nft: NFTData) => {
    setNfts(prev => prev.map(item => 
      item.id === nft.id 
        ? { ...item, isLiked: !item.isLiked }
        : item
    ));
  };

  const handleViewDetails = (nft: NFTData) => {
    console.log('Viewing details for:', nft);
    // TODO: Implement NFT details modal
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-solana-purple mx-auto mb-4" />
          <p className="text-muted-foreground">Loading NFTs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and Controls */}
      <Card className="glass-effect">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search NFTs, collections..."
                value={searchQuery}
                className="pl-10 bg-solana-gray/50 border-solana-purple/20 text-white placeholder:text-muted-foreground"
                readOnly
              />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4">
              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-solana-gray/50 border border-solana-purple/20 rounded-md px-3 py-2 text-white text-sm"
              >
                <option value="newest">Newest</option>
                <option value="price">Price: Low to High</option>
                <option value="rarity">Rarity</option>
              </select>

              {/* View Mode */}
              <div className="flex border border-solana-purple/20 rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'solana' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'solana' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">
          {filteredNFTs.length} NFT{filteredNFTs.length !== 1 ? 's' : ''} found
        </p>
      </div>

      {/* NFT Grid */}
      {filteredNFTs.length === 0 ? (
        <Card className="glass-effect">
          <CardContent className="p-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-white mb-2">No NFTs found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search criteria or filters
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className={
          viewMode === 'grid' 
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            : "space-y-4"
        }>
          {filteredNFTs.map((nft) => (
            <NFTCard
              key={nft.id}
              nft={nft}
              onBuy={handleBuy}
              onLike={handleLike}
              onViewDetails={handleViewDetails}
              className={viewMode === 'list' ? 'flex flex-row' : ''}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default NFTMarketplace;
