import React from "react";

type Item = { mint: string; name: string; image: string; collection: string };

export default function NftGrid({ items }: { items: Item[] }) {
  if (!items?.length) return <div style={{marginTop:12, opacity:.7}}>No NFTs to display.</div>;
  return (
    <div style={{
      display:"grid",
      gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",
      gap:16, marginTop:16
    }}>
      {items.map(n => (
        <div key={n.mint} style={{border:"1px solid #e5e7eb", borderRadius:12, padding:12}}>
          <img src={n.image} alt={n.name} style={{width:"100%", borderRadius:8, aspectRatio:"1/1", objectFit:"cover"}} />
          <div style={{marginTop:8, fontWeight:700}}>{n.name}</div>
          <div style={{fontSize:12, color:"#6b7280"}}>{n.collection}</div>
          <div style={{marginTop:4, fontSize:11, color:"#9ca3af", wordBreak:"break-all"}}>{n.mint}</div>
        </div>
      ))}
    </div>
  );
}
