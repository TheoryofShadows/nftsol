import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Shield, Wallet, Lock, CheckCircle, AlertCircle, Copy, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WalletConfig {
  publicKey: string;
  privateKey: string;
  isConfigured: boolean;
}

interface WalletSetupState {
  developerWallet: WalletConfig;
  cloutTreasury: WalletConfig;
  marketplaceTreasury: WalletConfig;
  creatorEscrow: WalletConfig;
  cloutTokenMint: string;
  encryptionKey: string;
}

export default function AdminWalletSetup() {
  const { toast } = useToast();
  const [showPrivateKeys, setShowPrivateKeys] = useState<Record<string, boolean>>({});
  const [walletState, setWalletState] = useState<WalletSetupState>({
    developerWallet: {
      publicKey: '3WCkmqcoJZnVbscWSD3xr9tyG1kqnc3MsVPusriKKKad',
      privateKey: '',
      isConfigured: true
    },
    cloutTreasury: {
      publicKey: 'FsoPx1WmXA6FDxYTSULRDko3tKbNG7KxdRTq2icQJGjM',
      privateKey: '',
      isConfigured: true
    },
    marketplaceTreasury: {
      publicKey: 'Aqx6ozBZmH761aEwtpiVcA33eQGLnbXtHPepi1bMfjgs',
      privateKey: '',
      isConfigured: true
    },
    creatorEscrow: {
      publicKey: '3WCkmqcoJZnVbscWSD3xr9tyG1kqnc3MsVPusriKKKad',
      privateKey: '',
      isConfigured: true
    },
    cloutTokenMint: '',
    encryptionKey: ''
  });

  const validateSolanaAddress = (address: string): boolean => {
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  const togglePrivateKeyVisibility = (wallet: string) => {
    setShowPrivateKeys(prev => ({
      ...prev,
      [wallet]: !prev[wallet]
    }));
  };

  const updateWallet = (walletType: keyof WalletSetupState, field: string, value: string) => {
    if (walletType === 'cloutTokenMint' || walletType === 'encryptionKey') {
      setWalletState(prev => ({
        ...prev,
        [walletType]: value
      }));
      return;
    }

    setWalletState(prev => ({
      ...prev,
      [walletType]: {
        ...prev[walletType] as WalletConfig,
        [field]: value,
        isConfigured: field === 'publicKey' ? validateSolanaAddress(value) : (prev[walletType] as WalletConfig).isConfigured
      }
    }));
  };

  const generateEnvConfig = () => {
    const envLines = [
      '# NFTSol Wallet Configuration',
      '',
      '# Platform Wallets',
      `DEVELOPER_WALLET_PUBLIC_KEY=${walletState.developerWallet.publicKey}`,
      `DEVELOPER_WALLET_PRIVATE_KEY=${walletState.developerWallet.privateKey}`,
      '',
      `CLOUT_TREASURY_WALLET=${walletState.cloutTreasury.publicKey}`,
      `CLOUT_TREASURY_PRIVATE_KEY=${walletState.cloutTreasury.privateKey}`,
      '',
      `MARKETPLACE_TREASURY_WALLET=${walletState.marketplaceTreasury.publicKey}`,
      `MARKETPLACE_TREASURY_PRIVATE_KEY=${walletState.marketplaceTreasury.privateKey}`,
      '',
      `CREATOR_ESCROW_WALLET=${walletState.creatorEscrow.publicKey}`,
      `CREATOR_ESCROW_PRIVATE_KEY=${walletState.creatorEscrow.privateKey}`,
      '',
      '# Token Configuration',
      `CLOUT_TOKEN_MINT_ADDRESS=${walletState.cloutTokenMint}`,
      '',
      '# Security Keys',
      `WALLET_ENCRYPTION_KEY=${walletState.encryptionKey}`,
    ].join('\n');

    copyToClipboard(envLines, 'Environment configuration');
  };

  const WalletCard = ({ 
    title, 
    description, 
    wallet, 
    walletKey,
    status 
  }: { 
    title: string;
    description: string;
    wallet: WalletConfig;
    walletKey: string;
    status: 'configured' | 'partial' | 'missing';
  }) => (
    <Card className="border-slate-800 bg-slate-900/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-slate-100 flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              {title}
            </CardTitle>
            <CardDescription className="text-slate-400">
              {description}
            </CardDescription>
          </div>
          <Badge variant={status === 'configured' ? 'default' : status === 'partial' ? 'secondary' : 'destructive'}>
            {status === 'configured' ? (
              <CheckCircle className="h-3 w-3 mr-1" />
            ) : (
              <AlertCircle className="h-3 w-3 mr-1" />
            )}
            {status === 'configured' ? 'Ready' : status === 'partial' ? 'Partial' : 'Missing'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor={`${walletKey}-public`} className="text-slate-300">
            Public Key
          </Label>
          <div className="flex gap-2">
            <Input
              id={`${walletKey}-public`}
              value={wallet.publicKey}
              onChange={(e) => updateWallet(walletKey as keyof WalletSetupState, 'publicKey', e.target.value)}
              placeholder="Enter Solana wallet public key..."
              className="bg-slate-800 border-slate-700 text-slate-100"
            />
            {wallet.publicKey && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(wallet.publicKey, `${title} public key`)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        
        <div>
          <Label htmlFor={`${walletKey}-private`} className="text-slate-300">
            Private Key (Optional - for real transactions)
          </Label>
          <div className="flex gap-2">
            <Input
              id={`${walletKey}-private`}
              type={showPrivateKeys[walletKey] ? 'text' : 'password'}
              value={wallet.privateKey}
              onChange={(e) => updateWallet(walletKey as keyof WalletSetupState, 'privateKey', e.target.value)}
              placeholder="Enter private key for real transactions..."
              className="bg-slate-800 border-slate-700 text-slate-100"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => togglePrivateKeyVisibility(walletKey)}
            >
              {showPrivateKeys[walletKey] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const getWalletStatus = (wallet: WalletConfig): 'configured' | 'partial' | 'missing' => {
    if (wallet.publicKey && validateSolanaAddress(wallet.publicKey)) {
      return wallet.privateKey ? 'configured' : 'partial';
    }
    return 'missing';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-emerald-900/20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Shield className="h-8 w-8 text-purple-400" />
              <h1 className="text-3xl font-bold text-slate-100">
                Wallet Configuration
              </h1>
            </div>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Configure your NFTSol platform wallets for commission handling, CLOUT distribution, 
              and secure transaction processing.
            </p>
          </div>

          {/* Current Status */}
          <Card className="border-slate-800 bg-slate-900/50 mb-8">
            <CardHeader>
              <CardTitle className="text-slate-100 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-400" />
                Platform Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-400">Active</div>
                  <div className="text-sm text-slate-400">Marketplace</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-400">4</div>
                  <div className="text-sm text-slate-400">Real NFTs</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-400">Working</div>
                  <div className="text-sm text-slate-400">Helius API</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-emerald-400">Ready</div>
                  <div className="text-sm text-slate-400">For Deploy</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Wallet Cards */}
          <div className="space-y-6">
            <WalletCard
              title="Developer Commission Wallet"
              description="Receives 2% commission from all marketplace sales"
              wallet={walletState.developerWallet}
              walletKey="developerWallet"
              status={getWalletStatus(walletState.developerWallet)}
            />

            <WalletCard
              title="CLOUT Treasury Wallet"
              description="Manages all CLOUT token rewards and distributions"
              wallet={walletState.cloutTreasury}
              walletKey="cloutTreasury"
              status={getWalletStatus(walletState.cloutTreasury)}
            />

            <WalletCard
              title="Marketplace Treasury"
              description="Handles operational funds and platform reserves"
              wallet={walletState.marketplaceTreasury}
              walletKey="marketplaceTreasury"
              status={getWalletStatus(walletState.marketplaceTreasury)}
            />

            <WalletCard
              title="Creator Escrow Wallet"
              description="Temporary holding for creator royalties and payments"
              wallet={walletState.creatorEscrow}
              walletKey="creatorEscrow"
              status={getWalletStatus(walletState.creatorEscrow)}
            />
          </div>

          <Separator className="my-8 bg-slate-700" />

          {/* Additional Configuration */}
          <div className="space-y-6">
            <Card className="border-slate-800 bg-slate-900/50">
              <CardHeader>
                <CardTitle className="text-slate-100 flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Token & Security Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="clout-token" className="text-slate-300">
                    CLOUT Token Mint Address
                  </Label>
                  <Input
                    id="clout-token"
                    value={walletState.cloutTokenMint}
                    onChange={(e) => updateWallet('cloutTokenMint', '', e.target.value)}
                    placeholder="Enter CLOUT token mint address..."
                    className="bg-slate-800 border-slate-700 text-slate-100"
                  />
                </div>
                
                <div>
                  <Label htmlFor="encryption-key" className="text-slate-300">
                    Wallet Encryption Key
                  </Label>
                  <Input
                    id="encryption-key"
                    type="password"
                    value={walletState.encryptionKey}
                    onChange={(e) => updateWallet('encryptionKey', '', e.target.value)}
                    placeholder="Generate secure encryption key..."
                    className="bg-slate-800 border-slate-700 text-slate-100"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Export Configuration */}
            <Card className="border-slate-800 bg-slate-900/50">
              <CardHeader>
                <CardTitle className="text-slate-100">Export Configuration</CardTitle>
                <CardDescription className="text-slate-400">
                  Generate environment variables for your production deployment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={generateEnvConfig} className="w-full">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Environment Variables
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Security Notice */}
          <Card className="border-yellow-600 bg-yellow-900/20 mt-8">
            <CardHeader>
              <CardTitle className="text-yellow-400 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Security Notice
              </CardTitle>
            </CardHeader>
            <CardContent className="text-yellow-200">
              <ul className="space-y-2 list-disc list-inside">
                <li>Never share private keys publicly or store them in code</li>
                <li>Use hardware wallets for maximum security in production</li>
                <li>The marketplace currently works with public keys only for simulation</li>
                <li>Private keys are only needed for real Solana transactions</li>
                <li>Always backup your wallet keys securely</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}