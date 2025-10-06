

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
  
  // Check for installed wallets
  if (typeof window !== 'undefined') {
    // Phantom
    if (window.solana?.isPhantom) {
      installedWallets.push('Phantom');
    }
    
    // Solflare
    if (window.solflare?.isSolflare) {
      installedWallets.push('Solflare');
    }
    
    // Backpack
    if (window.backpack?.isBackpack) {
      installedWallets.push('Backpack');
    }
    
    // Slope
    if (window.Slope) {
      installedWallets.push('Slope');
    }
    
    // Coin98
    if (window.coin98?.sol) {
      installedWallets.push('Coin98');
    }
  }
  
  const isAnyWalletInstalled = installedWallets.length > 0;
  let recommendedWallet = 'Phantom'; // Default recommendation
  
  if (isAnyWalletInstalled) {
    // Use the first installed wallet as recommended
    recommendedWallet = installedWallets[0];
  } else {
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
    isAnyWalletInstalled
  };
}

export function waitForWallets(timeout = 10000): Promise<string[]> {
  return new Promise((resolve) => {
    const checkWallets = () => {
      const result = detectWalletStatus();
      if (result.isAnyWalletInstalled) {
        resolve(result.installedWallets);
        return;
      }
    };
    
    // Check immediately
    checkWallets();
    
    let attempts = 0;
    const maxAttempts = timeout / 200;
    
    const checkInterval = setInterval(() => {
      attempts++;
      checkWallets();
      
      if (attempts >= maxAttempts) {
        clearInterval(checkInterval);
        resolve([]); // Return empty array if no wallets found
      }
    }, 200);
  });
}

// Enhanced global type declarations
declare global {
  interface Window {
    solana?: {
      isPhantom?: boolean;
      connect: (options?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: { toString: () => string } }>;
      disconnect: () => Promise<void>;
      isConnected: boolean;
      publicKey: { toString: () => string } | null;
      signTransaction: (transaction: any) => Promise<any>;
      signAllTransactions: (transactions: any[]) => Promise<any[]>;
      request: (params: { method: string; params?: any }) => Promise<any>;
      on: (event: string, callback: (args: any) => void) => void;
      off: (event: string, callback: (args: any) => void) => void;
    };
    solflare?: {
      isSolflare?: boolean;
      connect: () => Promise<{ publicKey: { toString: () => string } }>;
      disconnect: () => Promise<void>;
      isConnected: boolean;
      publicKey: { toString: () => string } | null;
      signTransaction: (transaction: any) => Promise<any>;
      signAllTransactions: (transactions: any[]) => Promise<any[]>;
      on: (event: string, callback: (args: any) => void) => void;
      off: (event: string, callback: (args: any) => void) => void;
    };
    backpack?: {
      isBackpack?: boolean;
      connect: () => Promise<{ publicKey: { toString: () => string } }>;
      disconnect: () => Promise<void>;
      isConnected: boolean;
      publicKey: { toString: () => string } | null;
      signTransaction: (transaction: any) => Promise<any>;
      signAllTransactions: (transactions: any[]) => Promise<any[]>;
      on: (event: string, callback: (args: any) => void) => void;
      off: (event: string, callback: (args: any) => void) => void;
    };
    Slope?: {
      connect: () => Promise<{ publicKey: { toString: () => string } }>;
      disconnect: () => Promise<void>;
      isConnected: boolean;
      publicKey: { toString: () => string } | null;
      signTransaction: (transaction: any) => Promise<any>;
      signAllTransactions: (transactions: any[]) => Promise<any[]>;
    };
    coin98?: {
      sol?: {
        connect: () => Promise<{ publicKey: { toString: () => string } }>;
        disconnect: () => Promise<void>;
        isConnected: boolean;
        publicKey: { toString: () => string } | null;
        signTransaction: (transaction: any) => Promise<any>;
        signAllTransactions: (transactions: any[]) => Promise<any[]>;
      };
    };
  }
}

