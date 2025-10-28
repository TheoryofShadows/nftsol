/**
 * 🌊 Eternal Echoes API Routes
 * RESTful endpoints for collaborative history remixing
 */

import express from 'express';
import { Connection } from '@solana/web3.js';
import { EternalEchoesService } from '../services/eternalEchoesService';

const router = express.Router();

// Initialize service
let eternalEchoesService: EternalEchoesService;

export const initializeEternalEchoes = (connection: Connection) => {
  eternalEchoesService = new EternalEchoesService(connection);
};

/**
 * GET /api/eternal-echoes/search
 * Search Internet Archive for public domain videos
 */
router.get('/search', async (req, res) => {
  try {
    const { query, rows = 20 } = req.query;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'Query parameter is required' 
      });
    }

    const videos = await eternalEchoesService.searchIAVideos(query, parseInt(rows as string));
    
    res.json({
      success: true,
      videos,
      count: videos.length
    });
  } catch (error: any) {
    console.error('Search IA videos error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search videos'
    });
  }
});

/**
 * POST /api/eternal-echoes/mint-base
 * Mint base echo (cNFT) from IA video
 */
router.post('/mint-base', async (req, res) => {
  try {
    const { iaId, creatorWallet, iaVideo } = req.body;
    
    if (!iaId || !creatorWallet || !iaVideo) {
      return res.status(400).json({
        success: false,
        error: 'iaId, creatorWallet, and iaVideo are required'
      });
    }

    const result = await eternalEchoesService.mintBaseEcho(iaId, creatorWallet, iaVideo);
    
    if (result.success) {
      res.json({
        success: true,
        ledgerId: result.ledgerId,
        message: 'Base echo minted successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error: any) {
    console.error('Mint base echo error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mint base echo'
    });
  }
});

/**
 * POST /api/eternal-echoes/add-echo
 * Add echo to existing ledger
 */
router.post('/add-echo', async (req, res) => {
  try {
    const { ledgerId, echoData, contributor, echoType } = req.body;
    
    if (!ledgerId || !echoData || !contributor || !echoType) {
      return res.status(400).json({
        success: false,
        error: 'ledgerId, echoData, contributor, and echoType are required'
      });
    }

    if (!['text', 'audio', 'annotation'].includes(echoType)) {
      return res.status(400).json({
        success: false,
        error: 'echoType must be text, audio, or annotation'
      });
    }

    const result = await eternalEchoesService.addEcho(
      ledgerId, 
      echoData, 
      contributor, 
      echoType as 'text' | 'audio' | 'annotation'
    );
    
    if (result.success) {
      res.json({
        success: true,
        echoId: result.echoId,
        message: 'Echo added successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error: any) {
    console.error('Add echo error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add echo'
    });
  }
});

/**
 * GET /api/eternal-echoes/ledger/:ledgerId
 * Get echo ledger with all echoes
 */
router.get('/ledger/:ledgerId', async (req, res) => {
  try {
    const { ledgerId } = req.params;
    
    const ledger = await eternalEchoesService.getEchoLedger(ledgerId);
    
    if (!ledger) {
      return res.status(404).json({
        success: false,
        error: 'Echo ledger not found'
      });
    }

    res.json({
      success: true,
      ledger
    });
  } catch (error: any) {
    console.error('Get echo ledger error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get echo ledger'
    });
  }
});

/**
 * POST /api/eternal-echoes/verify/:ledgerId
 * Re-verify all echoes in a ledger
 */
router.post('/verify/:ledgerId', async (req, res) => {
  try {
    const { ledgerId } = req.params;
    
    const result = await eternalEchoesService.reVerifyEchoes(ledgerId);
    
    if (result.success) {
      res.json({
        success: true,
        updatedScore: result.updatedScore,
        message: 'Echoes re-verified successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Failed to re-verify echoes'
      });
    }
  } catch (error: any) {
    console.error('Re-verify echoes error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to re-verify echoes'
    });
  }
});

/**
 * GET /api/eternal-echoes/verify-content
 * Verify content truthfulness
 */
router.post('/verify-content', async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Content is required'
      });
    }

    const verification = await eternalEchoesService.grokVerify(content);
    
    res.json({
      success: true,
      verification
    });
  } catch (error: any) {
    console.error('Verify content error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify content'
    });
  }
});

export default router;
