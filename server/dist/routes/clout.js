"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cloutToken_1 = require("../services/cloutToken");
const honorSystem_1 = require("../services/honorSystem");
const trustPaymentSystem_1 = require("../services/trustPaymentSystem");
const router = (0, express_1.Router)();
const cloutService = new cloutToken_1.CloutTokenService();
const honorSystem = new honorSystem_1.HonorSystem();
const trustPaymentSystem = new trustPaymentSystem_1.TrustPaymentSystem();
// Get CLOUT token info
router.get("/info", async (req, res) => {
    try {
        const tokenInfo = cloutService.getCloutTokenInfo();
        res.json({ success: true, ...tokenInfo });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// Get user's CLOUT balance
router.get("/balance/:wallet", async (req, res) => {
    try {
        const { wallet } = req.params;
        const balance = await cloutService.getCloutBalance(wallet);
        res.json({ success: true, ...balance });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// Get user's honor score
router.get("/honor/:wallet", async (req, res) => {
    try {
        const { wallet } = req.params;
        const honorScore = await honorSystem.calculateHonorScore(wallet);
        res.json({ success: true, ...honorScore });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// Get user's trust level
router.get("/trust/:wallet", async (req, res) => {
    try {
        const { wallet } = req.params;
        const trustLevel = await trustPaymentSystem.getTrustLevel(wallet);
        res.json({ success: true, ...trustLevel });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// Calculate payment fees
router.post("/fees", async (req, res) => {
    try {
        const { buyerWallet, sellerWallet, price } = req.body;
        if (!buyerWallet || !sellerWallet || !price) {
            return res.status(400).json({
                success: false,
                error: "Missing required fields: buyerWallet, sellerWallet, price"
            });
        }
        const fees = await trustPaymentSystem.calculatePaymentFees(buyerWallet, sellerWallet, price);
        res.json({ success: true, ...fees });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// Process trust-based payment
router.post("/payment", async (req, res) => {
    try {
        const { buyerWallet, sellerWallet, nftMint, price } = req.body;
        if (!buyerWallet || !sellerWallet || !nftMint || !price) {
            return res.status(400).json({
                success: false,
                error: "Missing required fields: buyerWallet, sellerWallet, nftMint, price"
            });
        }
        const result = await trustPaymentSystem.processNFTPurchase(buyerWallet, sellerWallet, nftMint, price);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// Distribute CLOUT rewards
router.post("/distribute", async (req, res) => {
    try {
        const { recipientWallet, baseAmount, honorMultiplier } = req.body;
        if (!recipientWallet || !baseAmount) {
            return res.status(400).json({
                success: false,
                error: "Missing required fields: recipientWallet, baseAmount"
            });
        }
        const result = await cloutService.distributeCloutRewards(recipientWallet, baseAmount, honorMultiplier || 1.0);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// Get CLOUT benefits for a user
router.get("/benefits/:wallet", async (req, res) => {
    try {
        const { wallet } = req.params;
        const balance = await cloutService.getCloutBalance(wallet);
        const benefits = await cloutService.calculateCloutBenefits(Number(balance.balance));
        res.json({
            success: true,
            balance: balance.balance,
            benefits
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
exports.default = router;
