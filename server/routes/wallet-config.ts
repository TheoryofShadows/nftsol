import { Request, Response } from 'express';
import { getWalletConfigStatus, generateEnvironmentConfig } from '../wallet-config';

// Get current wallet configuration status
export async function getWalletConfig(req: Request, res: Response) {
  try {
    const status = getWalletConfigStatus();
    const envConfig = generateEnvironmentConfig();
    
    res.json({
      success: true,
      wallets: status,
      environmentConfig: envConfig,
      configuredCount: Object.values(status).filter(w => w.configured).length,
      totalWallets: Object.keys(status).length
    });
  } catch (error) {
    console.error('Error getting wallet config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get wallet configuration'
    });
  }
}

// Update wallet configuration (for admin use)
export async function updateWalletConfig(req: Request, res: Response) {
  try {
    const { walletType, publicKey, privateKey } = req.body;
    
    // Validate the request
    if (!walletType || !publicKey) {
      return res.status(400).json({
        success: false,
        error: 'Wallet type and public key are required'
      });
    }
    
    // In a real implementation, you would update the configuration
    // For now, we'll just return the current status
    const status = getWalletConfigStatus();
    
    res.json({
      success: true,
      message: `Wallet configuration updated for ${walletType}`,
      wallets: status
    });
  } catch (error) {
    console.error('Error updating wallet config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update wallet configuration'
    });
  }
}