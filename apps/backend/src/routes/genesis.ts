/**
 * 🌟 Genesis Protocol API Routes
 * Fair launch mechanisms for compressed NFT drops
 */

import express from 'express';
import rateLimit from 'express-rate-limit';
import { GenesisProtocolService, GenesisLaunchConfig, GenesisTier } from '../services/genesisProtocolService';
import { Connection } from '@solana/web3.js';

const router = express.Router();

// Initialize Genesis Protocol Service
const connection = new Connection(process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com');
const genesisService = new GenesisProtocolService(connection);

// Set up signer if available
if (process.env.BUBBLEGUM_PRIVATE_KEY) {
  const { Keypair } = require('@solana/web3.js');
  const bs58 = require('bs58');
  const keypair = Keypair.fromSecretKey(
    bs58.decode(process.env.BUBBLEGUM_PRIVATE_KEY)
  );
  genesisService.setSigner(keypair);
}

// Rate limiting
const createLaunchLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 launches per 15 minutes
  message: { success: false, error: 'Too many launch creation attempts' }
});

const mintLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 mints per minute per IP
  message: { success: false, error: 'Too many mint attempts' }
});

const whitelistLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 whitelist operations per minute
  message: { success: false, error: 'Too many whitelist operations' }
});

/**
 * GET /api/genesis/info
 * Get Genesis Protocol service information
 */
router.get('/info', (req, res) => {
  try {
    const info = {
      name: 'Genesis Protocol Service',
      version: '1.0.0',
      description: 'Fair launch mechanisms for compressed NFT drops',
      features: [
        'Fair Launch Management',
        'Whitelist Management',
        'Tiered Access Control',
        'Anti-Bot Protection',
        'Launch Scheduling',
        'Revenue Tracking',
        'Anti-Sniping Measures'
      ],
      capabilities: {
        maxLaunches: 1000,
        maxWhitelistSize: 10000,
        supportedTiers: 5,
        antiBotProtection: true,
        scheduledLaunches: true
      }
    };

    res.json({ success: true, data: info });
  } catch (error: any) {
    console.error('❌ Error getting Genesis info:', error);
    res.status(500).json({ success: false, error: 'Failed to get service info' });
  }
});

/**
 * POST /api/genesis/launch
 * Create a new Genesis launch
 */
