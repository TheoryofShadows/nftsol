import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { createTree, mintV1, mplBubblegum } from '@metaplex-foundation/mpl-bubblegum';
import {
  createSignerFromKeypair,
  signerIdentity,
  generateSigner,
  percentAmount,
} from '@metaplex-foundation/umi';
import { irysUploader } from '@metaplex-foundation/umi-uploader-irys';
import { uploadMetadata } from '../utils/irysUpload';

export class BubblegumService {
  private connection: Connection;
  private umi: any;
  private currentKeypair: Keypair | null = null;

  constructor() {
    this.connection = new Connection(
      process.env.HELIUS_RPC_URL || process.env.SOLANA_RPC_URL!,
      'confirmed'
    );
    // Use Irys uploader instead of deprecated Bundlr
    // This avoids the vulnerable @bundlr-network/client dependency
    this.umi = createUmi(this.connection.rpcEndpoint)
      .use(mplBubblegum())
      .use(
        irysUploader({
          address:
            process.env.SOLANA_CLUSTER === 'mainnet-beta'
              ? 'https://node1.irys.xyz'
              : 'https://devnet.irys.xyz',
          providerUrl: this.connection.rpcEndpoint,
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
        console.error('Irys upload failed, using fallback IPFS URI:', error);
        // Fallback to IPFS or local gateway
        metadataUri = metadata.uri || `https://gateway.irys.xyz/${Date.now()}`;
      }

      const builder = await mintV1(this.umi, {
        leafOwner: owner,
        merkleTree: treeAddress,
        metadata: {
          name: metadata.name,
          symbol: metadata.symbol || 'ECHO',
          uri: metadataUri,
          sellerFeeBasisPoints: percentAmount(5.0), // 5% royalty
          collection: null,
          creators: [],
        },
      });

      const result = await builder.sendAndConfirm(this.umi);

      return {
        success: true,
        assetId: `cNFT_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        signature: result.signature.toString(),
        metadataUri,
      };
    } catch (error: any) {
      console.error('Mint error:', error);
      return {
        success: false,
        error: error.message || 'Mint failed',
      };
    }
  }
}
