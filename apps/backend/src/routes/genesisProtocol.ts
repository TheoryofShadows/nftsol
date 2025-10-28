import { Router } from 'express';
import { PublicKey, Keypair } from '@solana/web3.js';
import { getGenesisProtocolService, FairLaunchConfig, WhitelistEntry } from '../services/genesisProtocolService';
import { getSolanaConnection } from '../config/solana';

const router = Router();

/**
 * Create a fair launch campaign
 */
router.post('/create', async (req, res) => {
  try {
    const {
      tokenMint,
      treasury,
      config
    }: {
      tokenMint: string;
      treasury: string;
      config: FairLaunchConfig;
    } = req.body;

    console.log('🎲 Creating fair launch campaign...');

    // Validate required fields
    if (!tokenMint || !treasury || !config) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: tokenMint, treasury, config'
      });
    }

    // Validate config
    if (!config.totalSupply || !config.minAllocation || !config.maxAllocation) {
      return res.status(400).json({
        success: false,
        error: 'Invalid config: missing totalSupply, minAllocation, or maxAllocation'
      });
    }

    const connection = getSolanaConnection();
    const genesisService = getGenesisProtocolService(connection);

    // Create authority keypair (in production, use actual authority)
    const authority = Keypair.generate();

    // Create fair launch
    const result = await genesisService.createFairLaunch(
      authority,
      new PublicKey(tokenMint),
      new PublicKey(treasury),
      config
    );

    res.json({
      success: true,
      data: {
        fairLaunch: result.fairLaunch.toString(),
        signature: result.signature,
        authority: authority.publicKey.toString(),
        config: config
      },
      message: 'Fair launch campaign created successfully'
    });

  } catch (error) {
    console.error('❌ Failed to create fair launch:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create fair launch'
    });
  }
});

/**
 * Generate whitelist merkle tree
 */
router.post('/whitelist/generate', async (req, res) => {
  try {
    const { whitelist }: { whitelist: WhitelistEntry[] } = req.body;

    if (!whitelist || !Array.isArray(whitelist)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid whitelist data'
      });
    }

    console.log(`🌳 Generating merkle tree for ${whitelist.length} participants...`);

    const connection = getSolanaConnection();
    const genesisService = getGenesisProtocolService(connection);

    const { root, tree } = genesisService.generateWhitelistTree(whitelist);

    res.json({
      success: true,
      data: {
        root: root,
        participantCount: whitelist.length,
        tree: tree.toString()
      },
      message: 'Whitelist merkle tree generated successfully'
    });

  } catch (error) {
    console.error('❌ Failed to generate whitelist tree:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate whitelist tree'
    });
  }
});

/**
 * Get merkle proof for participant
 */
router.post('/whitelist/proof', async (req, res) => {
  try {
    const {
      whitelist,
      wallet,
      maxAllocation
    }: {
      whitelist: WhitelistEntry[];
      wallet: string;
      maxAllocation: number;
    } = req.body;

    if (!whitelist || !wallet || !maxAllocation) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: whitelist, wallet, maxAllocation'
      });
    }

    const connection = getSolanaConnection();
    const genesisService = getGenesisProtocolService(connection);

    const { tree } = genesisService.generateWhitelistTree(whitelist);
    const proof = genesisService.getMerkleProof(tree, wallet, maxAllocation);

    res.json({
      success: true,
      data: {
        proof: proof,
        wallet: wallet,
        maxAllocation: maxAllocation
      },
      message: 'Merkle proof generated successfully'
    });

  } catch (error) {
    console.error('❌ Failed to get merkle proof:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get merkle proof'
    });
  }
});

/**
 * Participate in fair launch
 */
router.post('/participate', async (req, res) => {
  try {
    const {
      fairLaunch,
      amount,
      merkleProof,
      participantWallet
    }: {
      fairLaunch: string;
      amount: number;
      merkleProof: string[];
      participantWallet: string;
    } = req.body;

    if (!fairLaunch || !amount || !merkleProof || !participantWallet) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: fairLaunch, amount, merkleProof, participantWallet'
      });
    }

    console.log(`🎯 Participating in fair launch with ${amount} tokens...`);

    const connection = getSolanaConnection();
    const genesisService = getGenesisProtocolService(connection);

    // Create participant keypair (in production, use actual wallet)
    const participant = Keypair.generate();

    const result = await genesisService.participateInFairLaunch(
      participant,
      new PublicKey(fairLaunch),
      amount,
      merkleProof
    );

    res.json({
      success: true,
      data: {
        signature: result.signature,
        participant: participant.publicKey.toString(),
        amount: amount
      },
      message: 'Successfully participated in fair launch'
    });

  } catch (error) {
    console.error('❌ Failed to participate in fair launch:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to participate in fair launch'
    });
  }
});

/**
 * Finalize fair launch
 */
