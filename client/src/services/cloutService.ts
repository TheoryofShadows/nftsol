/**
 * CLOUT Service
 * Balance reads go directly via Helius DAS — no backend needed.
 * Reward distribution still requires the backend (vault private key).
 */

import { CloutBalance, CloutReward } from '@shared/types';
import { heliusService } from './heliusService';
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
   * Get CLOUT balance — direct via Helius, no backend needed.
   */
  async getBalance(walletAddress: string): Promise<CloutBalance> {
    try {
      const balance = await heliusService.getCloutBalance(walletAddress);
      logger.info('CLOUT balance fetched via Helius', { walletAddress, balance });
      return {
        address: walletAddress,
        balance,
        token: 'CLOUT',
      } as unknown as CloutBalance;
    } catch (error) {
      logger.error('Failed to fetch CLOUT balance', error, { walletAddress });
      throw error instanceof Error ? error : new NetworkError('Failed to fetch CLOUT balance');
    }
  }

  /**
   * Get vault balance — reads CLOUT token in vault wallet directly via Helius.
   */
  async getVaultBalance(): Promise<number> {
    try {
      const VAULT = '7SBYHw5KQasPKajH6gCDnpWmb5QAh9EBvTi3cUnFAc1v';
      return await heliusService.getCloutBalance(VAULT);
    } catch (error) {
      logger.error('Failed to fetch vault balance', error);
      throw error instanceof Error ? error : new NetworkError('Failed to fetch vault balance');
    }
  }

  /**
   * Request a CLOUT reward — requires backend (vault private key signs transfer).
   */
  async requestReward(request: CloutRewardRequest): Promise<CloutReward> {
    try {
      logger.info('Requesting CLOUT reward', { type: request.type, wallet: request.walletAddress });
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
      logger.info('CLOUT reward granted', { type: request.type, amount: data.amount });
      return data;
    } catch (error) {
      logger.error('Failed to request CLOUT reward', error);
      throw error instanceof Error ? error : new NetworkError('Failed to request CLOUT reward');
    }
  }

  /**
   * Get reward history — requires backend (database).
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
