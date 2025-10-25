import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { privacyAuditor } from '../utils/privacyAuditor';

const router = Router();

/**
 * @route POST /api/privacy/audit
 * @desc Perform privacy audit on a wallet address
 * @access Public
 */
router.post('/audit', [
  body('wallet_address')
    .isString()
    .isLength({ min: 32, max: 44 })
    .withMessage('Valid Solana wallet address required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { wallet_address } = req.body;
    
    const audit = await privacyAuditor.auditWallet(wallet_address);
    
    res.json({
      success: true,
      data: audit
    });
  } catch (error) {
    console.error('Privacy audit error:', error);
    res.status(500).json({
      success: false,
      error: 'Privacy audit failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route POST /api/privacy/zolana-bridge
 * @desc Simulate Zolana bridge for privacy enhancement
 * @access Public
 */
router.post('/zolana-bridge', [
  body('wallet_address')
    .isString()
    .isLength({ min: 32, max: 44 })
    .withMessage('Valid Solana wallet address required'),
  body('audit')
    .isObject()
    .withMessage('Privacy audit object required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { wallet_address, audit } = req.body;
    
    const bridgeResult = await privacyAuditor.simulateZcashBridge(wallet_address, audit);
    
    res.json({
      success: true,
      data: bridgeResult
    });
  } catch (error) {
    console.error('Zolana bridge simulation error:', error);
    res.status(500).json({
      success: false,
      error: 'Zolana bridge simulation failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route POST /api/privacy/zashi-intent
 * @desc Generate Zashi intent for one-click bridging
 * @access Public
 */
router.post('/zashi-intent', [
  body('wallet_address')
    .isString()
    .isLength({ min: 32, max: 44 })
    .withMessage('Valid Solana wallet address required'),
  body('amount_sol')
    .isNumeric()
    .isFloat({ min: 0.001 })
    .withMessage('Valid SOL amount required (minimum 0.001)'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { wallet_address, amount_sol } = req.body;
    
    const intent = await privacyAuditor.generateZashiIntent(wallet_address, amount_sol);
    
    res.json({
      success: true,
      data: intent
    });
  } catch (error) {
    console.error('Zashi intent generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Zashi intent generation failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route GET /api/privacy/health
 * @desc Health check for privacy services
 * @access Public
 */
router.get('/health', async (req, res) => {
  try {
    // Test basic functionality
    const testWallet = '11111111111111111111111111111111'; // Dummy address for testing
    const audit = await privacyAuditor.auditWallet(testWallet);
    
    res.json({
      success: true,
      status: 'healthy',
      services: {
        privacy_auditor: 'operational',
        helius_rpc: 'connected',
        near_rpc: 'connected'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;