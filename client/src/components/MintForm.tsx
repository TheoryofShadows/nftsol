import React, { useState } from "react";

export default function MintForm() {
  const [form, setForm] = useState({ name: "", desc: "", imageUrl: "" });
  const [status, setStatus] = useState("");

  async function handleMint() {
    setStatus("Minting...");
    const wallet = localStorage.getItem("wallet") || "demo_wallet";
    const res = await fetch(`${import.meta.env.VITE_API_BASE}/api/mint`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        description: form.desc,
        imageUrl: form.imageUrl,
        wallet
      })
    });
    const data = await res.json();
    setStatus(data.tx ? `✅ Minted! Tx: ${data.tx}` : `❌ ${data.error}`);
  }

  return (
    <section style={{ padding: 20 }}>
      <h2>Mint a New NFT</h2>
      <input placeholder="Name"
             onChange={e => setForm({ ...form, name: e.target.value })}/>
      <input placeholder="Description"
             onChange={e => setForm({ ...form, desc: e.target.value })}/>
      <input placeholder="Image URL"
             onChange={e => setForm({ ...form, imageUrl: e.target.value })}/>
      <button onClick={handleMint}>Mint NFT</button>
      <p>{status}</p>
    </section>
  );
}
