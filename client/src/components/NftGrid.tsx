import React from "react";
type N = { mint: string; name: string; image: string; collection: string };

export default function NftGrid({ items }: { items: N[] }) {
  if (!items?.length) {
    return <div style={{marginTop:16, opacity:.6, fontSize:14}}>No NFTs to display.</div>;
  }
  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(180px,1fr))", gap:16, marginTop:16 }}>
      {items.map((nft) => (
        <div key={nft.mint} style={{ border:"1px solid #e5e7eb", borderRadius:12, padding:12 }}>
          <img src={nft.image} alt={nft.name} style={{ width:"100%", borderRadius:8 }} />
          <div style={{ marginTop:8, fontWeight:600 }}>{nft.name}</div>
          <div style={{ fontSize:12, color:"#6b7280" }}>{nft.collection}</div>
        </div>
      ))}
    </div>
  );
}
