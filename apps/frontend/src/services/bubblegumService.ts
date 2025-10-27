/**
 * 🚀 Frontend Bubblegum Service - Mass cNFT Drops Client
 * Client for interacting with Bubblegum v2 API
 */

// API base URL from environment
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

// cNFT Metadata Interface
export interface CompressedNFTMetadata {
  name: string;
  symbol: string;
  description: string;
  image: string;
  external_url?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

export interface CreateTreeResponse {
  treeAddress: string;
  signature: string;
  capacity: number;
  maxDepth: number;
  maxBufferSize: number;
}

export interface MintResponse {
  assetId: string;
  signature: string;
  metadata: CompressedNFTMetadata;
}

export interface BulkMintResponse {
  minted: number;
  total: number;
  signatures: string[];
  totalCost: number;
  averageCostPerNFT: number;
}

export interface MerkleProofResponse {
  treeAddress: string;
  leafIndex: number;
  proof: string[];
}

export interface ServiceInfo {
  name: string;
  version: string;
  description: string;
  features: string[];
  costPerNFT: string;
  typicalBatchSize: string;
  typicalCost: string;
}

class BubblegumServiceClient {
  private apiBase: string;

  constructor() {
    this.apiBase = API_BASE;
  }

  /**
   * Get service information
   */
  async getInfo(): Promise<ServiceInfo> {
    try {
      const response = await fetch(`${this.apiBase}/api/bubblegum/info`);
      if (!response.ok) {
        throw new Error('Failed to get service info');
      }
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error getting service info:', error);
      throw error;
    }
  }

  /**
   * Create a new Bubblegum tree
   */
  async createTree(options: {
    maxDepth?: number;
    maxBufferSize?: number;
    canopyDepth?: number;
  }): Promise<CreateTreeResponse> {
    try {
      const response = await fetch(`${this.apiBase}/api/bubblegum/create-tree`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          maxDepth: options.maxDepth || 14,
          maxBufferSize: options.maxBufferSize || 64,
          canopyDepth: options.canopyDepth || 0,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create tree');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error creating tree:', error);
      throw error;
    }
  }

  /**
   * Mint a single compressed NFT
   */
  async mintCompressedNFT(options: {
    treeAddress: string;
    metadata: CompressedNFTMetadata;
    owner?: string;
    collectionMint?: string;
  }): Promise<MintResponse> {
    try {
      const response = await fetch(`${this.apiBase}/api/bubblegum/mint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to mint compressed NFT');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error minting compressed NFT:', error);
      throw error;
    }
  }

  /**
   * Bulk mint compressed NFTs
   */
  async bulkMint(options: {
    treeAddress: string;
    metadatas: CompressedNFTMetadata[];
    owner?: string;
    batchSize?: number;
  }): Promise<BulkMintResponse> {
    try {
      const response = await fetch(`${this.apiBase}/api/bubblegum/bulk-mint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to bulk mint');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error bulk minting:', error);
      throw error;
    }
  }

  /**
   * Get Merkle proof for a compressed NFT
   */
  async getMerkleProof(
    treeAddress: string,
    leafIndex: number
  ): Promise<MerkleProofResponse> {
    try {
      const response = await fetch(
        `${this.apiBase}/api/bubblegum/merkle-proof?treeAddress=${treeAddress}&leafIndex=${leafIndex}`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get Merkle proof');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error getting Merkle proof:', error);
      throw error;
    }
  }

  /**
   * Verify a Merkle proof
   */
  async verifyProof(options: {
    treeAddress: string;
    leafIndex: number;
    proof: string[];
  }): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiBase}/api/bubblegum/verify-proof`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to verify proof');
      }

      const data = await response.json();
      return data.data.valid;
    } catch (error) {
      console.error('Error verifying proof:', error);
      throw error;
    }
  }

  /**
   * Upload metadata files to IPFS
   */
  async uploadToIPFS(metadata: CompressedNFTMetadata): Promise<string> {
    try {
      const response = await fetch(`${this.apiBase}/api/irys/upload-metadata`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metadata),
      });

      if (!response.ok) {
        throw new Error('Failed to upload metadata');
      }

      const data = await response.json();
      return data.data.uri;
    } catch (error) {
      console.error('Error uploading to IPFS:', error);
      throw error;
    }
  }
}

export const bubblegumService = new BubblegumServiceClient();
export default BubblegumServiceClient;
