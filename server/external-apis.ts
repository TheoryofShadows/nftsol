
import { Express, Request, Response } from "express";

// Rate limiting tracker for external APIs
const apiCallTracker = new Map();
const resetInterval = 60 * 1000; // 1 minute

// API Limits per service (conservative estimates)
const API_LIMITS = {
  solscan: { perMinute: 20, perHour: 1000 },
  opensea: { perMinute: 5, perHour: 200 }, // Very conservative
  coingecko: { perMinute: 10, perHour: 1000 },
  metaplex: { perMinute: 30, perHour: 1800 },
  jupiter: { perMinute: 20, perHour: 1200 },
  birdeye: { perMinute: 5, perHour: 300 } // Requires API key
};

function checkRateLimit(service: string): boolean {
  const now = Date.now();
  const key = `${service}_minute`;
  const hourKey = `${service}_hour`;
  
  if (!apiCallTracker.has(key)) {
    apiCallTracker.set(key, { count: 0, resetTime: now + resetInterval });
    apiCallTracker.set(hourKey, { count: 0, resetTime: now + (60 * resetInterval) });
  }
  
  const minuteData = apiCallTracker.get(key);
  const hourData = apiCallTracker.get(hourKey);
  
  // Reset counters if time window passed
  if (now > minuteData.resetTime) {
    minuteData.count = 0;
    minuteData.resetTime = now + resetInterval;
  }
  
  if (now > hourData.resetTime) {
    hourData.count = 0;
    hourData.resetTime = now + (60 * resetInterval);
  }
  
  const limits = API_LIMITS[service as keyof typeof API_LIMITS];
  if (!limits) return true;
  
  // Check both minute and hour limits
  if (minuteData.count >= limits.perMinute || hourData.count >= limits.perHour) {
    return false;
  }
  
  minuteData.count++;
  hourData.count++;
  return true;
}

