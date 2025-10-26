"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const walletFunding_1 = require("../services/walletFunding");
const web3_js_1 = require("@solana/web3.js");
const router = (0, express_1.Router)();
const HELIUS_API_KEY = process.env.HELIUS_API_KEY || '';
const HELIUS_RPC_URL = process.env.HELIUS_RPC_URL || '';
// Create connection
const connection = new web3_js_1.Connection(HELIUS_RPC_URL || 'https://api.mainnet-beta.solana.com', 'confirmed');
// Create wallet funding service
const walletFundingService = new walletFunding_1.WalletFundingService(connection);
/**
 * Fund a wallet with SOL
 * POST /api/wallet/fund
 * Body: { walletAddress: string, amount: number, fundingSource?: 'treasury' | 'airdrop' }
 */
router.post('/fund', async (req, res) => {
    try {
        const { walletAddress, amount, fundingSource } = req.body;
        // Validate input
        if (!walletAddress) {
            return res.status(400).json({
                success: false,
                error: 'Wallet address is required'
            });
        }
        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Amount must be greater than 0'
            });
        }
        // Fund the wallet
        const result = await walletFundingService.fundWallet({
            walletAddress,
            amount,
            fundingSource
        });
        if (result.success) {
            return res.json({
                success: true,
                signature: result.signature,
                balance: result.balance,
                message: `Successfully funded wallet with ${amount} SOL`
            });
        }
        else {
            return res.status(400).json({
                success: false,
                error: result.error
            });
        }
    }
    catch (error) {
        console.error('Wallet funding error:', error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Wallet funding failed'
        });
    }
});
/**
 * Get wallet balance
 * GET /api/wallet/balance/:walletAddress
 */
router.get('/balance/:walletAddress', async (req, res) => {
    try {
        const { walletAddress } = req.params;
        if (!walletAddress) {
            return res.status(400).json({
                success: false,
                error: 'Wallet address is required'
            });
        }
        const balance = await walletFundingService.getWalletBalance(walletAddress);
        return res.json({
            success: true,
            balance,
            walletAddress
        });
    }
    catch (error) {
        console.error('Get wallet balance error:', error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get wallet balance'
        });
    }
});
/**
 * Get funding wallet status
 * GET /api/wallet/funding-status
 */
router.get('/funding-status', async (req, res) => {
    try {
        const balance = await walletFundingService.getFundingWalletBalance();
        return res.json({
            success: true,
            available: balance !== null,
            balance
        });
    }
    catch (error) {
        console.error('Get funding status error:', error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get funding status'
        });
    }
});
exports.default = router;
