import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export default function SimpleWalletButton() {
  return (
    <WalletMultiButton className="wallet-adapter-button wallet-adapter-button-trigger bg-gradient-to-r from-purple-600 to-green-500 hover:opacity-80 text-white text-sm" />
  );
}
