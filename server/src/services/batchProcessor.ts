import { PublicKey } from '@solana/web3.js';
import { connectionPool } from './connectionPool';
import { databaseOptimizationService } from './databaseOptimization';
import { logError } from '../utils/errorHandler';

export interface BatchOperation<T> {
  id: string;
  type: 'getAccountInfo' | 'getBalance' | 'getTokenAccounts' | 'updateNFT' | 'createNFT';
  data: T;
  priority: 'high' | 'normal' | 'low';
  retryCount?: number;
  maxRetries?: number;
}

export interface BatchResult<T> {
  id: string;
  success: boolean;
  data?: T;
  error?: string;
  executionTime: number;
}

export class BatchProcessor {
  private batchQueue: BatchOperation<any>[] = [];
  private processing = false;
  private readonly batchSize: number;
  private readonly batchTimeout: number;
  private batchTimer?: NodeJS.Timeout;

  constructor(batchSize: number = 50, batchTimeout: number = 100) {
    this.batchSize = batchSize;
    this.batchTimeout = batchTimeout;
  }

  // Add operation to batch queue
  addOperation<T>(operation: BatchOperation<T>): Promise<BatchResult<T>> {
    return new Promise((resolve, reject) => {
      const operationWithCallback = {
        ...operation,
        resolve,
        reject,
        retryCount: operation.retryCount || 0,
        maxRetries: operation.maxRetries || 3
      };

      this.batchQueue.push(operationWithCallback);

      // Process immediately if batch is full
      if (this.batchQueue.length >= this.batchSize) {
        this.processBatch();
      } else if (!this.batchTimer) {
        // Set timeout to process batch
        this.batchTimer = setTimeout(() => {
          this.processBatch();
        }, this.batchTimeout);
      }
    });
  }

  // Process all operations in the batch
  private async processBatch(): Promise<void> {
    if (this.processing || this.batchQueue.length === 0) {
      return;
    }

    this.processing = true;

    // Clear the timer
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = undefined;
    }

    // Get operations to process
    const operations = this.batchQueue.splice(0, this.batchSize);
    
