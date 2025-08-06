
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Clock, Gavel, TrendingUp } from 'lucide-react';

interface Auction {
  id: string;
  nftId: string;
  title: string;
  image: string;
  currentBid: number;
  reservePrice: number;
  timeLeft: string;
  bidCount: number;
  seller: string;
}

export function NFTAuctions() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate auction data
    setAuctions([
      {
        id: '1',
        nftId: 'nft-1',
        title: 'Rare Digital Art #001',
        image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400',
        currentBid: 15.5,
        reservePrice: 20,
        timeLeft: '2h 15m',
        bidCount: 12,
        seller: 'CryptoArtist'
      },
      {
        id: '2',
        nftId: 'nft-2',
        title: 'Genesis Collection #042',
        image: 'https://images.unsplash.com/photo-1634973357973-f2ed2657db3c?w=400',
        currentBid: 8.2,
        reservePrice: 10,
        timeLeft: '6h 42m',
        bidCount: 8,
        seller: 'DigitalMaster'
      }
    ]);
    setLoading(false);
  }, []);

  const placeBid = (auctionId: string) => {
    // Implement bidding logic
    console.log('Placing bid on auction:', auctionId);
  };

  if (loading) {
    return <div className="text-center py-8">Loading auctions...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Live Auctions</h2>
        <Badge variant="secondary" className="bg-red-500/20 text-red-400">
          <Clock className="h-4 w-4 mr-1" />
          Live Now
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {auctions.map((auction) => (
          <Card key={auction.id} className="bg-gray-800/50 border-gray-700 hover:border-purple-500 transition-colors">
            <CardHeader className="p-4">
              <img 
                src={auction.image} 
                alt={auction.title}
                className="w-full h-48 object-cover rounded-lg"
              />
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div>
                <h3 className="font-semibold text-white truncate">{auction.title}</h3>
                <p className="text-sm text-gray-400">by {auction.seller}</p>
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-400">Current Bid</p>
                  <p className="text-lg font-bold text-green-400">{auction.currentBid} SOL</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">Reserve</p>
                  <p className="text-sm text-yellow-400">{auction.reservePrice} SOL</p>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-400" />
                  <span className="text-sm text-gray-400">{auction.bidCount} bids</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-red-400" />
                  <span className="text-sm text-red-400">{auction.timeLeft}</span>
                </div>
              </div>

              <Button 
                onClick={() => placeBid(auction.id)}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                <Gavel className="h-4 w-4 mr-2" />
                Place Bid
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
