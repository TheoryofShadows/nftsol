import React, { useEffect, useState } from "react";
import { getNfts } from "./lib/api";
import NftGrid from "./components/NftGrid";

const API_BASE = (import.meta as any).env?.VITE_API_BASE || "http://localhost:3001";

export default function App() {
  const [ok, setOk] = useState<boolean>(false);
  const [ts, setTs] = useState<number | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [owner, setOwner] = useState<string>(""); // optional override

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/healthz`);
        const j = await r.json();
        setOk(!!j.ok); setTs(j.ts || null);
      } catch { setOk(false); }
    })();
  }, []);

  async function loadNfts(o?: string) {
    try {
      const data = await getNfts(o);
      setItems(data.items || []);
    } catch {
      setItems([]);
    }
  }

  useEffect(() => { loadNfts(undefined); }, []); // initial (mock) load

  return (
    <div style={{padding:24,fontFamily:"system-ui", maxWidth:1200, margin:"0 auto"}}>
      <h1 style={{fontWeight:800}}>NFTSol</h1>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <span title={ok ? "API healthy" : "API down"} style={{width:10,height:10,borderRadius:9999,display:"inline-block",background: ok ? "#22c55e" : "#ef4444"}} />
        <span style={{fontSize:12,opacity:.7}}>{ok ? "API OK" : "API Down"}</span>
        {ts && <span style={{fontSize:12,opacity:.6}}>ts: {ts}</span>}
      </div>

      <div style={{display:"flex", gap:8, marginTop:12}}>
        <input
          value={owner}
          onChange={(e)=>setOwner(e.target.value.trim())}
          placeholder="Paste any Solana public key (devnet/mainnet)"
          style={{flex:1,padding:8,border:"1px solid #e5e7eb",borderRadius:8}}
        />
        <button onClick={()=>loadNfts(owner || undefined)} style={{padding:"8px 12px", borderRadius:8, border:"1px solid #e5e7eb", background:"#f3f4f6", cursor:"pointer"}}>
          Load
        </button>
      </div>

      <NftGrid items={items} />
    </div>
  );
}
