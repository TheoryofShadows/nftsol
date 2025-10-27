import express from "express";
import multer from "multer";
import { SimpleIPFSService } from '../services/simpleIPFSService';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only allow image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed') as any, false);
    }
  }
});

// POST /api/upload - Upload file to IPFS
router.post("/", upload.single('file') as any, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: "No file provided" 
      });
    }

    console.log(`📤 Uploading file: ${req.file.originalname} (${req.file.size} bytes)`);

    // Initialize simple IPFS service
    const ipfsService = new SimpleIPFSService();

    // Upload image to IPFS
    const result = await ipfsService.uploadFile(req.file.buffer, req.file.originalname);

    if (result.success) {
      console.log(`✅ File uploaded successfully: ${result.hash}`);
      res.json({
        success: true,
        ipfsUrl: result.ipfsUrl,
        hash: result.hash
      });
    } else {
      throw new Error(result.error || 'Upload failed');
    }

  } catch (error: any) {
    console.error('❌ File upload failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Upload failed'
    });
  }
});

// POST /api/upload/metadata - Upload metadata to IPFS
router.post("/metadata", async (req, res) => {
  try {
    const { name, description, image, attributes, collection, creator } = req.body;

    if (!name || !description || !image) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: name, description, image"
      });
    }

    console.log(`📤 Uploading metadata for: ${name}`);

    // Initialize simple IPFS service
    const ipfsService = new SimpleIPFSService();

    // Prepare metadata
    const metadata = {
      name,
      description,
      image,
      attributes: attributes || [],
      collection,
      creator,
      external_url: `https://nftsol.app/nft/${name.toLowerCase().replace(/\s+/g, '-')}`,
      seller_fee_basis_points: 250
    };

    // Upload metadata to IPFS
    const result = await ipfsService.uploadJSON(metadata, `nft-metadata-${name}-${Date.now()}`);

    if (result.success) {
      console.log(`✅ Metadata uploaded successfully: ${result.hash}`);
      res.json({
        success: true,
        metadataUrl: result.ipfsUrl,
        hash: result.hash
      });
    } else {
      throw new Error(result.error || 'Metadata upload failed');
    }

  } catch (error: any) {
    console.error('❌ Metadata upload failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Metadata upload failed'
    });
  }
});

export default router;
