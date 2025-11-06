/**
 * Echo Service
 * Service layer for Eternal Echoes operations
 */

import { Echo, EchoStats } from '@shared/types';
import { logger } from '@shared/utils/logger';
import { NetworkError } from '@shared/utils/errors';
import { echoAddSchema } from '@shared/validation/schemas';
import { ValidationError } from '@shared/utils/errors';

const API_BASE = import.meta.env.VITE_API_BASE || window.location.origin;

export interface EchoMintRequest {
  videoUri: string;
  title: string;
  description?: string;
  contributorWallet: string;
}

export interface EchoAddRequest {
  ledgerId: string;
  echoData: string;
  echoType: 'Text' | 'Audio' | 'Annotation' | 'Video';
  contributorWallet: string;
  videoUri?: string;
}

export class EchoService {
  /**
   * Get all echoes/ledgers
   */
  async getAll(): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE}/api/echo`);
      if (!response.ok) {
        throw new NetworkError(`Failed to fetch echoes: ${response.statusText}`);
      }
      const data = await response.json();
      return data.echoes || data || [];
    } catch (error) {
      logger.error('Failed to fetch echoes', error);
      throw error instanceof Error ? error : new NetworkError('Failed to fetch echoes');
    }
  }

  /**
   * Get echo by ledger ID
   */
  async getByLedgerId(ledgerId: string): Promise<Echo[]> {
    try {
      const response = await fetch(`${API_BASE}/api/echo/${ledgerId}`);
      if (!response.ok) {
        throw new NetworkError(`Failed to fetch echo: ${response.statusText}`);
      }
      const data = await response.json();
      return data.echoes || [];
    } catch (error) {
      logger.error('Failed to fetch echo', error, { ledgerId });
      throw error instanceof Error ? error : new NetworkError('Failed to fetch echo');
    }
  }

  /**
   * Mint a new Eternal Echo
   */
  async mint(request: EchoMintRequest): Promise<any> {
    try {
      logger.info('Minting Eternal Echo', { title: request.title });
      
      const response = await fetch(`${API_BASE}/api/echo/mint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new NetworkError(errorData.error || `Failed to mint echo: ${response.statusText}`);
      }

      const data = await response.json();
      logger.info('Eternal Echo minted successfully', { 
        ledgerId: data.ledgerId,
      });
      return data;
    } catch (error) {
      logger.error('Failed to mint Eternal Echo', error);
      throw error instanceof Error ? error : new NetworkError('Failed to mint Eternal Echo');
    }
  }

  /**
   * Add an echo layer to an existing ledger
   */
  async addEcho(request: EchoAddRequest): Promise<any> {
    try {
      // Validate request
      const validated = echoAddSchema.parse(request);
      
      logger.info('Adding echo layer', { 
        ledgerId: validated.ledgerId,
        type: validated.echoType,
      });
      
      const response = await fetch(`${API_BASE}/api/echo/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validated),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new NetworkError(errorData.error || `Failed to add echo: ${response.statusText}`);
      }

      const data = await response.json();
      logger.info('Echo layer added successfully', { 
        ledgerId: validated.ledgerId,
      });
      return data;
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        throw new ValidationError('Invalid echo request', error);
      }
      logger.error('Failed to add echo layer', error);
      throw error instanceof Error ? error : new NetworkError('Failed to add echo layer');
    }
  }

  /**
   * Get echo statistics
   */
  async getStats(): Promise<EchoStats> {
    try {
      const response = await fetch(`${API_BASE}/api/echo/stats`);
      if (!response.ok) {
        throw new NetworkError(`Failed to fetch echo stats: ${response.statusText}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      logger.error('Failed to fetch echo stats', error);
      throw error instanceof Error ? error : new NetworkError('Failed to fetch echo stats');
    }
  }

  /**
   * Get trending echoes
   */
  async getTrending(): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE}/api/echo/trending`);
      if (!response.ok) {
        throw new NetworkError(`Failed to fetch trending echoes: ${response.statusText}`);
      }
      const data = await response.json();
      return data.echoes || data || [];
    } catch (error) {
      logger.error('Failed to fetch trending echoes', error);
      throw error instanceof Error ? error : new NetworkError('Failed to fetch trending echoes');
    }
  }
}

export const echoService = new EchoService();

