import { Router } from "express";
import { Connection } from '@solana/web3.js';
import { getHeliusConfig } from '../config/environment';
import { db } from '../db';

const router = Router();

// Enhanced health check endpoint
router.get("/", async (_req, res) => {
  try {
    const health = {
      ok: true,
      timestamp: Date.now(),
      service: "nftsol-server",
      version: "1.0.0",
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV || 'development'
    };
    res.json(health);
  } catch (error) {
    res.status(500).json({ 
      ok: false, 
      error: error instanceof Error ? error.message : 'Health check failed',
      timestamp: Date.now()
    });
  }
});

// Comprehensive system health check
router.get("/detailed", async (_req, res) => {
  try {
    const heliusConfig = getHeliusConfig();
    const connection = new Connection(heliusConfig.rpcUrl, 'confirmed');
    
    const health = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      services: {
        database: await testDatabase(),
        helius: await testHelius(connection),
        ipfs: await testIPFS(),
        clout: await testCloutToken(connection)
      },
      performance: {
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime(),
        cpuUsage: process.cpuUsage()
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasOpenAI: !!process.env.OPENAI_API_KEY,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasHeliusKey: !!process.env.HELIUS_API_KEY
      }
    };
    
    res.json(health);
  } catch (error) {
    res.status(500).json({
      timestamp: new Date().toISOString(),
      status: 'error',
      error: error instanceof Error ? error.message : 'System health check failed'
    });
  }
});

// Test database connection
async function testDatabase() {
  try {
    // Simple database query test
    await db.execute('SELECT 1');
    return { status: 'healthy', connected: true };
  } catch (error) {
    return { 
      status: 'error', 
      connected: false,
      error: error instanceof Error ? error.message : 'Database connection failed'
    };
  }
}

// Test Helius connection
async function testHelius(connection: Connection) {
  try {
    const slot = await connection.getSlot();
    return { 
      status: 'healthy', 
      connected: true,
      currentSlot: slot
    };
  } catch (error) {
    return { 
      status: 'error', 
      connected: false,
      error: error instanceof Error ? error.message : 'Helius connection failed'
    };
  }
}

// Test IPFS connectivity
async function testIPFS() {
  try {
    const testUrl = 'https://w3s.link/ipfs/bafybeiefy2i5yfzkctg5of57nmdxkr7ilt5soyvcyoe7fa3fhsk3scodcy';
    const response = await fetch(testUrl, { method: 'HEAD' });
    return { 
      status: response.ok ? 'healthy' : 'error',
      connected: response.ok,
      gateway: 'w3s.link'
    };
  } catch (error) {
    return { 
      status: 'error', 
      connected: false,
      error: error instanceof Error ? error.message : 'IPFS connection failed'
    };
  }
}

// Test CLOUT token system
async function testCloutToken(connection: Connection) {
  try {
    const cloutMint = '4aHwytKbZnTJY5uNDSX75g2zChfYnC53GdNJHEZtwDPf';
    const accountInfo = await connection.getAccountInfo(new (await import('@solana/web3.js')).PublicKey(cloutMint));
    return { 
      status: accountInfo ? 'healthy' : 'error',
      connected: !!accountInfo,
      mint: cloutMint
    };
  } catch (error) {
    return { 
      status: 'error', 
      connected: false,
      error: error instanceof Error ? error.message : 'CLOUT token check failed'
    };
  }
}

// Additional health endpoint for Render health checks
router.get("/health", (_req, res) => res.json({ 
  status: "ok", 
  timestamp: Date.now(),
  service: "nftsol-server",
  version: "1.0.0"
}));

export default router;
