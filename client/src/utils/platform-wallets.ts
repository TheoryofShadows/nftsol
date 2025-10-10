export type PlatformWalletKey =
  | 'developer'
  | 'cloutTreasury'
  | 'marketplaceTreasury'
  | 'creatorEscrow';

export interface PlatformWalletInfo {
  address: string | null;
  placeholderAddress?: string;
  purpose: string;
  status: string;
  configured: boolean;
  source: 'env' | 'placeholder';
  commissionRate?: number;
  distributionRate?: number;
}

export type PlatformWalletMap = Record<PlatformWalletKey, PlatformWalletInfo>;

let walletRequest: Promise<PlatformWalletMap> | null = null;

async function loadWallets(): Promise<PlatformWalletMap> {
  const response = await fetch('/api/platform/wallets');
  if (!response.ok) {
    throw new Error(`Failed to fetch platform wallets: ${response.status}`);
  }

  const data = (await response.json()) as PlatformWalletMap;
  return data;
}

export async function fetchPlatformWallets(force = false): Promise<PlatformWalletMap> {
  if (!walletRequest || force) {
    walletRequest = loadWallets().catch((error) => {
      walletRequest = null;
      throw error;
    });
  }

  return walletRequest;
}

export async function requireConfiguredWallet(
  key: PlatformWalletKey,
): Promise<PlatformWalletInfo> {
  const wallets = await fetchPlatformWallets();
  const wallet = wallets[key];

  if (!wallet?.configured || !wallet.address) {
    throw new Error(
      `Platform wallet "${key}" is not configured. Please ask an administrator to set the corresponding environment variable before executing live transactions.`,
    );
  }

  return wallet;
}
