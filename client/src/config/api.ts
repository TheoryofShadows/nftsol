/**
 * Centralized API Configuration
 * Handles API base URL for both development and production
 */

// Determine API base URL
const getApiBase = (): string => {
  // Priority 1: Environment variable (explicit)
  if (import.meta.env.VITE_API_BASE) {
    return import.meta.env.VITE_API_BASE;
  }

  // Priority 2: Production environment - use production backend
  if (import.meta.env.MODE === 'production' || import.meta.env.PROD) {
    // Production backend URL
    return 'https://nftsol.onrender.com';
  }

  // Priority 3: Development - use localhost
  return 'http://localhost:3001';
};

// Priority 4: Fallback - try to detect from window location (only in browser)
if (typeof window !== 'undefined') {
  const currentHost = window.location.hostname;
  
  // If we're on localhost, use localhost backend
  if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
    // Already handled above, but keep for safety
  }
  // If we're on Netlify but in development mode, still use localhost
  // (This handles localhost:5173 development)
}

export const API_BASE = getApiBase();

// Log API base in development
if (import.meta.env.DEV) {
  // eslint-disable-next-line no-console
  console.log('🔗 API Base URL:', API_BASE);
  // eslint-disable-next-line no-console
  console.log('🌍 Environment:', import.meta.env.MODE);
  // eslint-disable-next-line no-console
  console.log('📦 Production Mode:', import.meta.env.PROD);
}

// Helper function to build full API URLs
export const buildApiUrl = (endpoint: string): string => {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  
  // Ensure API_BASE doesn't have trailing slash
  const cleanBase = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE;
  
  return `${cleanBase}/${cleanEndpoint}`;
};

// Health check endpoint
export const HEALTH_ENDPOINT = buildApiUrl('health');

// API version prefix
export const API_VERSION = 'v1';
export const API_PREFIX = `/api/${API_VERSION}`;

