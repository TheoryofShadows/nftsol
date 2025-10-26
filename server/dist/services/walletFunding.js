"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletFundingService = void 0;
const web3_js_1 = require("@solana/web3.js");
const bs58 = __importStar(require("bs58"));
class WalletFundingService {
    constructor(connection) {
        this.fundingWallet = null;
        this.connection = connection;
        this.loadFundingWallet();
    }
    loadFundingWallet() {
        // Load funding wallet from environment variables
        const fundingWalletSecret = process.env.FUNDING_WALLET_SECRET;
        if (fundingWalletSecret) {
            try {
                const secretKey = bs58.decode(fundingWalletSecret);
                this.fundingWallet = web3_js_1.Keypair.fromSecretKey(secretKey);
                console.log('✅ Funding wallet loaded:', this.fundingWallet.publicKey.toString());
            }
            catch (error) {
                console.error('❌ Failed to load funding wallet:', error);
            }
        }
        else {
            console.warn('⚠️ FUNDING_WALLET_SECRET not set, airdrops will only work on devnet');
        }
    }
    async fundWallet(request) {
        try {
            const recipientPublicKey = new web3_js_1.PublicKey(request.walletAddress);
            const amountInLamports = request.amount * web3_js_1.LAMPORTS_PER_SOL;
            // Validate amount
            if (request.amount <= 0) {
                return {
                    success: false,
                    error: 'Amount must be greater than 0'
                };
            }
            if (amountInLamports > 10 * web3_js_1.LAMPORTS_PER_SOL) {
                return {
                    success: false,
                    error: 'Cannot transfer more than 10 SOL per request'
                };
            }
            // Determine funding method
            const cluster = process.env.SOLANA_CLUSTER || 'devnet';
            const method = request.fundingSource || (cluster === 'devnet' ? 'airdrop' : 'treasury');
            let signature;
            if (method === 'airdrop' && cluster === 'devnet') {
                // Use airdrop for devnet
                console.log(`🪂 Requesting airdrop of ${request.amount} SOL to ${request.walletAddress}`);
                signature = await this.requestAirdrop(recipientPublicKey, amountInLamports);
            }
            else if (method === 'treasury' && this.fundingWallet) {
                // Use treasury wallet for mainnet
                console.log(`💰 Transferring ${request.amount} SOL from treasury to ${request.walletAddress}`);
                signature = await this.transferFromTreasury(recipientPublicKey, amountInLamports);
            }
            else {
                return {
                    success: false,
                    error: `Funding method '${method}' not available. Check FUNDING_WALLET_SECRET configuration.`
                };
            }
            // Wait for confirmation
            await this.connection.confirmTransaction(signature, 'confirmed');
            // Get updated balance
            const balance = await this.connection.getBalance(recipientPublicKey);
            const balanceInSOL = balance / web3_js_1.LAMPORTS_PER_SOL;
            console.log(`✅ Successfully funded wallet: ${request.walletAddress} with ${request.amount} SOL`);
            console.log(`   New balance: ${balanceInSOL} SOL`);
            return {
                success: true,
                signature,
                balance: balanceInSOL
            };
        }
        catch (error) {
            console.error('❌ Wallet funding failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Wallet funding failed'
            };
        }
    }
    async requestAirdrop(recipient, lamports) {
        const signature = await this.connection.requestAirdrop(recipient, lamports);
        return signature;
    }
    async transferFromTreasury(recipient, lamports) {
        if (!this.fundingWallet) {
            throw new Error('Funding wallet not initialized');
        }
        // Create transfer instruction
        const transferInstruction = web3_js_1.SystemProgram.transfer({
            fromPubkey: this.fundingWallet.publicKey,
            toPubkey: recipient,
            lamports,
        });
        // Create and send transaction
        const transaction = new web3_js_1.Transaction().add(transferInstruction);
        const signature = await this.connection.sendTransaction(transaction, [this.fundingWallet], {
            skipPreflight: false,
            preflightCommitment: 'confirmed',
        });
        return signature;
    }
    async getFundingWalletBalance() {
        if (!this.fundingWallet) {
            return null;
        }
        try {
            const balance = await this.connection.getBalance(this.fundingWallet.publicKey);
            return balance / web3_js_1.LAMPORTS_PER_SOL;
        }
        catch (error) {
            console.error('Failed to get funding wallet balance:', error);
            return null;
        }
    }
    async getWalletBalance(walletAddress) {
        try {
            const publicKey = new web3_js_1.PublicKey(walletAddress);
            const balance = await this.connection.getBalance(publicKey);
            return balance / web3_js_1.LAMPORTS_PER_SOL;
        }
        catch (error) {
            console.error('Failed to get wallet balance:', error);
            return 0;
        }
    }
}
exports.WalletFundingService = WalletFundingService;
