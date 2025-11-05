import { API_BASE, API_ENDPOINTS } from '../config/api';

export { API_BASE };

export async function getHealth() {
  const r = await fetch(API_ENDPOINTS.health);
  return r.json();
}

export async function getNfts(owner?: string) {
  const url = owner ? API_ENDPOINTS.nfts(owner) : API_ENDPOINTS.nfts();
  const r = await fetch(url);
  return r.json(); // { items: [...] }
}
