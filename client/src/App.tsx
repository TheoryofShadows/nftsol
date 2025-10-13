import React, { useEffect, useMemo, useState } from "react";
import NftGrid from "./components/NftGrid";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

function useQueryOwner() {
  return useMemo(() => {
    const u = new URL(window.location.href);
    return (u.searchParams.get("owner") || "").trim();
  }, []);
}

export default function App() {
  const [apiOk, setApiOk] = useState<boolean>(false);
  const [owner, setOwner] = useState<string>("");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>("");

  const initialOwner = useQueryOwner();

  useEffect(() => {
    fetch(`${API_BASE}/healthz`).then(r=>r.json()).then(j=>setApiOk(!!j.ok)).catch(()=>setApiOk(false));
  }, []);

  useEffect(() => {
    if (initialOwner) {
      setOwner(initialOwner);
      void fetchNfts(initialOwner);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialOwner]);

  async function fetchNfts(pubkey: string) {
    setLoading(true); setErr(""); setItems([]);
    try {
      const r = await fetch(`${API_BASE}/nfts?owner=${encodeURIComponent(pubkey)}`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = await r.json();
      setItems(Array.isArray(j.items) ? j.items : []);
    } catch (e:any) {
      setErr(e?.message || "Failed to load NFTs");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{padding:24, fontFamily:"ui-sans-serif"}}>
      <h1 style={{fontWeight:800}}>NFTSol — Minimal</h1>

      <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:12}}>
        <span title={apiOk ? "API healthy" : "API down"} style={{
          width:10,height:10,borderRadius:9999,display:"inline-block",
          background:apiOk?"#22c55e":"#ef4444"
        }} />
        <span style={{fontSize:12,opacity:.7}}>{apiOk ? "API OK" : "API Down"}</span>
      </div>

      <div style={{display:"flex", gap:8, alignItems:"center", flexWrap:"wrap"}}>
        <input
          value={owner}
          onChange={e=>setOwner(e.target.value.trim())}
          placeholder="Paste any Solana public key (devnet/mainnet)"
          style={{flex:"1 1 420px", minWidth:320, padding:"10px 12px", border:"1px solid #e5e7eb", borderRadius:8}}
        />
        <button
          onClick={()=>owner && fetchNfts(owner)}
          disabled={!owner || loading}
          style={{padding:"10px 16px", borderRadius:8, border:"1px solid #e5e7eb", background:"#111827", color:"#fff", fontWeight:600}}
        >
          {loading ? "Loading…" : "Load"}
        </button>
      </div>

      {err && <div style={{marginTop:12, color:"#ef4444"}}>Error: {err}</div>}
      {!err && !loading && <div style={{marginTop:8, fontSize:12, color:"#6b7280"}}>Tip: try your pubkey or a well-known one.</div>}

      <NftGrid items={items} />
    </div>
  );
}
