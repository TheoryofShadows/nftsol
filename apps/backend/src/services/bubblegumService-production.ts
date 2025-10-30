import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { 
  createTree,
  mintV1,
  mplBubblegum 
} from '@metaplex-foundation/mpl-bubblegum';
import {
  createSignerFromKeypair,
  signerIdentity,
  generateSigner,
  percentAmount,
} from '@metaplex-foundation/umi';

export class BubblegumService {
  private connection: Connection;
  private umi: any;

  constructor() {
    this.connection = new Connection(
      process.env.HELIUS_RPC_URL || process.env.SOLANA_RPC_URL!,
      'confirmed'
    );
    this.umi = createUmi(this.connection.rpcEndpoint)
      .use(mplBubblegum());
  }

  setSigner(keypair: Keypair) {
    const umiKeypair = this.umi.eddsa.createKeypairFromSecretKey(
      new Uint8Array(keypair.secretKey)
    );
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

      // Upload metadata to Irys (simplified - in production use proper upload)
      const metadataUri = `https://gateway.irys.xyz/${Date.now()}`; // Mock for now

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
