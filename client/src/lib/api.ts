export const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

export async function getHealth() {
  const r = await fetch(`${API_BASE}/healthz`);
  return r.json();
}

export async function getNfts(owner?: string) {
  const url = owner ? `${API_BASE}/nfts?owner=${encodeURIComponent(owner)}` : `${API_BASE}/nfts`;
  const r = await fetch(url);
  return r.json(); // { items: [...] }
}
