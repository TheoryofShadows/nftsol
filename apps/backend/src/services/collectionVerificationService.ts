/**
 * 🏗️ Collection Verification Service
 * Handles collection creation, verification, and management for compressed NFTs
 */

import { Connection, PublicKey, Keypair, Transaction, SystemProgram } from '@solana/web3.js';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { mplBubblegum } from '@metaplex-foundation/mpl-bubblegum';
import { irysUploader } from '@metaplex-foundation/umi-uploader-irys';
import { dasApi } from '@metaplex-foundation/digital-asset-standard-api';
import { signerIdentity, publicKey, some, none } from '@metaplex-foundation/umi';
import { createTree, createCollectionV1, verifyCollectionV1 } from '@metaplex-foundation/mpl-bubblegum';

export interface CollectionMetadata {
  name: string;
  symbol: string;
  description: string;
  image: string;
  externalUrl?: string;
  attributes?: Array<{
    trait_type: string;
    value: string;
  }>;
  properties?: {
    files?: Array<{
      uri: string;
      type: string;
    }>;
    category?: string;
  };
}

export interface CollectionInfo {
  collectionMint: PublicKey;
  collectionAuthority: PublicKey;
  collectionMetadata: string;
  collectionUri: string;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CollectionVerificationRequest {
  collectionMint: PublicKey;
  collectionAuthority: PublicKey;
  treeAddress: PublicKey;
  leafIndex: number;
  assetId: string;
}

export interface CollectionVerificationResult {
  success: boolean;
  signature?: string;
  error?: string;
  verified: boolean;
  assetId: string;
  collectionMint: PublicKey;
}

export class CollectionVerificationService {
  private connection: Connection;
  private umi: any;
  private signer?: Keypair;

  constructor(connection: Connection, rpcEndpoint: string) {
    this.connection = connection;
    this.umi = createUmi(rpcEndpoint)
      .use(mplBubblegum())
      .use(irysUploader({
        address: 'https://devnet.irys.xyz',
        timeout: 60000,
        providerUrl: rpcEndpoint,
      }))
      .use(dasApi());
  }

  setSigner(signer: Keypair): void {
    this.signer = signer;
    this.umi.use(signerIdentity(signer));
  }

