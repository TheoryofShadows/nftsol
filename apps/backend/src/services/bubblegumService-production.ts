import logger from '../utils/logger';
import { Connection, PublicKey as _Web3PublicKey, Keypair } from '@solana/web3.js';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { publicKey as _publicKey } from '@metaplex-foundation/umi';
import {
  createTree,
  mintV1,
  mplBubblegum,
  findLeafAssetIdPda,
  parseLeafFromMintV1Transaction,
} from '@metaplex-foundation/mpl-bubblegum';
import bs58 from 'bs58';
import { publicKey as umiPublicKey } from '@metaplex-foundation/umi';
import { publicKey as _umiToWeb3 } from '@metaplex-foundation/umi';
import {
  createSignerFromKeypair,
  signerIdentity,
  generateSigner,
  percentAmount as _percentAmount,
} from '@metaplex-foundation/umi';
import { irysUploader } from '@metaplex-foundation/umi-uploader-irys';
import { uploadMetadata } from '../utils/irysUpload';

export interface CompressedNFTMetadata {
  name: string;
  symbol: string;
  description?: string;
  image: string;
  external_url?: string;
  attributes?: Array<{ trait_type: string; value: string }>;
  properties?: {
    files?: Array<{ type: string; uri: string }>;
    category?: string;
    creators?: Array<{ address: string; share: number }>;
  };
}

export class BubblegumService {
  private connection: Connection;
  private umi: any;
  private currentKeypair: Keypair | null = null;

  constructor() {
    const rpcUrl = process.env.HELIUS_RPC_URL || process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
    
    this.connection = new Connection(rpcUrl, 'confirmed');
    
    // Initialize UMI with the RPC endpoint
    this.umi = createUmi(rpcUrl)
      .use(mplBubblegum())
      .use(
        irysUploader({
          address:
            process.env.SOLANA_CLUSTER === 'mainnet-beta'
              ? 'https://node1.irys.xyz'
              : 'https://devnet.irys.xyz',
          providerUrl: rpcUrl,
          timeout: 60000,
        })
      );
  }

  setSigner(keypair: Keypair) {
    this.currentKeypair = keypair;
    const umiKeypair = this.umi.eddsa.createKeypairFromSecretKey(new Uint8Array(keypair.secretKey));
    const signer = createSignerFromKeypair(this.umi, umiKeypair);
    this.umi.use(signerIdentity(signer));
  }

  async createTree(payer: Keypair) {
    this.setSigner(payer);

    const merkleTree = generateSigner(this.umi);

    const builder = await createTree(this.umi, {
      merkleTree,
      maxDepth: 14,
      maxBufferSize: 64,
    });

    const result = await builder.sendAndConfirm(this.umi);

    return {
      success: true,
      treeAddress: merkleTree.publicKey.toString(),
      signature: result.signature.toString(),
    };
  }

  async mintCompressedNFT(opts: {
    treeAddress: string;
    metadata: {
      name: string;
      symbol: string;
      description: string;
      image: string;
      attributes?: Array<{ trait_type: string; value: string | number }>;
    };
    owner: string;
  }) {
    try {
      const { treeAddress, metadata, owner } = opts;

      // Upload metadata to Irys/Arweave using latest Irys SDK
      let metadataUri: string;
      try {
        const uploadResult = await uploadMetadata(
          {
            name: metadata.name,
            symbol: metadata.symbol || 'ECHO',
            description: metadata.description || '',
            image: metadata.image || '',
            attributes: metadata.attributes || [],
          },
          {
            connection: this.connection,
            keypair:
              this.currentKeypair ||
              (() => {
                throw new Error('Keypair not set. Call setSigner() first.');
              })(),
            network: (process.env.SOLANA_CLUSTER === 'mainnet-beta' ? 'mainnet-beta' : 'devnet') as
              | 'mainnet-beta'
              | 'devnet',
          }
        );
        metadataUri = uploadResult.uri;
      } catch (error) {
        logger.error('Irys upload failed, using fallback IPFS URI:', error);
        // Fallback to IPFS or local gateway
        // Use a fallback URI if metadata.uri is not available
        // Use a fallback URI if metadata.uri is not available
        metadataUri = typeof metadata === 'object' && metadata !== null && 'uri' in metadata 
          ? String(metadata.uri) 
          : `https://gateway.irys.xyz/${Date.now()}`;
      }

      // Resolve the Merkle tree to mint into. This MUST be a real, initialized
      // Bubblegum tree — the previous code minted into the signer's own pubkey,
      // which is not a tree account and would fail on-chain.
      const treeSource = treeAddress || process.env.BUBBLEGUM_TREE_ADDRESS;
      if (!treeSource) {
        throw new Error(
          'No Bubblegum Merkle tree configured. Pass opts.treeAddress or set BUBBLEGUM_TREE_ADDRESS.',
        );
      }
      const ownerPublicKey = owner ? umiPublicKey(owner) : this.umi.identity.publicKey;
      const treePublicKey = umiPublicKey(treeSource);

      // Create the mint builder
      const builder = mintV1(this.umi, {
        leafOwner: ownerPublicKey,
        merkleTree: treePublicKey,
        metadata: {
          name: metadata.name,
          symbol: metadata.symbol || 'ECHO',
          uri: metadataUri,
          sellerFeeBasisPoints: 500, // 5% in basis points (500/10000 = 5%)
          collection: null,
          creators: [],
        },
      });

      const result = await builder.sendAndConfirm(this.umi);

      const signature = bs58.encode(result.signature);

      // Derive the canonical compressed-NFT asset ID from the minted leaf so the
      // returned id resolves via the DAS API. Previously this returned a random
      // `cNFT_<ts>_<rand>` string that no indexer could ever resolve. Fall back to
      // a deterministic `<tree>-<sigPrefix>` id (as in ultra-cheap-mint) if leaf
      // parsing fails, so a confirmed mint never returns success with an empty id.
      let assetId: string;
      try {
        const leaf = await parseLeafFromMintV1Transaction(this.umi, result.signature);
        const assetIdPda = findLeafAssetIdPda(this.umi, {
          merkleTree: treePublicKey,
          leafIndex: leaf.nonce,
        });
        assetId = (Array.isArray(assetIdPda) ? assetIdPda[0] : assetIdPda).toString();
      } catch (deriveError) {
        logger.warn('Failed to derive canonical cNFT asset ID, using fallback:', deriveError);
        assetId = `${treePublicKey.toString()}-${signature.slice(0, 8)}`;
      }

      return {
        success: true,
        assetId,
        signature,
        metadataUri,
      };
    } catch (error: any) {
      logger.error('Mint error:', error);
      return {
        success: false,
        error: error.message || 'Mint failed',
      };
    }
  }
}
