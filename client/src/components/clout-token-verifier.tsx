import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import {
  Coins,
  ExternalLink,
  Copy, 
  Check, 
  RefreshCw, 
  AlertCircle,
  CheckCircle,
  XCircle,
  TrendingUp,
  Wallet
} from 'lucide-react';
import { fetchPlatformWallets, type PlatformWalletMap } from '@/utils/platform-wallets';

interface TokenInfo {
  deployed: boolean;
  mintAddress?: string;
  treasuryTokenAccount?: string;
  totalSupply?: string;
  explorer?: string;
  deployedAt?: string;
  treasuryBalance?: string;
  reason?: string;
}

export function CLOUTTokenVerifier() {
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [walletStatuses, setWalletStatuses] = useState<PlatformWalletMap | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [verificationStep, setVerificationStep] = useState(0);
  const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    checkTokenStatus();
    loadWalletStatuses();
  }, []);

  const loadWalletStatuses = async () => {
    try {
      const wallets = await fetchPlatformWallets(true);
      setWalletStatuses(wallets);
    } catch (error) {
      console.error('Failed to fetch platform wallets', error);
      toast({
        title: 'Wallet lookup failed',
        description: 'Unable to load platform wallet configuration.',
        variant: 'destructive'
      });
    }
  };

  const checkTokenStatus = async () => {
    setIsLoading(true);
    setVerificationStep(1);

    try {
      // Call the backend API to check deployment status
      setVerificationStep(2);
      
      const response = await fetch('/api/clout/status');
      const data = await response.json();
      setVerificationStep(3);
      
      if (data.deployed && data.deploymentInfo) {
        const tokenInfo: TokenInfo = {
          deployed: true,
          mintAddress: data.deploymentInfo.mintAddress,
          treasuryTokenAccount: data.deploymentInfo.treasuryTokenAccount,
          totalSupply: `${data.deploymentInfo.initialSupply.toLocaleString()}`,
          explorer: data.deploymentInfo.explorerUrl,
          deployedAt: data.deploymentInfo.deployedAt,
          treasuryBalance: data.deploymentInfo.initialSupply.toLocaleString()
        };
        setTokenInfo(tokenInfo);
      } else {
        setTokenInfo({
          deployed: false,
          reason: 'not_deployed'
        });
      }
      setVerificationStep(4);

      if (!data.deployed) {
        toast({
          title: "CLOUT Token Not Deployed",
          description: "The CLOUT token has not been deployed to the Solana network yet",
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('Token verification failed:', error);
      toast({
        title: "Verification Failed",
        description: "Unable to verify CLOUT token status",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string | null | undefined, itemKey: string) => {
    if (!text) {
      toast({
        title: 'Address unavailable',
        description: 'Configure the wallet public key in the server environment before copying.',
        variant: 'destructive'
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopiedItems(prev => new Set(prev).add(itemKey));
      
      setTimeout(() => {
        setCopiedItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(itemKey);
          return newSet;
        });
      }, 2000);

      toast({
        title: "Copied!",
        description: "Address copied to clipboard"
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Unable to copy to clipboard",
        variant: "destructive"
      });
    }
  };

  const deployToken = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/clout/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "CLOUT Token Deployed!",
          description: "Token successfully deployed to Solana network"
        });
        
        // Refresh the token status
        await checkTokenStatus();
      } else {
        toast({
          title: "Deployment Failed",
          description: result.error || "Unknown error occurred",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Deployment Error",
        description: "Failed to communicate with deployment service",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (deployed: boolean) => {
    if (deployed) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
    return <XCircle className="w-5 h-5 text-red-500" />;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
          CLOUT Token Verifier
        </h1>
        <p className="text-muted-foreground">
          Verify the deployment status and configuration of the CLOUT token on Solana
        </p>
      </div>

      {/* Verification Progress */}
      {isLoading && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin" />
              Verifying Token Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Progress value={(verificationStep / 4) * 100} />
              <div className="text-sm text-muted-foreground">
                {verificationStep === 1 && "Initializing verification..."}
                {verificationStep === 2 && "Checking deployment files..."}
                {verificationStep === 3 && "Verifying on Solana network..."}
                {verificationStep === 4 && "Finalizing verification..."}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Token Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5" />
            CLOUT Token Status
            <div className="ml-auto">
              <Button onClick={checkTokenStatus} size="sm" disabled={isLoading}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tokenInfo ? (
            <div className="space-y-6">
              {/* Deployment Status */}
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(tokenInfo.deployed)}
                  <div>
                    <div className="font-medium">
                      {tokenInfo.deployed ? 'Token Deployed' : 'Token Not Deployed'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {tokenInfo.deployed 
                        ? 'CLOUT token is live on Solana mainnet' 
                        : 'CLOUT token needs to be deployed'
                      }
                    </div>
                  </div>
                </div>
                <Badge variant={tokenInfo.deployed ? 'default' : 'destructive'}>
                  {tokenInfo.deployed ? 'Live' : 'Not Deployed'}
                </Badge>
              </div>

              {/* Token Information */}
              {tokenInfo.deployed && tokenInfo.mintAddress ? (
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">Mint Address</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Input value={tokenInfo.mintAddress} readOnly className="font-mono text-xs" />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(tokenInfo.mintAddress!, 'mint')}
                        >
                          {copiedItems.has('mint') ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Treasury Account</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Input value={tokenInfo.treasuryTokenAccount} readOnly className="font-mono text-xs" />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(tokenInfo.treasuryTokenAccount!, 'treasury')}
                        >
                          {copiedItems.has('treasury') ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">Total Supply</Label>
                      <div className="text-2xl font-bold text-yellow-500">
                        {tokenInfo.totalSupply} CLOUT
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Treasury Balance</Label>
                      <div className="text-lg font-semibold">
                        {tokenInfo.treasuryBalance || 'Loading...'} CLOUT
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 space-y-4">
                  <AlertCircle className="w-12 h-12 mx-auto text-yellow-500" />
                  <div>
                    <h3 className="font-semibold mb-2">CLOUT Token Not Found</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      The CLOUT token has not been deployed to the Solana network yet. 
                      You'll need to deploy it first before it can be verified.
                    </p>
                    <Button onClick={deployToken} className="bg-gradient-to-r from-yellow-500 to-orange-500">
                      <Coins className="w-4 h-4 mr-2" />
                      Deploy CLOUT Token
                    </Button>
                  </div>
                </div>
              )}

              {/* Explorer Link */}
              {tokenInfo.explorer && (
                <div className="pt-4 border-t">
                  <Button variant="outline" asChild>
                    <a href={tokenInfo.explorer} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View on Solana Explorer
                    </a>
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin text-muted-foreground" />
              <p>Loading token status...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Platform Wallets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Platform Wallets Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {walletStatuses &&
              Object.entries(walletStatuses).map(([key, wallet]) => {
                const label = key
                  .replace(/([A-Z])/g, ' $1')
                  .replace(/^./, (ch) => ch.toUpperCase());
                const copyTarget = wallet.address ?? undefined;

                return (
                  <div key={key} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{label}</h4>
                        <Badge variant={wallet.configured ? 'default' : 'destructive'}>
                          {wallet.configured ? 'Configured' : 'Not Configured'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{wallet.purpose}</p>
                      {!wallet.configured && wallet.placeholderAddress && (
                        <p className="text-xs text-yellow-500 mb-1">
                          Placeholder: {wallet.placeholderAddress}
                        </p>
                      )}
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-background px-2 py-1 rounded">
                          {wallet.address ?? 'Not configured'}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={!copyTarget}
                          onClick={() => copyToClipboard(copyTarget, key)}
                        >
                          {copiedItems.has(key) ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>

      {/* Deployment Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Deployment Instructions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg">
              <h4 className="font-medium mb-2">To Deploy CLOUT Token:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Ensure you have SOL in the treasury wallet for deployment fees</li>
                <li>Run the deployment command: <code className="bg-background px-2 py-1 rounded">npm run deploy:clout</code></li>
                <li>Wait for confirmation on the Solana network</li>
                <li>Verify deployment using this tool</li>
              </ol>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
              <h4 className="font-medium mb-2">After Deployment:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Token will be available for trading and rewards</li>
                <li>Treasury wallet will hold the initial supply</li>
                <li>Platform can distribute CLOUT rewards to users</li>
                <li>Token can be verified on Solana explorers</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