// Common API endpoints
export const API_ENDPOINTS = {
  health: buildApiUrl('health'),
  csrf: buildApiUrl(`${API_PREFIX}/csrf-token`),
  programs: buildApiUrl(`${API_PREFIX}/programs`),
  solanaStatus: buildApiUrl(`${API_PREFIX}/solana/status`),
  mint: buildApiUrl(`${API_PREFIX}/simple-mint`),
  nft: (mintAddress: string) => buildApiUrl(`${API_PREFIX}/nft/${mintAddress}`),
  nfts: (owner?: string) => 
    owner 
      ? buildApiUrl(`${API_PREFIX}/nfts/${owner}`)
      : buildApiUrl('api/nfts'), // Non-versioned endpoint for marketplace
  marketplace: buildApiUrl(`${API_PREFIX}/market`),
  collections: buildApiUrl(`${API_PREFIX}/collections`),
  wallet: (address: string) => buildApiUrl(`${API_PREFIX}/wallet/${address}`),
  admin: {
    auth: buildApiUrl(`${API_PREFIX}/auth/admin`),
    withdrawals: (status?: string) => 
      status
        ? buildApiUrl(`${API_PREFIX}/admin/withdrawals?status=${status}`)
        : buildApiUrl(`${API_PREFIX}/admin/withdrawals`),
    withdrawalAction: (id: string, action: string) => 
      buildApiUrl(`${API_PREFIX}/admin/withdrawals/${id}/${action}`),
  },
  clout: {
    reward: buildApiUrl('api/clout/reward'),
    balance: (address: string) => buildApiUrl(`api/clout/balance/${address}`),
  },
  echo: {
    mint: buildApiUrl('api/echo/mint'),
    list: buildApiUrl('api/echo'),
    get: (id: string) => buildApiUrl(`api/echo/${id}`),
  },
  withdrawals: {
    create: buildApiUrl('api/wallets/withdraw'),
    balance: (address: string) => buildApiUrl(`api/nfts/balance/${address}`),
    verify: (address: string) => buildApiUrl(`api/nfts/verify/${address}`),
  },
  waitlist: {
    subscribe: buildApiUrl('api/waitlist/subscribe'),
  },
  // Sprint 1: New feature endpoints
  tensor: {
    orderbook: (collection: string) => buildApiUrl(`api/tensor/orderbook/${collection}`),
    stats: (collection: string) => buildApiUrl(`api/tensor/stats/${collection}`),
    history: (collection: string, period: string = '7d') =>
      buildApiUrl(`api/tensor/history/${collection}?period=${period}`),
    trending: buildApiUrl('api/tensor/trending'),
    search: (query: string) => buildApiUrl(`api/tensor/search?q=${encodeURIComponent(query)}`),
    floor: (collection: string) => buildApiUrl(`api/tensor/floor/${collection}`),
  },
  pnl: {
    leaderboard: (period: string = 'daily', limit: number = 50) =>
      buildApiUrl(`api/pnl/leaderboard?period=${period}&limit=${limit}`),
    wallet: (address: string) => buildApiUrl(`api/pnl/wallet/${address}`),
    snapshot: buildApiUrl('api/pnl/snapshot'),
    rank: (address: string, period: string = 'daily') =>
      buildApiUrl(`api/pnl/rank/${address}?period=${period}`),
    portfolio: (address: string) => buildApiUrl(`api/pnl/portfolio/${address}`),
  },
  alerts: {
    types: buildApiUrl('api/alerts/types'),
    subscriptions: (wallet: string) => buildApiUrl(`api/alerts/subscriptions/${wallet}`),
    subscribe: buildApiUrl('api/alerts/subscribe'),
    unsubscribe: (id: string) => buildApiUrl(`api/alerts/unsubscribe/${id}`),
    history: (wallet: string) => buildApiUrl(`api/alerts/history/${wallet}`),
  },
  // Sprint 2: Trading power features
  jupiter: {
    price: (token: string, vsToken?: string) =>
      buildApiUrl(`api/jupiter/price/${token}${vsToken ? `?vsToken=${vsToken}` : ''}`),
    prices: (tokens: string[]) =>
      buildApiUrl(`api/jupiter/prices?tokens=${tokens.join(',')}`),
    createOrder: buildApiUrl('api/jupiter/limit-order/create'),
    cancelOrder: buildApiUrl('api/jupiter/limit-order/cancel'),
    openOrders: (wallet: string) => buildApiUrl(`api/jupiter/limit-order/open/${wallet}`),
    orderHistory: (wallet: string) => buildApiUrl(`api/jupiter/limit-order/history/${wallet}`),
    quote: buildApiUrl('api/jupiter/quote'),
  },
  magicEden: {
    diamonds: (wallet: string) => buildApiUrl(`api/magic-eden/diamonds/${wallet}`),
    quests: (wallet: string) => buildApiUrl(`api/magic-eden/quests/${wallet}`),
    tiers: buildApiUrl('api/magic-eden/tiers'),
    collection: (symbol: string) => buildApiUrl(`api/magic-eden/collection/${symbol}`),
  },
  whales: {
    top: (limit: number = 20) => buildApiUrl(`api/whales/top?limit=${limit}`),
    activity: (limit: number = 50) => buildApiUrl(`api/whales/activity?limit=${limit}`),
    details: (address: string) => buildApiUrl(`api/whales/details/${address}`),
    follow: buildApiUrl('api/whales/follow'),
    unfollow: buildApiUrl('api/whales/unfollow'),
    following: (wallet: string) => buildApiUrl(`api/whales/following/${wallet}`),
  },
  tax: {
    formats: buildApiUrl('api/tax/formats'),
    transactions: (wallet: string, startDate?: string, endDate?: string) => {
      let url = `api/tax/transactions/${wallet}`;
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      return buildApiUrl(params.toString() ? `${url}?${params}` : url);
    },
    summary: (wallet: string, year: number) =>
      buildApiUrl(`api/tax/summary/${wallet}/${year}`),
    export: (wallet: string, format: string = 'csv', year?: number) =>
      buildApiUrl(`api/tax/export/${wallet}?format=${format}${year ? `&year=${year}` : ''}`),
  },
};

export default API_BASE;

