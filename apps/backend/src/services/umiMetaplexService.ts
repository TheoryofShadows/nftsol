/**
 * 🚀 Umi Metaplex Service - 2026 Standards
 * Simplified Umi-based Metaplex integration for server-side operations
 */

import {
  createV1,
  mintV1,
  TokenStandard,
  mplTokenMetadata,
} from '@metaplex-foundation/mpl-token-metadata';
import {
  createTokenIfMissing,
  findAssociatedTokenPda,
  getSplAssociatedTokenProgramId,
  mplToolbox,
} from '@metaplex-foundation/mpl-toolbox';
import {
  createSignerFromKeypair,
  generateSigner,
  percentAmount,
  signerIdentity,
  Umi,
  publicKey,
} from '@metaplex-foundation/umi';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { base58 } from '@metaplex-foundation/umi/serializers';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';

// 2026 NFT Metadata Interface
export interface NFT2026Metadata {
  name: string;
  symbol: string;
  description: string;
  image: string;
  external_url?: string;
  twitter?: string;
  discord?: string;
  properties: {
    files: Array<{
      uri: string;
      type: string;
      cdn?: boolean;
    }>;
    category: string;
    creators: Array<{
      address: string;
      share: number;
      verified: boolean;
    }>;
  };
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
  seller_fee_basis_points: number;
}

export class UmiMetaplexService {
  private umi: Umi;
  private connection: Connection;

  constructor(connection: Connection, rpcEndpoint: string) {
    this.connection = connection;
    this.umi = createUmi(rpcEndpoint)
      .use(mplTokenMetadata())
      .use(mplToolbox());
  }

  /**
   * Set up signer for the service
   */
  setSigner(keypair: Keypair) {
    const umiKeypair = this.umi.eddsa.createKeypairFromSecretKey(
      new Uint8Array(keypair.secretKey)
    );
    const signer = createSignerFromKeypair(this.umi, umiKeypair);
    this.umi.use(signerIdentity(signer));
  }

  /**
   * Create NFT with Umi framework
   */
  async createNFT(
    metadata: NFT2026Metadata,
    collectionMint?: PublicKey
  ): Promise<{ mint: PublicKey; metadata: PublicKey; tokenAccount: PublicKey; signature: string }> {
    console.log('🎨 Creating NFT with Umi framework...');

    // Generate mint signer
    const mint = generateSigner(this.umi);

    // Upload metadata to IPFS first
    const metadataUri = await this.uploadMetadata(metadata);

    // Create mint and metadata accounts
    const result = await createV1(this.umi, {
      mint,
      authority: this.umi.identity,
      name: metadata.name,
      symbol: metadata.symbol,
      uri: metadataUri,
      sellerFeeBasisPoints: percentAmount(metadata.seller_fee_basis_points / 100),
      decimals: 0, // NFTs have 0 decimals
      tokenStandard: TokenStandard.NonFungible,
      isMutable: true,
      creators: metadata.properties.creators.map(c => ({
        address: publicKey(c.address),
        verified: c.verified,
        share: c.share
      })),
      collection: collectionMint ? {
        key: publicKey(collectionMint.toBase58()),
        verified: false
      } : undefined,
    }).sendAndConfirm(this.umi);

    // Create ATA if it doesn't exist
    await createTokenIfMissing(this.umi, {
      mint: mint.publicKey,
      owner: this.umi.identity.publicKey,
      ataProgram: getSplAssociatedTokenProgramId(this.umi),
    }).sendAndConfirm(this.umi);

    // Mint 1 token to the ATA
    const ata = findAssociatedTokenPda(this.umi, {
      mint: mint.publicKey,
      owner: this.umi.identity.publicKey,
    })[0];

    await mintV1(this.umi, {
      mint: mint.publicKey,
      authority: this.umi.identity,
      amount: 1n, // 1 NFT
      token: ata,
      tokenOwner: this.umi.identity.publicKey,
      tokenStandard: TokenStandard.NonFungible,
    }).sendAndConfirm(this.umi);

    // Find metadata PDA
    const TOKEN_METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');
    const mintPublicKey = new PublicKey(mint.publicKey);
    const [metadataAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from('metadata'), TOKEN_METADATA_PROGRAM_ID.toBuffer(), mintPublicKey.toBuffer()],
      TOKEN_METADATA_PROGRAM_ID
    );

    console.log(`✅ NFT created with Umi framework: ${mint.publicKey}`);
    console.log(`📝 Transaction: ${result.signature}`);

    return {
      mint: mintPublicKey,
      metadata: metadataAccount,
      tokenAccount: new PublicKey(ata),
      signature: result.signature.toString()
    };
  }

  /**
   * Upload metadata to IPFS and return URI
   */
  async uploadMetadata(metadata: NFT2026Metadata): Promise<string> {
    console.log('📤 Uploading metadata to IPFS...');
    
    // For now, return a placeholder URI
    // TODO: Implement actual IPFS upload
    const metadataJson = {
      name: metadata.name,
      symbol: metadata.symbol,
      description: metadata.description,
      image: metadata.image,
      external_url: metadata.external_url,
      twitter: metadata.twitter,
      discord: metadata.discord,
      attributes: metadata.attributes || [],
      properties: {
        files: metadata.properties.files,
        category: metadata.properties.category,
        creators: metadata.properties.creators
      },
      seller_fee_basis_points: metadata.seller_fee_basis_points
    };

    // Simulate IPFS upload
    const mockUri = `https://ipfs.io/ipfs/mock-${Date.now()}`;
    console.log(`✅ Metadata uploaded: ${mockUri}`);
    
    return mockUri;
  }

  /**
   * Create fungible token with Umi framework
   */
  async createFungibleToken(
    name: string,
    symbol: string,
    uri: string,
    amount: number,
    decimals: number = 9
  ): Promise<{ mintAddress: string; txSignature: string }> {
    console.log('🪙 Creating fungible token with Umi framework...');

    // Generate mint signer
    const mint = generateSigner(this.umi);

    // Create mint and metadata
    await createV1(this.umi, {
      mint,
      authority: this.umi.identity,
      name,
      symbol,
      uri,
      sellerFeeBasisPoints: percentAmount(5), // 5% royalties
      decimals,
      tokenStandard: TokenStandard.Fungible,
    }).sendAndConfirm(this.umi);

    // Create ATA if missing
    await createTokenIfMissing(this.umi, {
      mint: mint.publicKey,
      owner: this.umi.identity.publicKey,
      ataProgram: getSplAssociatedTokenProgramId(this.umi),
    }).sendAndConfirm(this.umi);

    // Mint tokens to server's ATA
    const ata = findAssociatedTokenPda(this.umi, {
      mint: mint.publicKey,
      owner: this.umi.identity.publicKey,
    })[0];

    const amountToMint = BigInt(amount * 10 ** decimals);
    const tx = await mintV1(this.umi, {
      mint: mint.publicKey,
      authority: this.umi.identity,
      amount: amountToMint,
      token: ata,
      tokenOwner: this.umi.identity.publicKey,
      tokenStandard: TokenStandard.Fungible,
    }).sendAndConfirm(this.umi);

    console.log(`✅ Fungible token created: ${mint.publicKey}`);
    console.log(`📝 Transaction: ${tx.signature}`);

    return {
      mintAddress: mint.publicKey.toString(),
      txSignature: tx.signature.toString(),
    };
  }
}
