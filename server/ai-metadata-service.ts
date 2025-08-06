import OpenAI from "openai";
import fs from "fs";
import path from "path";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

export interface NFTMetadataSuggestion {
  title: string;
  description: string;
  category: string;
  attributes: Array<{
    trait_type: string;
    value: string;
  }>;
  tags: string[];
  priceRange: {
    min: number;
    max: number;
    suggested: number;
  };
  confidence: number;
}

export interface AIAnalysisResult {
  metadata: NFTMetadataSuggestion;
  reasoning: string;
  alternatives: {
    titles: string[];
    descriptions: string[];
    categories: string[];
  };
}

export class AIMetadataService {
  /**
   * Analyze an uploaded image and generate comprehensive NFT metadata suggestions
   */
  async analyzeImageForNFT(imagePath: string, additionalContext?: string): Promise<AIAnalysisResult> {
    try {
      // Read and encode the image
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');
      const mimeType = this.getMimeType(imagePath);

      const systemPrompt = `You are an expert NFT metadata curator and digital art analyst. Analyze the provided image and generate comprehensive metadata suggestions for minting as an NFT.

Consider these factors:
- Visual elements, style, and artistic technique
- Color palette and composition
- Subject matter and themes
- Market trends and popular NFT categories
- Potential collector appeal
- Rarity and uniqueness factors

Respond in JSON format with detailed metadata suggestions.`;

      const userPrompt = `Analyze this image for NFT minting and provide detailed metadata suggestions. ${additionalContext ? `Additional context: ${additionalContext}` : ''}

Please provide:
1. A compelling title (3-8 words)
2. An engaging description (50-200 words)
3. The most appropriate category
4. 3-7 meaningful attributes as trait_type/value pairs
5. Relevant tags for discoverability
6. Price range suggestions in SOL
7. Your confidence level (0-1)
8. Reasoning for your suggestions
9. Alternative options

Categories: Art, Photography, Music, Gaming, Collectibles, Utility, Memes, Sports, Virtual Worlds, Fashion

Format as JSON:
{
  "metadata": {
    "title": "string",
    "description": "string", 
    "category": "string",
    "attributes": [{"trait_type": "string", "value": "string"}],
    "tags": ["string"],
    "priceRange": {"min": number, "max": number, "suggested": number},
    "confidence": number
  },
  "reasoning": "string",
  "alternatives": {
    "titles": ["string"],
    "descriptions": ["string"], 
    "categories": ["string"]
  }
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: userPrompt
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`
                }
              }
            ]
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1500,
        temperature: 0.7
      });

      const result = JSON.parse(response.choices[0].message.content!);
      return result as AIAnalysisResult;

    } catch (error) {
      console.error('AI metadata analysis failed:', error);
      throw new Error(`Failed to analyze image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate metadata suggestions based on text input only
   */
  async generateMetadataFromText(concept: string, category?: string): Promise<AIAnalysisResult> {
    try {
      const systemPrompt = `You are an expert NFT metadata curator. Generate comprehensive metadata suggestions for an NFT based on the provided concept or description.

Create compelling, market-ready metadata that would appeal to NFT collectors and fit current market trends.`;

      const userPrompt = `Generate NFT metadata for this concept: "${concept}"
      ${category ? `Preferred category: ${category}` : ''}

      Provide:
      1. A compelling title (3-8 words)
      2. An engaging description (50-200 words)
      3. The most appropriate category
      4. 3-7 meaningful attributes
      5. Relevant tags
      6. Price range suggestions in SOL
      7. Your confidence level
      8. Reasoning
      9. Alternatives

      Categories: Art, Photography, Music, Gaming, Collectibles, Utility, Memes, Sports, Virtual Worlds, Fashion

      Format as JSON with the same structure as image analysis.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1200,
        temperature: 0.7
      });

      const result = JSON.parse(response.choices[0].message.content!);
      return result as AIAnalysisResult;

    } catch (error) {
      console.error('AI text metadata generation failed:', error);
      throw new Error(`Failed to generate metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Enhance existing metadata with AI suggestions
   */
  async enhanceMetadata(existingMetadata: Partial<NFTMetadataSuggestion>, imagePath?: string): Promise<AIAnalysisResult> {
    try {
      let imageAnalysis = "";
      
      if (imagePath && fs.existsSync(imagePath)) {
        const imageBuffer = fs.readFileSync(imagePath);
        const base64Image = imageBuffer.toString('base64');
        const mimeType = this.getMimeType(imagePath);

        const imageResponse = await openai.chat.completions.create({
          model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Briefly describe this image for NFT metadata enhancement (2-3 sentences):"
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${mimeType};base64,${base64Image}`
                  }
                }
              ]
            }
          ],
          max_tokens: 200
        });

        imageAnalysis = imageResponse.choices[0].message.content || "";
      }

      const systemPrompt = `You are an NFT metadata enhancement specialist. Improve and complete the provided metadata while maintaining the creator's intent.`;

      const userPrompt = `Enhance this NFT metadata:

      Current metadata: ${JSON.stringify(existingMetadata, null, 2)}
      ${imageAnalysis ? `Image analysis: ${imageAnalysis}` : ''}

      Improve and complete the metadata while respecting existing content. Provide the same JSON structure as other endpoints.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1200,
        temperature: 0.5
      });

      const result = JSON.parse(response.choices[0].message.content!);
      return result as AIAnalysisResult;

    } catch (error) {
      console.error('AI metadata enhancement failed:', error);
      throw new Error(`Failed to enhance metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate collection-aware metadata suggestions
   */
  async generateCollectionMetadata(
    imagePath: string, 
    collectionName: string, 
    collectionDescription: string,
    existingItems: number = 0
  ): Promise<AIAnalysisResult> {
    try {
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');
      const mimeType = this.getMimeType(imagePath);

      const systemPrompt = `You are an NFT collection specialist. Generate metadata that fits coherently within an existing NFT collection while maintaining uniqueness.`;

      const userPrompt = `Generate metadata for this NFT as part of a collection:

      Collection: "${collectionName}"
      Collection Description: "${collectionDescription}"
      Existing Items: ${existingItems}

      Create metadata that:
      1. Fits the collection theme
      2. Maintains unique value
      3. Uses consistent attribute naming
      4. Considers rarity distribution
      5. Suggests appropriate numbering/naming

      Provide the standard JSON format with enhanced collection context.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: userPrompt
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`
                }
              }
            ]
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1500,
        temperature: 0.6
      });

      const result = JSON.parse(response.choices[0].message.content!);
      return result as AIAnalysisResult;

    } catch (error) {
      console.error('AI collection metadata generation failed:', error);
      throw new Error(`Failed to generate collection metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private getMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp'
    };
    return mimeTypes[ext] || 'image/jpeg';
  }

  /**
   * Validate if OpenAI service is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      if (!process.env.OPENAI_API_KEY) {
        return false;
      }

      // Simple test call
      await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          { role: "user", content: "Hello" }
        ],
        max_tokens: 5
      });

      return true;
    } catch (error) {
      console.error('OpenAI service health check failed:', error);
      return false;
    }
  }
}

export const aiMetadataService = new AIMetadataService();