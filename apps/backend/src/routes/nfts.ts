import { Router } from 'express';
import { mintNFT, getWalletBalance, accountExists, connection } from '../lib/solana';
import { validateWallet } from '../utils/validation';
import { ApiResponse } from '../types';
import { getPlatformKeypair } from '../lib/platformKeypair';
import { createModuleLogger } from '../utils/logger';

const log = createModuleLogger('nfts');

const router = Router();

// POST /api/nfts/mint - Real NFT minting
router.post('/mint', validateWallet, async (req, res) => {
  try {
    const { toAddress, name, description, imageUrl } = req.body;

    if (!toAddress || !name) {
      const response: ApiResponse = {
        success: false,
        error: 'Missing required parameters: toAddress, name',
        code: 'MISSING_PARAMETERS',
      };
      return res.status(400).json(response);
    }

    // Validate wallet address exists
    const walletExists = await accountExists(toAddress);
    if (!walletExists) {
      const response: ApiResponse = {
        success: false,
        error: 'Invalid wallet address or wallet does not exist',
        code: 'INVALID_WALLET',
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
          imageUrl: metadataUri,
        },
        message: 'NFT minted successfully',
      };
      return res.json(response);
    } else {
      const response: ApiResponse = {
        success: false,
        error: result.error || 'Minting failed',
        code: 'MINT_FAILED',
      };
      return res.status(500).json(response);
    }
  } catch (err) {
    const error = err as Error;
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      log.error('NFT minting error:', error);
    }

    const response: ApiResponse = {
      success: false,
      error:
        process.env.NODE_ENV === 'production'
          ? 'Failed to mint NFT. Please try again later.'
          : error.message || 'Internal server error',
      code: 'INTERNAL_ERROR',
    };
    return res.status(500).json(response);
  }
});

// GET /api/nfts/balance/:address - Get wallet balance
router.get('/balance/:address', async (req, res) => {
  try {
    const { address } = req.params;

    if (!address) {
      const response: ApiResponse = {
        success: false,
        error: 'Missing wallet address',
        code: 'MISSING_ADDRESS',
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
        exists,
      },
    };
    return res.json(response);
  } catch (err) {
    const error = err as Error;
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      log.error('Balance check error:', error);
    }

    const response: ApiResponse = {
      success: false,
      error:
        process.env.NODE_ENV === 'production'
          ? 'Unable to check wallet balance. Please try again.'
          : error.message || 'Failed to get wallet balance',
      code: 'BALANCE_CHECK_FAILED',
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
        code: 'MISSING_ADDRESS',
      };
      return res.status(400).json(response);
    }

    const exists = await accountExists(address);

    const response: ApiResponse = {
      success: true,
      data: {
        address,
        exists,
        valid: exists,
      },
    };
    return res.json(response);
  } catch (err) {
    const error = err as Error;
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      log.error('Wallet verification error:', error);
    }

    const response: ApiResponse = {
      success: false,
      error:
        process.env.NODE_ENV === 'production'
          ? 'Unable to verify wallet. Please check your wallet address and try again.'
          : error.message || 'Failed to verify wallet address',
      code: 'VERIFICATION_FAILED',
    };
    return res.status(500).json(response);
  }
});

router.get('/mint/status', async (req, res) => {
  try {
    const keypair = getPlatformKeypair();
    const balance = await getWalletBalance(keypair.publicKey.toBase58());

    // Check RPC health by getting latest blockhash
    let rpcHealth = 'unknown';
    let rpcWorking = false;
    try {
      await connection.getLatestBlockhash('confirmed');
      rpcHealth = 'ok';
      rpcWorking = true;
    } catch (error) {
      rpcHealth = 'error';
      rpcWorking = false;
    }

    const response: ApiResponse = {
      success: true,
      data: {
        platformWallet: keypair.publicKey.toBase58(),
        balance: balance,
        balanceFormatted: `${balance.toFixed(4)} SOL`,
        hasMinimumBalance: balance >= 0.02,
        rpcHealth: rpcHealth,
        rpcWorking: rpcWorking,
        rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
        network: process.env.SOLANA_CLUSTER || 'mainnet-beta',
        canMint: balance >= 0.02 && rpcWorking,
      },
    };
    return res.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({
      success: false,
      error: errorMessage,
      code: 'STATUS_CHECK_FAILED',
    });
  }
});

export default router;
