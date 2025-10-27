/**
 * 📤 Irys API Routes
 * Handles atomic metadata uploads to Irys
 */

import { Router, Request, Response } from 'express';
import { IrysService, IrysConfig } from '../services/irysService';

const router = Router();

// Initialize Irys service
const irysConfig = IrysService.createDefaultConfig();
const irysService = new IrysService(irysConfig);

/**
 * POST /api/irys/upload-metadata
 * Upload JSON metadata to Irys
 */
router.post('/upload-metadata', async (req: Request, res: Response) => {
  try {
    const metadata = req.body;
    
    // Upload metadata to Irys
    const result = await irysService.uploadMetadata(metadata);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('❌ Error uploading metadata to Irys:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload metadata',
      details: error.message
    });
  }
});

/**
 * POST /api/irys/upload-file
 * Upload file to Irys
 */
router.post('/upload-file', async (req: Request, res: Response) => {
  try {
    const { file, contentType } = req.body;
    
    if (!file || !contentType) {
      return res.status(400).json({
        success: false,
        error: 'File and content type are required'
      });
    }
    
    // Convert base64 to buffer if needed
    const fileBuffer = Buffer.isBuffer(file) ? file : Buffer.from(file, 'base64');
    
    // Upload file to Irys
    const result = await irysService.uploadFile(fileBuffer, contentType);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('❌ Error uploading file to Irys:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload file',
      details: error.message
    });
  }
});

/**
 * GET /api/irys/status/:id
 * Get upload status
 */
router.get('/status/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Get upload status
    const status = await irysService.getUploadStatus(id);
    
    res.json({
      success: true,
      data: status
    });
  } catch (error: any) {
    console.error('❌ Error getting upload status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get upload status',
      details: error.message
    });
  }
});

/**
 * GET /api/irys/balance
 * Get account balance
 */
router.get('/balance', async (req: Request, res: Response) => {
  try {
    // Get account balance
    const balance = await irysService.getBalance();
    
    res.json({
      success: true,
      data: { balance }
    });
  } catch (error: any) {
    console.error('❌ Error getting balance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get balance',
      details: error.message
    });
  }
});

/**
 * POST /api/irys/fund
 * Fund account with SOL
 */
router.post('/fund', async (req: Request, res: Response) => {
  try {
    const { amount } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid amount is required'
      });
    }
    
    // Fund account
    const result = await irysService.fundAccount(amount);
    
    res.json({
      success: true,
      data: { transactionId: result }
    });
  } catch (error: any) {
    console.error('❌ Error funding account:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fund account',
      details: error.message
    });
  }
});

/**
 * GET /api/irys/health
 * Health check for Irys service
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Irys service is healthy',
    timestamp: new Date().toISOString()
  });
});

export default router;
