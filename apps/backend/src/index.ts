import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import multer from 'multer';
import { createServer } from 'http';
import dotenv from 'dotenv';
import { PROGRAM_IDS } from './config/programs';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'https://nftsol.app'],
  credentials: true
}));
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Health check
app.get('/healthz', (req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

// Program IDs endpoint
app.get('/api/programs', (req, res) => {
  res.json({
    success: true,
    programs: PROGRAM_IDS,
    message: 'Real Solana program IDs'
  });
});

// Simple working mint endpoint
app.post('/api/simple-mint', upload.single('file'), (req, res) => {
  try {
    // Handle both JSON and FormData
    const { creatorWallet, name, description, imageUrl, owner, file } = req.body;
    
    // Use owner if creatorWallet is not provided (for FormData)
    const wallet = creatorWallet || owner;
    
    if (!wallet || !name) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: wallet/owner and name'
      });
      return;
    }
    
    // Mock successful mint for now
    const mockResult = {
      success: true,
      mint: `MOCK_MINT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      uri: `https://nftstorage.link/ipfs/mock_${Date.now()}`,
      mintAddress: `mint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      signature: `sig_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      message: 'NFT minted successfully (mock)'
    };
    
    console.log(`✅ Mock NFT minted: ${name} by ${wallet}`);
    res.json(mockResult);
  } catch (error) {
    console.error('Simple mint error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Simple marketplace endpoints
app.get('/api/market', (req, res) => {
  res.json({
    success: true,
    items: [],
    message: 'Marketplace endpoint working'
  });
});

app.get('/api/collections', (req, res) => {
  res.json({
    success: true,
    collections: [],
    message: 'Collections endpoint working'
  });
});

app.get('/api/wallet', (req, res) => {
  res.json({
    success: true,
    message: 'Wallet endpoint working'
  });
});

// Simple NFT listing endpoint
app.get('/api/nft/list', (req, res) => {
  res.json({
    success: true,
    nfts: [],
    message: 'NFT list endpoint working'
  });
});

// NFT endpoints
app.get('/nfts', (req, res) => {
  const { owner } = req.query;
  res.json({
    items: [],
    note: owner ? `NFTs for owner: ${owner}` : 'Add ?owner=<publicKey>'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ ok: true });
});

// Start server
server.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`✅ NFTSol API listening on http://0.0.0.0:${PORT}`);
  console.log(`🔗 Health check: http://0.0.0.0:${PORT}/healthz`);
  console.log(`🎨 Mint endpoint: http://0.0.0.0:${PORT}/api/simple-mint`);
});

export { app, server };