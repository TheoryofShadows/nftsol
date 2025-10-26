import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Image as ImageIcon, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const MintForm = () => {
  const [isMinting, setIsMinting] = useState(false);
  const [mintResult, setMintResult] = useState<{
    success: boolean;
    mintAddress?: string;
    error?: string;
  } | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    description: '',
    image: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsMinting(true);
    setMintResult(null);

    try {
      // Simulate minting process
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Mock successful mint
      const mockMintAddress = `mint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      setMintResult({
        success: true,
        mintAddress: mockMintAddress
      });

      // Reset form
      setFormData({ name: '', symbol: '', description: '', image: '' });

    } catch (error) {
      setMintResult({
        success: false,
        error: 'Failed to mint NFT'
      });
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Minting Form */}
      <Card className="glass-effect">
        <CardHeader>
          <CardTitle className="text-2xl text-white flex items-center">
            <ImageIcon className="h-6 w-6 mr-2 text-solana-purple" />
            Create New NFT
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Name *</label>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="My Awesome NFT"
                  className="bg-solana-gray/50 border-solana-purple/20 text-white placeholder:text-muted-foreground"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Symbol *</label>
                <Input
                  name="symbol"
                  value={formData.symbol}
                  onChange={handleInputChange}
                  placeholder="MAN"
                  className="bg-solana-gray/50 border-solana-purple/20 text-white placeholder:text-muted-foreground"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe your NFT..."
                rows={3}
                className="w-full px-3 py-2 bg-solana-gray/50 border border-solana-purple/20 rounded-md text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-solana-purple/50"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Image URL *</label>
              <Input
                name="image"
                value={formData.image}
                onChange={handleInputChange}
                placeholder="https://example.com/image.jpg"
                className="bg-solana-gray/50 border-solana-purple/20 text-white placeholder:text-muted-foreground"
                required
              />
            </div>

            {/* Mint Button */}
            <Button
              type="submit"
              disabled={isMinting}
              className="w-full solana-gradient hover:opacity-90 transition-opacity"
            >
              {isMinting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Minting NFT...
                </>
              ) : (
                <>
                  <ImageIcon className="mr-2 h-4 w-4" />
                  Mint NFT (0.01 SOL)
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Mint Result */}
      {mintResult && (
        <Card className="glass-effect">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              {mintResult.success ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-lg font-semibold text-white">NFT Minted Successfully!</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <span className="text-lg font-semibold text-white">Minting Failed</span>
                </>
              )}
            </div>
            
            {mintResult.success ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Your NFT has been successfully minted on Solana!
                </p>
                <div className="p-2 bg-solana-gray/50 rounded">
                  <span className="text-sm font-medium">Mint Address: </span>
                  <code className="text-xs text-solana-teal">
                    {mintResult.mintAddress}
                  </code>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {mintResult.error || 'An unknown error occurred while minting your NFT.'}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MintForm;