router.post('/launch', createLaunchLimiter, async (req, res) => {
  try {
    const {
      name,
      description,
      maxSupply,
      pricePerNFT,
      launchDate,
      endDate,
      whitelistRequired,
      maxMintsPerWallet,
      maxMintsPerTransaction,
      antiBotProtection,
      tieredAccess,
      tiers
    } = req.body;

    // Validation
    if (!name || !description || !maxSupply || !pricePerNFT || !launchDate) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, description, maxSupply, pricePerNFT, launchDate'
      });
    }

    if (maxSupply <= 0 || maxSupply > 1000000) {
      return res.status(400).json({
        success: false,
        error: 'maxSupply must be between 1 and 1,000,000'
      });
    }

    if (pricePerNFT < 0) {
      return res.status(400).json({
        success: false,
        error: 'pricePerNFT must be non-negative'
      });
    }

    const config: GenesisLaunchConfig = {
      name,
      description,
      maxSupply,
      pricePerNFT,
      launchDate: new Date(launchDate),
      endDate: endDate ? new Date(endDate) : undefined,
      whitelistRequired: whitelistRequired || false,
      maxMintsPerWallet: maxMintsPerWallet || 1,
      maxMintsPerTransaction: maxMintsPerTransaction || 1,
      antiBotProtection: antiBotProtection || false,
      tieredAccess: tieredAccess || false,
      tiers: tiers || []
    };

    const launch = await genesisService.createLaunch(config);
    
    res.json({
      success: true,
      data: {
        id: launch.id,
        name: launch.config.name,
        status: launch.status,
        maxSupply: launch.config.maxSupply,
        pricePerNFT: launch.config.pricePerNFT,
        launchDate: launch.config.launchDate,
        createdAt: launch.createdAt
      }
    });
  } catch (error: any) {
    console.error('❌ Error creating launch:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/genesis/launches
 * Get all launches
 */
router.get('/launches', (req, res) => {
  try {
    const { status, active, upcoming } = req.query;
    
    let launches = genesisService.getAllLaunches();
    
    if (status) {
      launches = launches.filter(launch => launch.status === status);
    }
    
    if (active === 'true') {
      launches = genesisService.getActiveLaunches();
    }
    
    if (upcoming === 'true') {
      launches = genesisService.getUpcomingLaunches();
    }

    const launchData = launches.map(launch => ({
      id: launch.id,
      name: launch.config.name,
      description: launch.config.description,
      status: launch.status,
      maxSupply: launch.config.maxSupply,
      totalMinted: launch.totalMinted,
      pricePerNFT: launch.config.pricePerNFT,
      totalRevenue: launch.totalRevenue,
      launchDate: launch.config.launchDate,
      whitelistRequired: launch.config.whitelistRequired,
      whitelistSize: launch.whitelist.length,
      createdAt: launch.createdAt,
      updatedAt: launch.updatedAt
    }));

    res.json({ success: true, data: launchData });
  } catch (error: any) {
    console.error('❌ Error getting launches:', error);
    res.status(500).json({ success: false, error: 'Failed to get launches' });
  }
});

/**
 * GET /api/genesis/launch/:id
 * Get specific launch details
 */
router.get('/launch/:id', (req, res) => {
  try {
    const { id } = req.params;
    const launch = genesisService.getLaunch(id);
    
    if (!launch) {
      return res.status(404).json({ success: false, error: 'Launch not found' });
    }

    const stats = genesisService.getLaunchStats(id);
    
    res.json({
      success: true,
      data: {
        ...launch,
        stats
      }
    });
  } catch (error: any) {
    console.error('❌ Error getting launch:', error);
    res.status(500).json({ success: false, error: 'Failed to get launch' });
  }
});

/**
 * POST /api/genesis/launch/:id/schedule
 * Schedule a launch
 */
router.post('/launch/:id/schedule', (req, res) => {
  try {
    const { id } = req.params;
    const { launchDate } = req.body;
    
    if (!launchDate) {
      return res.status(400).json({
        success: false,
        error: 'launchDate is required'
      });
    }

    genesisService.scheduleLaunch(id, new Date(launchDate));
    
    res.json({ success: true, message: 'Launch scheduled successfully' });
  } catch (error: any) {
    console.error('❌ Error scheduling launch:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/genesis/launch/:id/activate
 * Activate a scheduled launch
 */
router.post('/launch/:id/activate', (req, res) => {
  try {
    const { id } = req.params;
    genesisService.activateLaunch(id);
    
    res.json({ success: true, message: 'Launch activated successfully' });
  } catch (error: any) {
    console.error('❌ Error activating launch:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/genesis/launch/:id/pause
 * Pause an active launch
 */
router.post('/launch/:id/pause', (req, res) => {
  try {
    const { id } = req.params;
    genesisService.pauseLaunch(id);
    
    res.json({ success: true, message: 'Launch paused successfully' });
  } catch (error: any) {
    console.error('❌ Error pausing launch:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/genesis/launch/:id/resume
 * Resume a paused launch
 */
router.post('/launch/:id/resume', (req, res) => {
  try {
    const { id } = req.params;
    genesisService.resumeLaunch(id);
    
    res.json({ success: true, message: 'Launch resumed successfully' });
  } catch (error: any) {
    console.error('❌ Error resuming launch:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/genesis/launch/:id/complete
 * Complete a launch
 */
router.post('/launch/:id/complete', (req, res) => {
  try {
    const { id } = req.params;
    genesisService.completeLaunch(id);
    
    res.json({ success: true, message: 'Launch completed successfully' });
  } catch (error: any) {
    console.error('❌ Error completing launch:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/genesis/launch/:id/whitelist
 * Add wallet to whitelist
 */
router.post('/launch/:id/whitelist', whitelistLimiter, (req, res) => {
  try {
    const { id } = req.params;
    const { walletAddress, tier, maxMints } = req.body;
    
    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'walletAddress is required'
      });
    }

    genesisService.addToWhitelist(id, walletAddress, tier, maxMints);
    
    res.json({ success: true, message: 'Wallet added to whitelist' });
  } catch (error: any) {
    console.error('❌ Error adding to whitelist:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/genesis/launch/:id/whitelist/:wallet
 * Remove wallet from whitelist
 */
router.delete('/launch/:id/whitelist/:wallet', whitelistLimiter, (req, res) => {
  try {
    const { id, wallet } = req.params;
    genesisService.removeFromWhitelist(id, wallet);
    
    res.json({ success: true, message: 'Wallet removed from whitelist' });
  } catch (error: any) {
    console.error('❌ Error removing from whitelist:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/genesis/launch/:id/whitelist
 * Get whitelist for a launch
 */
router.get('/launch/:id/whitelist', (req, res) => {
  try {
    const { id } = req.params;
    const launch = genesisService.getLaunch(id);
    
    if (!launch) {
      return res.status(404).json({ success: false, error: 'Launch not found' });
    }

    res.json({ success: true, data: launch.whitelist });
  } catch (error: any) {
    console.error('❌ Error getting whitelist:', error);
    res.status(500).json({ success: false, error: 'Failed to get whitelist' });
  }
});

/**
 * POST /api/genesis/launch/:id/mint
 * Mint NFT through Genesis Protocol
 */
router.post('/launch/:id/mint', mintLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    const { walletAddress, metadata, quantity } = req.body;
    
    if (!walletAddress || !metadata) {
      return res.status(400).json({
        success: false,
        error: 'walletAddress and metadata are required'
      });
    }

    if (quantity && (quantity < 1 || quantity > 10)) {
      return res.status(400).json({
        success: false,
        error: 'quantity must be between 1 and 10'
      });
    }

    const result = await genesisService.mintThroughGenesis(id, walletAddress, metadata, quantity || 1);
    
    if (result.success) {
      res.json({ success: true, data: result });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error: any) {
    console.error('❌ Error minting through Genesis:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/genesis/launch/:id/stats
 * Get launch statistics
 */
router.get('/launch/:id/stats', (req, res) => {
  try {
    const { id } = req.params;
    const stats = genesisService.getLaunchStats(id);
    
    res.json({ success: true, data: stats });
  } catch (error: any) {
    console.error('❌ Error getting launch stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
