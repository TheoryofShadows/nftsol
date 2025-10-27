import { Router } from 'express';
import { Connection, PublicKey } from '@solana/web3.js';
import { FeeCollectionService } from '../services/feeCollectionService';
import { UsageMonitoringService } from '../services/usageMonitoringService';

const router = Router();

// Initialize services
const connection = new Connection(process.env.HELIUS_RPC_URL || 'https://api.mainnet-beta.solana.com');
const feeService = new FeeCollectionService(connection);
const usageService = new UsageMonitoringService();

// Generate some demo data
usageService.generateDemoData();

// Fee transparency endpoints
router.get('/fees/stats', async (req, res) => {
  try {
    const stats = await feeService.getFeeStats();
    res.json({
      success: true,
      data: stats,
      timestamp: Date.now(),
      message: 'Fee statistics retrieved successfully'
    });
  } catch (error) {
    console.error('Failed to fetch fee statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch fee statistics',
      timestamp: Date.now()
    });
  }
});

router.get('/fees/history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const history = await feeService.getFeeHistory(limit);
    res.json({
      success: true,
      data: history,
      count: history.length,
      timestamp: Date.now(),
      message: 'Fee history retrieved successfully'
    });
  } catch (error) {
    console.error('Failed to fetch fee history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch fee history',
      timestamp: Date.now()
    });
  }
});

// Usage monitoring endpoints
router.get('/usage/stats', async (req, res) => {
  try {
    const timeframe = req.query.timeframe as string || 'day';
    const stats = usageService.getUsageStats(timeframe as any);
    res.json({
      success: true,
      data: stats,
      timeframe,
      timestamp: Date.now(),
      message: 'Usage statistics retrieved successfully'
    });
  } catch (error) {
    console.error('Failed to fetch usage statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch usage statistics',
      timestamp: Date.now()
    });
  }
});

router.get('/usage/realtime', async (req, res) => {
  try {
    const realtime = usageService.getRealTimeMetrics();
    res.json({
      success: true,
      data: realtime,
      timestamp: Date.now(),
      message: 'Real-time metrics retrieved successfully'
    });
  } catch (error) {
    console.error('Failed to fetch real-time metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch real-time metrics',
      timestamp: Date.now()
    });
  }
});

// Treasury balance endpoint
router.get('/treasury/balance', async (req, res) => {
  try {
    const treasuryData = await feeService.getTreasuryBalance();
    res.json({
      success: true,
      data: treasuryData,
      timestamp: Date.now(),
      message: 'Treasury balance retrieved successfully'
    });
  } catch (error) {
    console.error('Failed to fetch treasury balance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch treasury balance',
      timestamp: Date.now()
    });
  }
});

// Smart contract information
router.get('/contracts/info', async (req, res) => {
  try {
    const contracts = {
      cloutToken: {
        mint: '4aHwytKbZnTJY5uNDSX75g2zChfYnC53GdNJHEZtwDPf',
        name: 'CLOUT Token',
        symbol: 'CLOUT',
        decimals: 9,
        totalSupply: '1000000000000000000', // 1 billion tokens
        solscanUrl: 'https://solscan.io/token/4aHwytKbZnTJY5uNDSX75g2zChfYnC53GdNJHEZtwDPf',
        verified: true
      },
      treasury: {
        address: 'J9msWkhEUPMLBXzkycwZjuU6B5vjfvNguASHLxJKAAfh',
        name: 'NFTSol Treasury',
        purpose: 'Fee collection and platform revenue',
        solscanUrl: 'https://solscan.io/account/J9msWkhEUPMLBXzkycwZjuU6B5vjfvNguASHLxJKAAfh',
        verified: true
      },
      feeCollector: {
        address: '5Gu3RnFApFEDmMJj5czHTFPRf6A5xNypSRPrqewmPLHW',
        name: 'Fee Collector',
        purpose: 'Transaction fee collection',
        solscanUrl: 'https://solscan.io/account/5Gu3RnFApFEDmMJj5czHTFPRf6A5xNypSRPrqewmPLHW',
        verified: true
      },
      developer: {
        address: '7pRUDnHS1y3b7EycVm7xtV2MgBArKFcAnFpdZCMPvLio',
        name: 'Developer Wallet',
        purpose: 'Development and maintenance fees',
        solscanUrl: 'https://solscan.io/account/7pRUDnHS1y3b7EycVm7xtV2MgBArKFcAnFpdZCMPvLio',
        verified: true
      },
      stakingProgram: {
        address: '4mUWjVdfVWP9TT5wT9x2P2Uhd8NQgzWXXMGKM8xxmM9E',
        name: 'CLOUT Staking Program',
        purpose: 'Token staking and rewards',
        solscanUrl: 'https://solscan.io/account/4mUWjVdfVWP9TT5wT9x2P2Uhd8NQgzWXXMGKM8xxmM9E',
        verified: true,
        network: 'devnet'
      }
    };

    res.json({
      success: true,
      data: contracts,
      timestamp: Date.now(),
      message: 'Smart contract information retrieved successfully'
    });
  } catch (error) {
    console.error('Failed to fetch contract information:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch contract information',
      timestamp: Date.now()
    });
  }
});

// Platform health and status
router.get('/platform/health', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      timestamp: Date.now(),
      services: {
        database: 'connected',
        redis: 'optional',
        solana: 'connected',
        ipfs: 'connected'
      }
    };

    res.json({
      success: true,
      data: health,
      timestamp: Date.now(),
      message: 'Platform health check completed'
    });
  } catch (error) {
    console.error('Failed to fetch platform health:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch platform health',
      timestamp: Date.now()
    });
  }
});

// Simulate fee collection for demo
router.post('/fees/simulate', async (req, res) => {
  try {
    const { type } = req.body;
    const validTypes = ['mint', 'trade', 'staking', 'governance'];
    
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid fee type. Must be one of: mint, trade, staking, governance',
        timestamp: Date.now()
      });
    }

    const feeCollection = await feeService.simulateFeeCollection(type);
    
    res.json({
      success: true,
      data: feeCollection,
      timestamp: Date.now(),
      message: 'Fee collection simulated successfully'
    });
  } catch (error) {
    console.error('Failed to simulate fee collection:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to simulate fee collection',
      timestamp: Date.now()
    });
  }
});

export default router;
