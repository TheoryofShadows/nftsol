import React, { useState } from "react";
import { useWallet } from '@solana/wallet-adapter-react';

interface MintFormProps {
  onMintSuccess?: (nft: any) => void;
}

export default function MintForm({ onMintSuccess }: MintFormProps) {
  const { publicKey, connected } = useWallet();
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const mint = async () => {
    if (!name || !connected) {
      setStatus("❌ Please fill in all fields and connect wallet");
      return;
    }
    
    setLoading(true);
    setStatus("Minting...");
    
    try {
      // For now, use JSON format that works with current backend
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE}/api/simple-mint`,
        { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            creatorWallet: publicKey!.toBase58(),
            name: name,
            description: `NFT created by ${publicKey!.toBase58().slice(0, 8)}...`,
            imageUrl: `https://via.placeholder.com/300x300/667eea/ffffff?text=${encodeURIComponent(name)}`
          })
        }
      );
      const data = await res.json();
      
      if (data.success) {
        setStatus(`✅ Minted! ${data.mintAddress}`);
        
        // Create NFT object for the parent component
        const newNFT = {
          id: data.mintAddress,
          name: name,
          description: `NFT created by ${publicKey!.toBase58().slice(0, 8)}...`,
          imageUrl: `https://via.placeholder.com/300x300/667eea/ffffff?text=${encodeURIComponent(name)}`,
          creator: publicKey!.toBase58(),
          mintAddress: data.mintAddress,
          signature: data.signature
        };
        
        if (onMintSuccess) {
          onMintSuccess(newNFT);
        }
        
        // Reset form
        setName('');
        setFile(null);
      } else {
        setStatus(`❌ ${data.error || 'Minting failed'}`);
      }
    } catch (error) {
      setStatus(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white/10 backdrop-blur rounded-xl max-w-md mx-auto">
      <h3 className="text-white mb-4 text-center text-lg font-semibold">
        Create Your NFT
      </h3>
      
      <div className="space-y-4">
        <input
          placeholder="NFT name"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full p-2 rounded border border-white/30 bg-white/10 text-white placeholder-white/70"
        />
        
        <button
          onClick={mint}
          disabled={!connected || loading}
          className="w-full bg-purple-600 enabled:hover:bg-purple-700 disabled:bg-gray-500 text-white py-2 rounded font-medium transition-colors"
        >
          {loading ? 'Minting…' : 'Mint NFT'}
        </button>
        
        {status && (
          <div className={`p-3 rounded text-center text-sm ${
            status.includes('✅') 
              ? 'bg-green-500/20 border border-green-500/50 text-green-300' 
              : 'bg-red-500/20 border border-red-500/50 text-red-300'
          }`}>
            {status}
          </div>
        )}
      </div>
    </div>
  );
}