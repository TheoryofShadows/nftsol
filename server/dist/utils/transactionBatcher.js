"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionBatcher = void 0;
exports.batchNFTMints = batchNFTMints;
exports.batchTokenTransfers = batchTokenTransfers;
exports.batchStakingOperations = batchStakingOperations;
const web3_js_1 = require("@solana/web3.js");
const computeUnitMonitor_1 = require("./computeUnitMonitor");
class TransactionBatcher {
    constructor(connection) {
        this.maxInstructionsPerBatch = 10; // Solana limit
        this.maxCUPerBatch = 180000; // Leave safety margin
        this.connection = connection;
    }
    /**
     * Create a batched transaction from multiple instructions
     */
    createBatch(instructions, feePayer, recentBlockhash) {
        // Sort by priority (higher first)
        const sortedInstructions = instructions.sort((a, b) => b.priority - a.priority);
        const transaction = new web3_js_1.Transaction();
        // Add fee payer
        transaction.feePayer = feePayer;
        // Add recent blockhash if provided
        if (recentBlockhash) {
            transaction.recentBlockhash = recentBlockhash;
        }
        // Add instructions
        for (const { instruction } of sortedInstructions) {
            transaction.add(instruction);
        }
        return transaction;
    }
    /**
     * Execute a batch of instructions atomically
     */
    async executeBatch(instructions, signers, feePayer, batchName = 'batched_operations') {
        try {
            // Get recent blockhash
            const { blockhash } = await this.connection.getLatestBlockhash('confirmed');
            // Create transaction
            const transaction = this.createBatch(instructions, feePayer, blockhash);
            // Estimate compute units (rough estimation)
            const estimatedCU = this.estimateComputeUnits(instructions);
            if (estimatedCU > this.maxCUPerBatch) {
                throw new Error(`Batch too large: ${estimatedCU} CU exceeds limit of ${this.maxCUPerBatch}`);
            }
            // Send transaction with monitoring
            const signature = await (0, computeUnitMonitor_1.sendTransactionWithMonitoring)(this.connection, transaction, signers, batchName);
            return {
                signature,
                success: true,
                instructions: instructions.map(i => i.name),
                totalCU: estimatedCU
            };
        }
        catch (error) {
            return {
                signature: '',
                success: false,
                instructions: instructions.map(i => i.name),
                totalCU: 0,
                error: error.message
            };
        }
    }
    /**
     * Split large batches into smaller chunks
     */
    splitBatch(instructions) {
        const batches = [];
        let currentBatch = [];
        let currentCU = 0;
        for (const instruction of instructions) {
            const estimatedCU = this.estimateInstructionCU(instruction);
            // If adding this instruction would exceed limits, start a new batch
            if (currentBatch.length >= this.maxInstructionsPerBatch ||
                currentCU + estimatedCU > this.maxCUPerBatch) {
                if (currentBatch.length > 0) {
                    batches.push(currentBatch);
                    currentBatch = [];
                    currentCU = 0;
                }
            }
            currentBatch.push(instruction);
            currentCU += estimatedCU;
        }
        // Add the last batch if it has instructions
        if (currentBatch.length > 0) {
            batches.push(currentBatch);
        }
        return batches;
    }
    /**
     * Execute multiple batches sequentially
     */
    async executeMultipleBatches(instructions, signers, feePayer, baseName = 'multi_batch') {
        const batches = this.splitBatch(instructions);
        const results = [];
        for (let i = 0; i < batches.length; i++) {
            const batchName = `${baseName}_${i + 1}_of_${batches.length}`;
            const result = await this.executeBatch(batches[i], signers, feePayer, batchName);
            results.push(result);
            // If a batch fails, stop execution
            if (!result.success) {
                console.error(`Batch ${i + 1} failed:`, result.error);
                break;
            }
        }
        return results;
    }
    /**
     * Estimate compute units for a batch of instructions
     */
    estimateComputeUnits(instructions) {
        return instructions.reduce((total, instruction) => {
            return total + this.estimateInstructionCU(instruction);
        }, 0);
    }
    /**
     * Estimate compute units for a single instruction
     */
    estimateInstructionCU(instruction) {
        // Rough estimation based on instruction complexity
        const baseCU = 1000; // Base cost
        const accountCount = instruction.instruction.keys.length;
        const dataSize = instruction.instruction.data.length;
        // Estimate based on accounts and data size
        const accountCost = accountCount * 100;
        const dataCost = dataSize * 10;
        return baseCU + accountCost + dataCost;
    }
    /**
     * Create a batch for common NFT operations
     */
    createNFTBatch(operations) {
        return operations.map(op => ({
            instruction: op.instruction,
            name: `nft_${op.type}`,
            priority: op.priority || this.getDefaultPriority(op.type)
        }));
    }
    /**
     * Get default priority for operation types
     */
    getDefaultPriority(type) {
        const priorities = {
            'mint': 100,
            'transfer': 90,
            'list': 80,
            'buy': 70,
            'stake': 60,
            'unstake': 50,
            'harvest': 40
        };
        return priorities[type] || 50;
    }
}
exports.TransactionBatcher = TransactionBatcher;
/**
 * Utility functions for common batching scenarios
 */
/**
 * Batch multiple NFT mints
 */
async function batchNFTMints(connection, mintInstructions, signers, feePayer) {
    const batcher = new TransactionBatcher(connection);
    const instructions = mintInstructions.map((instruction, index) => ({
        instruction,
        name: `mint_nft_${index}`,
        priority: 100
    }));
    return batcher.executeBatch(instructions, signers, feePayer, 'batch_nft_mints');
}
/**
 * Batch multiple token transfers
 */
async function batchTokenTransfers(connection, transferInstructions, signers, feePayer) {
    const batcher = new TransactionBatcher(connection);
    const instructions = transferInstructions.map((instruction, index) => ({
        instruction,
        name: `transfer_${index}`,
        priority: 90
    }));
    return batcher.executeBatch(instructions, signers, feePayer, 'batch_transfers');
}
/**
 * Batch staking operations
 */
async function batchStakingOperations(connection, stakingInstructions, signers, feePayer) {
    const batcher = new TransactionBatcher(connection);
    const instructions = stakingInstructions.map((instruction, index) => ({
        instruction,
        name: `stake_${index}`,
        priority: 60
    }));
    return batcher.executeBatch(instructions, signers, feePayer, 'batch_staking');
}
