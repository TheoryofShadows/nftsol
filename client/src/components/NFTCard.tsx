import React, { useState } from 'react';
import { Card, CardContent, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Heart, 
  ExternalLink, 
  ShoppingCart, 
  Loader2, 
  Star,
  Crown,
  Zap
} from 'lucide-react';

export interface NFTData {
  id: string;
  name: string;
  description: string;
  image: string;
  price: number;
  currency: 'SOL' | 'USDC';
  rarity?: {
    rank: number;
    total: number;
    tier: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  };
  collection?: {
    name: string;
    verified: boolean;
  };
  owner?: {
    address: string;
    name?: string;
  };
  isListed: boolean;
  isLiked?: boolean;
  attributes?: Array<{
    trait_type: string;
    value: string;
    rarity_percentage?: number;
  }>;
}

interface NFTCardProps {
  nft: NFTData;
  onBuy?: (nft: NFTData) => void;
  onLike?: (nft: NFTData) => void;
  onViewDetails?: (nft: NFTData) => void;
  isLoading?: boolean;
  className?: string;
}

const getRarityColor = (tier: string) => {
  switch (tier) {
    case 'Legendary':
      return 'bg-gradient-to-r from-yellow-400 to-orange-500 text-black';
    case 'Epic':
      return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white';
    case 'Rare':
      return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white';
    case 'Common':
    default:
      return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white';
  }
};

const getRarityIcon = (tier: string) => {
  switch (tier) {
    case 'Legendary':
      return <Crown className="h-3 w-3" />;
    case 'Epic':
      return <Star className="h-3 w-3" />;
    case 'Rare':
      return <Zap className="h-3 w-3" />;
    case 'Common':
    default:
      return null;
  }
};

export const NFTCard: React.FC<NFTCardProps> = ({
  nft,
  onBuy,
  onLike,
  onViewDetails,
  isLoading = false,
  className = ''
}) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  const formatPrice = (price: number, currency: string) => {
    return `${price.toFixed(2)} ${currency}`;
  };

  const formatRarityPercentage = (rank: number, total: number) => {
    const percentage = ((total - rank + 1) / total) * 100;
    return `${percentage.toFixed(1)}%`;
  };

  return (
    <Card 
      className={`nft-card group cursor-pointer ${className}`}
      onClick={() => onViewDetails?.(nft)}
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden rounded-t-lg">
        {imageLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-solana-gray/50">
            <Loader2 className="h-8 w-8 animate-spin text-solana-purple" />
          </div>
        )}
        
        {imageError ? (
          <div className="absolute inset-0 flex items-center justify-center bg-solana-gray/50">
            <div className="text-center">
              <div className="text-4xl mb-2">🖼️</div>
              <div className="text-sm text-muted-foreground">Image not available</div>
            </div>
          </div>
        ) : (
          <img
            src={nft.image}
            alt={nft.name}
            className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-110 ${
              imageLoading ? 'opacity-0' : 'opacity-100'
            }`}
            onLoad={handleImageLoad}
            onError={handleImageError}
            loading="lazy"
          />
        )}

        {/* Overlay with actions */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center space-x-2">
          <Button
            size="icon"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              onLike?.(nft);
            }}
            className="h-10 w-10"
          >
            <Heart 
              className={`h-4 w-4 ${
                nft.isLiked ? 'fill-red-500 text-red-500' : 'text-white'
              }`} 
            />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails?.(nft);
            }}
            className="h-10 w-10"
          >
            <ExternalLink className="h-4 w-4 text-white" />
          </Button>
        </div>

        {/* Rarity Badge */}
        {nft.rarity && (
          <div className="absolute top-2 left-2">
            <Badge 
              className={`${getRarityColor(nft.rarity.tier)} text-xs font-semibold px-2 py-1`}
            >
              {getRarityIcon(nft.rarity.tier)}
              <span className="ml-1">{nft.rarity.tier}</span>
            </Badge>
          </div>
        )}

        {/* Collection Badge */}
        {nft.collection && (
          <div className="absolute top-2 right-2">
            <Badge variant="secondary" className="text-xs bg-solana-gray/80 backdrop-blur-sm">
              {nft.collection.verified && <Star className="h-3 w-3 mr-1" />}
              {nft.collection.name}
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <CardContent className="p-4">
        <div className="space-y-2">
          {/* Title */}
          <h3 className="font-semibold text-lg text-white truncate group-hover:text-solana-purple transition-colors">
            {nft.name}
          </h3>

          {/* Description */}
          <p className="text-sm text-muted-foreground line-clamp-2">
            {nft.description}
          </p>

          {/* Rarity Info */}
          {nft.rarity && (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Rank #{nft.rarity.rank}</span>
              <span>{formatRarityPercentage(nft.rarity.rank, nft.rarity.total)}</span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center justify-between">
            <div className="text-lg font-bold text-solana-teal">
              {formatPrice(nft.price, nft.currency)}
            </div>
            {nft.isListed && (
              <Badge variant="outline" className="text-xs border-solana-teal text-solana-teal">
                Listed
              </Badge>
            )}
          </div>
        </div>
      </CardContent>

      {/* Footer with Buy Button */}
      <CardFooter className="p-4 pt-0">
        <Button
          className="w-full solana-gradient hover:opacity-90 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            onBuy?.(nft);
          }}
          disabled={isLoading || !nft.isListed}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : nft.isListed ? (
            <>
              <ShoppingCart className="mr-2 h-4 w-4" />
              Buy Now
            </>
          ) : (
            'Not Listed'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default NFTCard;
