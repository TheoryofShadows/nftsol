
import { Express, Request, Response } from "express";

// Rate limiting for public APIs
const rateLimitMap = new Map();

function rateLimit(req: Request, res: Response, next: any, limit = 100) {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  
  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return next();
  }
  
  const userLimit = rateLimitMap.get(ip);
  if (now > userLimit.resetTime) {
    userLimit.count = 1;
    userLimit.resetTime = now + windowMs;
    return next();
  }
  
  if (userLimit.count >= limit) {
    return res.status(429).json({ 
      error: 'Rate limit exceeded', 
      retryAfter: Math.ceil((userLimit.resetTime - now) / 1000) 
    });
  }
  
  userLimit.count++;
  next();
}

export function setupEnhancedPublicAPIRoutes(app: Express) {
  
  // Jupiter Aggregator - SOL Price & DeFi Data
  app.get("/api/public/jupiter/price", (req, res, next) => rateLimit(req, res, next, 60), async (req: Request, res: Response) => {
    try {
      const response = await fetch('https://quote-api.jup.ag/v6/price?ids=So11111111111111111111111111111111111111112');
      if (!response.ok) throw new Error('Jupiter API error');
      
      const data = await response.json();
      const solPrice = data.data?.So11111111111111111111111111111111111111112?.price || 100;
      
      res.json({
        solPrice: parseFloat(solPrice),
        provider: 'Jupiter',
        timestamp: new Date().toISOString(),
        source: 'DeFi Aggregator'
      });
    } catch (error) {
      console.error("Jupiter price error:", error);
      res.json({
        solPrice: 100, // Fallback
        provider: 'Fallback',
        timestamp: new Date().toISOString(),
        error: 'Jupiter unavailable'
      });
    }
  });

  // CoinGecko - Crypto Market Data
  app.get("/api/public/coingecko/solana", (req, res, next) => rateLimit(req, res, next, 50), async (req: Request, res: Response) => {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd&include_24hr_change=true&include_market_cap=true');
      if (!response.ok) throw new Error('CoinGecko API error');
      
      const data = await response.json();
      const solData = data.solana;
      
      res.json({
        price: solData.usd,
        change24h: solData.usd_24h_change,
        marketCap: solData.usd_market_cap,
        provider: 'CoinGecko',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("CoinGecko error:", error);
      res.status(500).json({ error: "Failed to fetch market data" });
    }
  });

  // Solana Beach - Network Statistics
  app.get("/api/public/solana-beach/stats", (req, res, next) => rateLimit(req, res, next, 30), async (req: Request, res: Response) => {
    try {
      const [blockHash, epochInfo] = await Promise.allSettled([
        fetch('https://api.solanabeach.io/v1/latest-blockhash'),
        fetch('https://api.solanabeach.io/v1/epoch/latest')
      ]);
      
      const networkStats = {
        networkHealth: 'operational',
        hasLatestBlock: blockHash.status === 'fulfilled',
        hasEpochInfo: epochInfo.status === 'fulfilled',
        provider: 'Solana Beach',
        timestamp: new Date().toISOString()
      };
      
      res.json(networkStats);
    } catch (error) {
      console.error("Solana Beach error:", error);
      res.json({
        networkHealth: 'unknown',
        provider: 'Fallback',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Magic Eden Public - NFT Collection Data
  app.get("/api/public/magiceden/collections", (req, res, next) => rateLimit(req, res, next, 40), async (req: Request, res: Response) => {
    try {
      const response = await fetch('https://api-mainnet.magiceden.dev/v2/collections?offset=0&limit=20');
      if (!response.ok) throw new Error('Magic Eden API error');
      
      const collections = await response.json();
      
      const enhancedCollections = collections.map((collection: any) => ({
        symbol: collection.symbol,
        name: collection.name,
        image: collection.image,
        floorPrice: collection.floorPrice || 0,
        listedCount: collection.listedCount || 0,
        volumeAll: collection.volumeAll || 0
      }));
      
      res.json({
        collections: enhancedCollections,
        count: enhancedCollections.length,
        provider: 'Magic Eden',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Magic Eden collections error:", error);
      res.status(500).json({ error: "Failed to fetch collections" });
    }
  });

  // Enhanced Market Overview Combining Multiple Sources
  app.get("/api/public/market-overview", (req, res, next) => rateLimit(req, res, next, 20), async (req: Request, res: Response) => {
    try {
      const [jupiterPrice, coinGeckoData, magicEdenCollections] = await Promise.allSettled([
        fetch('https://quote-api.jup.ag/v6/price?ids=So11111111111111111111111111111111111111112').then(r => r.json()),
        fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd&include_24hr_change=true').then(r => r.json()),
        fetch('https://api-mainnet.magiceden.dev/v2/collections?offset=0&limit=5').then(r => r.json())
      ]);

      const marketOverview = {
        solPrice: {
          jupiter: jupiterPrice.status === 'fulfilled' ? jupiterPrice.value.data?.So11111111111111111111111111111111111111112?.price : null,
          coinGecko: coinGeckoData.status === 'fulfilled' ? coinGeckoData.value.solana?.usd : null,
          current: coinGeckoData.status === 'fulfilled' ? coinGeckoData.value.solana?.usd : 100
        },
        marketChange24h: coinGeckoData.status === 'fulfilled' ? coinGeckoData.value.solana?.usd_24h_change : 0,
        topCollections: magicEdenCollections.status === 'fulfilled' ? magicEdenCollections.value.slice(0, 3) : [],
        networkStatus: 'operational',
        lastUpdated: new Date().toISOString()
      };

      res.json(marketOverview);
    } catch (error) {
      console.error("Market overview error:", error);
      res.status(500).json({ 
        error: "Failed to fetch market overview",
        fallback: {
          solPrice: { current: 100 },
          marketChange24h: 0,
          topCollections: [],
          networkStatus: 'operational'
        }
      });
    }
  });

  // Solana RPC Public - Account Verification
  app.get("/api/public/solana/account/:address", (req, res, next) => rateLimit(req, res, next, 30), async (req: Request, res: Response) => {
    try {
      const { address } = req.params;
      
      const response = await fetch('https://api.mainnet-beta.solana.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getAccountInfo',
          params: [address, { encoding: 'base64' }]
        })
      });

      const data = await response.json();
      
      res.json({
        address,
        exists: !!data.result?.value,
        lamports: data.result?.value?.lamports || 0,
        solBalance: (data.result?.value?.lamports || 0) / 1000000000,
        owner: data.result?.value?.owner || null,
        verified: true,
        provider: 'Solana RPC',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Solana account verification error:", error);
      res.status(500).json({ 
        error: "Failed to verify account",
        address: req.params.address,
        verified: false
      });
    }
  });

  // NFT Market Trends Aggregator
  app.get("/api/public/nft-trends", (req, res, next) => rateLimit(req, res, next, 25), async (req: Request, res: Response) => {
    try {
      const [magicEdenStats, solPrice] = await Promise.allSettled([
        fetch('https://api-mainnet.magiceden.dev/v2/collections?offset=0&limit=10').then(r => r.json()),
        fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd').then(r => r.json())
      ]);

      const trends = {
        totalCollections: magicEdenStats.status === 'fulfilled' ? magicEdenStats.value.length : 0,
        averageFloorPrice: magicEdenStats.status === 'fulfilled' 
          ? magicEdenStats.value.reduce((acc: number, col: any) => acc + (col.floorPrice || 0), 0) / magicEdenStats.value.length
          : 0,
        solPriceUSD: solPrice.status === 'fulfilled' ? solPrice.value.solana?.usd : 100,
        trending: magicEdenStats.status === 'fulfilled' 
          ? magicEdenStats.value.slice(0, 5).map((col: any) => ({
              name: col.name,
              symbol: col.symbol,
              floorPrice: col.floorPrice || 0,
              volume24h: col.volumeAll || 0
            }))
          : [],
        lastUpdated: new Date().toISOString()
      };

      res.json(trends);
    } catch (error) {
      console.error("NFT trends error:", error);
      res.status(500).json({ error: "Failed to fetch NFT trends" });
    }
  });

  // Health check for all public APIs
  app.get("/api/public/health-check", async (req: Request, res: Response) => {
    const services = {
      jupiter: { status: 'checking' },
      coinGecko: { status: 'checking' },
      magicEden: { status: 'checking' },
      solanaRPC: { status: 'checking' },
      solanaBeach: { status: 'checking' }
    };

    // Quick health checks
    const healthChecks = await Promise.allSettled([
      fetch('https://quote-api.jup.ag/v6/price?ids=So11111111111111111111111111111111111111112').then(() => 'operational').catch(() => 'error'),
      fetch('https://api.coingecko.com/api/v3/ping').then(() => 'operational').catch(() => 'error'),
      fetch('https://api-mainnet.magiceden.dev/v2/collections?offset=0&limit=1').then(() => 'operational').catch(() => 'error'),
      fetch('https://api.mainnet-beta.solana.com', { method: 'POST', body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getHealth' }) }).then(() => 'operational').catch(() => 'error'),
      fetch('https://api.solanabeach.io/v1/latest-blockhash').then(() => 'operational').catch(() => 'error')
    ]);

    services.jupiter.status = healthChecks[0].status === 'fulfilled' ? healthChecks[0].value : 'error';
    services.coinGecko.status = healthChecks[1].status === 'fulfilled' ? healthChecks[1].value : 'error';
    services.magicEden.status = healthChecks[2].status === 'fulfilled' ? healthChecks[2].value : 'error';
    services.solanaRPC.status = healthChecks[3].status === 'fulfilled' ? healthChecks[3].value : 'error';
    services.solanaBeach.status = healthChecks[4].status === 'fulfilled' ? healthChecks[4].value : 'error';

    res.json({
      overall: Object.values(services).every(s => s.status === 'operational') ? 'operational' : 'degraded',
      services,
      timestamp: new Date().toISOString()
    });
  });
}
