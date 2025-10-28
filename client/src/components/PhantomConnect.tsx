import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';

export default function PhantomConnect() {
  const { publicKey, connected } = useWallet();

  return (
    <div className="flex items-center gap-3">
      <WalletMultiButton />
      {connected && (
        <span className="text-sm text-green-400 font-mono">
          {publicKey?.toBase58().slice(0, 4)}...{publicKey?.toBase58().slice(-4)}
        </span>
      )}
    </div>
  );
}