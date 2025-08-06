import { Router } from "express";
// Note: Direct import causes TypeScript rootDir issues, so we'll use dynamic import
import fs from 'fs';
import path from 'path';

const router = Router();

/**
 * Deploy CLOUT token endpoint
 */
router.post('/deploy', async (req, res) => {
  try {
    console.log('🚀 Starting CLOUT token deployment via API...');
    
    // Dynamic import to avoid TypeScript rootDir issues
    const { deployCLOUTToken } = await import('../../scripts/deploy-clout-token.js');
    const deploymentInfo = await deployCLOUTToken();
    
    res.json({
      success: true,
      message: 'CLOUT token deployed successfully',
      deploymentInfo,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ CLOUT deployment failed:', error);
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Deployment failed',
      details: error instanceof Error && 'transactionMessage' in error 
        ? (error as any).transactionMessage 
        : 'No additional details',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Check CLOUT token deployment status
 */
router.get('/status', async (req, res) => {
  try {
    const deploymentPath = path.join(process.cwd(), 'clout-deployment.json');
    
    if (fs.existsSync(deploymentPath)) {
      const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
      
      res.json({
        deployed: true,
        deploymentInfo,
        timestamp: new Date().toISOString()
      });
    } else {
      res.json({
        deployed: false,
        message: 'CLOUT token has not been deployed yet',
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Status check failed',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Get deployment instructions
 */
router.get('/instructions', (req, res) => {
  res.json({
    instructions: {
      prerequisites: [
        'Ensure you have SOL in your treasury wallet for deployment fees',
        'Verify your treasury wallet private key is secure',
        'Check Solana network connectivity'
      ],
      steps: [
        'POST /api/clout/deploy to deploy the token',
        'Wait for confirmation on the Solana network',
        'GET /api/clout/status to verify deployment',
        'Use the token mint address in your application'
      ],
      security: [
        'Never share your private keys',
        'Use secure wallet storage',
        'Consider using a hardware wallet for production',
        'Store deployment info securely'
      ]
    },
    timestamp: new Date().toISOString()
  });
});

export default router;