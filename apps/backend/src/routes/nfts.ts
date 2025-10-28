import { Router } from 'express';
import { mintNFT, getWalletBalance, accountExists } from '../lib/solana';
import { validateWallet, sanitizeInput } from '../utils/validation';
import { ApiResponse } from '../types';

const router = Router();

// POST /api/nfts/mint - Real NFT minting
router.post('/mint', 
  sanitizeInput,
  validateWallet,
  async (req, res) => {
    try {
      const { toAddress, name, description, imageUrl } = req.body;
      
      if (!toAddress || !name) {
        const response: ApiResponse = {
          success: false,
          error: 'Missing required parameters: toAddress, name',
          code: 'MISSING_PARAMETERS'
        };
        return res.status(400).json(response);
      }

      // Validate wallet address exists
      const walletExists = await accountExists(toAddress);
      if (!walletExists) {
        const response: ApiResponse = {
          success: false,
          error: 'Invalid wallet address or wallet does not exist',
          code: 'INVALID_WALLET'
        };
        return res.status(400).json(response);
      }

      // For now, use a placeholder metadata URI
      // In production, you'd upload to IPFS first
      const metadataUri = imageUrl || `https://nftsol.app/metadata/${Date.now()}`;

      const result = await mintNFT(toAddress, metadataUri, name, description);
      
      if (result.success) {
        const response: ApiResponse = {
          success: true,
          data: {
            mintAddress: result.mintAddress,
            transactionSignature: result.txSig,
            name,
            description: description || 'Minted on NFTSol platform',
            toAddress,
            imageUrl: metadataUri
          },
          message: 'NFT minted successfully'
        };
        return res.json(response);
      } else {
        const response: ApiResponse = {
          success: false,
          error: result.error || 'Minting failed',
          code: 'MINT_FAILED'
        };
        return res.status(500).json(response);
      }
    } catch (err) {
      console.error('NFT minting error:', err);
      const response: ApiResponse = {
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      };
      return res.status(500).json(response);
    }
  }
);

// GET /api/nfts/balance/:address - Get wallet balance
router.get('/balance/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!address) {
      const response: ApiResponse = {
        success: false,
        error: 'Missing wallet address',
        code: 'MISSING_ADDRESS'
      };
      return res.status(400).json(response);
    }

    const balance = await getWalletBalance(address);
    const exists = await accountExists(address);
    
    const response: ApiResponse = {
      success: true,
      data: {
        address,
        balance,
        solBalance: `${balance.toFixed(4)} SOL`,
        exists
      }
    };
    return res.json(response);
  } catch (err) {
    console.error('Balance check error:', err);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to get wallet balance',
      code: 'BALANCE_CHECK_FAILED'
    };
    return res.status(500).json(response);
  }
});

// GET /api/nfts/verify/:address - Verify wallet address
router.get('/verify/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!address) {
      const response: ApiResponse = {
        success: false,
        error: 'Missing wallet address',
        code: 'MISSING_ADDRESS'
      };
      return res.status(400).json(response);
    }

    const exists = await accountExists(address);
    
    const response: ApiResponse = {
      success: true,
      data: {
        address,
        exists,
        valid: exists
      }
    };
    return res.json(response);
  } catch (err) {
    console.error('Wallet verification error:', err);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to verify wallet address',
      code: 'VERIFICATION_FAILED'
    };
    return res.status(500).json(response);
  }
});

export default router;
