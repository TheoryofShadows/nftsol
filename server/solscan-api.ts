import { Request, Response } from "express";

// Solscan API configuration
const SOLSCAN_API_BASE = 'https://api.solscan.io';
const SOLSCAN_API_KEY = process.env.SOLSCAN_API_KEY || '';

// API endpoints
const ENDPOINTS = {
  account: '/account',
  transaction: '/transaction',
  tokens: '/account/tokens',
  transfers: '/account/transfers',
  nft: '/account/nft',
  token: '/token',
  block: '/block',
  network: '/network'
};

async function makeRequest(endpoint: string, params: Record<string, string> = {}): Promise<any> {
  const url = new URL(`${SOLSCAN_API_BASE}${endpoint}`);
  
  // Add API key if available
  if (SOLSCAN_API_KEY) {
    url.searchParams.append('apikey', SOLSCAN_API_KEY);
  }
  
  // Add other parameters
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
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
      throw new Error(`Solscan API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Solscan API request failed:', error);
    throw error;
  }
}

export function setupSolscanRoutes(app: any) {
  // Get account information
  app.get("/api/solscan/account/:address", async (req: Request, res: Response) => {
    try {
      const { address } = req.params;
      const accountInfo = await makeRequest(ENDPOINTS.account, { address });
      res.json(accountInfo);
    } catch (error) {
      console.error("Failed to fetch account info:", error);
      res.status(500).json({ error: "Failed to fetch account information" });
    }
  });

  // Get transaction details
  app.get("/api/solscan/transaction/:signature", async (req: Request, res: Response) => {
    try {
      const { signature } = req.params;
      const transactionInfo = await makeRequest(ENDPOINTS.transaction, { signature });
      res.json(transactionInfo);
    } catch (error) {
      console.error("Failed to fetch transaction info:", error);
      res.status(500).json({ error: "Failed to fetch transaction information" });
    }
  });

  // Get account tokens
  app.get("/api/solscan/tokens/:address", async (req: Request, res: Response) => {
    try {
      const { address } = req.params;
      const tokens = await makeRequest(ENDPOINTS.tokens, { address });
      res.json(tokens);
    } catch (error) {
      console.error("Failed to fetch account tokens:", error);
      res.status(500).json({ error: "Failed to fetch account tokens" });
    }
  });

  // Get account transfers
  app.get("/api/solscan/transfers/:address", async (req: Request, res: Response) => {
    try {
      const { address } = req.params;
      const { limit = '50', offset = '0' } = req.query;
      const transfers = await makeRequest(ENDPOINTS.transfers, {
        address,
        limit: limit as string,
        offset: offset as string
      });
      res.json(transfers);
    } catch (error) {
      console.error("Failed to fetch account transfers:", error);
      res.status(500).json({ error: "Failed to fetch account transfers" });
    }
  });

  // Get account NFTs
  app.get("/api/solscan/nfts/:address", async (req: Request, res: Response) => {
    try {
      const { address } = req.params;
      const nfts = await makeRequest(ENDPOINTS.nft, { address });
      res.json(nfts);
    } catch (error) {
      console.error("Failed to fetch account NFTs:", error);
      res.status(500).json({ error: "Failed to fetch account NFTs" });
    }
  });

  // Get wallet analytics
  app.get("/api/solscan/analytics/:address", async (req: Request, res: Response) => {
    try {
      const { address } = req.params;
      
      // Fetch comprehensive wallet data
      const [accountInfo, transfers, tokens, nfts] = await Promise.all([
        makeRequest(ENDPOINTS.account, { address }).catch(() => null),
        makeRequest(ENDPOINTS.transfers, { address, limit: '10' }).catch(() => ({ data: [] })),
        makeRequest(ENDPOINTS.tokens, { address }).catch(() => ({ data: [] })),
        makeRequest(ENDPOINTS.nft, { address }).catch(() => ({ data: [] }))
      ]);

      const analytics = {
        address,
        balance: accountInfo ? accountInfo.lamports / 1000000000 : 0,
        totalTransactions: transfers.data?.length || 0,
        recentActivity: transfers.data || [],
        tokenHoldings: tokens.data || [],
        nftHoldings: nfts.data || [],
        explorerUrl: `https://solscan.io/account/${address}`,
        lastUpdated: new Date().toISOString()
      };

      res.json(analytics);
    } catch (error) {
      console.error("Failed to fetch wallet analytics:", error);
      res.status(500).json({ error: "Failed to fetch wallet analytics" });
    }
  });

  // Verify transaction
  app.get("/api/solscan/verify/:signature", async (req: Request, res: Response) => {
    try {
      const { signature } = req.params;
      const transactionInfo = await makeRequest(ENDPOINTS.transaction, { signature });
      
      const verification = {
        signature,
        verified: transactionInfo.status === 'Success',
        status: transactionInfo.status,
        blockTime: transactionInfo.blockTime,
        fee: transactionInfo.fee,
        explorerUrl: `https://solscan.io/tx/${signature}`,
        details: transactionInfo
      };

      res.json(verification);
    } catch (error) {
      console.error("Failed to verify transaction:", error);
      res.status(500).json({ 
        signature: req.params.signature,
        verified: false,
        error: "Failed to verify transaction",
        explorerUrl: `https://solscan.io/tx/${req.params.signature}`
      });
    }
  });

  // Get Solscan API status
  app.get("/api/solscan/status", async (req: Request, res: Response) => {
    try {
      res.json({
        status: 'operational',
        apiKeyConfigured: !!SOLSCAN_API_KEY,
        baseUrl: SOLSCAN_API_BASE,
        endpoints: Object.keys(ENDPOINTS),
        lastChecked: new Date().toISOString()
      });
    } catch (error) {
      console.error("Failed to get Solscan status:", error);
      res.status(500).json({ error: "Failed to get Solscan API status" });
    }
  });
}