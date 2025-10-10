import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { simplifiedMintNFT, type SimplifiedNFTData } from '@/utils/simplified-nft-minting';
import { 
  Upload, 
  Wand2, 
  Sparkles, 
  Image as ImageIcon, 
  FileText, 
  Tag, 
  DollarSign,
  Eye,
  RefreshCw,
  Check,
  AlertCircle,
  Zap,
  Star,
  TrendingUp
} from 'lucide-react';

interface NFTAttribute {
  trait_type: string;
  value: string;
}

interface NFTMetadata {
  title: string;
  description: string;
  category: string;
  attributes: NFTAttribute[];
  tags: string[];
  priceRange: {
    min: number;
    max: number;
    suggested: number;
  };
  confidence?: number;
}

interface AIAnalysisResult {
  metadata: NFTMetadata;
  reasoning: string;
  alternatives: {
    titles: string[];
    descriptions: string[];
    categories: string[];
  };
}

const NFT_CATEGORIES = [
  'Art', 'Photography', 'Music', 'Gaming', 'Collectibles', 
  'Utility', 'Memes', 'Sports', 'Virtual Worlds', 'Fashion'
];

export function NFTMintingWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [showAIPreview, setShowAIPreview] = useState(false);
  
  // Form data
  const [metadata, setMetadata] = useState<NFTMetadata>({
    title: '',
    description: '',
    category: '',
    attributes: [],
    tags: [],
    priceRange: { min: 0.1, max: 10, suggested: 1 }
  });

  const [additionalContext, setAdditionalContext] = useState('');
  const [newAttribute, setNewAttribute] = useState({ trait_type: '', value: '' });
  const [newTag, setNewTag] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // File upload handling
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setUploadedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setCurrentStep(2);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  // Cleanup preview URL
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // AI Analysis
  const analyzeWithAI = async () => {
    if (!uploadedFile) return;

    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('image', uploadedFile);
      if (additionalContext) {
        formData.append('additionalContext', additionalContext);
      }

      const response = await fetch('/api/ai-metadata/analyze-image', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const result = await response.json();
      setAiAnalysis(result.analysis);
      setShowAIPreview(true);
      
      toast({
        title: "AI Analysis Complete",
        description: "Generated smart metadata suggestions for your NFT!"
      });

    } catch (error) {
      console.error('AI analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Unable to analyze image",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Apply AI suggestions
  const applyAISuggestions = (analysisMetadata: NFTMetadata) => {
    setMetadata(analysisMetadata);
    setCurrentStep(3);
    setShowAIPreview(false);
    
    toast({
      title: "Suggestions Applied",
      description: "AI metadata has been applied to your NFT"
    });
  };

  // Manual metadata input
  const proceedManually = () => {
    setCurrentStep(3);
  };

  // Add attribute
  const addAttribute = () => {
    if (newAttribute.trait_type && newAttribute.value) {
      setMetadata(prev => ({
        ...prev,
        attributes: [...prev.attributes, { ...newAttribute }]
      }));
      setNewAttribute({ trait_type: '', value: '' });
    }
  };

  // Remove attribute
  const removeAttribute = (index: number) => {
    setMetadata(prev => ({
      ...prev,
      attributes: prev.attributes.filter((_, i) => i !== index)
    }));
  };

  // Add tag
  const addTag = () => {
    if (newTag && !metadata.tags.includes(newTag)) {
      setMetadata(prev => ({
        ...prev,
        tags: [...prev.tags, newTag]
      }));
      setNewTag('');
    }
  };

  // Remove tag
  const removeTag = (tag: string) => {
    setMetadata(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  // Mint NFT using the simplified mint flow that talks to our backend
  const mintNFT = async () => {
    if (!uploadedFile) {
      toast({
        title: "Artwork Required",
        description: "Please upload the artwork you want to mint.",
        variant: "destructive"
      });
      return;
    }

    if (!metadata.title.trim()) {
      toast({
        title: "Missing Title",
        description: "Give your NFT a title before minting.",
        variant: "destructive"
      });
      return;
    }

    if (!metadata.description.trim()) {
      toast({
        title: "Missing Description",
        description: "Add a description so collectors know what your NFT is about.",
        variant: "destructive"
      });
      return;
    }

    if (!window.solana?.isConnected || !window.solana.publicKey) {
      toast({
        title: "Wallet Not Connected",
        description: "Connect a wallet to sign the minting transaction.",
        variant: "destructive"
      });
      return;
    }

    const priceValue = Math.max(
      0.01,
      Number.isFinite(metadata.priceRange.suggested)
        ? metadata.priceRange.suggested
        : metadata.priceRange.min
    );
    const formattedAttributes = metadata.attributes
      .map(attr => ({
        trait_type: attr.trait_type.trim(),
        value: attr.value.trim()
      }))
      .filter(attr => attr.trait_type && attr.value);

    const nftData: SimplifiedNFTData = {
      name: metadata.title.trim(),
      description: metadata.description.trim(),
      imageFile: uploadedFile,
      price: priceValue.toFixed(2),
      royalty: "5",
      category: metadata.category || "art",
      attributes: formattedAttributes.length ? formattedAttributes : undefined
    };

    setIsMinting(true);
    try {
      const creatorWallet = window.solana.publicKey!.toString();
      const result = await simplifiedMintNFT(nftData, creatorWallet);

      if (!result.success) {
        toast({
          title: "Minting Failed",
          description: result.error || "Unable to mint NFT right now.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "NFT Minted Successfully!",
        description: `Mint address: ${result.mintAddress ?? "pending"} | Listed for ${priceValue.toFixed(2)} SOL`
      });

      setCurrentStep(1);
      setUploadedFile(null);
      setPreviewUrl('');
      setAiAnalysis(null);
      setMetadata({
        title: '',
        description: '',
        category: '',
        attributes: [],
        tags: [],
        priceRange: { min: 0.1, max: 10, suggested: 1 }
      });
      setAdditionalContext('');
      setNewAttribute({ trait_type: '', value: '' });
      setNewTag('');
      setShowAIPreview(false);
    } catch (error) {
      toast({
        title: "Minting Failed",
        description: error instanceof Error ? error.message : "Unable to mint NFT",
        variant: "destructive"
      });
    } finally {
      setIsMinting(false);
    }
  };

  const getStepIcon = (step: number) => {
    if (step < currentStep) return <Check className="w-4 h-4" />;
    if (step === currentStep) return step.toString();
    return step.toString();
  };

  const getStepStatus = (step: number) => {
    if (step < currentStep) return 'completed';
    if (step === currentStep) return 'current';
    return 'upcoming';
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-green-500 bg-clip-text text-transparent">
          One-Click NFT Minting Wizard
        </h1>
        <p className="text-muted-foreground">
          Upload your artwork and let AI generate perfect metadata for your NFT
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center space-x-4">
        {[1, 2, 3, 4].map((step) => (
          <div key={step} className="flex items-center">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                getStepStatus(step) === 'completed'
                  ? 'bg-green-500 border-green-500 text-white'
                  : getStepStatus(step) === 'current'
                  ? 'border-purple-500 text-purple-500 bg-purple-50 dark:bg-purple-950'
                  : 'border-gray-300 text-gray-300'
              }`}
            >
              {getStepIcon(step)}
            </div>
            {step < 4 && (
              <div
                className={`w-16 h-0.5 ${
                  step < currentStep ? 'bg-green-500' : 'bg-gray-300'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <Card className="border-2 border-purple-200 dark:border-purple-800">
        <CardContent className="p-6">
          {/* Step 1: File Upload */}
          {currentStep === 1 && (
            <div className="text-center space-y-6">
              <div className="space-y-2">
                <Upload className="w-16 h-16 mx-auto text-purple-500" />
                <h2 className="text-2xl font-semibold">Upload Your Artwork</h2>
                <p className="text-muted-foreground">
                  Choose an image file to create your NFT
                </p>
              </div>

              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 cursor-pointer transition-all ${
                  isDragActive
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-950'
                    : 'border-gray-300 hover:border-purple-400'
                }`}
              >
                <input {...getInputProps()} />
                <div className="space-y-2">
                  <ImageIcon className="w-12 h-12 mx-auto text-gray-400" />
                  <p className="text-lg">
                    {isDragActive ? 'Drop your image here' : 'Drag & drop or click to upload'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Supports PNG, JPG, GIF, WebP (max 10MB)
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: AI Analysis */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <Sparkles className="w-16 h-16 mx-auto text-purple-500" />
                <h2 className="text-2xl font-semibold">AI-Powered Analysis</h2>
                <p className="text-muted-foreground">
                  Let our AI analyze your artwork and suggest optimal metadata
                </p>
              </div>

              {previewUrl && (
                <div className="flex justify-center">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-w-sm max-h-64 rounded-lg border shadow-lg"
                  />
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <Label htmlFor="context">Additional Context (Optional)</Label>
                  <Textarea
                    id="context"
                    placeholder="Describe your artwork, inspiration, or any specific details..."
                    value={additionalContext}
                    onChange={(e) => setAdditionalContext(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={analyzeWithAI}
                    disabled={isAnalyzing}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-green-500"
                  >
                    {isAnalyzing ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4 mr-2" />
                        Analyze with AI
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={proceedManually}>
                    Skip AI & Enter Manually
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Metadata Editing */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <FileText className="w-16 h-16 mx-auto text-purple-500" />
                <h2 className="text-2xl font-semibold">Configure Metadata</h2>
                <p className="text-muted-foreground">
                  Review and edit your NFT's metadata
                </p>
              </div>

              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="attributes">Attributes</TabsTrigger>
                  <TabsTrigger value="pricing">Pricing</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                  <div className="grid gap-4">
                    <div>
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        value={metadata.title}
                        onChange={(e) => setMetadata(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Enter NFT title..."
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">Description *</Label>
                      <Textarea
                        id="description"
                        value={metadata.description}
                        onChange={(e) => setMetadata(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe your NFT..."
                        rows={4}
                      />
                    </div>

                    <div>
                      <Label htmlFor="category">Category *</Label>
                      <Select
                        value={metadata.category}
                        onValueChange={(value) => setMetadata(prev => ({ ...prev, category: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {NFT_CATEGORIES.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Tags</Label>
                      <div className="flex gap-2 mb-2">
                        <Input
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          placeholder="Add a tag..."
                          onKeyPress={(e) => e.key === 'Enter' && addTag()}
                        />
                        <Button onClick={addTag} variant="outline" size="sm">
                          <Tag className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {metadata.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="cursor-pointer"
                            onClick={() => removeTag(tag)}
                          >
                            {tag} ×
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="attributes" className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Trait type (e.g., Background)"
                        value={newAttribute.trait_type}
                        onChange={(e) => setNewAttribute(prev => ({ ...prev, trait_type: e.target.value }))}
                      />
                      <Input
                        placeholder="Value (e.g., Blue)"
                        value={newAttribute.value}
                        onChange={(e) => setNewAttribute(prev => ({ ...prev, value: e.target.value }))}
                      />
                      <Button onClick={addAttribute} variant="outline">
                        Add
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {metadata.attributes.map((attr, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 border rounded">
                          <span className="font-medium">{attr.trait_type}:</span>
                          <span>{attr.value}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeAttribute(index)}
                            className="ml-auto"
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="pricing" className="space-y-4">
                  <div className="grid gap-4">
                    <div>
                      <Label htmlFor="suggested-price">Suggested Price (SOL)</Label>
                      <Input
                        id="suggested-price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={metadata.priceRange.suggested}
                        onChange={(e) => setMetadata(prev => ({
                          ...prev,
                          priceRange: { ...prev.priceRange, suggested: parseFloat(e.target.value) || 0 }
                        }))}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="min-price">Min Price (SOL)</Label>
                        <Input
                          id="min-price"
                          type="number"
                          step="0.01"
                          min="0"
                          value={metadata.priceRange.min}
                          onChange={(e) => setMetadata(prev => ({
                            ...prev,
                            priceRange: { ...prev.priceRange, min: parseFloat(e.target.value) || 0 }
                          }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="max-price">Max Price (SOL)</Label>
                        <Input
                          id="max-price"
                          type="number"
                          step="0.01"
                          min="0"
                          value={metadata.priceRange.max}
                          onChange={(e) => setMetadata(prev => ({
                            ...prev,
                            priceRange: { ...prev.priceRange, max: parseFloat(e.target.value) || 0 }
                          }))}
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex gap-3">
                <Button
                  onClick={() => setCurrentStep(4)}
                  disabled={!metadata.title || !metadata.description || !metadata.category}
                  className="flex-1"
                >
                  Continue to Preview
                  <Eye className="w-4 h-4 ml-2" />
                </Button>
                <Button variant="outline" onClick={() => setCurrentStep(2)}>
                  Back
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Preview & Mint */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <Zap className="w-16 h-16 mx-auto text-purple-500" />
                <h2 className="text-2xl font-semibold">Preview & Mint</h2>
                <p className="text-muted-foreground">
                  Review your NFT before minting
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Preview */}
                <Card>
                  <CardHeader>
                    <CardTitle>NFT Preview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {previewUrl && (
                      <img
                        src={previewUrl}
                        alt={metadata.title}
                        className="w-full rounded-lg mb-4"
                      />
                    )}
                    <h3 className="text-xl font-semibold mb-2">{metadata.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{metadata.description}</p>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Category:</span>
                        <Badge variant="outline">{metadata.category}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Price:</span>
                        <span className="font-medium">{metadata.priceRange.suggested} SOL</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Metadata Details */}
                <Card>
                  <CardHeader>
                    <CardTitle>Metadata Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {metadata.attributes.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Attributes</h4>
                        <div className="space-y-1">
                          {metadata.attributes.map((attr, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span>{attr.trait_type}:</span>
                              <span>{attr.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {metadata.tags.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Tags</h4>
                        <div className="flex flex-wrap gap-1">
                          {metadata.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={mintNFT}
                  disabled={isMinting}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-green-500"
                >
                  {isMinting ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Minting NFT...
                    </>
                  ) : (
                    <>
                      <Star className="w-4 h-4 mr-2" />
                      Mint NFT
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={() => setCurrentStep(3)}>
                  Back to Edit
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Preview Dialog */}
      <Dialog open={showAIPreview} onOpenChange={setShowAIPreview}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              AI-Generated Metadata Suggestions
            </DialogTitle>
          </DialogHeader>

          {aiAnalysis && (
            <div className="space-y-4">
              <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                <h3 className="font-semibold mb-2">Main Suggestion</h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Title:</strong> {aiAnalysis.metadata.title}</div>
                  <div><strong>Category:</strong> {aiAnalysis.metadata.category}</div>
                  <div><strong>Suggested Price:</strong> {aiAnalysis.metadata.priceRange.suggested} SOL</div>
                  {aiAnalysis.metadata.confidence && (
                    <div className="flex items-center gap-2">
                      <strong>Confidence:</strong>
                      <div className="flex items-center gap-1">
                        <Progress value={aiAnalysis.metadata.confidence * 100} className="w-20" />
                        <span>{Math.round(aiAnalysis.metadata.confidence * 100)}%</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-sm text-muted-foreground">{aiAnalysis.metadata.description}</p>
              </div>

              <div>
                <h4 className="font-medium mb-2">AI Reasoning</h4>
                <p className="text-sm text-muted-foreground">{aiAnalysis.reasoning}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={() => applyAISuggestions(aiAnalysis.metadata)}
                  className="bg-gradient-to-r from-purple-500 to-green-500"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Apply Suggestions
                </Button>
                <Button variant="outline" onClick={() => setShowAIPreview(false)}>
                  Review More
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