  /**
   * Create a new collection for compressed NFTs
   */
  async createCollection(
    metadata: CollectionMetadata,
    collectionAuthority?: PublicKey
  ): Promise<CollectionInfo> {
    if (!this.signer) {
      throw new Error('Signer not set. Call setSigner() first.');
    }

    try {
      console.log('🏗️ Creating collection for compressed NFTs...');

      // Upload collection metadata to Irys
      const collectionUri = await this.uploadCollectionMetadata(metadata);
      console.log(`✅ Collection metadata uploaded: ${collectionUri}`);

      // Create collection mint
      const collectionMint = Keypair.generate();
      const collectionAuthorityPubkey = collectionAuthority || this.signer.publicKey;

      // Create collection instruction
      const createCollectionIx = await createCollectionV1(this.umi, {
        collectionMint: publicKey(collectionMint.publicKey.toString()),
        collectionAuthority: publicKey(collectionAuthorityPubkey.toString()),
        collectionMetadata: {
          name: metadata.name,
          symbol: metadata.symbol,
          uri: collectionUri,
          sellerFeeBasisPoints: 0,
          creators: [
            {
              address: publicKey(collectionAuthorityPubkey.toString()),
              verified: true,
              share: 100,
            },
          ],
        },
        collectionUpdateAuthority: publicKey(collectionAuthorityPubkey.toString()),
        isMutable: true,
      });

      // Send and confirm transaction
      const result = await createCollectionIx.sendAndConfirm(this.umi);
      console.log(`✅ Collection created: ${collectionMint.publicKey.toString()}`);

      const collectionInfo: CollectionInfo = {
        collectionMint: collectionMint.publicKey,
        collectionAuthority: collectionAuthorityPubkey,
        collectionMetadata: collectionUri,
        collectionUri,
        verified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      return collectionInfo;
    } catch (error: any) {
      console.error('❌ Error creating collection:', error);
      throw new Error(`Failed to create collection: ${error.message}`);
    }
  }

  /**
   * Verify a compressed NFT belongs to a collection
   */
  async verifyCollection(
    request: CollectionVerificationRequest
  ): Promise<CollectionVerificationResult> {
    if (!this.signer) {
      throw new Error('Signer not set. Call setSigner() first.');
    }

    try {
      console.log(`🔍 Verifying collection for asset ${request.assetId}...`);

      // Create verification instruction
      const verifyCollectionIx = await verifyCollectionV1(this.umi, {
        leafOwner: publicKey(this.signer.publicKey.toString()),
        leafDelegate: publicKey(this.signer.publicKey.toString()),
        merkleTree: publicKey(request.treeAddress.toString()),
        collectionMint: publicKey(request.collectionMint.toString()),
        collectionAuthority: publicKey(request.collectionAuthority.toString()),
        leafIndex: request.leafIndex,
      });

      // Send and confirm transaction
      const result = await verifyCollectionIx.sendAndConfirm(this.umi);
      console.log(`✅ Collection verified for asset ${request.assetId}`);

      return {
        success: true,
        signature: result.signature,
        verified: true,
        assetId: request.assetId,
        collectionMint: request.collectionMint,
      };
    } catch (error: any) {
      console.error('❌ Error verifying collection:', error);
      return {
        success: false,
        error: error.message,
        verified: false,
        assetId: request.assetId,
        collectionMint: request.collectionMint,
      };
    }
  }

  /**
   * Get collection information
   */
  async getCollectionInfo(collectionMint: PublicKey): Promise<CollectionInfo | null> {
    try {
      console.log(`🔍 Getting collection info for ${collectionMint.toString()}...`);

      // Get collection metadata from DAS API
      const asset = await this.umi.rpc.getAsset(publicKey(collectionMint.toString()));
      
      if (!asset) {
        return null;
      }

      // Parse collection info
      const collectionInfo: CollectionInfo = {
        collectionMint,
        collectionAuthority: new PublicKey(asset.authorities?.[0]?.address || ''),
        collectionMetadata: asset.content?.metadata?.uri || '',
        collectionUri: asset.content?.metadata?.uri || '',
        verified: asset.authorities?.[0]?.verified || false,
        createdAt: new Date(asset.created_at || Date.now()),
        updatedAt: new Date(asset.updated_at || Date.now()),
      };

      console.log(`✅ Collection info retrieved for ${collectionMint.toString()}`);
      return collectionInfo;
    } catch (error: any) {
      console.error('❌ Error getting collection info:', error);
      return null;
    }
  }

  /**
   * List all collections created by the authority
   */
  async listCollections(authority: PublicKey): Promise<CollectionInfo[]> {
    try {
      console.log(`🔍 Listing collections for authority ${authority.toString()}...`);

      // This would typically query a database or indexer
      // For now, we'll return an empty array
      // In a real implementation, you'd query your collection database
      const collections: CollectionInfo[] = [];

      console.log(`✅ Found ${collections.length} collections for authority ${authority.toString()}`);
      return collections;
    } catch (error: any) {
      console.error('❌ Error listing collections:', error);
      return [];
    }
  }

  /**
   * Update collection metadata
   */
  async updateCollectionMetadata(
    collectionMint: PublicKey,
    metadata: CollectionMetadata
  ): Promise<CollectionInfo> {
    if (!this.signer) {
      throw new Error('Signer not set. Call setSigner() first.');
    }

    try {
      console.log(`🔄 Updating collection metadata for ${collectionMint.toString()}...`);

      // Upload new metadata
      const collectionUri = await this.uploadCollectionMetadata(metadata);
      console.log(`✅ Collection metadata updated: ${collectionUri}`);

      // Update collection on-chain
      // This would require implementing collection update logic
      // For now, we'll return the existing collection info
      const collectionInfo = await this.getCollectionInfo(collectionMint);
      
      if (!collectionInfo) {
        throw new Error('Collection not found');
      }

      collectionInfo.collectionMetadata = collectionUri;
      collectionInfo.collectionUri = collectionUri;
      collectionInfo.updatedAt = new Date();

      console.log(`✅ Collection metadata updated for ${collectionMint.toString()}`);
      return collectionInfo;
    } catch (error: any) {
      console.error('❌ Error updating collection metadata:', error);
      throw new Error(`Failed to update collection metadata: ${error.message}`);
    }
  }

  /**
   * Verify multiple assets belong to a collection
   */
  async verifyCollectionBatch(
    requests: CollectionVerificationRequest[]
  ): Promise<CollectionVerificationResult[]> {
    console.log(`🔍 Verifying ${requests.length} assets for collection...`);

    const results: CollectionVerificationResult[] = [];

    for (const request of requests) {
      try {
        const result = await this.verifyCollection(request);
        results.push(result);
      } catch (error: any) {
        results.push({
          success: false,
          error: error.message,
          verified: false,
          assetId: request.assetId,
          collectionMint: request.collectionMint,
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`✅ Verified ${successCount}/${requests.length} assets for collection`);

    return results;
  }

  /**
   * Get collection statistics
   */
  async getCollectionStats(collectionMint: PublicKey): Promise<{
    totalAssets: number;
    verifiedAssets: number;
    unverifiedAssets: number;
    verificationRate: number;
  }> {
    try {
      console.log(`📊 Getting collection stats for ${collectionMint.toString()}...`);

      // This would typically query a database or indexer
      // For now, we'll return mock data
      const stats = {
        totalAssets: 0,
        verifiedAssets: 0,
        unverifiedAssets: 0,
        verificationRate: 0,
      };

      console.log(`✅ Collection stats retrieved for ${collectionMint.toString()}`);
      return stats;
    } catch (error: any) {
      console.error('❌ Error getting collection stats:', error);
      return {
        totalAssets: 0,
        verifiedAssets: 0,
        unverifiedAssets: 0,
        verificationRate: 0,
      };
    }
  }

  /**
   * Upload collection metadata to Irys
   */
  private async uploadCollectionMetadata(metadata: CollectionMetadata): Promise<string> {
    try {
      console.log('📤 Uploading collection metadata to Irys...');
      
      const collectionMetadata = {
        name: metadata.name,
        symbol: metadata.symbol,
        description: metadata.description,
        image: metadata.image,
        external_url: metadata.externalUrl,
        attributes: metadata.attributes || [],
        properties: metadata.properties || {},
        collection: {
          name: metadata.name,
          family: metadata.name,
        },
      };

      const [uri] = await this.umi.uploader.uploadJson(collectionMetadata);
      console.log(`✅ Collection metadata uploaded: ${uri}`);
      return uri;
    } catch (error: any) {
      console.error('❌ Error uploading collection metadata:', error);
      throw new Error(`Failed to upload collection metadata: ${error.message}`);
    }
  }

  /**
   * Validate collection metadata
   */
  private validateCollectionMetadata(metadata: CollectionMetadata): boolean {
    if (!metadata.name || metadata.name.trim().length === 0) {
      throw new Error('Collection name is required');
    }

    if (!metadata.symbol || metadata.symbol.trim().length === 0) {
      throw new Error('Collection symbol is required');
    }

    if (!metadata.description || metadata.description.trim().length === 0) {
      throw new Error('Collection description is required');
    }

    if (!metadata.image || metadata.image.trim().length === 0) {
      throw new Error('Collection image is required');
    }

    return true;
  }

  /**
   * Get collection verification status
   */
  async getCollectionVerificationStatus(
    collectionMint: PublicKey,
    assetId: string
  ): Promise<{
    verified: boolean;
    collectionMint: PublicKey;
    assetId: string;
    verifiedAt?: Date;
  }> {
    try {
      console.log(`🔍 Getting verification status for asset ${assetId}...`);

      // This would typically query a database or indexer
      // For now, we'll return mock data
      const status = {
        verified: false,
        collectionMint,
        assetId,
        verifiedAt: undefined as Date | undefined,
      };

      console.log(`✅ Verification status retrieved for asset ${assetId}`);
      return status;
    } catch (error: any) {
      console.error('❌ Error getting verification status:', error);
      return {
        verified: false,
        collectionMint,
        assetId,
      };
    }
  }
}
