import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { aiMetadataService } from "../ai-metadata-service";

const router = Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'temp');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `ai-analysis-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

/**
 * Health check for AI service
 */
router.get('/health', async (req, res) => {
  try {
    const isHealthy = await aiMetadataService.healthCheck();
    res.json({
      status: isHealthy ? 'healthy' : 'unavailable',
      service: 'OpenAI GPT-4o',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Analyze uploaded image for NFT metadata suggestions
 */
router.post('/analyze-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const { additionalContext } = req.body;
    const imagePath = req.file.path;

    try {
      const analysis = await aiMetadataService.analyzeImageForNFT(imagePath, additionalContext);
      
      // Clean up temp file
      fs.unlinkSync(imagePath);

      res.json({
        success: true,
        analysis,
        processedAt: new Date().toISOString()
      });

    } catch (analysisError) {
      // Clean up temp file on error
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
      throw analysisError;
    }

  } catch (error) {
    console.error('Image analysis error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Analysis failed'
    });
  }
});

/**
 * Generate metadata from text concept
 */
router.post('/generate-from-text', async (req, res) => {
  try {
    const { concept, category } = req.body;

    if (!concept || typeof concept !== 'string' || concept.trim().length === 0) {
      return res.status(400).json({ error: 'Concept text is required' });
    }

    const analysis = await aiMetadataService.generateMetadataFromText(concept.trim(), category);

    res.json({
      success: true,
      analysis,
      processedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Text generation error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Generation failed'
    });
  }
});

/**
 * Enhance existing metadata
 */
router.post('/enhance-metadata', upload.single('image'), async (req, res) => {
  try {
    const { metadata } = req.body;

    if (!metadata) {
      return res.status(400).json({ error: 'Existing metadata is required' });
    }

    let parsedMetadata;
    try {
      parsedMetadata = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
    } catch {
      return res.status(400).json({ error: 'Invalid metadata format' });
    }

    const imagePath = req.file?.path;

    try {
      const analysis = await aiMetadataService.enhanceMetadata(parsedMetadata, imagePath);
      
      // Clean up temp file if exists
      if (imagePath && fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }

      res.json({
        success: true,
        analysis,
        processedAt: new Date().toISOString()
      });

    } catch (enhanceError) {
      // Clean up temp file on error
      if (imagePath && fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
      throw enhanceError;
    }

  } catch (error) {
    console.error('Metadata enhancement error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Enhancement failed'
    });
  }
});

/**
 * Generate collection-aware metadata
 */
router.post('/generate-collection', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Image file is required for collection metadata' });
    }

    const { collectionName, collectionDescription, existingItems } = req.body;

    if (!collectionName || !collectionDescription) {
      return res.status(400).json({ 
        error: 'Collection name and description are required' 
      });
    }

    const imagePath = req.file.path;

    try {
      const analysis = await aiMetadataService.generateCollectionMetadata(
        imagePath,
        collectionName,
        collectionDescription,
        parseInt(existingItems) || 0
      );
      
      // Clean up temp file
      fs.unlinkSync(imagePath);

      res.json({
        success: true,
        analysis,
        processedAt: new Date().toISOString()
      });

    } catch (analysisError) {
      // Clean up temp file on error
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
      throw analysisError;
    }

  } catch (error) {
    console.error('Collection metadata generation error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Collection generation failed'
    });
  }
});

/**
 * Get metadata suggestions based on category
 */
router.get('/category-suggestions/:category', async (req, res) => {
  try {
    const { category } = req.params;
    
    const suggestions = {
      art: {
        commonAttributes: ['Style', 'Medium', 'Color Palette', 'Technique', 'Era'],
        priceRange: { min: 0.1, max: 10, suggested: 1 },
        tags: ['digital-art', 'artwork', 'creative', 'original']
      },
      photography: {
        commonAttributes: ['Subject', 'Location', 'Camera', 'Style', 'Lighting'],
        priceRange: { min: 0.05, max: 5, suggested: 0.5 },
        tags: ['photography', 'photo', 'capture', 'moment']
      },
      gaming: {
        commonAttributes: ['Rarity', 'Power Level', 'Game', 'Character Type', 'Special Ability'],
        priceRange: { min: 0.1, max: 50, suggested: 2 },
        tags: ['gaming', 'game-asset', 'collectible', 'rare']
      },
      music: {
        commonAttributes: ['Genre', 'Duration', 'Artist', 'Mood', 'Instrument'],
        priceRange: { min: 0.1, max: 20, suggested: 1.5 },
        tags: ['music', 'audio', 'sound', 'track']
      },
      collectibles: {
        commonAttributes: ['Series', 'Number', 'Rarity', 'Edition', 'Theme'],
        priceRange: { min: 0.05, max: 100, suggested: 3 },
        tags: ['collectible', 'limited', 'series', 'rare']
      }
    };

    const categoryData = suggestions[category.toLowerCase() as keyof typeof suggestions];
    
    if (!categoryData) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({
      category,
      suggestions: categoryData
    });

  } catch (error) {
    console.error('Category suggestions error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to get suggestions'
    });
  }
});

export default router;