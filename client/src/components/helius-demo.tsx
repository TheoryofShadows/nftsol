import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Wallet, ExternalLink, CheckCircle, XCircle } from "lucide-react";
import { 
  getHeliusStatus, 
  getHeliusNFTs, 
  getHeliusBalance, 
  getHeliusTransactions,
  HeliusNFT,
  HeliusBalance,
  HeliusTransactionsResponse
} from "@/utils/helius-api";

export default function HeliusDemo() {
  const [walletAddress, setWalletAddress] = useState("3WCkmqcoJZnVbscWSD3xr9tyG1kqnc3MsVPusriKKKad");
  const [activeDemo, setActiveDemo] = useState<string>("");

  // Helius API status check
  const { data: status, isLoading: statusLoading } = useQuery({
    queryKey: ['/api/helius/status'],
    queryFn: getHeliusStatus,
    refetchInterval: 30000 // Check every 30 seconds
  });

  // NFTs query
  const { data: nftsData, isLoading: nftsLoading, refetch: refetchNFTs } = useQuery({
    queryKey: ['/api/helius/nfts', walletAddress],
    queryFn: () => getHeliusNFTs(walletAddress, 1, 10),
    enabled: false
  });

  // Balance query
  const { data: balanceData, isLoading: balanceLoading, refetch: refetchBalance } = useQuery({
    queryKey: ['/api/helius/balance', walletAddress],
    queryFn: () => getHeliusBalance(walletAddress),
    enabled: false
  });

  // Transactions query
  const { data: transactionsData, isLoading: transactionsLoading, refetch: refetchTransactions } = useQuery({
    queryKey: ['/api/helius/transactions', walletAddress],
    queryFn: () => getHeliusTransactions(walletAddress, undefined, 5),
    enabled: false
  });

  const handleDemo = async (demoType: string) => {
    setActiveDemo(demoType);
    
    switch (demoType) {
      case 'nfts':
        await refetchNFTs();
        break;
      case 'balance':
        await refetchBalance();
        break;
      case 'transactions':
        await refetchTransactions();
        break;
    }
  };

  return (
    <div className="space-y-6">
      {/* Helius API Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {statusLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : status?.status === 'operational' ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            Helius API Status
          </CardTitle>
          <CardDescription>
            Enhanced Solana blockchain data integration
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={status.status === 'operational' ? 'default' : 'destructive'}>
                  {status.status}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Block Height</p>
                <p className="font-mono text-sm">{status.currentBlockHeight?.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">API Key Configured</p>
                <Badge variant={status.apiKeyConfigured ? 'default' : 'destructive'}>
                  {status.apiKeyConfigured ? 'Yes' : 'No'}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Checked</p>
                <p className="text-sm">{new Date(status.lastChecked).toLocaleTimeString()}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Demo Interface */}
      <Card>
        <CardHeader>
          <CardTitle>Helius API Demo</CardTitle>
          <CardDescription>
            Test enhanced Solana blockchain data retrieval
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter Solana wallet address..."
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              className="flex-1"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={() => handleDemo('nfts')}
              disabled={!walletAddress || nftsLoading}
              size="sm"
            >
              {nftsLoading && activeDemo === 'nfts' ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              Get NFTs
            </Button>
            
            <Button 
              onClick={() => handleDemo('balance')}
              disabled={!walletAddress || balanceLoading}
              size="sm"
              variant="outline"
            >
              {balanceLoading && activeDemo === 'balance' ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Wallet className="h-4 w-4 mr-2" />
              )}
              Get Balance
            </Button>
            
            <Button 
              onClick={() => handleDemo('transactions')}
              disabled={!walletAddress || transactionsLoading}
              size="sm"
              variant="outline"
            >
              {transactionsLoading && activeDemo === 'transactions' ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <ExternalLink className="h-4 w-4 mr-2" />
              )}
              Get Transactions
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Display */}
      {nftsData && (
        <Card>
          <CardHeader>
            <CardTitle>NFTs Found ({nftsData.total})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {nftsData.nfts.slice(0, 6).map((nft: HeliusNFT) => (
                <div key={nft.id} className="border rounded-lg p-3">
                  <div className="space-y-2">
                    <p className="font-semibold text-sm">
                      {nft.content?.metadata?.name || "Unnamed NFT"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {nft.content?.metadata?.symbol || "No Symbol"}
                    </p>
                    {nft.content?.links?.image && (
                      <img 
                        src={nft.content.links.image} 
                        alt={nft.content.metadata?.name || "NFT"}
                        className="w-full h-32 object-cover rounded"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                    <p className="text-xs font-mono break-all">
                      {nft.id.substring(0, 20)}...
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {balanceData && (
        <Card>
          <CardHeader>
            <CardTitle>Wallet Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">SOL Balance</p>
                <p className="text-2xl font-bold">{balanceData.solBalance.toFixed(4)} SOL</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Lamports</p>
                <p className="font-mono text-sm">{balanceData.balance.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {transactionsData && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions ({transactionsData.count})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {transactionsData.transactions.map((tx) => (
                <div key={tx.signature} className="flex justify-between items-center p-2 border rounded">
                  <div>
                    <p className="font-mono text-xs">
                      {tx.signature.substring(0, 20)}...
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Slot: {tx.slot}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant={tx.err ? 'destructive' : 'default'}>
                      {tx.err ? 'Failed' : 'Success'}
                    </Badge>
                    {tx.blockTime && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(tx.blockTime * 1000).toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}