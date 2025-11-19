/**
 * Video Upload API Routes
 * Handles user video uploads, Pinata storage, and metadata creation
 */

import { Router, Request, Response, NextFunction, ErrorRequestHandler, RequestHandler } from 'express';
import { Multer } from 'multer';
import multer from 'multer';
import { uploadToPinata } from '../utils/pinataUpload';
import { uploadMetadataToIrys } from '../utils/irysUpload';
import { verifyWithGrok, GrokVerificationResult } from '../utils/grokpedia-production';
import { Connection, Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import { solanaConfig } from '../config';
import expressRateLimit from 'express-rate-limit';

// Extend the Express Request type to include file
interface MulterRequest extends Request {
  file?: any;
}

const router = Router();

// Pre-check Content-Length to fail fast on oversized uploads
const MAX_VIDEO_BYTES = 100 * 1024 * 1024; // 100MB
const contentLengthCheck: RequestHandler = (req, res, next) => {
  const lenHeader = req.headers['content-length'];
  if (lenHeader) {
    const len = parseInt(Array.isArray(lenHeader) ? lenHeader[0] : lenHeader, 10);
    if (!Number.isNaN(len) && len > MAX_VIDEO_BYTES) {
      return res.status(400).json({ success: false, error: 'Video file too large. Maximum size: 100MB' });
    }
  }
  return next();
};

// Rate limiting for video uploads
const uploadLimiter = expressRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 uploads per 15 minutes
  message: 'Too many upload requests, please try again later',
});

// Configure multer for video uploads (separate from image uploads)
const videoUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max (free tier friendly)
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    // Allow video MIME types
    const allowedTypes = [
      'video/mp4',
      'video/webm',
      'video/quicktime', // mov
      'video/x-msvideo', // avi
      'video/mpeg',
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`));
    }
  },
});

/**
 * POST /api/video/upload
 * Upload video to Pinata, create metadata, upload metadata to Irys
 */
router.post('/upload', uploadLimiter, contentLengthCheck, videoUpload.single('video'), async (req: MulterRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No video file provided',
      });
    }

    const file = req.file;
    const { name, description } = req.body;

    // Validate file size (Pinata free tier: 1GB total)
    if (file.size > 100 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        error: 'Video file too large. Maximum size: 100MB',
      });
    }

    // 1. Upload video to Pinata (free 1GB tier)
    console.log(`[Video] Uploading ${file.size} bytes to Pinata...`);
    const videoCid = await uploadToPinata(file.buffer, file.originalname || 'video.mp4');
    console.log(`[Video] Uploaded to Pinata: ${videoCid}`);

    // 2. Create metadata JSON
    const metadata = {
      name: name || `Video NFT #${Date.now()}`,
      symbol: 'ECHO',
      description: description || 'User-uploaded video NFT',
      image: `https://gateway.pinata.cloud/ipfs/${videoCid}?format=jpg`, // Thumbnail (if available)
      animation_url: `https://gateway.pinata.cloud/ipfs/${videoCid}`,
      attributes: [
        { trait_type: 'Type', value: 'Video' },
        { trait_type: 'Format', value: file.mimetype },
        { trait_type: 'Size', value: `${Math.round(file.size / 1024 / 1024)}MB` },
      ],
      properties: {
        files: [
          {
            uri: `https://gateway.pinata.cloud/ipfs/${videoCid}`,
            type: file.mimetype,
          },
        ],
      },
    };

    // 3. Upload metadata to Irys (free, under 100KB limit)
    console.log(`[Video] Uploading metadata to Irys...`);
    
    // Get platform keypair for Irys (from environment or config)
    const platformSecretKey = process.env.PLATFORM_SECRET_KEY_BASE58;
    if (!platformSecretKey) {
      throw new Error('PLATFORM_SECRET_KEY_BASE58 not configured');
    }

    // Create keypair from base58 secret key
    const secretKeyBytes = bs58.decode(platformSecretKey);
    const keypair = Keypair.fromSecretKey(secretKeyBytes);

    const connection = new Connection(solanaConfig.rpcUrl, solanaConfig.commitment);
    
    // Upload metadata to Irys (metadata only, not video - Irys has 100KB limit)
    // uploadMetadataToIrys creates its own Irys node internally
    const metadataResult = await uploadMetadataToIrys(metadata, {
      connection,
      keypair,
      network: solanaConfig.cluster as 'mainnet-beta' | 'devnet',
    });

    console.log(`[Video] Metadata uploaded to Irys: ${metadataResult.uri}`);

    // 4. Trigger Grok verification (async, don't block response)
    let verificationResult: GrokVerificationResult | null = null;
    try {
      const videoUrl = `https://gateway.pinata.cloud/ipfs/${videoCid}`;
      const nftId = `video-${Date.now()}`;
      verificationResult = await verifyWithGrok(videoUrl, nftId);
      console.log(`[Video] Grok verification: ${verificationResult.verified ? 'VERIFIED' : 'NEEDS_REVIEW'} (score: ${verificationResult.score})`);
    } catch (verificationError) {
      console.warn('[Video] Grok verification failed (non-blocking):', verificationError);
      // Don't fail upload if verification fails
    }

    // 5. Return both metadata URI (for minting) and video CID (for playback)
    res.json({
      success: true,
      data: {
        metadataUri: metadataResult.uri,
        videoCid,
        videoUrl: `https://gateway.pinata.cloud/ipfs/${videoCid}`,
        metadata: {
          name: metadata.name,
          description: metadata.description,
        },
        verification: verificationResult ? {
          verified: verificationResult.verified,
          score: verificationResult.score,
          summary: verificationResult.summary,
        } : null,
      },
    });
  } catch (error: any) {
    console.error('[Video] Upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Video upload failed',
    });
  }
});

// Define custom error interface for Multer errors
interface MulterError extends Error {
  code?: string;
  field?: string;
  storageErrors?: Error[];
}

// Error handler middleware with proper types
const errorHandler: ErrorRequestHandler = (err: Error & { code?: string }, _req: Request, res: Response, next: NextFunction) => {
  if (err) {
    // Standard Multer error
    if ('code' in err && err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        success: false, 
        error: 'Video file too large. Maximum size: 100MB' 
      });
    }
    
    // Some environments surface as generic Error('File too large')
    if (err.message && typeof err.message === 'string' && 
        err.message.toLowerCase().includes('file too large')) {
      return res.status(400).json({ 
        success: false, 
        error: 'Video file too large. Maximum size: 100MB' 
      });
    }
  }
  
  return next(err);
};

// Register error handler
router.use(errorHandler);

export default router;

