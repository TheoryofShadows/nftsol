export const IPFS_GATEWAYS = [
  "https://w3s.link/ipfs/",
  "https://cloudflare-ipfs.com/ipfs/",
  "https://gateway.pinata.cloud/ipfs/",
] as const;

export function resolveIpfs(uri?: string, gateways: readonly string[] = IPFS_GATEWAYS) {
  if (!uri) return uri;
  return uri.startsWith("ipfs://") ? gateways[0] + uri.slice(7) : uri;
}
