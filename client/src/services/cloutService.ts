/**
 * CLOUT Service
 * Service layer for CLOUT token operations
 */

import { CloutBalance, CloutReward } from '@shared/types';
import { logger } from '@shared/utils/logger';
import { NetworkError } from '@shared/utils/errors';

const API_BASE = import.meta.env.VITE_API_BASE || window.location.origin;

export interface CloutRewardRequest {
  type: CloutReward['type'];
  amount: number;
  reason?: string;
  walletAddress: string;
}

export class CloutService {
  /**
   * Get CLOUT balance for a wallet
   */
  async getBalance(walletAddress: string): Promise<CloutBalance> {
    try {
      const response = await fetch(`${API_BASE}/api/clout/balance/${walletAddress}`);
      
      if (!response.ok) {
        throw new NetworkError(`Failed to fetch CLOUT balance: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success || !data.data) {
        throw new NetworkError(data.error || 'Failed to fetch CLOUT balance');
      }

      logger.info('CLOUT balance fetched', { walletAddress, balance: data.data.balance });
      return data.data;
    } catch (error) {
      logger.error('Failed to fetch CLOUT balance', error, { walletAddress });
      throw error instanceof Error ? error : new NetworkError('Failed to fetch CLOUT balance');
    }
  }

  /**
   * Get vault balance (admin/public)
   */
  async getVaultBalance(): Promise<number> {
    try {
      const response = await fetch(`${API_BASE}/api/clout/vault-balance`);
      
      if (!response.ok) {
        throw new NetworkError(`Failed to fetch vault balance: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success || !data.data) {
        throw new NetworkError(data.error || 'Failed to fetch vault balance');
      }

      return data.data.balance || 0;
    } catch (error) {
      logger.error('Failed to fetch vault balance', error);
      throw error instanceof Error ? error : new NetworkError('Failed to fetch vault balance');
    }
  }

  /**
   * Request a CLOUT reward
   */
  async requestReward(request: CloutRewardRequest): Promise<CloutReward> {
    try {
      logger.info('Requesting CLOUT reward', { 
        type: request.type,
        wallet: request.walletAddress,
      });
      
      const response = await fetch(`${API_BASE}/api/clout/reward`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new NetworkError(errorData.error || `Failed to request reward: ${response.statusText}`);
      }

      const data = await response.json();
      logger.info('CLOUT reward granted', { 
        type: request.type,
        amount: data.amount,
      });
      return data;
    } catch (error) {
      logger.error('Failed to request CLOUT reward', error);
      throw error instanceof Error ? error : new NetworkError('Failed to request CLOUT reward');
    }
  }

  /**
   * Get reward history for a wallet
   */
  async getRewardHistory(walletAddress: string): Promise<CloutReward[]> {
    try {
      const response = await fetch(`${API_BASE}/api/clout/rewards/${walletAddress}`);
      
      if (!response.ok) {
        throw new NetworkError(`Failed to fetch reward history: ${response.statusText}`);
      }

      const data = await response.json();
      return data.rewards || data || [];
    } catch (error) {
      logger.error('Failed to fetch reward history', error, { walletAddress });
      throw error instanceof Error ? error : new NetworkError('Failed to fetch reward history');
    }
  }
}

export const cloutService = new CloutService();

