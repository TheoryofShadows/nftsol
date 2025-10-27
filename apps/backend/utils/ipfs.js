const GATEWAYS = [
  'https://w3s.link/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
  'https://gateway.pinata.cloud/ipfs/',
];
function resolveIpfs(uri) {
  if (!uri) return uri;
  return uri.startsWith('ipfs://') ? GATEWAYS[0] + uri.slice(7) : uri;
}
async function fetchWithIpfs(uri, init) {
  const list = uri.startsWith('ipfs://') ? GATEWAYS.map(g => g + uri.slice(7)) : [uri];
  let last;
  for (const u of list) {
    try {
      const r = await fetch(u, { redirect: 'follow', ...init });
      if (r.ok) return r;
      last = new Error(`HTTP ${r.status} at ${u}`);
    } catch (e) { last = e; }
  }
  throw last ?? new Error('Failed to fetch via gateways');
}
module.exports = { resolveIpfs, fetchWithIpfs };