    try {
      // Group operations by type for efficient processing
      const groupedOps = this.groupOperationsByType(operations);
      
      // Process each group in parallel
      const groupPromises = Object.entries(groupedOps).map(([type, ops]) => 
        this.processOperationGroup(type, ops)
      );

      await Promise.allSettled(groupPromises);

    } catch (error) {
      logError(error as Error, 'BatchProcessor.processBatch');
    } finally {
      this.processing = false;

      // Process remaining operations if any
      if (this.batchQueue.length > 0) {
        setTimeout(() => this.processBatch(), 0);
      }
    }
  }

  private groupOperationsByType(operations: any[]): Record<string, any[]> {
    return operations.reduce((groups, op) => {
      if (!groups[op.type]) {
        groups[op.type] = [];
      }
      groups[op.type].push(op);
      return groups;
    }, {});
  }

  private async processOperationGroup(type: string, operations: any[]): Promise<void> {
    const startTime = Date.now();

    try {
      switch (type) {
        case 'getAccountInfo':
          await this.processAccountInfoBatch(operations);
          break;
        case 'getBalance':
          await this.processBalanceBatch(operations);
          break;
        case 'getTokenAccounts':
          await this.processTokenAccountsBatch(operations);
          break;
        case 'updateNFT':
          await this.processUpdateNFTBatch(operations);
          break;
        case 'createNFT':
          await this.processCreateNFTBatch(operations);
          break;
        default:
          throw new Error(`Unknown operation type: ${type}`);
      }
    } catch (error) {
      logError(error as Error, `BatchProcessor.processOperationGroup.${type}`);
      
      // Reject all operations in this group
      operations.forEach(op => {
        op.reject(new Error(`Batch processing failed: ${error}`));
      });
    }
  }

  private async processAccountInfoBatch(operations: any[]): Promise<void> {
    const publicKeys = operations.map(op => new PublicKey(op.data.publicKey));
    
    try {
      const results = await connectionPool.batchGetAccountInfo(publicKeys);
      
      operations.forEach((op, index) => {
        const executionTime = Date.now() - op.startTime;
        op.resolve({
          id: op.id,
          success: true,
          data: results[index],
          executionTime
        });
      });
    } catch (error) {
      operations.forEach(op => {
        op.reject(error);
      });
    }
  }

  private async processBalanceBatch(operations: any[]): Promise<void> {
    const promises = operations.map(async (op) => {
      const startTime = Date.now();
      try {
        const balance = await connectionPool.getBalance(new PublicKey(op.data.publicKey));
        const executionTime = Date.now() - startTime;
        
        op.resolve({
          id: op.id,
          success: true,
          data: balance,
          executionTime
        });
      } catch (error) {
        const executionTime = Date.now() - startTime;
        op.reject({
          id: op.id,
          success: false,
          error: error.message,
          executionTime
        });
      }
    });

    await Promise.allSettled(promises);
  }

  private async processTokenAccountsBatch(operations: any[]): Promise<void> {
    const promises = operations.map(async (op) => {
      const startTime = Date.now();
      try {
        const accounts = await connectionPool.getTokenAccountsByOwner(
          new PublicKey(op.data.ownerAddress),
          op.data.filter
        );
        const executionTime = Date.now() - startTime;
        
        op.resolve({
          id: op.id,
          success: true,
          data: accounts,
          executionTime
        });
      } catch (error) {
        const executionTime = Date.now() - startTime;
        op.reject({
          id: op.id,
          success: false,
          error: error.message,
          executionTime
        });
      }
    });

    await Promise.allSettled(promises);
  }

  private async processUpdateNFTBatch(operations: any[]): Promise<void> {
    try {
      const updates = operations.map(op => ({
        id: op.data.id,
        data: op.data.updateData
      }));

      await databaseOptimizationService.batchUpdateNFTs(updates);

      operations.forEach(op => {
        const executionTime = Date.now() - op.startTime;
        op.resolve({
          id: op.id,
          success: true,
          executionTime
        });
      });
    } catch (error) {
      operations.forEach(op => {
        op.reject(error);
      });
    }
  }

  private async processCreateNFTBatch(operations: any[]): Promise<void> {
    // Process NFT creation operations
    const promises = operations.map(async (op) => {
      const startTime = Date.now();
      try {
        // Implement NFT creation logic here
        // This would typically involve calling the NFT creation service
        const executionTime = Date.now() - startTime;
        
        op.resolve({
          id: op.id,
          success: true,
          data: { id: op.data.id },
          executionTime
        });
      } catch (error) {
        const executionTime = Date.now() - startTime;
        op.reject({
          id: op.id,
          success: false,
          error: error.message,
          executionTime
        });
      }
    });

    await Promise.allSettled(promises);
  }

  // Utility methods for common operations
  async getAccountInfo(publicKey: string, priority: 'high' | 'normal' | 'low' = 'normal'): Promise<BatchResult<any>> {
    return this.addOperation({
      id: `account-info-${Date.now()}-${Math.random()}`,
      type: 'getAccountInfo',
      data: { publicKey },
      priority
    });
  }

  async getBalance(publicKey: string, priority: 'high' | 'normal' | 'low' = 'normal'): Promise<BatchResult<number>> {
    return this.addOperation({
      id: `balance-${Date.now()}-${Math.random()}`,
      type: 'getBalance',
      data: { publicKey },
      priority
    });
  }

  async getTokenAccounts(ownerAddress: string, filter: any, priority: 'high' | 'normal' | 'low' = 'normal'): Promise<BatchResult<any>> {
    return this.addOperation({
      id: `token-accounts-${Date.now()}-${Math.random()}`,
      type: 'getTokenAccounts',
      data: { ownerAddress, filter },
      priority
    });
  }

  async updateNFT(id: string, updateData: any, priority: 'high' | 'normal' | 'low' = 'normal'): Promise<BatchResult<void>> {
    return this.addOperation({
      id: `update-nft-${Date.now()}-${Math.random()}`,
      type: 'updateNFT',
      data: { id, updateData },
      priority
    });
  }

  // Get batch processor statistics
  getStats(): {
    queueLength: number;
    processing: boolean;
    batchSize: number;
    batchTimeout: number;
  } {
    return {
      queueLength: this.batchQueue.length,
      processing: this.processing,
      batchSize: this.batchSize,
      batchTimeout: this.batchTimeout
    };
  }

  // Force process all pending operations
  async flush(): Promise<void> {
    if (this.batchQueue.length > 0) {
      await this.processBatch();
    }
  }

  // Cleanup
  destroy(): void {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }
    this.batchQueue = [];
  }
}

// Create singleton instance
export const batchProcessor = new BatchProcessor(50, 100);
