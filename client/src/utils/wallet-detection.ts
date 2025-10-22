type WalletWindow = typeof window & {
  solana?: { isPhantom?: boolean };
  solflare?: { isSolflare?: boolean };
  backpack?: { isBackpack?: boolean };
  Slope?: unknown;
  coin98?: { sol?: unknown };
};

export interface WalletDetectionResult {
  installedWallets: string[];
  availableWallets: string[];
  recommendedWallet: string;
  troubleshooting: string[];
  isAnyWalletInstalled: boolean;
}

export function detectWalletStatus(): WalletDetectionResult {
  const troubleshooting: string[] = [];
  const installedWallets: string[] = [];
  const availableWallets = ['Phantom', 'Solflare', 'Backpack', 'Slope', 'Coin98'];

  if (typeof window !== 'undefined') {
    const win = window as WalletWindow;

    if (win.solana?.isPhantom) {
      installedWallets.push('Phantom');
    }

    if (win.solflare?.isSolflare) {
      installedWallets.push('Solflare');
    }

    if (win.backpack?.isBackpack) {
      installedWallets.push('Backpack');
    }

    if (win.Slope) {
      installedWallets.push('Slope');
    }

    if (win.coin98?.sol) {
      installedWallets.push('Coin98');
    }
  }

  const isAnyWalletInstalled = installedWallets.length > 0;
  const recommendedWallet = isAnyWalletInstalled ? installedWallets[0] : 'Phantom';

  if (!isAnyWalletInstalled) {
    troubleshooting.push('No Solana wallets detected');
    troubleshooting.push('Install Phantom wallet from https://phantom.app/ (recommended)');
    troubleshooting.push('Or choose another wallet: Solflare, Backpack, Slope');
    troubleshooting.push('Refresh the page after installation');
  }

  return {
    installedWallets,
    availableWallets,
    recommendedWallet,
    troubleshooting,
    isAnyWalletInstalled,
  };
}

export function waitForWallets(timeout = 10000): Promise<string[]> {
  return new Promise((resolve) => {
    const checkWallets = () => {
      const result = detectWalletStatus();
      if (result.isAnyWalletInstalled) {
        resolve(result.installedWallets);
        return true;
      }
      return false;
    };

    if (checkWallets()) {
      return;
    }

    let attempts = 0;
    const maxAttempts = Math.max(1, Math.floor(timeout / 200));

    const checkInterval = setInterval(() => {
      attempts += 1;
      if (checkWallets() || attempts >= maxAttempts) {
        clearInterval(checkInterval);
        if (attempts >= maxAttempts) {
          resolve([]);
        }
      }
    }, 200);
  });
}

