import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, Camera, Sparkles, DollarSign } from "lucide-react";
import { simplifiedMintNFT, type SimplifiedNFTData } from "@/utils/simplified-nft-minting";
import PricingSuggestions from "./pricing-suggestions";

export default function SimplifiedNFTCreator() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState<SimplifiedNFTData>({
    name: "",
    description: "",
    imageFile: null,
    price: "1.0",
    royalty: "5"
  });

  const [isCreating, setIsCreating] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { toast } = useToast();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, imageFile: file }));

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter an NFT name",
        variant: "destructive"
      });
      return;
    }

    if (!formData.description.trim()) {
      toast({
        title: "Missing Information", 
        description: "Please enter a description for your NFT",
        variant: "destructive"
      });
      return;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast({
        title: "Missing Information",
        description: "Please enter a valid price greater than 0",
        variant: "destructive"
      });
      return;
    }

    if (!formData.imageFile) {
      toast({
        title: "Missing Information",
        description: "Please upload an image for your NFT",
        variant: "destructive"
      });
      return;
    }

    if (!window.solana?.isConnected || !window.solana.publicKey) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to create NFTs",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);
    try {
      const creatorWallet = window.solana.publicKey.toString();
      const result = await simplifiedMintNFT(formData, creatorWallet);

      if (result.success) {
        toast({
          title: "NFT Created Successfully!",
          description: `Your NFT "${formData.name}" has been minted and listed for ${formData.price} SOL. You earned 200 CLOUT tokens!`,
        });

        // Reset form
        setFormData({
          name: "",
          description: "",
          imageFile: null,
          price: "1.0",
          royalty: "5"
        });
        setImagePreview(null);

        // Navigate to marketplace
        setTimeout(() => {
          setLocation('/marketplace');
        }, 2000);

      } else {
        toast({
          title: "Creation Failed",
          description: result.error || "Failed to create NFT. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Creation Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const mintingFee = 0.01; // SOL
  const priceNumber = parseFloat(formData.price) || 0;
  const royaltyPercent = parseFloat(formData.royalty) || 5;
  const potentialEarnings = priceNumber * (100 - 2.5) / 100; // 97.5% after platform fee
  const cloutReward = 200; // CLOUT tokens for minting

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">
          <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-green-400 bg-clip-text text-transparent">
            Create Your NFT
          </span>
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Mint and list your digital artwork on Solana with industry-leading 95.5% seller rates
        </p>
        <div className="flex items-center justify-center space-x-4 mt-4">
          <Badge variant="secondary" className="bg-green-600/20 text-green-400 border-green-600">
            Only 0.01 SOL to mint
          </Badge>
          <Badge variant="secondary" className="bg-purple-600/20 text-purple-400 border-purple-600">
            95.5% goes to you
          </Badge>
          <Badge variant="secondary" className="bg-yellow-600/20 text-yellow-400 border-yellow-600">
            200 CLOUT bonus
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Creation Form */}
        <Card className="bg-gray-800 border-gray-700 lg:col-span-2 gpu-accelerated">
          <CardHeader>
            <CardTitle className="flex items-center text-white">
              <Sparkles className="w-5 h-5 mr-2 text-purple-400" />
              NFT Details
            </CardTitle>
            <CardDescription className="text-gray-400">
              Fill in your NFT information to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Image Upload */}
              <div className="space-y-2">
                <Label className="text-white">Artwork Image *</Label>
                <div className="relative border-2 border-dashed border-gray-600 rounded-lg hover:border-purple-500 transition-colors">
                  {imagePreview ? (
                    <div className="relative p-4">
                      <img
                        src={imagePreview}
                        alt="NFT Preview"
                        className="w-full h-48 object-cover rounded-lg mb-4"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setImagePreview(null);
                          setFormData(prev => ({ ...prev, imageFile: null }));
                        }}
                        className="absolute top-6 right-6 bg-black/70 text-white border-white/20 hover:bg-black/90"
                      >
                        Change
                      </Button>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="p-8 text-center pointer-events-none">
                        <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                        <p className="text-white font-medium mb-2">Upload your artwork</p>
                        <p className="text-gray-400 text-sm">PNG, JPG, or GIF up to 10MB</p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        style={{ zIndex: 20 }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Name */}
              <div className="space-y-3">
                <Label htmlFor="nft-name" className="text-white text-sm font-medium">NFT Name *</Label>
                <Input
                  id="nft-name"
                  type="text"
                  placeholder="My Amazing Artwork"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 h-12 touch-manipulation"
                  autoComplete="off"
                />
              </div>

              {/* Description */}
              <div className="space-y-3">
                <Label htmlFor="nft-description" className="text-white text-sm font-medium">Description *</Label>
                <Textarea
                  id="nft-description"
                  placeholder="Describe your NFT..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 touch-manipulation resize-none"
                  autoComplete="off"
                />
              </div>

              {/* Price and Royalty */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-white">List Price (SOL) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="1.0"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="royalty" className="text-white">Royalty (%)</Label>
                  <Input
                    id="royalty"
                    type="number"
                    min="0"
                    max="10"
                    step="0.5"
                    placeholder="5"
                    value={formData.royalty}
                    onChange={(e) => setFormData(prev => ({ ...prev, royalty: e.target.value }))}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  />
                </div>
              </div>

              {/* Create Button */}
              <div className="flex justify-center pt-4">
                <Button
                  type="submit"
                  disabled={isCreating}
                  className="w-full max-w-md bg-gradient-to-r from-purple-600 to-green-600 hover:from-purple-700 hover:to-green-700 text-white font-medium py-3 text-lg"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      <span className="bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
                        Creating NFT...
                      </span>
                    </>
                  ) : (
                    <>
                      <Camera className="w-5 h-5 mr-2" />
                      <span className="bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
                        Create & List NFT
                      </span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Pricing Assistant */}
        <div className="space-y-6">
          <PricingSuggestions 
            onPriceSelect={(price) => setFormData(prev => ({ ...prev, price }))}
            nftName={formData.name}
            nftDescription={formData.description}
          />

          {/* Earnings Breakdown */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <DollarSign className="w-5 h-5 mr-2 text-green-400" />
                Earnings Breakdown
              </CardTitle>
              <CardDescription className="text-gray-400">
                See exactly what you'll earn
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
                  <span className="text-gray-300">List Price</span>
                  <span className="text-white font-medium">{priceNumber.toFixed(2)} SOL</span>
                </div>

                <div className="flex justify-between items-center p-3 bg-red-900/20 rounded-lg border border-red-800/30">
                  <span className="text-gray-300">Platform Fee (2%)</span>
                  <span className="text-red-400">-{(priceNumber * 0.02).toFixed(4)} SOL</span>
                </div>

                <div className="flex justify-between items-center p-3 bg-orange-900/20 rounded-lg border border-orange-800/30">
                  <span className="text-gray-300">Creator Royalty ({royaltyPercent}%)</span>
                  <span className="text-orange-400">-{(priceNumber * royaltyPercent / 100).toFixed(4)} SOL</span>
                </div>

                <div className="flex justify-between items-center p-3 bg-green-900/20 rounded-lg border border-green-800/30">
                  <span className="text-white font-medium">You Receive</span>
                  <span className="text-green-400 font-bold text-lg">{(priceNumber * 0.955).toFixed(4)} SOL</span>
                </div>
              </div>

              <div className="text-center py-3 border-t border-gray-600">
                <p className="text-sm text-gray-400">Minting Fee</p>
                <p className="text-purple-400 font-medium">{mintingFee} SOL (one-time)</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-yellow-900/20 border-yellow-700">
            <CardHeader>
              <CardTitle className="text-yellow-400">CLOUT Token Rewards</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Minting Bonus</span>
                  <span className="text-yellow-400 font-bold">+{cloutReward} CLOUT</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">First Sale Bonus</span>
                  <span className="text-yellow-400 font-bold">+300 CLOUT</span>
                </div>
                <div className="text-xs text-gray-400 mt-3">
                  CLOUT tokens can be used for platform rewards, exclusive features, and community governance
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-purple-900/20 border-purple-700">
            <CardHeader>
              <CardTitle className="text-purple-400">Why Choose NFTSol?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-center text-gray-300">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
                  95.5% seller rate (vs 92.5% on OpenSea)
                </div>
                <div className="flex items-center text-gray-300">
                  <span className="w-2 h-2 bg-purple-400 rounded-full mr-3"></span>
                  Fast Solana blockchain (low fees)
                </div>
                <div className="flex items-center text-gray-300">
                  <span className="w-2 h-2 bg-yellow-400 rounded-full mr-3"></span>
                  CLOUT token rewards for activity
                </div>
                <div className="flex items-center text-gray-300">
                  <span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>
                  IPFS decentralized storage
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
