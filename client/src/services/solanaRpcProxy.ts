/**
 * Solana RPC Proxy Service
 *
 * Provides a frontend interface to our backend RPC proxy.
 * This avoids CORS, rate limiting, and 403 errors from directly calling Solana RPC.
 *
 * Usage:
 * import { solanaRpcProxy } from '@/services/solanaRpcProxy';
 *
 * const balance = await solanaRpcProxy.getBalance('wallet_address');
 */

import { API_BASE } from '../config/api';
import { logger } from '../utils/logger';

interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: number;
  method: string;
  params: any[];
}

interface JsonRpcResponse<T = any> {
  jsonrpc: '2.0';
  id: number;
  result?: T;
  error?: {
    code: number;
    message: string;
  };
}

class SolanaRpcProxy {
  private apiBase = API_BASE;
  private requestId = 1;

  /**
   * Make a JSON-RPC call to the backend RPC proxy
   */
  private async rpcCall<T = any>(method: string, params: any[] = []): Promise<T> {
    const id = this.requestId++;
    const request: JsonRpcRequest = {
      jsonrpc: '2.0',
      id,
      method,
      params,
    };

    try {
      const response = await fetch(`${this.apiBase}/api/rpc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const data: JsonRpcResponse<T> = await response.json();

      if (data.error) {
        throw new Error(`RPC Error (${data.error.code}): ${data.error.message}`);
      }

      if (data.result === undefined) {
        throw new Error('No result in RPC response');
      }

      logger.debug(`RPC: ${method}`, { id, result: typeof data.result });
      return data.result;
    } catch (error) {
      logger.error(`RPC call failed: ${method}`, error);
      throw error;
    }
  }

  /**
   * Get SOL balance of a wallet (in lamports)
   */
  async getBalance(publicKey: string): Promise<number> {
    const result = await this.rpcCall<{ value: number }>('getBalance', [publicKey]);
    return result.value;
  }

  /**
   * Get SOL balance in SOL (not lamports)
   */
  async getBalanceInSol(publicKey: string): Promise<number> {
    const lamports = await this.getBalance(publicKey);
    return lamports / 1e9;
  }

  /**
   * Get block height
   */
  async getBlockHeight(): Promise<number> {
    return this.rpcCall<number>('getBlockHeight', []);
  }

  /**
   * Get recent blockhash
   */
  async getRecentBlockhash(): Promise<string> {
    const result = await this.rpcCall<{ blockhash: string; feeCalculator: any }>('getRecentBlockhash', []);
    return result.blockhash;
  }

  /**
   * Get latest blockhash (newer method)
   */
  async getLatestBlockhash(): Promise<{ blockhash: string; lastValidBlockHeight: number }> {
    return this.rpcCall<{ blockhash: string; lastValidBlockHeight: number }>('getLatestBlockhash', []);
  }

  /**
   * Get token account balance
   */
  async getTokenAccountBalance(tokenAccount: string): Promise<{ amount: string; decimals: number }> {
    const result = await this.rpcCall<{ value: { amount: string; decimals: number } }>('getTokenAccountBalance', [
      tokenAccount,
    ]);
    return result.value;
  }

  /**
   * Get all token accounts for a wallet
   */
  async getParsedTokenAccountsByOwner(wallet: string, mint?: string): Promise<any[]> {
    const params: any[] = [wallet, mint ? { mint } : { programId: 'TokenkegQfeZyiNwAJsyFbPVwwQQfփ' }];

    const result = await this.rpcCall<{ value: any[] }>('getParsedTokenAccountsByOwner', params);
    return result.value || [];
  }

  /**
   * Get token supply
   */
  async getTokenSupply(mint: string): Promise<{ amount: string; decimals: number; uiAmount: number }> {
    const result = await this.rpcCall<{ value: { amount: string; decimals: number; uiAmount: number } }>('getTokenSupply', [mint]);
    return result.value;
  }

  /**
   * Get program accounts
   */
  async getProgramAccounts(program: string, filters?: any[]): Promise<any[]> {
    const params: any[] = [program];
    if (filters) {
      params.push({ filters });
    }
    const result = await this.rpcCall<any[]>('getProgramAccounts', params);
    return result || [];
  }

  /**
   * Get account info
   */
  async getAccountInfo(publicKey: string): Promise<any> {
    const result = await this.rpcCall<any>('getAccountInfo', [publicKey, { encoding: 'jsonParsed' }]);
    return result;
  }

  /**
   * Get multiple accounts at once (batch)
   */
  async getMultipleAccounts(publicKeys: string[]): Promise<any[]> {
    const result = await this.rpcCall<any[]>('getMultipleAccounts', [
      publicKeys,
      { encoding: 'jsonParsed' },
    ]);
    return result || [];
  }

  /**
   * Get transaction details
   */
  async getTransaction(signature: string): Promise<any> {
    return this.rpcCall<any>('getTransaction', [signature, { encoding: 'jsonParsed' }]);
  }

  /**
   * Get version
   */
  async getVersion(): Promise<any> {
    return this.rpcCall<any>('getVersion', []);
  }

  /**
   * Get current slot
   */
  async getSlot(): Promise<number> {
    return this.rpcCall<number>('getSlot', []);
  }

  /**
   * Get epoch info
   */
  async getEpochInfo(): Promise<any> {
    return this.rpcCall<any>('getEpochInfo', []);
  }

  /**
   * Check if blockhash is valid
   */
  async isBlockhashValid(blockhash: string): Promise<boolean> {
    const result = await this.rpcCall<{ value: boolean }>('isBlockhashValid', [blockhash]);
    return result.value;
  }

  /**
   * Get signature statuses
   */
  async getSignatureStatuses(signatures: string[]): Promise<any[]> {
    const result = await this.rpcCall<{ value: any[] }>('getSignatureStatuses', [signatures]);
    return result.value || [];
  }

  /**
   * Send transaction
   */
  async sendTransaction(transaction: string): Promise<string> {
    return this.rpcCall<string>('sendTransaction', [transaction]);
  }

  /**
   * Simulate transaction
   */
  async simulateTransaction(transaction: string): Promise<any> {
    return this.rpcCall<any>('simulateTransaction', [transaction]);
  }

  /**
   * Get minimum balance for rent exemption
   */
  async getMinimumBalanceForRentExemption(dataLength: number): Promise<number> {
    return this.rpcCall<number>('getMinimumBalanceForRentExemption', [dataLength]);
  }

  /**
   * Get fee for message
   */
  async getFeeForMessage(message: string): Promise<number> {
    const result = await this.rpcCall<{ value: number }>('getFeeForMessage', [message]);
    return result.value;
  }
}

export const solanaRpcProxy = new SolanaRpcProxy();
export default solanaRpcProxy;
