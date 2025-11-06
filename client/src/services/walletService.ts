/**
 * Wallet Service
 * Service layer for wallet operations
 */

import { WalletInfo } from '@shared/types';
import { apiService } from './api';
import { logger } from '@shared/utils/logger';
import { NetworkError } from '@shared/utils/errors';

export interface WithdrawalRequest {
  amount: number;
  destinationAddress: string;
  memo?: string;
}

export class WalletService {
  /**
   * Get wallet info
   */
  async getWalletInfo(address: string): Promise<WalletInfo | null> {
    try {
      const response = await apiService.getWalletInfo(address);
      
      if (!response.success || !response.data) {
        if (response.error?.includes('not found')) {
          return null;
        }
        throw new NetworkError(response.error || 'Failed to fetch wallet info');
      }

      logger.info('Wallet info fetched', { address });
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch wallet info', error, { address });
      throw error instanceof Error ? error : new NetworkError('Failed to fetch wallet info');
    }
  }

  /**
   * Create withdrawal request
   */
  async createWithdrawal(request: WithdrawalRequest): Promise<any> {
    try {
      logger.info('Creating withdrawal request', { 
        amount: request.amount,
        destination: request.destinationAddress,
      });
      
      const response = await fetch(`${apiService['API_BASE'] || ''}/api/wallets/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new NetworkError(errorData.error || `Failed to create withdrawal: ${response.statusText}`);
      }

      const data = await response.json();
      logger.info('Withdrawal request created', { 
        amount: request.amount,
      });
      return data;
    } catch (error) {
      logger.error('Failed to create withdrawal', error);
      throw error instanceof Error ? error : new NetworkError('Failed to create withdrawal');
    }
  }

  /**
   * Get wallet balance
   */
  async getBalance(address: string): Promise<number> {
    try {
      const response = await fetch(`${apiService['API_BASE'] || ''}/api/nfts/balance/${address}`);
      
      if (!response.ok) {
        throw new NetworkError(`Failed to fetch balance: ${response.statusText}`);
      }

      const data = await response.json();
      return data.balance || 0;
    } catch (error) {
      logger.error('Failed to fetch wallet balance', error, { address });
      throw error instanceof Error ? error : new NetworkError('Failed to fetch wallet balance');
    }
  }

  /**
   * Verify wallet address
   */
  async verifyAddress(address: string): Promise<boolean> {
    try {
      const response = await fetch(`${apiService['API_BASE'] || ''}/api/nfts/verify/${address}`);
      
      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.valid || false;
    } catch (error) {
      logger.error('Failed to verify wallet address', error, { address });
      return false;
    }
  }
}

export const walletService = new WalletService();

