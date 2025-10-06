// Helius API client utilities

export interface HeliusNFT {
  id: string;
  interface: string;
  ownership: {
    frozen: boolean;
    delegated: boolean;
    delegate?: string;
    ownership_model: string;
    owner: string;
  };
  content?: {
    metadata: {
      attributes?: Array<{
        trait_type: string;
        value: string | number;
      }>;
      description?: string;
      name?: string;
      symbol?: string;
    };
    links?: {
      image?: string;
      external_url?: string;
    };
  };
  royalty?: {
    percent: number;
    basis_points: number;
    primary_sale_happened: boolean;
  };
  creators?: Array<{
    address: string;
    share: number;
    verified: boolean;
  }>;
}

export interface HeliusNFTsResponse {
  owner: string;
  nfts: HeliusNFT[];
  total: number;
  page: number;
  limit: number;
}

export interface HeliusBalance {
  address: string;
  balance: number;
  solBalance: number;
}

export interface HeliusTransaction {
  signature: string;
  slot: number;
  err: any;
  memo?: string;
  blockTime?: number;
  confirmationStatus?: string;
}

export interface HeliusTransactionsResponse {
  address: string;
  transactions: HeliusTransaction[];
  count: number;
}

// Get NFTs owned by a wallet address
export async function getHeliusNFTs(
  owner: string, 
  page: number = 1, 
  limit: number = 100
): Promise<HeliusNFTsResponse> {
  const response = await fetch(`/api/helius/nfts/${owner}?page=${page}&limit=${limit}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch NFTs: ${response.statusText}`);
  }
  
  return await response.json();
}

// Get single NFT metadata by mint address
export async function getHeliusNFT(mint: string): Promise<HeliusNFT> {
  const response = await fetch(`/api/helius/nft/${mint}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch NFT: ${response.statusText}`);
  }
  
  return await response.json();
}

// Get multiple NFTs by mint addresses
export async function getHeliusNFTsBatch(mints: string[]): Promise<HeliusNFT[]> {
  const response = await fetch('/api/helius/nfts/batch', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ mints })
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch NFTs batch: ${response.statusText}`);
  }
  
  return await response.json();
}

// Get wallet balance using Helius RPC
export async function getHeliusBalance(address: string): Promise<HeliusBalance> {
  const response = await fetch(`/api/helius/balance/${address}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch balance: ${response.statusText}`);
  }
  
  return await response.json();
}

// Get transaction history for a wallet
export async function getHeliusTransactions(
  address: string, 
  before?: string, 
  limit: number = 50
): Promise<HeliusTransactionsResponse> {
  const params = new URLSearchParams();
  if (before) params.append('before', before);
  params.append('limit', limit.toString());
  
  const response = await fetch(`/api/helius/transactions/${address}?${params}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch transactions: ${response.statusText}`);
  }
  
  return await response.json();
}

// Search NFTs with advanced filters
export async function searchHeliusNFTs(params: {
  query?: string;
  creator?: string;
  collection?: string;
  owner?: string;
  page?: number;
  limit?: number;
}): Promise<any> {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, value.toString());
    }
  });
  
  const response = await fetch(`/api/helius/search?${searchParams}`);
  
  if (!response.ok) {
    throw new Error(`Failed to search NFTs: ${response.statusText}`);
  }
  
  return await response.json();
}

// Get collection information
export async function getHeliusCollection(address: string): Promise<any> {
  const response = await fetch(`/api/helius/collection/${address}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch collection: ${response.statusText}`);
  }
  
  return await response.json();
}

// Check Helius API status
export async function getHeliusStatus(): Promise<any> {
  const response = await fetch('/api/helius/status');
  
  if (!response.ok) {
    throw new Error(`Failed to check Helius status: ${response.statusText}`);
  }
  
  return await response.json();
}

// Enhanced wallet info combining Helius and existing data
export async function getEnhancedWalletInfoWithHelius(walletAddress: string): Promise<any> {
  try {
    const [nfts, balance, transactions] = await Promise.all([
      getHeliusNFTs(walletAddress, 1, 20).catch(() => ({ nfts: [], total: 0 })),
      getHeliusBalance(walletAddress).catch(() => ({ balance: 0, solBalance: 0 })),
      getHeliusTransactions(walletAddress, undefined, 10).catch(() => ({ transactions: [] }))
    ]);

    return {
      address: walletAddress,
      balance: balance.solBalance,
      recentTransactions: transactions.transactions || [],
      nftHoldings: nfts.nfts || [],
      totalNFTs: nfts.total || 0,
      explorerUrl: `https://solscan.io/account/${walletAddress}`,
      lastUpdated: new Date().toISOString(),
      source: 'helius'
    };
  } catch (error) {
    console.error('Failed to fetch enhanced wallet info with Helius:', error);
    throw error;
  }
}