/**
 * 🍭 Candy Machine API Routes
 * Handles Candy Machine operations and auction drops
 */

import { Router, Request, Response } from 'express';
import { CandyMachineService, CandyMachineConfig, AuctionDropConfig } from '../services/candyMachineService';
import { Connection, PublicKey } from '@solana/web3.js';

const router = Router();
const connection = new Connection(process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com');

// Initialize Candy Machine service
const candyMachineService = new CandyMachineService(connection.rpcEndpoint);

/**
 * POST /api/candy-machine/create
 * Create a new Candy Machine
 */
router.post('/create', async (req: Request, res: Response) => {
  try {
    const config: CandyMachineConfig = req.body;
    
    // Validate configuration
    const validation = candyMachineService.validateConfig(config);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid configuration',
        details: validation.errors
      });
    }

    // Create Candy Machine
    const result = await candyMachineService.createCandyMachine(config);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('❌ Error creating Candy Machine:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create Candy Machine',
      details: error.message
    });
  }
});

/**
 * POST /api/candy-machine/auction-drop
 * Create an auction drop using Candy Machine + Guards
 */
router.post('/auction-drop', async (req: Request, res: Response) => {
  try {
    const config: AuctionDropConfig = req.body;
    
    // Create auction drop
    const result = await candyMachineService.createAuctionDrop(config);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('❌ Error creating auction drop:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create auction drop',
      details: error.message
    });
  }
});

/**
 * POST /api/candy-machine/fair-drop
 * Create a fair drop with price decay
 */
router.post('/fair-drop', async (req: Request, res: Response) => {
  try {
    const { items, price, startTime, endTime } = req.body;
    
    // Create fair drop configuration
    const config = candyMachineService.createFairDropConfig(
      items,
      price,
      startTime ? new Date(startTime) : undefined,
      endTime ? new Date(endTime) : undefined
    );
    
    // Create auction drop
    const result = await candyMachineService.createAuctionDrop(config);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('❌ Error creating fair drop:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create fair drop',
      details: error.message
    });
  }
});

/**
 * GET /api/candy-machine/:address
 * Get Candy Machine information
 */
router.get('/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    
    // Get Candy Machine info
    const info = await candyMachineService.getCandyMachine(new PublicKey(address));
    
    if (!info) {
      return res.status(404).json({
        success: false,
        error: 'Candy Machine not found'
      });
    }
    
    res.json({
      success: true,
      data: info
    });
  } catch (error: any) {
    console.error('❌ Error getting Candy Machine:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get Candy Machine',
      details: error.message
    });
  }
});

/**
 * POST /api/candy-machine/:address/items
 * Add items to Candy Machine
 */
router.post('/:address/items', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const { items } = req.body;
    
    // Add items to Candy Machine
    const result = await candyMachineService.addItems(new PublicKey(address), items);
    
    res.json({
      success: true,
      data: { result }
    });
  } catch (error: any) {
    console.error('❌ Error adding items:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add items',
      details: error.message
    });
  }
});

/**
 * GET /api/candy-machine/health
 * Health check for Candy Machine service
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Candy Machine service is healthy',
    timestamp: new Date().toISOString()
  });
});

export default router;
