/**
 * Solana RPC Proxy
 *
 * Handles JSON-RPC requests from the frontend and proxies them to Solana RPC endpoints.
 * This avoids CORS and rate-limiting issues when directly calling the RPC from the browser.
 */

import { Router, Request, Response } from 'express';
import axios, { AxiosError } from 'axios';
import rateLimit from 'express-rate-limit';
import { createModuleLogger } from '../utils/logger';

const log = createModuleLogger('rpcProxy');

const router = Router();

// Rate limiting for RPC calls
const rpcLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // Max 100 RPC calls per minute
  message: 'Too many RPC requests',
  standardHeaders: true,
  legacyHeaders: false,
});

// Get RPC URL from environment or use default
const getRpcUrl = (): string => {
  // Priority order:
  // 1. HELIUS_RPC_URL (best - Helius is optimized)
  // 2. SOLANA_RPC_URL (custom RPC)
  // 3. Fallback to default mainnet-beta

  if (process.env.HELIUS_RPC_URL) {
    return process.env.HELIUS_RPC_URL;
  }

  if (process.env.SOLANA_RPC_URL) {
    return process.env.SOLANA_RPC_URL;
  }

  // Fallback - should never be used in production
  return 'https://api.mainnet-beta.solana.com';
};

// Allowed RPC methods (whitelist for security)
const ALLOWED_METHODS = [
  'getBalance',
  'getBlockHeight',
  'getRecentBlockhash',
  'getLatestBlockhash',
  'getTokenAccountBalance',
  'getParsedTokenAccountsByOwner',
  'getTokenSupply',
  'getTokenLargestAccounts',
  'getTokenMetadata',
  'getProgramAccounts',
  'getAccountInfo',
  'getMultipleAccounts',
  'getTransaction',
  'getTransactionCount',
  'sendTransaction',
  'simulateTransaction',
  'getVersion',
  'getSlot',
  'getClusterNodes',
  'getEpochInfo',
  'getEpochSchedule',
  'getFeeForMessage',
  'getMinimumBalanceForRentExemption',
  'getNonce',
  'getSignatureStatuses',
  'isBlockhashValid',
];

/**
 * POST /api/rpc
 * Proxy JSON-RPC requests to Solana RPC endpoint
 *
 * Body should be a standard JSON-RPC 2.0 request:
 * {
 *   "jsonrpc": "2.0",
 *   "id": 1,
 *   "method": "getBalance",
 *   "params": ["wallet_address"]
 * }
 */
router.post('/', rpcLimiter, async (req: Request, res: Response) => {
  try {
    const { jsonrpc = '2.0', id, method, params } = req.body;

    // Validate required fields
    if (!method || typeof method !== 'string') {
      return res.status(400).json({
        jsonrpc: '2.0',
        error: {
          code: -32600,
          message: 'Invalid Request: method is required',
        },
        id: id || null,
      });
    }

    // Whitelist check - prevent abuse
    if (!ALLOWED_METHODS.includes(method)) {
      return res.status(403).json({
        jsonrpc: '2.0',
        error: {
          code: -32602,
          message: `Method ${method} is not allowed`,
        },
        id: id || null,
      });
    }

    // Prepare the RPC request
    const rpcUrl = getRpcUrl();
    const rpcRequest = {
      jsonrpc,
      id: id || 1,
      method,
      params: params || [],
    };

    // Log the request (without sensitive data)
    log.info(`RPC Proxy: ${method}`, {
      hasParams: !!params,
      paramCount: params?.length || 0,
    });

    // Make the RPC call with timeout
    const response = await axios.post(rpcUrl, rpcRequest, {
      timeout: 30000, // 30 second timeout
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'NFTSol-Backend/1.0',
      },
    });

    // Forward the response
    res.json(response.data);
  } catch (error: any) {
    console.error('RPC Proxy Error:', {
      method: req.body?.method,
      error: error.message,
      status: error.response?.status,
    });

    // Handle timeout
    if (error.code === 'ECONNABORTED') {
      return res.status(504).json({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'RPC request timeout',
        },
        id: req.body?.id || null,
      });
    }

    // Handle RPC server errors
    if (error.response?.data) {
      return res.status(error.response.status || 500).json(error.response.data);
    }

    // Generic error
    res.status(500).json({
      jsonrpc: '2.0',
      error: {
        code: -32603,
        message: 'Internal server error',
      },
      id: req.body?.id || null,
    });
  }
});

/**
 * Batch RPC requests
 * POST /api/rpc/batch
 * Send multiple RPC requests in one call
 */
router.post('/batch', rpcLimiter, async (req: Request, res: Response) => {
  try {
    const requests = req.body;

    // Validate it's an array
    if (!Array.isArray(requests)) {
      return res.status(400).json({
        error: {
          code: -32600,
          message: 'Invalid Request: batch must be an array',
        },
      });
    }

    // Validate all requests have allowed methods
    for (const req of requests) {
      if (!ALLOWED_METHODS.includes(req.method)) {
        return res.status(403).json({
          error: {
            code: -32602,
            message: `Method ${req.method} is not allowed`,
          },
        });
      }
    }

    const rpcUrl = getRpcUrl();

    // Make batch request
    const response = await axios.post(rpcUrl, requests, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'NFTSol-Backend/1.0',
      },
    });

    res.json(response.data);
  } catch (error: any) {
    log.error('RPC Batch Error:', error.message);

    if (error.code === 'ECONNABORTED') {
      return res.status(504).json({
        error: {
          code: -32000,
          message: 'RPC request timeout',
        },
      });
    }

    if (error.response?.data) {
      return res.status(error.response.status || 500).json(error.response.data);
    }

    res.status(500).json({
      error: {
        code: -32603,
        message: 'Internal server error',
      },
    });
  }
});

/**
 * Health check for RPC endpoint
 * GET /api/rpc/health
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const rpcUrl = getRpcUrl();

    const response = await axios.post(
      rpcUrl,
      {
        jsonrpc: '2.0',
        id: 1,
        method: 'getVersion',
      },
      { timeout: 5000 }
    );

    res.json({
      success: true,
      data: {
        rpcUrl: rpcUrl.replace(/.*:\/\//, '').replace(/\/.*/, ''), // Hide full URL but show provider
        status: 'healthy',
        responseTime: 'fast',
        version: response.data.result?.['solana-core'],
      },
    });
  } catch (error: any) {
    res.status(503).json({
      success: false,
      error: {
        message: 'RPC endpoint unavailable',
        code: 'RPC_UNAVAILABLE',
      },
    });
  }
});

export default router;
