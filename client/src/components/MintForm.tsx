import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { 
  Upload, 
  Image as ImageIcon, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  ExternalLink,
  Copy,
  X
} from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { toast } from 'react-toastify';

// Form validation schema
const mintSchema = z.object({
  name: z.string().min(1, 'Name is required').max(32, 'Name must be 32 characters or less'),
  symbol: z.string().min(1, 'Symbol is required').max(10, 'Symbol must be 10 characters or less'),
  description: z.string().min(1, 'Description is required').max(500, 'Description must be 500 characters or less'),
  image: z.string().url('Please enter a valid image URL'),
  attributes: z.array(z.object({
    trait_type: z.string().min(1, 'Trait type is required'),
    value: z.string().min(1, 'Value is required')
  })).optional()
});

type MintFormData = z.infer<typeof mintSchema>;

interface MintFormProps {
  className?: string;
}

interface Attribute {
  trait_type: string;
  value: string;
}

const MintForm: React.FC<MintFormProps> = ({ className = '' }) => {
  const { publicKey, connected } = useWallet();
  const [isMinting, setIsMinting] = useState(false);
  const [mintResult, setMintResult] = useState<{
    success: boolean;
    mintAddress?: string;
    transactionSignature?: string;
    error?: string;
  } | null>(null);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [imagePreview, setImagePreview] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue
  } = useForm<MintFormData>({
    resolver: zodResolver(mintSchema)
  });

  const imageUrl = watch('image');

  // Handle image URL change for preview
  React.useEffect(() => {
    if (imageUrl && imageUrl.startsWith('http')) {
      setImagePreview(imageUrl);
    } else {
      setImagePreview('');
    }
  }, [imageUrl]);

  const addAttribute = () => {
    setAttributes([...attributes, { trait_type: '', value: '' }]);
  };

  const removeAttribute = (index: number) => {
    setAttributes(attributes.filter((_, i) => i !== index));
  };

  const updateAttribute = (index: number, field: keyof Attribute, value: string) => {
    const updated = attributes.map((attr, i) => 
      i === index ? { ...attr, [field]: value } : attr
    );
    setAttributes(updated);
  };

  const onSubmit = async (data: MintFormData) => {
    if (!connected || !publicKey) {
      toast.error('Please connect your wallet first');
      return;
    }

    setIsMinting(true);
    setMintResult(null);

    try {
      // Simulate minting process
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Mock successful mint
      const mockMintAddress = `mint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const mockTxSignature = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      setMintResult({
        success: true,
        mintAddress: mockMintAddress,
        transactionSignature: mockTxSignature
      });

      toast.success('NFT minted successfully!');
      reset();
      setAttributes([]);
      setImagePreview('');

    } catch (error) {
      console.error('Minting error:', error);
      setMintResult({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to mint NFT'
      });
      toast.error('Failed to mint NFT');
    } finally {
      setIsMinting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  if (!connected) {
    return (
      <Card className={`glass-effect ${className}`}>
        <CardContent className="p-8 text-center">
          <div className="text-6xl mb-4">🔗</div>
          <h3 className="text-xl font-semibold text-white mb-2">Connect Your Wallet</h3>
          <p className="text-muted-foreground mb-6">
            Please connect your Solana wallet to start minting NFTs
          </p>
          <Button className="solana-gradient">
            Connect Wallet
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Minting Form */}
      <Card className="glass-effect">
        <CardHeader>
          <CardTitle className="text-2xl text-white flex items-center">
            <ImageIcon className="h-6 w-6 mr-2 text-solana-purple" />
            Create New NFT
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Name *</label>
                <Input
                  {...register('name')}
                  placeholder="My Awesome NFT"
                  className="bg-solana-gray/50 border-solana-purple/20 text-white placeholder:text-muted-foreground"
                />
                {errors.name && (
                  <p className="text-sm text-red-400">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Symbol *</label>
                <Input
                  {...register('symbol')}
                  placeholder="MAN"
                  className="bg-solana-gray/50 border-solana-purple/20 text-white placeholder:text-muted-foreground"
                />
                {errors.symbol && (
                  <p className="text-sm text-red-400">{errors.symbol.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Description *</label>
              <textarea
                {...register('description')}
                placeholder="Describe your NFT..."
                rows={3}
                className="w-full px-3 py-2 bg-solana-gray/50 border border-solana-purple/20 rounded-md text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-solana-purple/50"
              />
              {errors.description && (
                <p className="text-sm text-red-400">{errors.description.message}</p>
              )}
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Image URL *</label>
              <div className="space-y-4">
                <Input
                  {...register('image')}
                  placeholder="https://example.com/image.jpg"
                  className="bg-solana-gray/50 border-solana-purple/20 text-white placeholder:text-muted-foreground"
                />
                {errors.image && (
                  <p className="text-sm text-red-400">{errors.image.message}</p>
                )}

                {/* Image Preview */}
                {imagePreview && (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg border border-solana-purple/20"
                      onError={() => setImagePreview('')}
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8"
                      onClick={() => {
                        setImagePreview('');
                        setValue('image', '');
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Attributes */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-white">Attributes (Optional)</label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addAttribute}
                  className="border-solana-purple/20 text-solana-purple hover:bg-solana-purple/10"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Add Attribute
                </Button>
              </div>

              {attributes.map((attr, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <Input
                    placeholder="Trait Type"
                    value={attr.trait_type}
                    onChange={(e) => updateAttribute(index, 'trait_type', e.target.value)}
                    className="bg-solana-gray/50 border-solana-purple/20 text-white placeholder:text-muted-foreground"
                  />
                  <Input
                    placeholder="Value"
                    value={attr.value}
                    onChange={(e) => updateAttribute(index, 'value', e.target.value)}
                    className="bg-solana-gray/50 border-solana-purple/20 text-white placeholder:text-muted-foreground"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removeAttribute(index)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
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

      {/* Mint Result Dialog */}
      {mintResult && (
        <Dialog open={!!mintResult} onOpenChange={() => setMintResult(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                {mintResult.success ? (
                  <>
                    <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                    NFT Minted Successfully!
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 mr-2 text-red-500" />
                    Minting Failed
                  </>
                )}
              </DialogTitle>
            </DialogHeader>
            
            {mintResult.success ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Your NFT has been successfully minted on Solana!
                </p>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-solana-gray/50 rounded">
                    <span className="text-sm font-medium">Mint Address:</span>
                    <div className="flex items-center space-x-2">
                      <code className="text-xs text-solana-teal">
                        {mintResult.mintAddress?.slice(0, 8)}...{mintResult.mintAddress?.slice(-8)}
                      </code>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => copyToClipboard(mintResult.mintAddress!)}
                        className="h-6 w-6"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-2 bg-solana-gray/50 rounded">
                    <span className="text-sm font-medium">Transaction:</span>
                    <div className="flex items-center space-x-2">
                      <code className="text-xs text-solana-teal">
                        {mintResult.transactionSignature?.slice(0, 8)}...{mintResult.transactionSignature?.slice(-8)}
                      </code>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => copyToClipboard(mintResult.transactionSignature!)}
                        className="h-6 w-6"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button
                    className="flex-1 solana-gradient"
                    onClick={() => {
                      // TODO: Open in Solana Explorer
                      window.open(`https://explorer.solana.com/tx/${mintResult.transactionSignature}`, '_blank');
                    }}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View on Explorer
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setMintResult(null)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {mintResult.error || 'An unknown error occurred while minting your NFT.'}
                </p>
                <Button
                  className="w-full"
                  onClick={() => setMintResult(null)}
                >
                  Try Again
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default MintForm;
