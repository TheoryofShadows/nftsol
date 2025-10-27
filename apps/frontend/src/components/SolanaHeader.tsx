import React from 'react';
export default function SolanaHeader(){
  return (
    <header style={{padding:16, position:'sticky', top:0, zIndex:50, borderBottom:'1px solid rgba(255,255,255,0.06)'}} className="bg-[#08111d]/70 backdrop-blur">
      <div style={{display:'flex',alignItems:'center',gap:16,justifyContent:'space-between', maxWidth:1200, margin:'0 auto'}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <div className="sla-gradient" style={{width:32,height:32,borderRadius:8}} />
          <div>
            <div className="sla-text-gradient" style={{fontSize:20,fontWeight:800,lineHeight:1}}>NFTSol</div>
            <div style={{fontSize:12,opacity:.7}}>Built for Solana</div>
          </div>
        </div>
        <nav style={{display:'flex',gap:12,alignItems:'center'}}>
          <a href="https://solana.com/branding" target="_blank" rel="noreferrer" style={{fontSize:14,opacity:.9}}>Brand Guide</a>
          <button className="sla-gradient" style={{padding:'10px 14px',borderRadius:12,fontWeight:700}}>
            Launch App
          </button>
        </nav>
      </div>
    </header>
  );
}
