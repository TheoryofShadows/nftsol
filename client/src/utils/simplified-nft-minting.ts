export interface SimplifiedNFTData {
  name: string;
  description: string;
  imageFile: File | null;
  price: string;
  royalty: string;
}

export interface NFTMintResult {
  success: boolean;
  mintAddress?: string;
  metadataUri?: string;
  signature?: string;
  error?: string;
}

export async function simplifiedMintNFT(
  nftData: SimplifiedNFTData,
  creatorWallet: string
): Promise<NFTMintResult> {
  try {
    // Validate inputs
    if (!nftData.name.trim()) {
      return { success: false, error: "NFT name is required" };
    }
    
    if (!nftData.description.trim()) {
      return { success: false, error: "NFT description is required" };
    }
    
    if (!nftData.price || parseFloat(nftData.price) <= 0) {
      return { success: false, error: "Valid price is required" };
    }
    
    if (!nftData.imageFile) {
      return { success: false, error: "Image file is required" };
    }

    if (!window.solana?.isConnected || !window.solana.publicKey) {
      return { success: false, error: "Wallet not connected" };
    }

    // Create FormData to include image file
    const formData = new FormData();
    formData.append('name', nftData.name);
    formData.append('description', nftData.description);
    formData.append('price', nftData.price);
    formData.append('royalty', nftData.royalty);
    formData.append('creatorWallet', creatorWallet);
    if (nftData.imageFile) {
      formData.append('image', nftData.imageFile);
    }

    // Send to backend for minting with image upload
    const response = await fetch('/api/nfts/mint', {
      method: 'POST',
      body: formData, // FormData automatically sets correct Content-Type
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { 
        success: false, 
        error: errorData.error || 'Failed to mint NFT' 
      };
    }

    const result = await response.json();
    
    if (result.success) {
      return {
        success: true,
        mintAddress: result.mintAddress,
        metadataUri: result.metadataUri,
        signature: result.signature
      };
    } else {
      return {
        success: false,
        error: result.error || 'NFT minting failed'
      };
    }

  } catch (error) {
    console.error('NFT minting error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

// Helper function to validate file
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];

  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 10MB' };
  }

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'File must be PNG, JPG, or GIF' };
  }

  return { valid: true };
}

// Helper function to estimate gas fees
export function estimateMintingCosts(price: string) {
  const priceNum = parseFloat(price) || 0;
  const mintingFee = 0.01; // SOL
  const platformFee = priceNum * 0.02; // 2%
  const networkFee = 0.0001; // Estimated network fee

  return {
    mintingFee,
    platformFee,
    networkFee,
    total: mintingFee + networkFee,
    sellerReceives: priceNum * 0.955 // Industry-leading 95.5% seller rate
  };
}