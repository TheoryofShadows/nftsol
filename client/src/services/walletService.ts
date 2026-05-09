/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck - Legacy code, type checking disabled
/**
 * Wallet Service
 * Uses Helius DAS API directly — no backend needed for read operations.
 * Withdrawal/admin operations still require the backend.
 */

import { WalletInfo } from '@shared/types';
import { heliusService } from './heliusService';
import { API_ENDPOINTS } from '../config/api';
import { logger } from '@shared/utils/logger';
import { NetworkError } from '@shared/utils/errors';

export interface WithdrawalRequest {
  amount: number;
  destinationAddress: string;
  memo?: string;
}

export class WalletService {
  /**
   * Get wallet info — SOL balance + NFT count via Helius.
   */
  async getWalletInfo(address: string): Promise<WalletInfo | null> {
    try {
      const [solBalance, nftPage] = await Promise.all([
        heliusService.getSolBalance(address),
        heliusService.getNFTsByOwner(address, 1, 1),
      ]);

      logger.info('Wallet info fetched via Helius', { address });
      return {
        address,
        balance: solBalance,
        nftCount: nftPage.total,
      } as unknown as WalletInfo;
    } catch (error) {
      logger.error('Failed to fetch wallet info', error, { address });
      throw error instanceof Error ? error : new NetworkError('Failed to fetch wallet info');
    }
  }

  /**
   * Get SOL balance directly from Helius.
   */
  async getBalance(address: string): Promise<number> {
    try {
      return await heliusService.getSolBalance(address);
    } catch (error) {
      logger.error('Failed to fetch wallet balance', error, { address });
      throw error instanceof Error ? error : new NetworkError('Failed to fetch wallet balance');
    }
  }

  /**
   * Verify wallet address — just checks if it's a valid base58 public key.
   * Helius DAS will error on invalid addresses so we use a lightweight check.
   */
  async verifyAddress(address: string): Promise<boolean> {
    try {
      // A valid Solana address is 32-44 base58 characters
      if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) return false;
      await heliusService.getSolBalance(address);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Create withdrawal request — still requires backend (vault private key).
   */
  async createWithdrawal(request: WithdrawalRequest): Promise<any> {
    try {
      logger.info('Creating withdrawal request', {
        amount: request.amount,
        destination: request.destinationAddress,
      });

      const response = await fetch(API_ENDPOINTS.withdrawals.create, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new NetworkError(errorData.error || `Failed to create withdrawal: ${response.statusText}`);
      }

      const data = await response.json();
      logger.info('Withdrawal request created', { amount: request.amount });
      return data;
    } catch (error) {
      logger.error('Failed to create withdrawal', error);
      throw error instanceof Error ? error : new NetworkError('Failed to create withdrawal');
    }
  }
}

export const walletService = new WalletService();
