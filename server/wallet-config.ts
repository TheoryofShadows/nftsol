// NFTSol Wallet Configuration
// Centralised management for platform-controlled wallets

type PlatformWalletKey = "DEVELOPER" | "CLOUT_TREASURY" | "MARKETPLACE_TREASURY" | "CREATOR_ESCROW";

type WalletSource = "env" | "placeholder";

interface WalletSpec {
  label: string;
  envVar: string;
  fallback: string;
  purpose: string;
}

interface ResolvedWallet extends WalletSpec {
  publicKey: string;
  source: WalletSource;
}

const WALLET_SPECS: Record<PlatformWalletKey, WalletSpec> = {
  DEVELOPER: {
    label: "Developer Wallet",
    envVar: "DEVELOPER_WALLET_PUBLIC_KEY",
    fallback: "3WCkmqcoJZnVbscWSD3xr9tyG1kqnc3MsVPusriKKKad",
    purpose: "Receives 2% commission from all marketplace sales",
  },
  CLOUT_TREASURY: {
    label: "CLOUT Treasury",
    envVar: "CLOUT_TREASURY_WALLET",
    fallback: "FsoPx1WmXA6FDxYTSULRDko3tKbNG7KxdRTq2icQJGjM",
    purpose: "Manages CLOUT token distribution and community rewards",
  },
  MARKETPLACE_TREASURY: {
    label: "Marketplace Treasury",
    envVar: "MARKETPLACE_TREASURY_WALLET",
    fallback: "Aqx6ozBZmH761aEwtpiVcA33eQGLnbXtHPepi1bMfjgs",
    purpose: "Handles operational funds and platform reserves",
  },
  CREATOR_ESCROW: {
    label: "Creator Escrow",
    envVar: "CREATOR_ESCROW_WALLET",
    fallback: "3WCkmqcoJZnVbscWSD3xr9tyG1kqnc3MsVPusriKKKad",
    purpose: "Temporary holding for creator royalties and payouts",
  },
};

function resolveWallet(spec: WalletSpec): ResolvedWallet {
  const rawValue = process.env[spec.envVar]?.trim();
  if (rawValue) {
    return {
      ...spec,
      publicKey: rawValue,
      source: "env",
    };
  }

  const strict = process.env.NODE_ENV === "production";
  if (strict) {
    throw new Error(
      `[wallet-config] Missing required env var ${spec.envVar} (${spec.label}). ` +
        "Set this public key before running in production.",
    );
  }

  console.warn(
    `[wallet-config] Environment variable ${spec.envVar} not set. ` +
      `Falling back to placeholder address for ${spec.label}. ` +
      "Update your .env file with the real Phantom wallet as soon as possible.",
  );

  return {
    ...spec,
    publicKey: spec.fallback,
    source: "placeholder",
  };
}

export const PLATFORM_WALLETS: Record<PlatformWalletKey, ResolvedWallet> = {
  DEVELOPER: resolveWallet(WALLET_SPECS.DEVELOPER),
  CLOUT_TREASURY: resolveWallet(WALLET_SPECS.CLOUT_TREASURY),
  MARKETPLACE_TREASURY: resolveWallet(WALLET_SPECS.MARKETPLACE_TREASURY),
  CREATOR_ESCROW: resolveWallet(WALLET_SPECS.CREATOR_ESCROW),
};

// Validation function for Solana addresses
export function validateSolanaAddress(address: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
}

export function ensurePlatformWallets(strict = process.env.NODE_ENV === "production") {
  const invalid = Object.entries(PLATFORM_WALLETS).filter(
    ([, wallet]) => !validateSolanaAddress(wallet.publicKey),
  );
  if (invalid.length > 0) {
    const details = invalid.map(([key, wallet]) => `${key} (${wallet.publicKey})`).join(", ");
    throw new Error(`[wallet-config] Invalid wallet address detected: ${details}`);
  }

  if (strict) {
    const placeholders = Object.entries(PLATFORM_WALLETS).filter(
      ([, wallet]) => wallet.source !== "env",
    );
    if (placeholders.length > 0) {
      const details = placeholders
        .map(([key, wallet]) => `${key} (set ${wallet.envVar})`)
        .join(", ");
      throw new Error(
        `[wallet-config] Placeholder wallets detected in production: ${details}. Configure real Phantom wallets.`,
      );
    }
  }
}

// Get wallet configuration status
export function getWalletConfigStatus() {
  return {
    developer: {
      configured:
        PLATFORM_WALLETS.DEVELOPER.source === "env" &&
        validateSolanaAddress(PLATFORM_WALLETS.DEVELOPER.publicKey),
      address: PLATFORM_WALLETS.DEVELOPER.publicKey,
      source: PLATFORM_WALLETS.DEVELOPER.source,
      purpose: PLATFORM_WALLETS.DEVELOPER.purpose,
    },
    cloutTreasury: {
      configured:
        PLATFORM_WALLETS.CLOUT_TREASURY.source === "env" &&
        validateSolanaAddress(PLATFORM_WALLETS.CLOUT_TREASURY.publicKey),
      address: PLATFORM_WALLETS.CLOUT_TREASURY.publicKey,
      source: PLATFORM_WALLETS.CLOUT_TREASURY.source,
      purpose: PLATFORM_WALLETS.CLOUT_TREASURY.purpose,
    },
    marketplaceTreasury: {
      configured:
        PLATFORM_WALLETS.MARKETPLACE_TREASURY.source === "env" &&
        validateSolanaAddress(PLATFORM_WALLETS.MARKETPLACE_TREASURY.publicKey),
      address: PLATFORM_WALLETS.MARKETPLACE_TREASURY.publicKey,
      source: PLATFORM_WALLETS.MARKETPLACE_TREASURY.source,
      purpose: PLATFORM_WALLETS.MARKETPLACE_TREASURY.purpose,
    },
    creatorEscrow: {
      configured:
        PLATFORM_WALLETS.CREATOR_ESCROW.source === "env" &&
        validateSolanaAddress(PLATFORM_WALLETS.CREATOR_ESCROW.publicKey),
      address: PLATFORM_WALLETS.CREATOR_ESCROW.publicKey,
      source: PLATFORM_WALLETS.CREATOR_ESCROW.source,
      purpose: PLATFORM_WALLETS.CREATOR_ESCROW.purpose,
    },
  };
}

// Generate environment variables configuration snapshot
export function generateEnvironmentConfig() {
  return {
    DEVELOPER_WALLET_PUBLIC_KEY: PLATFORM_WALLETS.DEVELOPER.publicKey,
    CLOUT_TREASURY_WALLET: PLATFORM_WALLETS.CLOUT_TREASURY.publicKey,
    MARKETPLACE_TREASURY_WALLET: PLATFORM_WALLETS.MARKETPLACE_TREASURY.publicKey,
    CREATOR_ESCROW_WALLET: PLATFORM_WALLETS.CREATOR_ESCROW.publicKey,
  };
}
