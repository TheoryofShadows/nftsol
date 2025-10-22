import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { simplifiedMintNFT, type SimplifiedNFTData } from "@/utils/simplified-nft-minting";
import { Upload, Plus, X } from "lucide-react";

interface NFTAttribute {
  trait_type: string;
  value: string;
}

export default function CreateNFT() {
  const [isCreating, setIsCreating] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [attributes, setAttributes] = useState<NFTAttribute[]>([]);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    collection: "",
    royalty: "2.5",
    category: "art"
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addAttribute = () => {
    setAttributes([...attributes, { trait_type: "", value: "" }]);
  };

  const updateAttribute = (index: number, field: 'trait_type' | 'value', value: string) => {
    const newAttributes = [...attributes];
    newAttributes[index][field] = value;
    setAttributes(newAttributes);
  };

  const removeAttribute = (index: number) => {
    setAttributes(attributes.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!window.solana?.isConnected || !window.solana.publicKey) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to create NFTs",
        variant: "destructive"
      });
      return;
    }

    if (!imageFile) {
      toast({
        title: "Image Required",
        description: "Please select an image for your NFT",
        variant: "destructive"
      });
      return;
    }

    if (!formData.name.trim()) {
      toast({
        title: "Name Required", 
        description: "Please enter a name for your NFT",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);

    try {
      const creatorWallet = window.solana.publicKey.toString();

      // Filter out empty attributes
      const validAttributes = attributes.filter(
        attr => attr.trait_type.trim() && attr.value.trim()
      );

      const nftData: SimplifiedNFTData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        imageFile,
        price: "0.01",
        royalty: formData.royalty,
        collection: formData.collection.trim() || undefined,
        category: formData.category,
        attributes: validAttributes.length > 0 ? validAttributes : undefined
      };

      const result = await simplifiedMintNFT(nftData, creatorWallet);

      if (result.success) {
        toast({
          title: "NFT Created Successfully!",
          description: `Your NFT "${formData.name}" has been minted on Solana blockchain`,
        });

        // Reset form
        setFormData({ name: "", description: "", collection: "", royalty: "2.5", category: "art" });
        setImageFile(null);
        setImagePreview(null);
        setAttributes([]);

        // Award CLOUT tokens (handled in minting function)
        toast({
          title: "CLOUT Bonus!",
          description: "You earned 300 CLOUT tokens for creating your first NFT!",
        });

      } else {
        throw new Error(result.error || "Failed to create NFT");
      }

    } catch (error) {
      console.error("NFT creation failed:", error);
      toast({
        title: "NFT Creation Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card className="bg-gray-900/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-2xl bg-gradient-to-r from-purple-400 to-green-400 bg-clip-text text-transparent">
            Create New NFT
          </CardTitle>
          <CardDescription className="text-gray-400">
            Mint your digital artwork on the Solana blockchain with just 0.01 SOL
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Image Upload */}
            <div className="space-y-2">
              <Label htmlFor="image" className="text-white">NFT Image *</Label>
              <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-purple-500 transition-colors">
                {imagePreview ? (
                  <div className="space-y-4">
                    <img 
                      src={imagePreview} 
                      alt="NFT Preview" 
                      className="max-w-full h-48 object-contain mx-auto rounded-lg"
                    />
                    <Button 
                      type="button"
                      variant="outline" 
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                      }}
                      className="text-gray-400 border-gray-600"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Remove Image
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                    <div>
                      <p className="text-gray-300">Click to upload or drag and drop</p>
                      <p className="text-gray-500 text-sm">PNG, JPG, GIF up to 10MB</p>
                    </div>
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="w-full max-w-xs mx-auto"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-white">NFT Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="My Amazing NFT"
                  className="bg-gray-800 border-gray-600 text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="collection" className="text-white">Collection</Label>
                <Input
                  id="collection"
                  value={formData.collection}
                  onChange={(e) => setFormData({...formData, collection: e.target.value})}
                  placeholder="My Collection"
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-white">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Describe your NFT..."
                className="bg-gray-800 border-gray-600 text-white min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="royalty" className="text-white">Creator Royalty (%)</Label>
              <Input
                id="royalty"
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={formData.royalty}
                onChange={(e) => setFormData({...formData, royalty: e.target.value})}
                className="bg-gray-800 border-gray-600 text-white"
              />
              <p className="text-gray-500 text-sm">
                Percentage you'll earn from future sales (0-10%)
              </p>
            </div>

             <div className="space-y-2">
            <Label htmlFor="category" className="text-white">Category</Label>
            <select
              id="category"
              value={formData.category || 'art'}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              className="bg-gray-800 border-gray-600 text-white w-full"
            >
              <option value="art">Art</option>
              <option value="gaming">Gaming</option>
              <option value="music">Music</option>
              <option value="collectibles">Collectibles</option>
              <option value="photography">Photography</option>
            </select>
          </div>

            {/* Attributes */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-white">Attributes</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addAttribute}
                  className="text-purple-400 border-purple-400 hover:bg-purple-400 hover:text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Attribute
                </Button>
              </div>

              {attributes.map((attr, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="Trait (e.g., Color)"
                    value={attr.trait_type}
                    onChange={(e) => updateAttribute(index, 'trait_type', e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                  <Input
                    placeholder="Value (e.g., Blue)"
                    value={attr.value}
                    onChange={(e) => updateAttribute(index, 'value', e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeAttribute(index)}
                    className="text-red-400 border-red-400 hover:bg-red-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Fee Information */}
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
              <h3 className="text-white font-medium mb-2">Minting Fees</h3>
              <div className="space-y-1 text-sm text-gray-400">
                <div className="flex justify-between">
                  <span>Platform Fee:</span>
                  <span>0.01 SOL (~$2)</span>
                </div>
                <div className="flex justify-between">
                  <span>Storage Fee:</span>
                  <span>Free (IPFS)</span>
                </div>
                <div className="flex justify-between">
                  <span>CLOUT Bonus:</span>
                  <span className="text-green-400">+300 CLOUT</span>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isCreating || !imageFile || !formData.name.trim()}
              className="w-full bg-gradient-to-r from-purple-600 to-green-600 hover:from-purple-700 hover:to-green-700 text-white font-medium py-3"
            >
              {isCreating ? "Creating NFT..." : "Create NFT (0.01 SOL)"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

