import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export default function PhantomConnect() {
  const { publicKey, connected } = useWallet();

  return (
    <div className="flex items-center gap-2">
      <WalletMultiButton />
      {connected && (
        <span className="text-sm text-green-400">
          {publicKey?.toBase58().slice(0, 8)}...
        </span>
      )}
    </div>
  );
}