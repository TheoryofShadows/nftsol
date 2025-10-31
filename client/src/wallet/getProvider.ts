export type PhantomProvider = {
  isPhantom?: boolean;
  publicKey?: { toString(): string; toBase58(): string };
  isConnected?: boolean;
  connect: (opts?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: { toBase58(): string } }>;
  disconnect: () => Promise<void>;
  on: (
    event: 'connect' | 'disconnect' | 'accountChanged',
    handler: (...args: any[]) => void
  ) => void;
  request: (args: { method: string; params?: any }) => Promise<any>;
};

export function getProvider(): PhantomProvider | undefined {
  if ('phantom' in window) {
    // @ts-expect-error - Phantom wallet extension types not available
    const provider = window.phantom?.solana as PhantomProvider;
    if (provider?.isPhantom) return provider;
  }
  // Optional: open install page
  window.open('https://phantom.app/', '_blank');
  return undefined;
}
