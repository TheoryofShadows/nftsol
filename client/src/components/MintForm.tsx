import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

export default function MintForm() {
  const { publicKey, connected } = useWallet();
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const mint = async () => {
    if (!file || !name || !connected) return;
    setLoading(true);

    try {
      // First, verify wallet exists
      const verifyRes = await fetch(`${import.meta.env.VITE_API_BASE}/api/nfts/verify/${publicKey!.toBase58()}`);
      const verifyData = await verifyRes.json();
      
      if (!verifyData.success || !verifyData.data.exists) {
        alert('Wallet not found on Solana network. Please ensure your wallet is properly connected.');
        return;
      }

      // Create image URL (in production, upload to IPFS first)
      const imageUrl = URL.createObjectURL(file);
      
      // Mint NFT using real Solana blockchain
      const mintRes = await fetch(`${import.meta.env.VITE_API_BASE}/api/nfts/mint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          toAddress: publicKey!.toBase58(),
          name: name,
          description: `Minted NFT: ${name}`,
          imageUrl: imageUrl
        }),
      });
      
      const mintData = await mintRes.json();
      
      if (mintData.success) {
        alert(`🎉 NFT Minted Successfully!\n\nMint Address: ${mintData.data.mintAddress}\nTransaction: ${mintData.data.transactionSignature}\n\nView on Explorer: https://explorer.solana.com/address/${mintData.data.mintAddress}?cluster=devnet`);
      } else {
        alert(`Mint failed: ${mintData.error}`);
      }
    } catch (e: any) {
      alert('Mint failed: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white/10 backdrop-blur-lg rounded-2xl">
      <h3 className="text-xl font-bold mb-4">Mint Your NFT</h3>
      <input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] ?? null)} className="mb-3 block w-full" />
      <input
        placeholder="NFT Name"
        value={name}
        onChange={e => setName(e.target.value)}
        className="w-full p-3 mb-3 rounded-lg bg-white/20 placeholder-gray-400"
      />
      <button
        onClick={mint}
        disabled={!connected || loading}
        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold disabled:opacity-50"
      >
        {loading ? 'Minting...' : 'Mint NFT'}
      </button>
      {!connected && <p className="text-red-400 text-sm mt-2">Connect wallet to mint</p>}
    </div>
  );
}