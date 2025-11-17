import { Request, Response } from "express";

// Helius API configuration
const HELIUS_API_KEY = process.env.HELIUS_API_KEY || 'demo';
const HELIUS_RPC_URL = `https://rpc.helius.xyz/?api-key=${HELIUS_API_KEY}`;
const HELIUS_API_BASE = 'https://api.helius.xyz/v0';

interface HeliusNFT {
  id: string;
  interface: string;
  ownership: {
    frozen: boolean;
    delegated: boolean;
    delegate?: string;
    ownership_model: string;
    owner: string;
  };
  mpl_core_info?: any;
  authorities?: any[];
  compression?: any;
  grouping?: any[];
  royalty?: {
    royalty_model: string;
    target?: string;
    percent: number;
    basis_points: number;
    primary_sale_happened: boolean;
    locked: boolean;
  };
  creators?: Array<{
    address: string;
    share: number;
    verified: boolean;
  }>;
  supply?: {
    print_max_supply: number;
    print_current_supply: number;
    edition_nonce: number;
  };
  mutable: boolean;
  burnt: boolean;
  mint_extensions?: any;
  token_info?: {
    supply: number;
    decimals: number;
    token_program: string;
    mint_authority?: string;
    freeze_authority?: string;
    balance?: number;
  };
  content?: {
    $schema: string;
    json_uri: string;
    files?: Array<{
      uri: string;
      cdn_uri?: string;
      mime: string;
    }>;
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
}

async function makeHeliusRequest(endpoint: string, params: Record<string, any> = {}): Promise<any> {
  const url = new URL(`${HELIUS_API_BASE}${endpoint}`);

  // Add API key to params
  params.api_key = HELIUS_API_KEY;

  // Add parameters to URL
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, value.toString());
    }
  });

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Helius API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Helius API request failed:', error);
    throw error;
  }
}

async function makeHeliusRPCRequest(method: string, params: any[] = []): Promise<any> {
  try {
    const response = await fetch(HELIUS_RPC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method,
        params
      })
    });

    if (!response.ok) {
      throw new Error(`Helius RPC error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(`RPC Error: ${data.error.message}`);
    }

    return data.result;
  } catch (error) {
    console.error('Helius RPC request failed:', error);
    throw error;
  }
}

export function setupHeliusRoutes(app: any) {
  // Get NFTs by owner using Helius API
  app.get("/api/helius/nfts/:owner", async (req: Request, res: Response) => {
    try {
      const { owner } = req.params;
      const { page = 1, limit = 1000 } = req.query;

      const nfts = await makeHeliusRequest('/addresses/' + owner + '/nfts', {
        page: page as string,
        limit: limit as string
      });

      res.json({
        owner,
        nfts: nfts.items || [],
        total: nfts.total || 0,
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      });
    } catch (error) {
      console.error("Failed to fetch NFTs from Helius:", error);
      res.status(500).json({ error: "Failed to fetch NFTs" });
    }
  });

  // Get NFT metadata by mint address
  app.get("/api/helius/nft/:mint", async (req: Request, res: Response) => {
    try {
      const { mint } = req.params;

      const nftData = await makeHeliusRequest('/nfts/' + mint, {});

      res.json(nftData);
    } catch (error) {
      console.error("Failed to fetch NFT metadata from Helius:", error);
      res.status(500).json({ error: "Failed to fetch NFT metadata" });
    }
  });

  // Get multiple NFTs by mint addresses
  app.post("/api/helius/nfts/batch", async (req: Request, res: Response) => {
    try {
      const { mints } = req.body;

      if (!mints || !Array.isArray(mints)) {
        return res.status(400).json({ error: "Invalid mints array" });
      }

      const response = await fetch(`${HELIUS_API_BASE}/nfts?api-key=${HELIUS_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mints,
          includeOffChainData: true
        })
      });

      if (!response.ok) {
        throw new Error(`Helius batch request failed: ${response.statusText}`);
      }

      const nfts = await response.json();
      res.json(nfts);
    } catch (error) {
      console.error("Failed to fetch NFTs batch from Helius:", error);
      res.status(500).json({ error: "Failed to fetch NFTs batch" });
    }
  });

  // Get account balance using enhanced RPC
  app.get("/api/helius/balance/:address", async (req: Request, res: Response) => {
    try {
      const { address } = req.params;

      const balance = await makeHeliusRPCRequest('getBalance', [address]);

      res.json({
        address,
        balance: balance.value,
        solBalance: balance.value / 1000000000 // Convert lamports to SOL
      });
    } catch (error) {
      console.error("Failed to fetch balance from Helius:", error);
      res.status(500).json({ error: "Failed to fetch balance" });
    }
  });

  // Get transaction history for an address
  app.get("/api/helius/transactions/:address", async (req: Request, res: Response) => {
    try {
      const { address } = req.params;
      const { before, limit = 50 } = req.query;

      const params: any[] = [address, { limit: parseInt(limit as string) }];
      if (before) {
        params[1].before = before;
      }

      const transactions = await makeHeliusRPCRequest('getSignaturesForAddress', params);

      res.json({
        address,
        transactions: transactions || [],
        count: transactions?.length || 0
      });
    } catch (error) {
      console.error("Failed to fetch transactions from Helius:", error);
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  // Enhanced NFT search with filters
  app.get("/api/helius/search", async (req: Request, res: Response) => {
    try {
      const { 
        query, 
        creator, 
        collection, 
        owner, 
        page = 1, 
        limit = 20 
      } = req.query;

      const searchParams: any = {
        page: page as string,
        limit: limit as string
      };

      if (query) searchParams.search = query;
      if (creator) searchParams.creator = creator;
      if (collection) searchParams.collection = collection;
      if (owner) searchParams.owner = owner;

      const results = await makeHeliusRequest('/nfts/search', searchParams);

      res.json(results);
    } catch (error) {
      console.error("Failed to search NFTs via Helius:", error);
      res.status(500).json({ error: "Failed to search NFTs" });
    }
  });

  // Get collection information
  app.get("/api/helius/collection/:address", async (req: Request, res: Response) => {
    try {
      const { address } = req.params;

      const collection = await makeHeliusRequest('/collections/' + address, {});

      res.json(collection);
    } catch (error) {
      console.error("Failed to fetch collection from Helius:", error);
      res.status(500).json({ error: "Failed to fetch collection data" });
    }
  });

  // Helius API health check
  app.get("/api/helius/status", async (req: Request, res: Response) => {
    try {
      // Test RPC connection
      const blockHeight = await makeHeliusRPCRequest('getBlockHeight', []);

      res.json({
        status: 'operational',
        apiKeyConfigured: !!HELIUS_API_KEY,
        rpcUrl: HELIUS_RPC_URL.split('?')[0] + '?api-key=***',
        apiBase: HELIUS_API_BASE,
        currentBlockHeight: blockHeight,
        lastChecked: new Date().toISOString()
      });
    } catch (error) {
      console.error("Helius status check failed:", error);
      res.status(500).json({ 
        status: 'error',
        error: "Failed to connect to Helius API",
        apiKeyConfigured: !!HELIUS_API_KEY
      });
    }
  });
}