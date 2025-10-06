import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ExternalLink, Wallet, TrendingUp, Activity, Coins, Image } from "lucide-react";
import { getEnhancedWalletInfo } from "@/utils/solscan-api";
import { getEnhancedWalletInfoWithHelius, getHeliusStatus } from "@/utils/helius-api";

interface WalletAnalyticsProps {
  walletAddress: string;
  showAnalytics?: boolean;
}

interface WalletAnalytics {
  balance: number;
  recentTransactions: any[];
  tokens: any[];
  nfts: any[];
  explorerUrl: string;
}

export default function WalletAnalytics({ walletAddress, showAnalytics = true }: WalletAnalyticsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Fetch wallet analytics from Helius API (primary) with Solscan fallback
  const { data: analytics, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/helius/analytics', walletAddress],
    queryFn: async (): Promise<WalletAnalytics> => {
      if (!walletAddress) throw new Error('No wallet address provided');
      
      try {
        // Try Helius API first for enhanced data
        const heliusData = await getEnhancedWalletInfoWithHelius(walletAddress);
        return {
          balance: heliusData.balance,
          recentTransactions: heliusData.recentTransactions,
          tokens: [], // Helius provides NFTs, tokens handled separately
          nfts: heliusData.nftHoldings,
          explorerUrl: heliusData.explorerUrl
        };
      } catch (heliusError) {
        console.log('Helius API failed, falling back to Solscan:', heliusError);
        
        try {
          // Fallback to Solscan API
          const response = await fetch(`/api/solscan/analytics/${walletAddress}`);
          if (response.ok) {
            return await response.json();
          }
          
          // Final fallback to client-side utility
          return await getEnhancedWalletInfo(walletAddress);
        } catch (error) {
          console.error('All wallet analytics sources failed:', error);
          throw error;
        }
      }
    },
    enabled: !!walletAddress && showAnalytics,
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 20000, // Consider data stale after 20 seconds
  });

  if (!showAnalytics || !walletAddress) {
    return null;
  }

  if (isLoading) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin text-purple-400 mr-2" />
          <span className="text-gray-400">Loading wallet analytics...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-red-400 mb-4">Failed to load wallet analytics</p>
            <Button 
              onClick={() => refetch()}
              variant="outline"
              size="sm"
              className="border-gray-600 text-gray-400 hover:bg-gray-700"
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return null;
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-4)}`;
  };

  const formatSOL = (amount: number) => {
    return amount.toFixed(4);
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Wallet className="h-5 w-5 text-purple-400" />
            <CardTitle className="text-white">Wallet Analytics</CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => setIsExpanded(!isExpanded)}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white"
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </Button>
            <Button
              onClick={() => window.open(analytics.explorerUrl, '_blank')}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <CardDescription className="text-gray-400">
          {formatAddress(walletAddress)}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Balance Display */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Coins className="h-4 w-4 text-green-400" />
            <span className="text-gray-400">SOL Balance</span>
          </div>
          <Badge variant="secondary" className="bg-green-600/20 text-green-400 border-green-600">
            {formatSOL(analytics.balance)} SOL
          </Badge>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-lg font-semibold text-white">{analytics.recentTransactions.length}</div>
            <div className="text-xs text-gray-400">Recent Txns</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-white">{analytics.tokens.length}</div>
            <div className="text-xs text-gray-400">Tokens</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-white">{analytics.nfts.length}</div>
            <div className="text-xs text-gray-400">NFTs</div>
          </div>
        </div>

        {/* Expanded Analytics */}
        {isExpanded && (
          <div className="space-y-4 border-t border-gray-700 pt-4">
            {/* Recent Transactions */}
            {analytics.recentTransactions.length > 0 && (
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Activity className="h-4 w-4 text-blue-400" />
                  <span className="text-sm font-medium text-white">Recent Activity</span>
                </div>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {analytics.recentTransactions.slice(0, 5).map((tx: any, index: number) => (
                    <div key={index} className="flex items-center justify-between text-xs bg-gray-700/50 p-2 rounded">
                      <span className="text-gray-400">
                        {new Date(tx.blockTime * 1000).toLocaleDateString()}
                      </span>
                      <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">
                        {tx.status || 'Success'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Token Holdings */}
            {analytics.tokens.length > 0 && (
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Coins className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm font-medium text-white">Token Holdings</span>
                </div>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {analytics.tokens.slice(0, 5).map((token: any, index: number) => (
                    <div key={index} className="flex items-center justify-between text-xs bg-gray-700/50 p-2 rounded">
                      <span className="text-gray-300 truncate">
                        {token.tokenSymbol || token.tokenName || 'Unknown Token'}
                      </span>
                      <span className="text-gray-400">
                        {token.tokenAmount?.uiAmountString || '0'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* NFT Holdings */}
            {analytics.nfts.length > 0 && (
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Image className="h-4 w-4 text-purple-400" />
                  <span className="text-sm font-medium text-white">NFT Collection</span>
                </div>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {analytics.nfts.slice(0, 5).map((nft: any, index: number) => (
                    <div key={index} className="flex items-center justify-between text-xs bg-gray-700/50 p-2 rounded">
                      <span className="text-gray-300 truncate">
                        {nft.tokenName || nft.tokenSymbol || 'Unknown NFT'}
                      </span>
                      <span className="text-gray-400">
                        {nft.collection || 'Uncategorized'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Refresh Button */}
        <div className="text-center pt-2">
          <Button
            onClick={() => refetch()}
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}