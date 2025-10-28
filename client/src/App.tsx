import CloutBadge from "./components/CloutBadge";
import MintForm from "./components/MintForm";
import SolanaSection from "./components/SolanaSection";
import SolanaHeader from "./components/SolanaHeader";
import PhantomConnect from "./components/PhantomConnect";
import ProxyCheck from "./components/ProxyCheck";
import React from "react";

const API = import.meta.env.VITE_API_BASE || "http://localhost:3003";
const IPFS_DEMO = "ipfs://YOUR_REAL_CID_HERE/your-image.png"
// your current 1x1 demo image (visible because we size it)
const TEST = "https://upload.wikimedia.org/wikipedia/commons/3/3f/PNG_demo.png";
const SRC = `${API}/ipfs-img?u=${encodeURIComponent(TEST)}`;

export default function App() {
  const [err, setErr] = React.useState<string | null>(null);

  return (
    <div style={{padding:20,fontFamily:"system-ui,Segoe UI,Arial"}}>
      <h1 style={{margin:0}}>NFTSol – Proxy Test</h1>
      <p>Fetching through <code>{API}/ipfs-img</code></p>
      <div style={{display:"flex",gap:20,alignItems:"flex-start"}}>
        <img
          src={SRC}
          width={256}
          height={256}
          style={{border:"1px solid #ddd", background:"#f6f6f6", borderRadius:12, objectFit:"contain"}}
          onError={() => setErr("Failed to load image")}
          alt="proxy test"
        />
        <div>
          <div><b>Image URL:</b> <code style={{wordBreak:"break-all"}}>{SRC}</code>  <SolanaSection title="Phantom Wallet">
    <PhantomConnect />
  </SolanaSection>
  <PhantomConnect />
  <ProxyCheck />
  <SolanaHeader />
  <ProxyCheck />
</div>
          <div><b>CID:</b> <code>{TEST}</code></div>
          {err && <div style={{color:"crimson"}}>Error: {err}</div>}
        </div>
      </div>
    </div>
  );
}