router.post('/finalize', async (req, res) => {
  try {
    const {
      fairLaunch,
      authorityWallet
    }: {
      fairLaunch: string;
      authorityWallet: string;
    } = req.body;

    if (!fairLaunch || !authorityWallet) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: fairLaunch, authorityWallet'
      });
    }

    console.log('🏁 Finalizing fair launch...');

    const connection = getSolanaConnection();
    const genesisService = getGenesisProtocolService(connection);

    // Create authority keypair (in production, use actual authority)
    const authority = Keypair.generate();

    const result = await genesisService.finalizeFairLaunch(
      authority,
      new PublicKey(fairLaunch)
    );

    res.json({
      success: true,
      data: {
        signature: result.signature,
        fairLaunch: fairLaunch
      },
      message: 'Fair launch finalized successfully'
    });

  } catch (error) {
    console.error('❌ Failed to finalize fair launch:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to finalize fair launch'
    });
  }
});

/**
 * Claim tokens
 */
router.post('/claim', async (req, res) => {
  try {
    const {
      fairLaunch,
      tokenMint,
      participantWallet
    }: {
      fairLaunch: string;
      tokenMint: string;
      participantWallet: string;
    } = req.body;

    if (!fairLaunch || !tokenMint || !participantWallet) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: fairLaunch, tokenMint, participantWallet'
      });
    }

    console.log('💰 Claiming tokens...');

    const connection = getSolanaConnection();
    const genesisService = getGenesisProtocolService(connection);

    // Create participant keypair (in production, use actual wallet)
    const participant = Keypair.generate();

    const result = await genesisService.claimTokens(
      participant,
      new PublicKey(fairLaunch),
      new PublicKey(tokenMint)
    );

    res.json({
      success: true,
      data: {
        signature: result.signature,
        participant: participant.publicKey.toString()
      },
      message: 'Tokens claimed successfully'
    });

  } catch (error) {
    console.error('❌ Failed to claim tokens:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to claim tokens'
    });
  }
});

/**
 * Get fair launch data
 */
router.get('/:fairLaunch', async (req, res) => {
  try {
    const { fairLaunch } = req.params;

    if (!fairLaunch) {
      return res.status(400).json({
        success: false,
        error: 'Missing fairLaunch parameter'
      });
    }

    const connection = getSolanaConnection();
    const genesisService = getGenesisProtocolService(connection);

    const data = await genesisService.getFairLaunchData(new PublicKey(fairLaunch));

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Fair launch not found'
      });
    }

    res.json({
      success: true,
      data: data,
      message: 'Fair launch data retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Failed to get fair launch data:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get fair launch data'
    });
  }
});

/**
 * Get participant data
 */
router.get('/:fairLaunch/participant/:wallet', async (req, res) => {
  try {
    const { fairLaunch, wallet } = req.params;

    if (!fairLaunch || !wallet) {
      return res.status(400).json({
        success: false,
        error: 'Missing fairLaunch or wallet parameter'
      });
    }

    const connection = getSolanaConnection();
    const genesisService = getGenesisProtocolService(connection);

    const data = await genesisService.getParticipantData(
      new PublicKey(fairLaunch),
      new PublicKey(wallet)
    );

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Participant not found'
      });
    }

    res.json({
      success: true,
      data: data,
      message: 'Participant data retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Failed to get participant data:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get participant data'
    });
  }
});

/**
 * Get fair launch statistics
 */
router.get('/:fairLaunch/stats', async (req, res) => {
  try {
    const { fairLaunch } = req.params;

    if (!fairLaunch) {
      return res.status(400).json({
        success: false,
        error: 'Missing fairLaunch parameter'
      });
    }

    const connection = getSolanaConnection();
    const genesisService = getGenesisProtocolService(connection);

    const stats = await genesisService.getFairLaunchStats(new PublicKey(fairLaunch));

    if (!stats) {
      return res.status(404).json({
        success: false,
        error: 'Fair launch not found'
      });
    }

    res.json({
      success: true,
      data: stats,
      message: 'Fair launch statistics retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Failed to get fair launch stats:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get fair launch statistics'
    });
  }
});

/**
 * Check if fair launch is active
 */
router.get('/:fairLaunch/status', async (req, res) => {
  try {
    const { fairLaunch } = req.params;

    if (!fairLaunch) {
      return res.status(400).json({
        success: false,
        error: 'Missing fairLaunch parameter'
      });
    }

    const connection = getSolanaConnection();
    const genesisService = getGenesisProtocolService(connection);

    const isActive = await genesisService.isFairLaunchActive(new PublicKey(fairLaunch));

    res.json({
      success: true,
      data: {
        isActive: isActive,
        fairLaunch: fairLaunch
      },
      message: 'Fair launch status retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Failed to get fair launch status:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get fair launch status'
    });
  }
});

export default router;
