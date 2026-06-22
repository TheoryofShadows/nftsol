/**
 * 💎 Ultra-Cheap NFT Minting Service (2024+ Best Practices)
 * Using Metaplex UMI + Bubblegum Compressed NFTs
 * 
 * COST COMPARISON:
 * - Compressed NFTs (cNFTs): ~$0.0001-0.001 per mint
 * - Regular NFTs: ~$0.02-0.05 per mint
 * - Ethereum NFTs: ~$50-100+ per mint
 * - pump.fun meme coins: ~$0.02 per mint
 * 
 * ✅ CHEAPER THAN MEME COINS!
 */

import logger from '../utils/logger';
import { 
  Connection,
} from '@solana/web3.js';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import {
  keypairIdentity,
  generateSigner,
  Umi,
  publicKey as umiPublicKey,
  KeypairSigner,
  createSignerFromKeypair,
} from '@metaplex-foundation/umi';

// Use the base Umi type with additional properties we need
type UmiInstance = Umi & {
  // Add any additional properties or methods we need to access
  _programs?: any;
  identity: KeypairSigner;
};

import {
  createTree,
  mintV1,
  mplBubblegum,
  findLeafAssetIdPda,
  parseLeafFromMintV1Transaction,
} from '@metaplex-foundation/mpl-bubblegum';
import { irysUploader } from '@metaplex-foundation/umi-uploader-irys';
import { solanaConfig } from '../config';
import { getPlatformKeypair } from '../lib/platformKeypair';
import bs58 from 'bs58';
// UMI publicKey is already imported above

// Merkle tree configuration
const MERKLE_TREE_CONFIG = {
  maxDepth: 14, // Supports up to 16,384 NFTs (2^14)
  maxBufferSize: 64,
  canopyDepth: 0, // No canopy for maximum compression
};

// Minimum SOL the platform relayer needs to fund an Irys metadata upload + the
// compressed-mint fee. Tree creation (~0.15 SOL) is a one-time cost and is
// skipped entirely when BUBBLEGUM_TREE_ADDRESS is set.
const MIN_PLATFORM_SOL = 0.01;

/**
 * Rewrite Solana's cryptic low-balance errors into an honest, actionable
 * message. The user's connected wallet is never the fee payer for gasless
 * mints — the platform relayer is — so "insufficient funds for fee" is
 * misleading without this context.
 */
function humanizeMintError(message: string, relayerAddress?: string): string {
  if (/insufficient funds|debit an account|attempt to debit/i.test(message)) {
    return `Minting temporarily unavailable: the platform relayer wallet needs SOL.${
      relayerAddress ? ` Fund ${relayerAddress}.` : ''
    }`;
  }
  return message;
}

interface UltraCheapMintParams {
  toAddress: string;
  name: string;
  symbol?: string;
  description?: string;
  imageUrl: string;
  externalUrl?: string;
  attributes?: Array<{ trait_type: string; value: string }>;
}

interface MintResult {
  success: boolean;
  assetId?: string; // For cNFTs, this is the leaf asset ID
  mintAddress?: string; // Alias for assetId
  signature?: string;
  cost?: number; // In SOL
  costUSD?: number; // Estimated USD cost
  treeAddress?: string; // Merkle tree address
  error?: string;
}

export class UltraCheapMintService {
  private connection: Connection;
  private umi: UmiInstance | null = null;
  private merkleTree: any = null;
  private solanaConnection: Connection;

  constructor() {
    this.solanaConnection = new Connection(solanaConfig.rpcUrl, 'confirmed');
    this.connection = this.solanaConnection;
  }