// External API integrations for comprehensive NFT data
export function setupExternalAPIRoutes(app: Express) {
  
  // Solscan API proxy for transaction data
  app.get("/api/external/solscan/account/:address", async (req: Request, res: Response) => {
    try {
      if (!checkRateLimit('solscan')) {
        return res.status(429).json({ 
          error: "Rate limit exceeded for Solscan API. Please try again later.",
          retryAfter: 60 
        });
      }

      const { address } = req.params;
      const response = await fetch(`https://public-api.solscan.io/account/${address}`, {
        headers: {
          'User-Agent': 'NFTSol/1.0',
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        if (response.status === 429) {
          return res.status(429).json({ error: "Solscan rate limit exceeded" });
        }
        throw new Error(`Solscan API error: ${response.status}`);
      }
      
      const data = await response.json();
      res.json({
        source: 'Solscan',
        account: data,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error("Solscan API error:", error);
      res.status(500).json({ error: "Failed to fetch account data" });
    }
  });

  // OpenSea API proxy for cross-chain NFT data (very conservative limits)
  app.get("/api/external/opensea/assets", async (req: Request, res: Response) => {
    try {
      if (!checkRateLimit('opensea')) {
        return res.status(429).json({ 
          error: "Rate limit exceeded for OpenSea API. Please try again later.",
          retryAfter: 60 
        });
      }

      // Only proceed if we have an API key
      if (!process.env.OPENSEA_API_KEY) {
        return res.status(503).json({ 
          error: "OpenSea API not configured. API key required.",
          fallback: "Using mock data for demo"
        });
      }

      const { collection, limit = 10 } = req.query; // Reduced limit
      
      const response = await fetch(`https://api.opensea.io/api/v1/assets?collection=${collection}&limit=${Math.min(Number(limit), 10)}`, {
        headers: {
          'X-API-KEY': process.env.OPENSEA_API_KEY,
          'User-Agent': 'NFTSol/1.0',
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        if (response.status === 429) {
          return res.status(429).json({ error: "OpenSea rate limit exceeded" });
        }
        throw new Error(`OpenSea API error: ${response.status}`);
      }
      
      const data = await response.json();
      res.json({
        source: 'OpenSea',
        assets: data.assets || [],
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error("OpenSea API error:", error);
      res.status(500).json({ error: "Failed to fetch OpenSea data" });
    }
  });

  // CoinGecko API for SOL price data (free tier: 10-50 calls/minute)
  app.get("/api/external/prices/sol", async (req: Request, res: Response) => {
    try {
      if (!checkRateLimit('coingecko')) {
        return res.status(429).json({ 
          error: "Rate limit exceeded for CoinGecko API. Please try again later.",
          retryAfter: 60 
        });
      }

      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd,eur,btc', {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'NFTSol/1.0'
        }
      });
      
      if (!response.ok) {
        if (response.status === 429) {
          return res.status(429).json({ error: "CoinGecko rate limit exceeded" });
        }
        throw new Error(`CoinGecko API error: ${response.status}`);
      }
      
      const data = await response.json();
      res.json({
        source: 'CoinGecko',
        solana: data.solana || {},
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error("CoinGecko API error:", error);
      res.status(500).json({ error: "Failed to fetch SOL price" });
    }
  });

  // Metaplex API for Solana NFT metadata
  app.get("/api/external/metaplex/nft/:mintAddress", async (req: Request, res: Response) => {
    try {
      const { mintAddress } = req.params;
      
      // Metaplex RPC call simulation (replace with actual implementation)
      const response = await fetch(`https://api.metaplex.com/nfts/${mintAddress}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        // Fallback to mock data for demo
        return res.json({
          source: 'Metaplex (Demo)',
          nft: {
            mintAddress,
            name: `NFT ${mintAddress.slice(0, 8)}`,
            symbol: 'NFT',
            description: 'Metaplex NFT metadata',
            image: `https://via.placeholder.com/400x400/9333ea/ffffff?text=${mintAddress.slice(0, 8)}`,
            attributes: [],
            creators: [],
            royalty: 0
          },
          lastUpdated: new Date().toISOString()
        });
      }
      
      const data = await response.json();
      res.json({
        source: 'Metaplex',
        nft: data,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error("Metaplex API error:", error);
      res.status(500).json({ error: "Failed to fetch Metaplex data" });
    }
  });

  // Phantom wallet API integration
  app.get("/api/external/phantom/connect", async (req: Request, res: Response) => {
    try {
      res.json({
        phantomSupported: true,
        connectInstructions: {
          step1: "Install Phantom wallet extension",
          step2: "Visit your dApp",
          step3: "Click connect wallet",
          step4: "Approve connection in Phantom"
        },
        phantomDeepLink: "https://phantom.app/ul/browse/https://nftsol.app?ref=nftsol"
      });
    } catch (error) {
      console.error("Phantom integration error:", error);
      res.status(500).json({ error: "Failed to provide Phantom integration" });
    }
  });

  // Solflare wallet API integration
  app.get("/api/external/solflare/connect", async (req: Request, res: Response) => {
    try {
      res.json({
        solflareSupported: true,
        connectInstructions: {
          step1: "Install Solflare wallet",
          step2: "Create or import wallet",
          step3: "Visit NFTSol marketplace",
          step4: "Connect your Solflare wallet"
        },
        solflareDeepLink: "https://solflare.com/access-wallet"
      });
    } catch (error) {
      console.error("Solflare integration error:", error);
      res.status(500).json({ error: "Failed to provide Solflare integration" });
    }
  });

  // Jupiter aggregator for token swaps
  app.get("/api/external/jupiter/quote", async (req: Request, res: Response) => {
    try {
      const { inputMint, outputMint, amount } = req.query;
      
      const response = await fetch(
        `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=50`
      );
      
      if (!response.ok) {
        throw new Error(`Jupiter API error: ${response.status}`);
      }
      
      const data = await response.json();
      res.json({
        source: 'Jupiter',
        quote: data,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error("Jupiter API error:", error);
      res.status(500).json({ error: "Failed to fetch swap quote" });
    }
  });

  // Birdeye API for market data
  app.get("/api/external/birdeye/token/:address", async (req: Request, res: Response) => {
    try {
      const { address } = req.params;
      
      const response = await fetch(`https://public-api.birdeye.so/defi/token_overview?address=${address}`, {
        headers: {
          'X-API-KEY': process.env.BIRDEYE_API_KEY || ''
        }
      });
      
      if (!response.ok) {
        throw new Error(`Birdeye API error: ${response.status}`);
      }
      
      const data = await response.json();
      res.json({
        source: 'Birdeye',
        token: data.data || {},
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error("Birdeye API error:", error);
      res.status(500).json({ error: "Failed to fetch token data" });
    }
  });

  // Aggregated market data endpoint
  app.get("/api/external/market-overview", async (req: Request, res: Response) => {
    try {
      // Fetch data from multiple sources
      const [solPrice, nftStats] = await Promise.allSettled([
        fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd').then(r => r.json()),
        // Add your internal stats here
        Promise.resolve({
          totalNFTs: 2543,
          totalVolume: 12847.23,
          activeTraders: 892
        })
      ]);

      res.json({
        marketOverview: {
          solPrice: solPrice.status === 'fulfilled' ? solPrice.value.solana : { usd: 100 },
          nftMarket: nftStats.status === 'fulfilled' ? nftStats.value : {},
          lastUpdated: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error("Market overview error:", error);
      res.status(500).json({ error: "Failed to fetch market overview" });
    }
  });

  // API status and usage dashboard
  app.get("/api/external/status", async (req: Request, res: Response) => {
    try {
      const now = Date.now();
      const apiStatuses = {
        solscan: 'operational',
        magicEden: 'operational', 
        coingecko: 'operational',
        jupiter: 'operational',
        birdeye: 'limited',
        helius: process.env.HELIUS_API_KEY ? 'operational' : 'not_configured',
        opensea: process.env.OPENSEA_API_KEY ? 'operational' : 'not_configured'
      };

      // Get current usage stats
      const usageStats: any = {};
      for (const [service] of Object.entries(API_LIMITS)) {
        const minuteKey = `${service}_minute`;
        const hourKey = `${service}_hour`;
        const minuteData = apiCallTracker.get(minuteKey) || { count: 0 };
        const hourData = apiCallTracker.get(hourKey) || { count: 0 };
        const limits = API_LIMITS[service as keyof typeof API_LIMITS];
        
        usageStats[service] = {
          minute: { used: minuteData.count, limit: limits.perMinute },
          hour: { used: hourData.count, limit: limits.perHour },
          available: minuteData.count < limits.perMinute && hourData.count < limits.perHour
        };
      }

      // OpenAI usage
      usageStats.openai = {
        minute: { used: openaiCallTracker.count, limit: OPENAI_LIMITS.perMinute },
        day: { used: openaiCallTracker.dailyCount, limit: OPENAI_LIMITS.perDay },
        available: openaiCallTracker.count < OPENAI_LIMITS.perMinute && 
                  openaiCallTracker.dailyCount < OPENAI_LIMITS.perDay
      };

      res.json({
        externalAPIs: apiStatuses,
        usageStats,
        overall: Object.values(apiStatuses).every(status => status === 'operational') ? 'operational' : 'degraded',
        lastChecked: new Date().toISOString()
      });
    } catch (error) {
      console.error("API status error:", error);
      res.status(500).json({ error: "Failed to check API status" });
    }
  });
}
