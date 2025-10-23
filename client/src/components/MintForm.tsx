import React, { useState } from "react";
import { useUniversalWallet } from '../wallet/UniversalWalletAdapter';

export default function MintForm() {
  const { publicKey, connected } = useUniversalWallet();
  const [form, setForm] = useState({ 
    name: "", 
    description: "", 
    imageUrl: "",
    collection: ""
  });
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleMint() {
    if (!connected || !publicKey) {
      setStatus("❌ Please connect your wallet first");
      return;
    }

    if (!form.name || !form.description || !form.imageUrl) {
      setStatus("❌ Please fill in all required fields");
      return;
    }

    setLoading(true);
    setStatus("Minting NFT...");

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE}/api/mint`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorWallet: publicKey.toString(),
          name: form.name,
          description: form.description,
          imageUrl: form.imageUrl,
          collection: form.collection || undefined
        })
      });

      const data = await res.json();
      
      if (data.ok) {
        setStatus(`✅ NFT minted successfully! Mint: ${data.mintAddress}`);
        setForm({ name: "", description: "", imageUrl: "", collection: "" });
      } else {
        setStatus(`❌ Minting failed: ${data.error}`);
      }
    } catch (error: any) {
      setStatus(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section style={{ padding: 20, border: '1px solid #e5e7eb', borderRadius: 12 }}>
      <h2>Create New NFT</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 400 }}>
        <input 
          placeholder="NFT Name *"
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
          style={{ padding: 8, border: '1px solid #d1d5db', borderRadius: 6 }}
        />
        <textarea 
          placeholder="Description *"
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
          rows={3}
          style={{ padding: 8, border: '1px solid #d1d5db', borderRadius: 6, resize: 'vertical' }}
        />
        <input 
          placeholder="Image URL *"
          value={form.imageUrl}
          onChange={e => setForm({ ...form, imageUrl: e.target.value })}
          style={{ padding: 8, border: '1px solid #d1d5db', borderRadius: 6 }}
        />
        <input 
          placeholder="Collection (optional)"
          value={form.collection}
          onChange={e => setForm({ ...form, collection: e.target.value })}
          style={{ padding: 8, border: '1px solid #d1d5db', borderRadius: 6 }}
        />
        <button 
          onClick={handleMint}
          disabled={loading || !connected}
          style={{
            padding: '12px 24px',
            backgroundColor: connected ? '#007bff' : '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            cursor: connected ? 'pointer' : 'not-allowed',
            fontSize: 16,
            fontWeight: 500
          }}
        >
          {loading ? 'Minting...' : connected ? 'Mint NFT' : 'Connect Wallet First'}
        </button>
        {status && (
          <div style={{ 
            padding: 12, 
            backgroundColor: status.includes('✅') ? '#d4edda' : '#f8d7da',
            color: status.includes('✅') ? '#155724' : '#721c24',
            borderRadius: 6,
            fontSize: 14
          }}>
            {status}
          </div>
        )}
      </div>
    </section>
  );
}
