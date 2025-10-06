import { Metaplex, keypairIdentity, bundlrStorage } from "@metaplex-foundation/js";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { uploadToIPFS } from "./ipfs-storage";

const RPC_URL = import.meta.env.VITE_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
const connection = new Connection(RPC_URL, 'confirmed');

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
  creator?: string;
  collection?: string;
  royalty?: number; // Basis points (250 = 2.5%)
}

export interface MintResult {
  success: boolean;
  mintAddress?: string;
  metadataUri?: string;
  signature?: string;
  error?: string;
}

export async function mintNFT(
  metadata: NFTMetadata,
  creatorWallet: string,
  imageFile?: File
): Promise<MintResult> {
  try {
    if (!window.solana?.signTransaction) {
      throw new Error('Wallet not connected');
    }

    // Upload image to IPFS if provided
    let imageUri = metadata.image;
    if (imageFile) {
      const uploadResult = await uploadToIPFS(imageFile);
      if (!uploadResult.success) {
        throw new Error('Failed to upload image to IPFS');
      }
      imageUri = uploadResult.url!;
    }

    // Prepare complete metadata
    const completeMetadata = {
      name: metadata.name,
      description: metadata.description,
      image: imageUri,
      attributes: metadata.attributes || [],
      properties: {
        files: [
          {
            uri: imageUri,
            type: imageFile?.type || "image/png"
          }
        ],
        category: "image",
        creators: [
          {
            address: creatorWallet,
            share: 100
          }
        ]
      }
    };

    // Upload metadata to IPFS
    const metadataBlob = new Blob([JSON.stringify(completeMetadata)], {
      type: 'application/json'
    });
    const metadataFile = new File([metadataBlob], 'metadata.json');
    const metadataUpload = await uploadToIPFS(metadataFile);
    
    if (!metadataUpload.success) {
      throw new Error('Failed to upload metadata to IPFS');
    }

    // Create Metaplex instance (using wallet as signer)
    const metaplex = Metaplex.make(connection);

    // Create NFT using Metaplex
    const { nft } = await metaplex
      .nfts()
      .create({
        uri: metadataUpload.url!,
        name: metadata.name,
        sellerFeeBasisPoints: metadata.royalty || 250, // 2.5% default royalty
        symbol: "NFTSOL",
        creators: [
          {
            address: new PublicKey(creatorWallet),
            share: 100,
            verified: true
          }
        ],
        isMutable: true,
        maxSupply: 1
      });

    // Process minting fee payment
    await processMintingFee(creatorWallet, 0.01); // 0.01 SOL minting fee

    // Record NFT in database
    await recordNFTCreation({
      mintAddress: nft.address.toString(),
      creator: creatorWallet,
      metadata: completeMetadata,
      metadataUri: metadataUpload.url!,
      price: 0, // Will be set when listed
      status: 'minted'
    });

    return {
      success: true,
      mintAddress: nft.address.toString(),
      metadataUri: metadataUpload.url!,
      signature: nft.updateAuthorityAddress.toString()
    };

  } catch (error) {
    console.error('NFT minting failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Minting failed'
    };
  }
}

async function processMintingFee(creatorWallet: string, feeAmount: number) {
  try {
    const response = await fetch('/api/platform/minting-fee', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creatorWallet,
        feeAmount,
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error('Failed to process minting fee');
    }

    // Award CLOUT tokens for minting
    await fetch('/api/clout/award', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transactions: [{
          walletAddress: creatorWallet,
          amount: 300, // 300 CLOUT bonus for minting
          reason: 'NFT Creation Bonus'
        }]
      })
    });

  } catch (error) {
    console.error('Minting fee processing failed:', error);
    // Non-critical - don't fail the mint
  }
}

async function recordNFTCreation(nftData: any) {
  try {
    await fetch('/api/nfts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nftData)
    });
  } catch (error) {
    console.error('Failed to record NFT creation:', error);
  }
}

export async function listNFTForSale(
  mintAddress: string,
  price: number,
  ownerWallet: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/nfts/list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mintAddress,
        price,
        ownerWallet,
        listedAt: new Date().toISOString(),
        status: 'listed'
      })
    });

    if (!response.ok) {
      throw new Error('Failed to list NFT');
    }

    return { success: true };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Listing failed'
    };
  }
}

export async function getUserNFTs(walletAddress: string) {
  try {
    const response = await fetch(`/api/nfts/user/${walletAddress}`);
    if (!response.ok) {
      throw new Error('Failed to fetch user NFTs');
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch user NFTs:', error);
    return [];
  }
}

export async function getMarketplaceNFTs() {
  try {
    const response = await fetch('/api/nfts/marketplace');
    if (!response.ok) {
      throw new Error('Failed to fetch marketplace NFTs');
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch marketplace NFTs:', error);
    return [];
  }
}