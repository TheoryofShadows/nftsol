import { Router } from "express";
import { CloutTokenService } from "../services/cloutToken";
import { HonorSystem } from "../services/honorSystem";
import { TrustPaymentSystem } from "../services/trustPaymentSystem";

const router = Router();
const cloutService = new CloutTokenService();
const honorSystem = new HonorSystem();
const trustPaymentSystem = new TrustPaymentSystem();

// Get CLOUT token info
router.get("/info", async (req, res) => {
  try {
    const tokenInfo = cloutService.getCloutTokenInfo();
    res.json({ success: true, ...tokenInfo });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get user's CLOUT balance
router.get("/balance/:wallet", async (req, res) => {
  try {
    const { wallet } = req.params;
    const balance = await cloutService.getCloutBalance(wallet);
    res.json({ success: true, ...balance });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get user's honor score
router.get("/honor/:wallet", async (req, res) => {
  try {
    const { wallet } = req.params;
    const honorScore = await honorSystem.calculateHonorScore(wallet);
    res.json({ success: true, ...honorScore });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get user's trust level
router.get("/trust/:wallet", async (req, res) => {
  try {
    const { wallet } = req.params;
    const trustLevel = await trustPaymentSystem.getTrustLevel(wallet);
    res.json({ success: true, ...trustLevel });
  } catch (error: any) {
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

    const fees = await trustPaymentSystem.calculatePaymentFees(
      buyerWallet, 
      sellerWallet, 
      price
    );

    res.json({ success: true, ...fees });
  } catch (error: any) {
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

    const result = await trustPaymentSystem.processNFTPurchase(
      buyerWallet,
      sellerWallet,
      nftMint,
      price
    );

    res.json(result);
  } catch (error: any) {
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

    const result = await cloutService.distributeCloutRewards(
      recipientWallet,
      baseAmount,
      honorMultiplier || 1.0
    );

    res.json(result);
  } catch (error: any) {
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
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;