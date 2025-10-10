import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";

function formatWalletAddress(address: string) {
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

export default function WalletConnect() {
  const { publicKey } = useWallet();

  return (
    <div className="flex items-center gap-2">
      <WalletMultiButton className="wallet-adapter-button wallet-adapter-button-trigger bg-gradient-to-r from-purple-600 to-green-500 hover:opacity-80 text-white text-sm" />
      {publicKey && (
        <span className="text-xs sm:text-sm text-gray-300">
          {formatWalletAddress(publicKey.toBase58())}
        </span>
      )}
    </div>
  );
}

