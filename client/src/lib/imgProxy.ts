export function proxify(u: string) {
  const base =
    import.meta.env.VITE_IMG_PROXY_BASE || import.meta.env.VITE_API_BASE || 'http://localhost:3001';
  const url = new URL('/ipfs-img', base);
  url.searchParams.set('u', u);
  return url.toString();
}
export function proxifyCid(cidOrPath: string) {
  const base =
    import.meta.env.VITE_IMG_PROXY_BASE || import.meta.env.VITE_API_BASE || 'http://localhost:3001';
  const url = new URL('/ipfs-img', base);
  url.searchParams.set('cid', cidOrPath.replace(/^ipfs:\/\//, '').replace(/^\/+/, ''));
  return url.toString();
}
