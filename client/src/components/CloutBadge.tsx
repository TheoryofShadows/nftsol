import React, { useEffect, useState } from "react";

export default function CloutBadge() {
  const [clout, setClout] = useState<number | null>(null);
  const wallet = typeof window !== 'undefined' ? localStorage.getItem("wallet") : null;
  const base = import.meta.env.VITE_API_BASE;

  useEffect(() => {
    if (!wallet || !base) return;
    fetch(`${base}/api/clout/${wallet}`).then(r => r.json()).then(d => {
      if (typeof d?.clout === 'number') setClout(d.clout);
    }).catch(() => {});
  }, [wallet, base]);

  if (!wallet) return null;
  return (
    <div style={{
      position: "fixed", right: 12, bottom: 12,
      background: "#111", color: "#fff", padding: "8px 12px",
      borderRadius: 12, border: "1px solid #333", fontSize: 13
    }}>
      <strong>Clout:</strong> {clout ?? '…'} <span style={{opacity: .6}}>(wallet: {wallet.slice(0,4)}…)</span>
    </div>
  );
}
