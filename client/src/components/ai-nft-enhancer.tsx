
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Sparkles, Wand2, Upload, Download, Eye, Palette, FileText, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AIEnhancementResult {
  originalImage: string;
  enhancedImage: string;
  improvementType: string;
  qualityScore: number;
  metadata: {
    title: string;
    description: string;
    tags: string[];
    rarity: string;
    style: string;
  };
}

export default function AINFTEnhancer() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [enhancementResult, setEnhancementResult] = useState<AIEnhancementResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState("enhance");
  const [customPrompt, setCustomPrompt] = useState("");
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const enhanceImage = async (enhancementType: string) => {
    if (!selectedFile) {
      toast({
        title: "No image selected",
        description: "Please select an image to enhance",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('enhancementType', enhancementType);
      formData.append('customPrompt', customPrompt);

      const response = await fetch('/api/ai/enhance-nft', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        setEnhancementResult(result);
        toast({
          title: "Enhancement Complete",
          description: `Your NFT has been enhanced with ${enhancementType}`,
        });
      } else {
        throw new Error('Enhancement failed');
      }
    } catch (error) {
      console.error('Enhancement error:', error);
      toast({
        title: "Enhancement Failed",
        description: "Failed to enhance your NFT. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const generateMetadata = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('image', selectedFile);

      const response = await fetch('/api/ai/generate-metadata', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const metadata = await response.json();
        setEnhancementResult(prev => ({
          ...prev!,
          metadata
        }));
        toast({
          title: "Metadata Generated",
          description: "AI has analyzed your NFT and generated metadata",
        });
      }
    } catch (error) {
      console.error('Metadata generation error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-purple-400" />
            AI NFT Enhancer
          </h2>
          <p className="text-gray-400 mt-2">Transform your NFTs with AI-powered enhancement tools</p>
        </div>
        <Badge variant="secondary" className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 text-purple-400 border-purple-600">
          Beta Feature
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-gray-800 border-gray-700">
          <TabsTrigger value="enhance" className="data-[state=active]:bg-purple-600">
            <Wand2 className="h-4 w-4 mr-2" />
            Enhance
          </TabsTrigger>
          <TabsTrigger value="style" className="data-[state=active]:bg-blue-600">
            <Palette className="h-4 w-4 mr-2" />
            Style Transfer
          </TabsTrigger>
          <TabsTrigger value="metadata" className="data-[state=active]:bg-green-600">
            <FileText className="h-4 w-4 mr-2" />
            Metadata AI
          </TabsTrigger>
          <TabsTrigger value="background" className="data-[state=active]:bg-pink-600">
            <Eye className="h-4 w-4 mr-2" />
            Background
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          {/* File Upload Section */}
          <Card className="bg-gray-800 border-gray-700 mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-600 rounded-lg p-8 hover:border-purple-500 transition-colors">
                {previewUrl ? (
                  <div className="text-center">
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      className="max-w-xs max-h-48 rounded-lg mb-4 mx-auto"
                    />
                    <p className="text-sm text-gray-400 mb-4">{selectedFile?.name}</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="h-12 w-12 text-gray-400 mb-4 mx-auto" />
                    <p className="text-gray-300 mb-2">Drop your NFT image here or click to browse</p>
                    <p className="text-sm text-gray-500">Supports PNG, JPG, GIF (max 10MB)</p>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="nft-upload"
                />
                <label htmlFor="nft-upload">
                  <Button variant="outline" className="mt-4 cursor-pointer">
                    {previewUrl ? "Change Image" : "Select Image"}
                  </Button>
                </label>
              </div>
            </CardContent>
          </Card>

          <TabsContent value="enhance">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { type: "upscale", title: "AI Upscaling", desc: "Increase resolution by 4x", icon: "📈" },
                { type: "denoise", title: "Noise Reduction", desc: "Remove artifacts and noise", icon: "✨" },
                { type: "sharpen", title: "AI Sharpening", desc: "Enhance image clarity", icon: "🔍" },
                { type: "colorize", title: "Color Enhancement", desc: "Boost colors and vibrancy", icon: "🎨" }
              ].map((enhancement) => (
                <Card key={enhancement.type} className="bg-gray-800 border-gray-700 hover:border-purple-500 transition-colors cursor-pointer">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl mb-2">{enhancement.icon}</div>
                    <h3 className="font-semibold text-white mb-1">{enhancement.title}</h3>
                    <p className="text-xs text-gray-400 mb-3">{enhancement.desc}</p>
                    <Button 
                      size="sm" 
                      className="w-full bg-purple-600 hover:bg-purple-700"
                      onClick={() => enhanceImage(enhancement.type)}
                      disabled={!selectedFile || isProcessing}
                    >
                      {isProcessing ? "Processing..." : "Enhance"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="style">
            <div className="space-y-4">
              <Textarea
                placeholder="Describe the artistic style you want to apply (e.g., 'cyberpunk neon style', 'watercolor painting', 'pixel art')..."
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
              />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  "Cyberpunk", "Watercolor", "Oil Painting", "Pixel Art",
                  "Anime Style", "Digital Art", "Realistic", "Abstract"
                ].map((style) => (
                  <Button
                    key={style}
                    variant="outline"
                    className="border-gray-600 hover:border-purple-500"
                    onClick={() => setCustomPrompt(`Transform to ${style.toLowerCase()} style`)}
                  >
                    {style}
                  </Button>
                ))}
              </div>
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={() => enhanceImage('style-transfer')}
                disabled={!selectedFile || !customPrompt || isProcessing}
              >
                Apply Style Transfer
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="metadata">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  AI-Generated Metadata
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700 mb-4"
                  onClick={generateMetadata}
                  disabled={!selectedFile || isProcessing}
                >
                  Generate Smart Metadata
                </Button>
                
                {enhancementResult?.metadata && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-300">AI-Generated Title</label>
                      <Input 
                        value={enhancementResult.metadata.title} 
                        className="bg-gray-900 border-gray-600 text-white mt-1"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-300">AI-Generated Description</label>
                      <Textarea 
                        value={enhancementResult.metadata.description}
                        className="bg-gray-900 border-gray-600 text-white mt-1"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-300">AI-Generated Tags</label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {enhancementResult.metadata.tags.map((tag) => (
                          <Badge key={tag} variant="secondary">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="background">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button 
                className="h-20 bg-pink-600 hover:bg-pink-700"
                onClick={() => enhanceImage('remove-background')}
                disabled={!selectedFile || isProcessing}
              >
                Remove Background
              </Button>
              <Button 
                className="h-20 bg-pink-600 hover:bg-pink-700"
                onClick={() => enhanceImage('replace-background')}
                disabled={!selectedFile || isProcessing}
              >
                Replace Background
              </Button>
            </div>
          </TabsContent>

          {/* Enhancement Results */}
          {enhancementResult && (
            <Card className="bg-gray-800 border-gray-700 mt-6">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Enhancement Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-300 mb-2">Original</h4>
                    <img 
                      src={enhancementResult.originalImage} 
                      alt="Original" 
                      className="w-full rounded-lg border border-gray-600"
                    />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-300 mb-2">Enhanced</h4>
                    <img 
                      src={enhancementResult.enhancedImage} 
                      alt="Enhanced" 
                      className="w-full rounded-lg border border-gray-600"
                    />
                  </div>
                </div>
                
                <div className="mt-6 flex justify-between items-center">
                  <Badge className="bg-green-600">
                    Quality Score: {enhancementResult.qualityScore}%
                  </Badge>
                  <div className="flex gap-2">
                    <Button variant="outline" className="border-gray-600">
                      Download Enhanced
                    </Button>
                    <Button className="bg-purple-600 hover:bg-purple-700">
                      Use for NFT Creation
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </Tabs>
    </div>
  );
}