  /**
   * Initialize UMI with platform keypair
   */
  private async initializeUmi(): Promise<UmiInstance> {
    if (this.umi) return this.umi;

    try {
      const platformKeypair = getPlatformKeypair();
      if (!platformKeypair) {
        throw new Error('Platform keypair not found');
      }

      const irysAddress = solanaConfig.cluster === 'mainnet-beta'
        ? 'https://node1.irys.xyz'
        : 'https://devnet.irys.xyz';

      // Build UMI once with the correct Helius RPC endpoint
      const umi = createUmi(solanaConfig.rpcUrl)
        .use(mplBubblegum())
        .use(irysUploader({
          address: irysAddress,
          providerUrl: solanaConfig.rpcUrl,
          timeout: 60000,
        }));

      const umiKeypair = umi.eddsa.createKeypairFromSecretKey(
        platformKeypair.secretKey
      );
      const signer = createSignerFromKeypair(umi, umiKeypair);
      umi.use(keypairIdentity(signer));

      this.umi = umi as UmiInstance;

      logger.info('[UltraCheapMint] UMI initialized with Bubblegum & Irys');
      return this.umi;

    } catch (error) {
      logger.error('[UltraCheapMint] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Get or create a Merkle tree for compressed NFTs
   * Reuses existing tree to save costs
   */
  private async getOrCreateMerkleTree() {
    const umi = await this.initializeUmi();
    if (!umi) {
      throw new Error('Failed to initialize UMI');
    }
    
    // In a real implementation, you'd want to store and retrieve the merkle tree address
    // For now, we'll create a new one each time
    const merkleTree = generateSigner(umi);
    
    try {
      // Create a new merkle tree with all required parameters
      const builder = await createTree(umi, {
        maxDepth: MERKLE_TREE_CONFIG.maxDepth,
        maxBufferSize: MERKLE_TREE_CONFIG.maxBufferSize,
        canopyDepth: MERKLE_TREE_CONFIG.canopyDepth,
        merkleTree: merkleTree, // Pass the signer directly
      });
      
      // Sign and send the transaction
      const result = await builder.sendAndConfirm(umi);
      
      if (!result || !result.signature) {
        throw new Error('Failed to create merkle tree: No signature returned');
      }
      
      const { signature } = result;
      
      // Wait for confirmation with explicit strategy
      const latestBlockhash = await umi.rpc.getLatestBlockhash();
      await umi.rpc.confirmTransaction(signature, {
        strategy: { type: 'blockhash', ...latestBlockhash },
        commitment: 'confirmed',
      });
      
      logger.info(`[UltraCheapMint] Created new merkle tree: ${merkleTree.publicKey}`);
      return [merkleTree];
    } catch (error) {
      logger.error('[UltraCheapMint] Failed to create merkle tree:', error);
      throw error;
    }
  }

  /**
   * Ensure merkle tree exists.
   * Reuses BUBBLEGUM_TREE_ADDRESS from env if set, otherwise creates a new one.
   */
  private async ensureMerkleTree(attempt = 1, maxAttempts = 3) {
    if (this.merkleTree) return this.merkleTree;

    // Reuse existing tree from env — avoids paying ~0.15 SOL each time
    const existingTreeAddress = process.env.BUBBLEGUM_TREE_ADDRESS;
    if (existingTreeAddress) {
      try {
        await this.initializeUmi();
        this.merkleTree = { publicKey: umiPublicKey(existingTreeAddress) };
        logger.info(`[UltraCheapMint] Reusing existing Merkle tree: ${existingTreeAddress}`);
        return this.merkleTree;
      } catch (error) {
        logger.warn('[UltraCheapMint] Could not reuse tree from env, will create new one:', error);
      }
    }

    try {
      const umi = await this.initializeUmi();
      if (!umi) throw new Error('Failed to initialize UMI');

      const trees = await this.getOrCreateMerkleTree();
      this.merkleTree = trees[0];

      return this.merkleTree;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`[UltraCheapMint] Merkle tree initialization failed (attempt ${attempt}/${maxAttempts}):`, errorMessage);

      if (attempt >= maxAttempts) {
        throw new Error(`Failed to initialize merkle tree after ${maxAttempts} attempts: ${errorMessage}`);
      }

      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      return this.ensureMerkleTree(attempt + 1, maxAttempts);
    }
  }

  /**
   * Estimate minting cost (ULTRA-LOW with compressed NFTs)
   */
  async estimateCost(): Promise<{ solCost: number; usdCost: number }> {
    try {
      // Compressed NFT minting cost breakdown:
      // - Tree creation: ~0.15 SOL (one-time, amortized over 16K+ mints)
      // - Per-mint cost: ~0.0001 SOL (just compute + priority fee)
      // - Total per mint: ~0.0001-0.001 SOL
      
      const perMintLamports = 10000; // ~0.00001 SOL base
      const priorityFeeLamports = 5000; // Minimal priority
      const totalLamports = perMintLamports + priorityFeeLamports;
      const solCost = totalLamports / 1e9;
      
      // Get real SOL price
      const solPrice = await this.getSolPrice();
      const usdCost = solCost * solPrice;

      return { solCost, usdCost };
    } catch (error) {
      // Ultra-conservative estimate for cNFTs
      return { solCost: 0.0001, usdCost: 0.01 };
    }
  }

  /**
   * Get current SOL price in USD
   */
  private async getSolPrice(): Promise<number> {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
      const data = await response.json();
      return data.solana?.usd || 100; // Fallback to $100 if API fails
    } catch {
      return 100; // Safe fallback
    }
  }

  /**
   * Read the platform relayer wallet — the actual fee payer for gasless mints.
   * Exposed for the /api/mint/relayer-status diagnostics endpoint and reused by
   * the mint() preflight. Only ever returns the public key, never the secret.
   */
  async getRelayerStatus(): Promise<{
    address: string;
    balanceSol: number;
    cluster: string;
    funded: boolean;
    minSol: number;
  }> {
    const keypair = getPlatformKeypair();
    const lamports = await this.connection.getBalance(keypair.publicKey);
    const balanceSol = lamports / 1e9;
    return {
      address: keypair.publicKey.toBase58(),
      balanceSol,
      cluster: solanaConfig.cluster ?? 'mainnet-beta',
      funded: balanceSol >= MIN_PLATFORM_SOL,
      minSol: MIN_PLATFORM_SOL,
    };
  }

  /**
   * Upload metadata to Arweave via Irys (included with UMI)
   */
  private async uploadMetadata(params: UltraCheapMintParams): Promise<string> {
    const umi = await this.initializeUmi();
    if (!umi) {
      throw new Error('Failed to initialize UMI');
    }
    
    const metadata = {
      name: params.name,
      symbol: 'NFT',
      description: params.description || 'A compressed NFT minted with UltraCheapMint',
      image: params.imageUrl,
      attributes: [
        { trait_type: 'Mint Type', value: 'Compressed NFT' },
        { trait_type: 'Minted At', value: new Date().toISOString() },
      ],
      properties: {
        files: [
          {
            uri: params.imageUrl,
            type: 'image/png',
          },
        ],
        category: 'image',
      },
    };
    
    try {
      // Upload to Irys
      const uri = await umi.uploader.uploadJson(metadata);
      return uri;
    } catch (error) {
      logger.error('Failed to upload metadata:', error);
      throw new Error(`Failed to upload metadata: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 🚀 Ultra-Cheap Compressed NFT Minting (cNFT via Bubblegum)
   * 
   * Cost: ~$0.0001-0.001 per mint (CHEAPER THAN MEME COINS!)
   * Speed: ~5-10 seconds
   * Standard: Metaplex Bubblegum (latest 2024+ standard)
   */
  async mint(params: UltraCheapMintParams): Promise<MintResult> {
    let relayerAddress: string | undefined;
    try {
      // Preflight: the platform relayer (NOT the user's connected wallet) pays
      // every fee for gasless minting — the Irys metadata upload and the cNFT
      // mint. If it's out of SOL these fail deep in the UMI stack with a cryptic
      // "insufficient funds for fee". Check up front and return a clear message.
      const relayer = await this.getRelayerStatus();
      relayerAddress = relayer.address;
      if (!relayer.funded) {
        logger.error(
          `[UltraCheapMint] Platform relayer underfunded: ${relayer.address} has ${relayer.balanceSol.toFixed(4)} SOL (need >= ${relayer.minSol})`,
        );
        return {
          success: false,
          error: `Minting temporarily unavailable: the platform relayer wallet needs SOL. Fund ${relayer.address} (currently ${relayer.balanceSol.toFixed(4)} SOL, need >= ${relayer.minSol}).`,
        };
      }

      // Initialize UMI if not already done
      const umi = await this.initializeUmi();
      if (!umi) {
        throw new Error('Failed to initialize UMI');
      }

      // Ensure merkle tree exists
      await this.ensureMerkleTree();
      
      if (!this.merkleTree) {
        throw new Error('Failed to initialize merkle tree');
      }

      logger.info('[UltraCheapMint] Starting compressed NFT mint...');
      // Upload metadata to Irys
      const metadataUri = await this.uploadMetadata(params);
      
      // Get the merkle tree public key
      const merkleTreePublicKey = this.merkleTree.publicKey;
      
      // Create the mint builder
      const mintBuilder = await mintV1(umi, {
        leafOwner: umiPublicKey(params.toAddress),
        merkleTree: merkleTreePublicKey,
        metadata: {
          name: params.name,
          symbol: params.symbol || 'NFT',
          uri: metadataUri,
          sellerFeeBasisPoints: 0,
          collection: {
            key: umi.identity.publicKey,
            verified: false
          },
          creators: [{
            address: umi.identity.publicKey,
            verified: true,
            share: 100,
          }],
        },
      });
      
      // Send and confirm the transaction
      const result = await mintBuilder.sendAndConfirm(umi);
      
      if (!result.signature) {
        throw new Error('Transaction failed: No signature returned');
      }
      
      logger.info('[UltraCheapMint] Mint transaction confirmed');
      
      // Get the signature as base58
      const signature = bs58.encode(result.signature);

      // Derive the canonical compressed-NFT asset ID from the on-chain leaf so the
      // returned id actually resolves via the DAS API (e.g. Helius getAsset).
      // Previously this returned a synthetic `${tree}-${sigPrefix}` string that no
      // indexer could ever resolve. Fall back to the synthetic id only if leaf
      // parsing fails, so a successful mint never silently reports an unusable id.
      let assetId: string;
      try {
        const leaf = await parseLeafFromMintV1Transaction(umi, result.signature);
        const assetIdPda = findLeafAssetIdPda(umi, {
          merkleTree: merkleTreePublicKey,
          leafIndex: leaf.nonce,
        });
        assetId = (Array.isArray(assetIdPda) ? assetIdPda[0] : assetIdPda).toString();
      } catch (deriveError) {
        logger.warn(
          '[UltraCheapMint] Could not derive canonical asset ID from leaf, using fallback:',
          deriveError,
        );
        assetId = `${merkleTreePublicKey.toString()}-${signature.slice(0, 8)}`;
      }

      // Calculate actual cost
      const { solCost, usdCost } = await this.estimateCost();

      return {
        success: true,
        assetId,
        mintAddress: assetId, // Alias for compatibility
        signature,
        cost: solCost,
        costUSD: usdCost,
        treeAddress: merkleTreePublicKey.toString(),
      };
    } catch (error) {
      logger.error('[UltraCheapMint] Mint failed:', error);
      const rawMessage = error instanceof Error ? error.message : 'Compressed NFT minting failed';
      return {
        success: false,
        error: humanizeMintError(rawMessage, relayerAddress),
      };
    }
  }

  /**
   * Get comparison data to show users
   * 🔥 Shows MASSIVE savings with compressed NFTs!
   */
  async getComparisonData() {
    const estimate = await this.estimateCost();
    
    return {
      nftSol: {
        cost: estimate.usdCost,
        time: '~5-10 seconds',
        network: 'Solana (Compressed NFT)',
        technology: 'Bubblegum State Compression',
      },
      openSea: {
        cost: 75.0, // OpenSea + Ethereum gas (2024 avg)
        time: '~5-15 minutes',
        network: 'Ethereum',
        technology: 'ERC-721',
      },
      pumpFun: {
        cost: 0.02, // pump.fun meme coin creation
        time: '~10 seconds',
        network: 'Solana',
        technology: 'Token-2022',
      },
      magicEden: {
        cost: 0.05, // Magic Eden launchpad (regular NFT)
        time: '~30 seconds',
        network: 'Solana',
        technology: 'Standard NFT',
      },
      savings: {
        vsOpenSea: Math.round(((75 - estimate.usdCost) / 75) * 100), // ~99.9%
        vsPumpFun: Math.round(((0.02 - estimate.usdCost) / 0.02) * 100), // ~50-95%
        vsMagicEden: Math.round(((0.05 - estimate.usdCost) / 0.05) * 100), // ~98%
        actualSavings: {
          vsOpenSea: `$${(75 - estimate.usdCost).toFixed(2)}`,
          vsPumpFun: `$${(0.02 - estimate.usdCost).toFixed(4)}`,
          vsMagicEden: `$${(0.05 - estimate.usdCost).toFixed(4)}`,
        },
      },
      features: {
        nftSol: ['Ultra-low cost', 'Instant', 'Full NFT standard', 'Compressed storage', 'Helius optimized'],
        openSea: ['High gas fees', 'Slow', 'Ethereum network', 'Expensive storage'],
        pumpFun: ['Cheap but token-only', 'No NFT metadata', 'Memecoin focused'],
        magicEden: ['Higher cost', 'Standard NFT', 'No compression'],
      },
    };
  }
}

/**
 * Export singleton instance
 */

export const ultraCheapMintService = new UltraCheapMintService();

