// NFTSol Wallet Configuration
// This file manages the platform wallet addresses for the marketplace

export const PLATFORM_WALLETS = {
  // Developer commission wallet (2% of all sales)
  DEVELOPER: {
    publicKey: '3WCkmqcoJZnVbscWSD3xr9tyG1kqnc3MsVPusriKKKad',
    purpose: 'Receives 2% commission from all marketplace sales',
    commissionRate: 0.02
  },
  
  // CLOUT treasury for token rewards
  CLOUT_TREASURY: {
    publicKey: 'FsoPx1WmXA6FDxYTSULRDko3tKbNG7KxdRTq2icQJGjM',
    purpose: 'Manages CLOUT token distribution and rewards',
    dailyLimit: 100000
  },
  
  // Marketplace treasury for operational funds
  MARKETPLACE_TREASURY: {
    publicKey: 'Aqx6ozBZmH761aEwtpiVcA33eQGLnbXtHPepi1bMfjgs',
    purpose: 'Handles operational funds and platform reserves',
    isConfigured: true
  },
  
  // Creator escrow for royalty management
  CREATOR_ESCROW: {
    publicKey: '3WCkmqcoJZnVbscWSD3xr9tyG1kqnc3MsVPusriKKKad',
    purpose: 'Temporary holding for creator royalties and payments',
    isConfigured: true
  }
};

// Validation function for Solana addresses
export function validateSolanaAddress(address: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
}

// Get wallet configuration status
export function getWalletConfigStatus() {
  return {
    developer: {
      configured: !!PLATFORM_WALLETS.DEVELOPER.publicKey && validateSolanaAddress(PLATFORM_WALLETS.DEVELOPER.publicKey),
      address: PLATFORM_WALLETS.DEVELOPER.publicKey
    },
    cloutTreasury: {
      configured: !!PLATFORM_WALLETS.CLOUT_TREASURY.publicKey && validateSolanaAddress(PLATFORM_WALLETS.CLOUT_TREASURY.publicKey),
      address: PLATFORM_WALLETS.CLOUT_TREASURY.publicKey
    },
    marketplaceTreasury: {
      configured: !!PLATFORM_WALLETS.MARKETPLACE_TREASURY.publicKey && validateSolanaAddress(PLATFORM_WALLETS.MARKETPLACE_TREASURY.publicKey),
      address: PLATFORM_WALLETS.MARKETPLACE_TREASURY.publicKey
    },
    creatorEscrow: {
      configured: !!PLATFORM_WALLETS.CREATOR_ESCROW.publicKey && validateSolanaAddress(PLATFORM_WALLETS.CREATOR_ESCROW.publicKey),
      address: PLATFORM_WALLETS.CREATOR_ESCROW.publicKey
    }
  };
}

// Generate environment variables configuration
export function generateEnvironmentConfig() {
  return {
    DEVELOPER_WALLET_PUBLIC_KEY: PLATFORM_WALLETS.DEVELOPER.publicKey,
    CLOUT_TREASURY_WALLET: PLATFORM_WALLETS.CLOUT_TREASURY.publicKey,
    MARKETPLACE_TREASURY_WALLET: PLATFORM_WALLETS.MARKETPLACE_TREASURY.publicKey,
    CREATOR_ESCROW_WALLET: PLATFORM_WALLETS.CREATOR_ESCROW.publicKey,
  };
}