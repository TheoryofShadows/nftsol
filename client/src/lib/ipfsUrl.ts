import { resolveIpfs } from './ipfs';
const API =
  import.meta.env.VITE_API_BASE || import.meta.env.VITE_IMG_PROXY_BASE || 'http://localhost:3001';
export function ipfsImg(u?: string) {
  if (!u) return u;
  return `${API}/ipfs-img?u=${encodeURIComponent(u)}`;
}
export function ipfsDirect(u?: string) {
  return resolveIpfs(u) ?? u;
}
