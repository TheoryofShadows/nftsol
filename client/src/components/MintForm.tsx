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

    const form = new FormData();
    form.append('file', file);
    form.append('name', name);
    form.append('owner', publicKey!.toBase58());

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE}/api/simple-mint`, {
        method: 'POST',
        body: form,
      });
      const data = await res.json();
      alert(`Minted! Mint: ${data.mint}\nExplorer: https://explorer.solana.com/address/${data.mint}?cluster=devnet`);
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