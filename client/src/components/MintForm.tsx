import React, { useState } from "react";

interface MintFormProps {
  onMintSuccess?: (nft: any) => void;
}

export default function MintForm({ onMintSuccess }: MintFormProps) {
  const [form, setForm] = useState({ 
    name: "", 
    description: "", 
    imageUrl: "",
    creatorWallet: "4mUWjVdfVWP9TT5wT9x2P2Uhd8NQgzWXXMGKM8xxmM9E" // Default test wallet
  });
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleMint() {
    if (!form.name || !form.description || !form.imageUrl) {
      setStatus("❌ Please fill in all fields");
      return;
    }

    setLoading(true);
    setStatus("Minting...");
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE}/api/simple-mint`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          imageUrl: form.imageUrl,
          creatorWallet: form.creatorWallet
        })
      });
      
      const data = await res.json();
      
      if (data.success) {
        setStatus(`✅ Minted! Address: ${data.mintAddress}`);
        
        // Create NFT object for the parent component
        const newNFT = {
          id: data.mintAddress,
          name: form.name,
          description: form.description,
          imageUrl: form.imageUrl,
          creator: form.creatorWallet,
          mintAddress: data.mintAddress,
          signature: data.signature
        };
        
        if (onMintSuccess) {
          onMintSuccess(newNFT);
        }
        
        // Reset form
        setForm({ 
          name: "", 
          description: "", 
          imageUrl: "",
          creatorWallet: "4mUWjVdfVWP9TT5wT9x2P2Uhd8NQgzWXXMGKM8xxmM9E"
        });
      } else {
        setStatus(`❌ ${data.error || 'Minting failed'}`);
      }
    } catch (error) {
      setStatus(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(10px)',
      borderRadius: '16px',
      padding: '2rem',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      maxWidth: '500px',
      margin: '0 auto'
    }}>
      <h3 style={{ color: 'white', marginBottom: '1.5rem', textAlign: 'center' }}>
        Create Your NFT
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <input
          placeholder="NFT Name"
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
          style={{
            padding: '0.75rem',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            background: 'rgba(255, 255, 255, 0.1)',
            color: 'white',
            fontSize: '1rem'
          }}
        />
        
        <textarea
          placeholder="Description"
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
          rows={3}
          style={{
            padding: '0.75rem',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            background: 'rgba(255, 255, 255, 0.1)',
            color: 'white',
            fontSize: '1rem',
            resize: 'vertical'
          }}
        />
        
        <input
          placeholder="Image URL"
          value={form.imageUrl}
          onChange={e => setForm({ ...form, imageUrl: e.target.value })}
          style={{
            padding: '0.75rem',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            background: 'rgba(255, 255, 255, 0.1)',
            color: 'white',
            fontSize: '1rem'
          }}
        />
        
        <button
          onClick={handleMint}
          disabled={loading}
          style={{
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            border: 'none',
            background: loading ? 'rgba(255, 255, 255, 0.3)' : 'linear-gradient(45deg, #667eea, #764ba2)',
            color: 'white',
            fontSize: '1rem',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s'
          }}
        >
          {loading ? 'Minting...' : '✨ Mint NFT'}
        </button>
        
        {status && (
          <div style={{
            padding: '0.75rem',
            borderRadius: '8px',
            background: status.includes('✅') ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)',
            border: `1px solid ${status.includes('✅') ? 'rgba(76, 175, 80, 0.5)' : 'rgba(244, 67, 54, 0.5)'}`,
            color: 'white',
            textAlign: 'center',
            fontSize: '0.9rem'
          }}>
            {status}
          </div>
        )}
      </div>
    </div>
  );
}