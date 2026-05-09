/**
 * Helius Service
 * Direct client-side calls to Helius DAS API — no backend needed.
 * Replaces backend proxy calls for NFT metadata, wallet assets, and Solana RPC.
 *
 * Helius API key is read from VITE_HELIUS_API_KEY env var.
 */

const HELIUS_KEY = import.meta.env.VITE_HELIUS_API_KEY as string;
const HELIUS_RPC  = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_KEY}`;
const HELIUS_DAS  = `https://api.helius.xyz/v0`;

export interface HeliusNFT {
  id: string;
  content: {
    metadata: {
      name: string;
      description?: string;
      symbol?: string;
      attributes?: Array<{ trait_type: string; value: string | number }>;
    };
    links?: { image?: string; external_url?: string };
    files?: Array<{ uri: string; mime?: string }>;
  };
  ownership: { owner: string };
  royalty?: { royalty_model: string; target: string | null; percent: number };
  creators?: Array<{ address: string; share: number; verified: boolean }>;
  compression?: { compressed: boolean };
  grouping?: Array<{ group_key: string; group_value: string }>;
}

export interface HeliusAssetPage {
  total: number;
  limit: number;
  page: number;
  items: HeliusNFT[];
}

// ─── DAS RPC helpers ────────────────────────────────────────────────────────

async function dasPost<T>(method: string, params: unknown): Promise<T> {
  const res = await fetch(HELIUS_RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`Helius RPC ${res.status}`);
  const json = await res.json() as { result: T; error?: { message: string } };
  if (json.error) throw new Error(json.error.message);
  return json.result;
}

// ─── Public API ─────────────────────────────────────────────────────────────

class HeliusService {
  /**
   * Fetch all NFTs owned by a wallet address (DAS getAssetsByOwner).
   */
  async getNFTsByOwner(
    ownerAddress: string,
    page = 1,
    limit = 50
  ): Promise<HeliusAssetPage> {
    return dasPost<HeliusAssetPage>('getAssetsByOwner', {
      ownerAddress,
      page,
      limit,
      displayOptions: { showUnverifiedCollections: false, showCollectionMetadata: true },
    });
  }

  /**
   * Fetch metadata for a single asset by mint address (DAS getAsset).
   */
  async getAsset(mintAddress: string): Promise<HeliusNFT> {
    return dasPost<HeliusNFT>('getAsset', { id: mintAddress });
  }

  /**
   * Fetch multiple assets by mint addresses (DAS getAssetBatch).
   */
  async getAssetBatch(mintAddresses: string[]): Promise<HeliusNFT[]> {
    return dasPost<HeliusNFT[]>('getAssetBatch', { ids: mintAddresses });
  }

  /**
   * Get all assets in a collection (DAS getAssetsByGroup).
   */
  async getAssetsByCollection(
    collectionMint: string,
    page = 1,
    limit = 50
  ): Promise<HeliusAssetPage> {
    return dasPost<HeliusAssetPage>('getAssetsByGroup', {
      groupKey: 'collection',
      groupValue: collectionMint,
      page,
      limit,
    });
  }

  /**
   * SOL balance for a wallet (standard JSON-RPC getBalance).
   */
  async getSolBalance(address: string): Promise<number> {
    const lamports = await dasPost<number>('getBalance', { pubkey: address, commitment: 'confirmed' } as unknown as unknown);
    return lamports / 1e9;
  }

  /**
   * SPL token accounts for a wallet — used for CLOUT balance.
   */
  async getTokenAccounts(ownerAddress: string): Promise<Array<{
    mint: string;
    amount: number;
    decimals: number;
  }>> {
    const res = await fetch(
      `${HELIUS_DAS}/addresses/${ownerAddress}/balances?api-key=${HELIUS_KEY}`,
      { signal: AbortSignal.timeout(10000) }
    );
    if (!res.ok) return [];
    const json = await res.json() as {
      tokens?: Array<{ mint: string; amount: number; decimals: number }>;
    };
    return json.tokens ?? [];
  }

  /**
   * Get CLOUT token balance for a wallet.
   * CLOUT mint: 26iJ37BE3icVtoo2QRkfjtYXFHMudG2sbTHAnhF2D6ab
   */
  async getCloutBalance(ownerAddress: string): Promise<number> {
    const CLOUT_MINT = '26iJ37BE3icVtoo2QRkfjtYXFHMudG2sbTHAnhF2D6ab';
    try {
      const tokens = await this.getTokenAccounts(ownerAddress);
      const clout = tokens.find(t => t.mint === CLOUT_MINT);
      if (!clout) return 0;
      return clout.amount / Math.pow(10, clout.decimals);
    } catch {
      return 0;
    }
  }

  /**
   * Transaction history for a wallet (Helius enhanced transactions API).
   */
  async getTransactionHistory(
    address: string,
    limit = 20
  ): Promise<Array<Record<string, unknown>>> {
    const res = await fetch(
      `${HELIUS_DAS}/addresses/${address}/transactions?api-key=${HELIUS_KEY}&limit=${limit}`,
      { signal: AbortSignal.timeout(12000) }
    );
    if (!res.ok) return [];
    return res.json() as Promise<Array<Record<string, unknown>>>;
  }
}

export const heliusService = new HeliusService();
