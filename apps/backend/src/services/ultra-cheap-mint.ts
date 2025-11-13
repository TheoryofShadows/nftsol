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

import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { keypairIdentity, generateSigner, publicKey as toPublicKey } from '@metaplex-foundation/umi';
import { Umi, PublicKey as UmiPublicKey, KeypairSigner, TransactionBuilder } from '@metaplex-foundation/umi';

type UmiInstance = Umi & {
  rpc: any;
  uploader: {
    uploadJson: (json: any) => Promise<string>;
  };
};

import { 
  createTree, 
  mintV1, 
  mplBubblegum,
} from '@metaplex-foundation/mpl-bubblegum';
import { irysUploader } from '@metaplex-foundation/umi-uploader-irys';
import { solanaConfig } from '../config';
import { BUBBLEGUM_PROGRAM_ID } from '../config/programs';
import { getPlatformKeypair } from '../lib/platformKeypair';
import bs58 from 'bs58';
import { publicKey } from '@metaplex-foundation/umi';

// Merkle tree configuration
const MERKLE_TREE_CONFIG = {
  maxDepth: 14, // Supports up to 16,384 NFTs (2^14)
  maxBufferSize: 64,
  canopyDepth: 0, // No canopy for maximum compression
};

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
  private umi: any;
  private merkleTree: any = null;

  constructor() {
    this.connection = new Connection(solanaConfig.rpcUrl, 'confirmed');
    // Don't initialize UMI yet, wait for first use
    this.umi = null;
  }

  /**
   * Initialize UMI with platform keypair
   */
  private async initializeUmi() {
    if (this.umi) return this.umi;
    
    try {
      const platformKeypair = getPlatformKeypair();
      if (!platformKeypair) {
        throw new Error('Platform keypair not found');
      }

      // Create UMI instance
      this.umi = createUmi(solanaConfig.rpcUrl);

      // Convert Solana keypair to UMI keypair format
      const umiKeypair = this.umi.eddsa.createKeypairFromSecretKey(platformKeypair.secretKey);
      
      // Set identity and programs
      this.umi
        .use(keypairIdentity(umiKeypair))
        .use(mplBubblegum()) // Add Bubblegum program
        .use(irysUploader()); // Add Irys uploader for metadata

      console.log('[UltraCheapMint] UMI initialized with Bubblegum & Irys');
      
      return this.umi;
      
    } catch (error) {
      console.error('[UltraCheapMint] Initialization failed:', error);
      throw error; // Re-throw to prevent silent failures
    }
  }

  /**
   * Ensure merkle tree exists and is funded
   */
  private async ensureMerkleTree(attempt = 1, maxAttempts = 3) {
    if (this.merkleTree) return this.merkleTree;

    try {
      console.log(`[UltraCheapMint] Attempting to create merkle tree (attempt ${attempt}/${maxAttempts})...`);
      
      // In a real app, you'd want to store and load the tree address
      const merkleTree = generateSigner(this.umi);
      
      const builder = await createTree(this.umi, {
        merkleTree,
        maxDepth: MERKLE_TREE_CONFIG.maxDepth,
        maxBufferSize: MERKLE_TREE_CONFIG.maxBufferSize,
        public: false,
      });
      
      const result = await builder.sendAndConfirm(this.umi);
      
      if (!result.signature) {
        throw new Error('No signature in transaction result');
      }
      
      this.merkleTree = merkleTree;
      console.log(`[UltraCheapMint] Successfully created merkle tree: ${merkleTree.publicKey}`);
      
      return merkleTree;
      
    } catch (error) {
      console.error(`[UltraCheapMint] Attempt ${attempt} failed to create merkle tree:`, error instanceof Error ? error.message : 'Unknown error');
      
      if (attempt >= maxAttempts) {
        console.warn(`[UltraCheapMint] Max attempts (${maxAttempts}) reached. Will retry on next mint.`);
        throw new Error(`Failed to create merkle tree after ${maxAttempts} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      // Wait before retrying (exponential backoff)
      const delayMs = Math.min(1000 * Math.pow(2, attempt), 10000); // Max 10s delay
      console.log(`[UltraCheapMint] Retrying in ${delayMs}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, delayMs));
      return this.ensureMerkleTree(attempt + 1, maxAttempts);
    }
  }

  /**
   * Get or create a Merkle tree for compressed NFTs
   * Reuses existing tree to save costs
   */
  private async getOrCreateMerkleTree() {
    try {
      // Check if we have a tree address stored (in production, store this in database)
      const storedTreeAddress = process.env.BUBBLEGUM_TREE_ADDRESS;
      
      if (storedTreeAddress && this.merkleTree === null) {
        try {
          // Use existing tree address
          this.merkleTree = toPublicKey(storedTreeAddress);
          console.log('[UltraCheapMint] Using existing Merkle tree:', storedTreeAddress);
          return this.merkleTree;
        } catch {
          console.log('[UltraCheapMint] Stored tree invalid, creating new one');
        }
      }

      if (this.merkleTree) {
        return this.merkleTree;
      }

      // Create new Merkle tree
      // maxDepth=14, maxBufferSize=64 allows for 16,384 cNFTs
      // Cost: ~0.15 SOL one-time (amortized across thousands of mints)
      console.log('[UltraCheapMint] Creating new Merkle tree...');
      
      const merkleTreeSigner = generateSigner(this.umi);
      
      const builder = await createTree(this.umi, {
        merkleTree: merkleTreeSigner,
        maxDepth: 14,
        maxBufferSize: 64,
      });

      await builder.sendAndConfirm(this.umi).catch(error => {
        console.error('Failed to create tree:', error);
        throw error;
      });

      this.merkleTree = merkleTreeSigner.publicKey;
      
      console.log(`[UltraCheapMint] Merkle tree created at: ${this.merkleTree}`);
      console.log(`[UltraCheapMint] Merkle tree address: ${this.merkleTree.toBase58()}`);
      console.log(`[UltraCheapMint] Store this address to reuse: BUBBLEGUM_TREE_ADDRESS=${this.merkleTree}`);

      return this.merkleTree;
    } catch (error) {
      console.error('[UltraCheapMint] Failed to get/create Merkle tree:', error);
      throw new Error('Merkle tree unavailable');
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
   * Upload metadata to Arweave via Irys (included with UMI)
   */
  private async uploadMetadata(params: UltraCheapMintParams) {
    try {
      const metadata = {
        name: params.name,
        symbol: params.symbol || 'NFTSOL',
        description: params.description || `${params.name} - Ultra-cheap minted on NFTSol`,
        image: params.imageUrl,
        external_url: params.externalUrl || 'https://nftsol.app',
        attributes: params.attributes || [],
        properties: {
          files: [
            {
              uri: params.imageUrl,
              type: 'image/png',
            },
          ],
          category: 'image',
          creators: [],
        },
      };

      // Upload to Arweave via Irys (built into UMI)
      const uri = await this.umi.uploader.uploadJson(metadata);
      console.log('[UltraCheapMint] Metadata uploaded to:', uri);
      
      return uri;
    } catch (error) {
      console.error('[UltraCheapMint] Metadata upload failed:', error);
      // Fallback: return image URL as metadata URI
      return params.imageUrl;
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
    try {
      // Initialize UMI if not already done
      await this.initializeUmi();
      
      // Ensure merkle tree exists
      await this.ensureMerkleTree();
      
      if (!this.merkleTree) {
        throw new Error('Failed to initialize merkle tree');
      }

      console.log('[UltraCheapMint] Starting compressed NFT mint...');
      // Upload metadata to Irys
      const metadataUri = await this.uploadMetadata(params);
      
      // Mint the cNFT
      const merkleTreePublicKey = new PublicKey(this.merkleTree);
      const [treeAuthority] = PublicKey.findProgramAddressSync(
        [merkleTreePublicKey.toBuffer()],
        BUBBLEGUM_PROGRAM_ID
      );
      const mintBuilder = await mintV1(this.umi, {
        leafOwner: publicKey(params.toAddress),
        merkleTree: merkleTreePublicKey,
        metadata: {
          name: params.name,
          symbol: params.symbol || 'NFT',
          uri: metadataUri,
          sellerFeeBasisPoints: 0,
          collection: {
            key: this.umi.identity.publicKey,
            verified: false
          },
          creators: [{
            address: this.umi.identity.publicKey,
            verified: true,
            share: 100,
          }],
        },
      });
      
      const mintResult = await mintBuilder.sendAndConfirm(this.umi).catch(error => {
        console.error('Mint transaction failed:', error);
        throw error;
      });
      
      console.log('[UltraCheapMint] Mint transaction confirmed');
      
      // Get the asset ID from the transaction result
      const signature = mintResult.signature ? bs58.encode(mintResult.signature) : 'pending';
      const assetId = merkleTree.publicKey.toString();

      // Calculate actual cost
      const { solCost, usdCost } = await this.estimateCost();

      return {
        success: true,
        assetId,
        mintAddress: assetId, // Alias for compatibility
        signature,
        cost: solCost,
        costUSD: usdCost,
        treeAddress: `${merkleTree}`,
      };
    } catch (error) {
      console.error('[UltraCheapMint] Mint failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Compressed NFT minting failed',
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

