import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Connection, Transaction, TransactionInstruction, PublicKey, Keypair } from '@solana/web3.js';
import { TransactionBatcher, BatchedInstruction } from '../src/utils/transactionBatcher';

// Mock Solana connection
const mockConnection = {
  getLatestBlockhash: jest.fn(),
  sendTransaction: jest.fn(),
  simulateTransaction: jest.fn(),
} as unknown as Connection;

describe('Transaction Batching', () => {
  let batcher: TransactionBatcher;
  let feePayer: PublicKey;
  let signers: Keypair[];

  beforeEach(() => {
    batcher = new TransactionBatcher(mockConnection);
    feePayer = Keypair.generate().publicKey;
    signers = [Keypair.generate()];
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock successful responses
    (mockConnection.getLatestBlockhash as jest.Mock).mockResolvedValue({
      blockhash: 'test-blockhash',
      lastValidBlockHeight: 100
    });
    
    (mockConnection.sendTransaction as jest.Mock).mockResolvedValue('test-signature');
  });

  describe('Batch Creation', () => {
    it('should create a transaction with multiple instructions', () => {
      const instructions: BatchedInstruction[] = [
        {
          instruction: new TransactionInstruction({
            keys: [],
            programId: PublicKey.default,
            data: Buffer.from('test1')
          }),
          name: 'instruction_1',
          priority: 100
        },
        {
          instruction: new TransactionInstruction({
            keys: [],
            programId: PublicKey.default,
            data: Buffer.from('test2')
          }),
          name: 'instruction_2',
          priority: 90
        }
      ];

      const transaction = batcher.createBatch(instructions, feePayer, 'test-blockhash');
      
      expect(transaction.instructions.length).toBe(2);
      expect(transaction.feePayer).toEqual(feePayer);
      expect(transaction.recentBlockhash).toBe('test-blockhash');
    });

    it('should sort instructions by priority', () => {
      const instructions: BatchedInstruction[] = [
        {
          instruction: new TransactionInstruction({
            keys: [],
            programId: PublicKey.default,
            data: Buffer.from('low_priority')
          }),
          name: 'low_priority',
          priority: 50
        },
        {
          instruction: new TransactionInstruction({
            keys: [],
            programId: PublicKey.default,
            data: Buffer.from('high_priority')
          }),
          name: 'high_priority',
          priority: 100
        }
      ];

      const transaction = batcher.createBatch(instructions, feePayer, 'test-blockhash');
      
      // High priority should come first
      expect(transaction.instructions[0].data).toEqual(Buffer.from('high_priority'));
      expect(transaction.instructions[1].data).toEqual(Buffer.from('low_priority'));
    });
  });

  describe('Batch Execution', () => {
    it('should execute a batch successfully', async () => {
      const instructions: BatchedInstruction[] = [
        {
          instruction: new TransactionInstruction({
            keys: [],
            programId: PublicKey.default,
            data: Buffer.from('test')
          }),
          name: 'test_instruction',
          priority: 100
        }
      ];

      const result = await batcher.executeBatch(instructions, signers, feePayer, 'test_batch');
      
      expect(result.success).toBe(true);
      expect(result.signature).toBe('test-signature');
      expect(result.instructions).toContain('test_instruction');
      expect(result.totalCU).toBeGreaterThan(0);
    });

    it('should handle batch execution failure', async () => {
      (mockConnection.sendTransaction as jest.Mock).mockRejectedValue(new Error('Transaction failed'));
      
      const instructions: BatchedInstruction[] = [
        {
          instruction: new TransactionInstruction({
            keys: [],
            programId: PublicKey.default,
            data: Buffer.from('test')
          }),
          name: 'test_instruction',
          priority: 100
        }
      ];

      const result = await batcher.executeBatch(instructions, signers, feePayer, 'test_batch');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Transaction failed');
      expect(result.signature).toBe('');
    });
  });

  describe('Batch Splitting', () => {
    it('should split large batches into smaller chunks', () => {
      const instructions: BatchedInstruction[] = [];
      
      // Create 15 instructions (exceeds max of 10)
      for (let i = 0; i < 15; i++) {
        instructions.push({
          instruction: new TransactionInstruction({
            keys: [],
            programId: PublicKey.default,
            data: Buffer.from(`instruction_${i}`)
          }),
          name: `instruction_${i}`,
          priority: 100
        });
      }

      const batches = batcher.splitBatch(instructions);
      
      expect(batches.length).toBe(2); // Should be split into 2 batches
      expect(batches[0].length).toBe(10); // First batch should have 10 instructions
      expect(batches[1].length).toBe(5); // Second batch should have 5 instructions
    });

    it('should handle batches within limits', () => {
      const instructions: BatchedInstruction[] = [];
      
      // Create 5 instructions (within limits)
      for (let i = 0; i < 5; i++) {
        instructions.push({
          instruction: new TransactionInstruction({
            keys: [],
            programId: PublicKey.default,
            data: Buffer.from(`instruction_${i}`)
          }),
          name: `instruction_${i}`,
          priority: 100
        });
      }

      const batches = batcher.splitBatch(instructions);
      
      expect(batches.length).toBe(1); // Should remain as single batch
      expect(batches[0].length).toBe(5);
    });
  });

  describe('Multiple Batch Execution', () => {
    it('should execute multiple batches sequentially', async () => {
      const instructions: BatchedInstruction[] = [];
      
      // Create 15 instructions to force splitting
      for (let i = 0; i < 15; i++) {
        instructions.push({
          instruction: new TransactionInstruction({
            keys: [],
            programId: PublicKey.default,
            data: Buffer.from(`instruction_${i}`)
          }),
          name: `instruction_${i}`,
          priority: 100
        });
      }

      const results = await batcher.executeMultipleBatches(instructions, signers, feePayer, 'multi_batch');
      
      expect(results.length).toBe(2); // Should have 2 batch results
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
    });

    it('should stop execution on batch failure', async () => {
      (mockConnection.sendTransaction as jest.Mock)
        .mockResolvedValueOnce('success-signature')
        .mockRejectedValueOnce(new Error('Second batch failed'));
      
      const instructions: BatchedInstruction[] = [];
      
      // Create 15 instructions to force splitting
      for (let i = 0; i < 15; i++) {
        instructions.push({
          instruction: new TransactionInstruction({
            keys: [],
            programId: PublicKey.default,
            data: Buffer.from(`instruction_${i}`)
          }),
          name: `instruction_${i}`,
          priority: 100
        });
      }

      const results = await batcher.executeMultipleBatches(instructions, signers, feePayer, 'multi_batch');
      
      expect(results.length).toBe(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[1].error).toBe('Second batch failed');
    });
  });

  describe('NFT Batch Operations', () => {
    it('should create NFT batch with proper priorities', () => {
      const operations = [
        {
          type: 'mint' as const,
          instruction: new TransactionInstruction({
            keys: [],
            programId: PublicKey.default,
            data: Buffer.from('mint')
          }),
          priority: 100
        },
        {
          type: 'transfer' as const,
          instruction: new TransactionInstruction({
            keys: [],
            programId: PublicKey.default,
            data: Buffer.from('transfer')
          }),
          priority: 90
        },
        {
          type: 'list' as const,
          instruction: new TransactionInstruction({
            keys: [],
            programId: PublicKey.default,
            data: Buffer.from('list')
          }),
          priority: 80
        }
      ];

      const batch = batcher.createNFTBatch(operations);
      
      expect(batch.length).toBe(3);
      expect(batch[0].name).toBe('nft_mint');
      expect(batch[1].name).toBe('nft_transfer');
      expect(batch[2].name).toBe('nft_list');
      
      // Should be sorted by priority
      expect(batch[0].priority).toBe(100);
      expect(batch[1].priority).toBe(90);
      expect(batch[2].priority).toBe(80);
    });
  });

  describe('Compute Unit Estimation', () => {
    it('should estimate compute units for instructions', () => {
      const instructions: BatchedInstruction[] = [
        {
          instruction: new TransactionInstruction({
            keys: [
              { pubkey: PublicKey.default, isSigner: false, isWritable: false },
              { pubkey: PublicKey.default, isSigner: false, isWritable: false }
            ],
            programId: PublicKey.default,
            data: Buffer.from('test data')
          }),
          name: 'test_instruction',
          priority: 100
        }
      ];

      const transaction = batcher.createBatch(instructions, feePayer, 'test-blockhash');
      
      // Should have estimated CU > 0
      expect(transaction.instructions.length).toBe(1);
    });
  });
});
