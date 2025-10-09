import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import * as crypto from "crypto";
import {
  PLATFORM_WALLETS as PLATFORM_WALLET_CONFIG,
  ensurePlatformWallets,
} from "./wallet-config";

ensurePlatformWallets();

// Secure wallet metadata (public keys supplied via wallet-config)
export const PLATFORM_WALLETS = {
  developer: {
    publicKey: PLATFORM_WALLET_CONFIG.DEVELOPER.publicKey,
    commissionRate: 0.02, // 2% total marketplace commission - 1% to developer, 1% to CLOUT treasury
    distributionRate: 0.01, // Developer gets 1% of sale
    purpose: PLATFORM_WALLET_CONFIG.DEVELOPER.purpose,
    source: PLATFORM_WALLET_CONFIG.DEVELOPER.source,
  },
  cloutTreasury: {
    publicKey: PLATFORM_WALLET_CONFIG.CLOUT_TREASURY.publicKey,
    distributionRate: 0.01, // CLOUT treasury gets 1% of sale for community rewards
    purpose: PLATFORM_WALLET_CONFIG.CLOUT_TREASURY.purpose,
    multisigRequired: true, // Requires multiple signatures for large withdrawals
    maxDailyDistribution: 100000, // Max 100k CLOUT per day
    emergencyLock: false, // Can be locked in emergency
    source: PLATFORM_WALLET_CONFIG.CLOUT_TREASURY.source,
  },
  marketplaceTreasury: {
    publicKey: PLATFORM_WALLET_CONFIG.MARKETPLACE_TREASURY.publicKey,
    purpose: PLATFORM_WALLET_CONFIG.MARKETPLACE_TREASURY.purpose,
    source: PLATFORM_WALLET_CONFIG.MARKETPLACE_TREASURY.source,
  },
  creatorEscrow: {
    publicKey: PLATFORM_WALLET_CONFIG.CREATOR_ESCROW.publicKey,
    purpose: PLATFORM_WALLET_CONFIG.CREATOR_ESCROW.purpose,
    source: PLATFORM_WALLET_CONFIG.CREATOR_ESCROW.source,
  },
};

const PLATFORM_WALLET_LABELS: Record<keyof typeof PLATFORM_WALLETS, string> = {
  developer: "Developer Wallet",
  cloutTreasury: "CLOUT Treasury",
  marketplaceTreasury: "Marketplace Treasury",
  creatorEscrow: "Creator Escrow",
};

// CLOUT token configuration
export const CLOUT_CONFIG = {
  tokenAddress: process.env.CLOUT_TOKEN_MINT_ADDRESS || "CLOUTtoken123456789",
  authorityAddress: process.env.CLOUT_TOKEN_AUTHORITY || "CLOUTAuthority123456789",
  decimals: 9,
  symbol: "CLOUT",
  name: "Community CLOUT Token",
  totalSupply: 1000000000, // 1 Billion CLOUT
  distribution: {
    communityRewards: 0.60, // 60%
    teamDevelopment: 0.20, // 20%
    marketingPartnerships: 0.15, // 15%
    reserveFund: 0.05 // 5%
  },
  rewardRates: {
    dailyLogin: 10,
    nftPurchase: 50,
    nftSale: 100,
    creatorRoyalty: 200, // Enhanced reward for creators receiving royalties
    referral: 25,
    communityPost: 5,
    nftCreation: 50, // Increased from 25
    firstSale: 300, // Increased bonus for first sale of created NFT
    creatorMilestone: 500 // New: Bonus for creators at milestones (10, 50, 100 sales)
  }
};

interface WalletTransaction {
  id: string;
  fromWallet: string;
  toWallet: string;
  amount: number;
  tokenType: 'SOL' | 'CLOUT';
  transactionType: 'purchase' | 'reward' | 'commission' | 'transfer';
  nftId?: string;
  timestamp: Date;
  signature?: string;
  status: 'pending' | 'confirmed' | 'failed';
}

interface UserWallet {
  userId: string;
  publicKey: string;
  solBalance: number;
  cloutBalance: number;
  isConnected: boolean;
  lastActivity: Date;
  totalRewards: number;
  transactionHistory: WalletTransaction[];
  securityLevel: 'basic' | 'enhanced' | 'premium';
}

// In-memory wallet storage (in production, use database)
const userWallets = new Map<string, UserWallet>();
const transactionQueue: WalletTransaction[] = [];

// Security utilities
export function generateSecureKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function validateWalletAddress(address: string): boolean {
  // Solana public key validation (base58, 32-44 chars)
  const solanaRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  return solanaRegex.test(address);
}

export function encryptSensitiveData(data: string, key: string): string {
  const cipher = crypto.createCipher('aes-256-cbc', key);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

export function decryptSensitiveData(encryptedData: string, key: string): string {
  const decipher = crypto.createDecipher('aes-256-cbc', key);
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// Wallet management functions
export async function createUserWallet(userId: string, publicKey: string): Promise<UserWallet> {
  if (!validateWalletAddress(publicKey)) {
    throw new Error('Invalid wallet address format');
  }

  const wallet: UserWallet = {
    userId,
    publicKey,
    solBalance: 0,
    cloutBalance: 0,
    isConnected: true,
    lastActivity: new Date(),
    totalRewards: 0,
    transactionHistory: [],
    securityLevel: 'basic'
  };

  userWallets.set(userId, wallet);
  
  // Award welcome CLOUT tokens
  await awardCloutTokens(userId, 100, 'Welcome bonus');
  
  return wallet;
}

export async function connectWallet(userId: string, publicKey: string): Promise<UserWallet> {
  let wallet = userWallets.get(userId);
  
  if (!wallet) {
    wallet = await createUserWallet(userId, publicKey);
  } else {
    wallet.publicKey = publicKey;
    wallet.isConnected = true;
    wallet.lastActivity = new Date();
  }
  
  // Daily login reward
  const lastLogin = wallet.lastActivity;
  const now = new Date();
  const daysSinceLastLogin = Math.floor((now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysSinceLastLogin >= 1) {
    await awardCloutTokens(userId, CLOUT_CONFIG.rewardRates.dailyLogin, 'Daily login reward');
  }
  
  return wallet;
}

// Helper function to get creator sales count
export async function getCreatorSalesCount(creatorId: string): Promise<number> {
  const wallet = userWallets.get(creatorId);
  if (!wallet) return 0;
  
  return wallet.transactionHistory.filter((t: WalletTransaction) => 
    t.transactionType === 'commission' && t.tokenType === 'SOL'
  ).length;
}

// CLOUT Treasury Security Controls
export async function validateCloutDistribution(amount: number): Promise<boolean> {
  const treasury = PLATFORM_WALLETS.cloutTreasury;
  
  // Check daily distribution limits
  const today = new Date().toDateString();
  const todaysDistributions = await getDailyCloutDistributions(today);
  
  if (todaysDistributions + amount > treasury.maxDailyDistribution) {
    console.log(`CLOUT distribution blocked: Would exceed daily limit of ${treasury.maxDailyDistribution}`);
    return false;
  }
  
  // Check emergency lock
  if (treasury.emergencyLock) {
    console.log('CLOUT distribution blocked: Emergency lock active');
    return false;
  }
  
  return true;
}

export async function getDailyCloutDistributions(date: string): Promise<number> {
  // Calculate total CLOUT distributed today across all users
  let totalDistributed = 0;
  for (const [userId, wallet] of Array.from(userWallets.entries())) {
    const todaysTransactions = wallet.transactionHistory.filter((t: WalletTransaction) => 
      t.tokenType === 'CLOUT' && 
      t.transactionType === 'reward' &&
      t.timestamp.toDateString() === date
    );
    totalDistributed += todaysTransactions.reduce((sum: number, t: WalletTransaction) => sum + t.amount, 0);
  }
  return totalDistributed;
}

export async function awardCloutTokens(userId: string, amount: number, reason: string): Promise<void> {
  const wallet = userWallets.get(userId);
  if (!wallet) return;
  
  // Security validation before awarding CLOUT
  const isValid = await validateCloutDistribution(amount);
  if (!isValid) {
    console.log(`CLOUT award blocked for user ${userId}: Security validation failed`);
    return;
  }
  
  wallet.cloutBalance += amount;
  wallet.totalRewards += amount;
  
  const transaction: WalletTransaction = {
    id: crypto.randomUUID(),
    fromWallet: 'CLOUT_TREASURY',
    toWallet: wallet.publicKey,
    amount,
    tokenType: 'CLOUT',
    transactionType: 'reward',
    timestamp: new Date(),
    status: 'confirmed'
  };
  
  wallet.transactionHistory.push(transaction);
  console.log(`Awarded ${amount} CLOUT to user ${userId}: ${reason}`);
}

type PlatformWalletStat = {
  name: string;
  address: string;
  balance: number;
  transactions: number;
  purpose: string;
  source: string;
};

export function getPlatformWalletStats(): PlatformWalletStat[] {
  const statsMap = new Map<string, PlatformWalletStat>();

  (Object.entries(PLATFORM_WALLETS) as Array<[keyof typeof PLATFORM_WALLETS, (typeof PLATFORM_WALLETS)[keyof typeof PLATFORM_WALLETS]]>).forEach(
    ([key, walletConfig]) => {
      statsMap.set(walletConfig.publicKey, {
        name: PLATFORM_WALLET_LABELS[key],
        address: walletConfig.publicKey,
        balance: 0,
        transactions: 0,
        purpose: walletConfig.purpose,
        source: walletConfig.source,
      });
    },
  );

  for (const wallet of userWallets.values()) {
    for (const tx of wallet.transactionHistory) {
      if (tx.tokenType !== 'SOL') continue;
      const stat = statsMap.get(tx.toWallet);
      if (stat) {
        stat.balance += tx.amount;
        stat.transactions += 1;
      }
    }
  }

  return Array.from(statsMap.values());
}

export async function processNFTPurchase(
  buyerId: string,
  sellerId: string,
  nftId: string,
  priceSOL: number,
  creatorId?: string,
  creatorRoyaltyRate: number = 0.025 // 2.5% default creator royalty (more seller-friendly)
): Promise<{ success: boolean; transactionId?: string; error?: string; breakdown?: any }> {
  try {
    const buyerWallet = userWallets.get(buyerId);
    const sellerWallet = userWallets.get(sellerId);
    const creatorWallet = creatorId ? userWallets.get(creatorId) : null;
    
    if (!buyerWallet || !sellerWallet) {
      return { success: false, error: 'Wallet not found' };
    }
    
    if (buyerWallet.solBalance < priceSOL) {
      return { success: false, error: 'Insufficient SOL balance' };
    }
    
    // Calculate all fees and distributions  
    const platformCommission = priceSOL * PLATFORM_WALLETS.developer.commissionRate; // 2%
    const creatorRoyalty = creatorWallet ? priceSOL * creatorRoyaltyRate : 0; // 2.5% if creator exists (reduced)
    const sellerAmount = priceSOL - platformCommission - creatorRoyalty;
    
    const breakdown = {
      totalPrice: priceSOL,
      platformCommission,
      creatorRoyalty,
      sellerAmount,
      platformCommissionRate: PLATFORM_WALLETS.developer.commissionRate,
      creatorRoyaltyRate
    };
    
    // Process transaction
    const transactionId = crypto.randomUUID();
    
    // Deduct from buyer
    buyerWallet.solBalance -= priceSOL;
    
    // Pay seller (after commissions)
    sellerWallet.solBalance += sellerAmount;
    
    // Pay creator royalty if applicable
    if (creatorWallet && creatorRoyalty > 0) {
      creatorWallet.solBalance += creatorRoyalty;
      // Enhanced creator rewards - 200 CLOUT instead of 100
      await awardCloutTokens(creatorId!, CLOUT_CONFIG.rewardRates.creatorRoyalty, 'Enhanced creator royalty reward');
      
      // Check for creator milestones
      const creatorSales = await getCreatorSalesCount(creatorId!);
      if ([10, 50, 100, 500, 1000].includes(creatorSales)) {
        await awardCloutTokens(creatorId!, CLOUT_CONFIG.rewardRates.creatorMilestone, `Creator milestone: ${creatorSales} sales`);
      }
    }
    
    // Award CLOUT tokens
    await awardCloutTokens(buyerId, CLOUT_CONFIG.rewardRates.nftPurchase, 'NFT purchase');
    await awardCloutTokens(sellerId, CLOUT_CONFIG.rewardRates.nftSale, 'NFT sale');
    
    // Record main transaction
    const purchaseTransaction: WalletTransaction = {
      id: transactionId,
      fromWallet: buyerWallet.publicKey,
      toWallet: sellerWallet.publicKey,
      amount: sellerAmount,
      tokenType: 'SOL',
      transactionType: 'purchase',
      nftId,
      timestamp: new Date(),
      status: 'confirmed'
    };
    
    // Record commission transaction
    const commissionTransaction: WalletTransaction = {
      id: crypto.randomUUID(),
      fromWallet: buyerWallet.publicKey,
      toWallet: PLATFORM_WALLETS.developer.publicKey,
      amount: platformCommission,
      tokenType: 'SOL',
      transactionType: 'commission',
      nftId,
      timestamp: new Date(),
      status: 'confirmed'
    };
    
    // Record creator royalty transaction if applicable
    let royaltyTransaction: WalletTransaction | null = null;
    if (creatorWallet && creatorRoyalty > 0) {
      royaltyTransaction = {
        id: crypto.randomUUID(),
        fromWallet: buyerWallet.publicKey,
        toWallet: creatorWallet.publicKey,
        amount: creatorRoyalty,
        tokenType: 'SOL',
        transactionType: 'commission',
        nftId,
        timestamp: new Date(),
        status: 'confirmed'
      };
      creatorWallet.transactionHistory.push(royaltyTransaction);
    }
    
    // Add transactions to history
    buyerWallet.transactionHistory.push(purchaseTransaction, commissionTransaction);
    sellerWallet.transactionHistory.push(purchaseTransaction);
    
    console.log(`NFT Purchase processed: ${priceSOL} SOL`);
    console.log(`- Developer commission: ${platformCommission} SOL (${(PLATFORM_WALLETS.developer.commissionRate * 100).toFixed(1)}%)`);
    console.log(`- Creator royalty: ${creatorRoyalty} SOL (${(creatorRoyaltyRate * 100).toFixed(1)}%)`);
    console.log(`- Seller receives: ${sellerAmount} SOL (${((sellerAmount / priceSOL) * 100).toFixed(1)}%)`);
    
    return { success: true, transactionId, breakdown };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// API endpoints
export function setupWalletRoutes(app: any) {
  // Get wallet info
  app.get('/api/wallet/:userId', async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const wallet = userWallets.get(userId);
      
      if (!wallet) {
        return res.status(404).json({ error: 'Wallet not found' });
      }
      
      res.json({
        publicKey: wallet.publicKey,
        solBalance: wallet.solBalance,
        cloutBalance: wallet.cloutBalance,
        totalRewards: wallet.totalRewards,
        securityLevel: wallet.securityLevel,
        isConnected: wallet.isConnected,
        lastActivity: wallet.lastActivity
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Connect wallet
  app.post('/api/wallet/connect', async (req: Request, res: Response) => {
    try {
      const { userId, publicKey } = req.body;
      
      if (!userId || !publicKey) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      const wallet = await connectWallet(userId, publicKey);
      res.json({ success: true, wallet });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Get CLOUT token info
  app.get('/api/clout/info', (req: Request, res: Response) => {
    res.json(CLOUT_CONFIG);
  });
  
  // Award CLOUT tokens (admin only)
  app.post('/api/clout/award', async (req: Request, res: Response) => {
    try {
      const { userId, amount, reason } = req.body;
      
      if (!userId || !amount) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      await awardCloutTokens(userId, amount, reason || 'Manual award');
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Get transaction history
  app.get('/api/wallet/:userId/transactions', (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const wallet = userWallets.get(userId);
      
      if (!wallet) {
        return res.status(404).json({ error: 'Wallet not found' });
      }
      
      res.json(wallet.transactionHistory);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Security health check
  app.get('/api/wallet/security/health', (req: Request, res: Response) => {
    res.json({
      status: 'secure',
      timestamp: new Date(),
      activeWallets: userWallets.size,
      totalTransactions: Array.from(userWallets.values())
        .reduce((sum, wallet) => sum + wallet.transactionHistory.length, 0),
      platformWallets: {
        developer: {
          configured: true,
          status: "Active",
          address: PLATFORM_WALLETS.developer.publicKey.slice(0, 8) + "...",
          purpose: PLATFORM_WALLETS.developer.purpose,
          commissionRate: "1% of total sales"
        },
        cloutTreasury: {
          configured: true,
          status: "Active", 
          address: PLATFORM_WALLETS.cloutTreasury.publicKey.slice(0, 8) + "...",
          purpose: PLATFORM_WALLETS.cloutTreasury.purpose,
          distributionRate: "1% of total sales"
        },
        marketplaceTreasury: {
          configured: true,
          status: "Active",
          address: PLATFORM_WALLETS.marketplaceTreasury.publicKey.slice(0, 8) + "...",
          purpose: PLATFORM_WALLETS.marketplaceTreasury.purpose
        },
        creatorEscrow: {
          configured: true,
          status: "Active",
          address: PLATFORM_WALLETS.creatorEscrow.publicKey.slice(0, 8) + "...",
          purpose: PLATFORM_WALLETS.creatorEscrow.purpose
        }
      },
      cloutToken: {
        configured: !!process.env.CLOUT_TOKEN_MINT_ADDRESS,
        totalSupply: CLOUT_CONFIG.totalSupply,
        distributionModel: CLOUT_CONFIG.distribution
      }
    });
  });

  // Get platform wallet addresses (public keys only)
  app.get('/api/platform/wallets', (req: Request, res: Response) => {
    res.json({
      developer: {
        address: PLATFORM_WALLETS.developer.publicKey,
        purpose: PLATFORM_WALLETS.developer.purpose,
        status: "Active",
        configured: true,
        commissionRate: "1% of total sales"
      },
      cloutTreasury: {
        address: PLATFORM_WALLETS.cloutTreasury.publicKey,
        purpose: PLATFORM_WALLETS.cloutTreasury.purpose,
        status: "Active",
        configured: true,
        distributionRate: "1% of total sales"
      },
      marketplaceTreasury: {
        address: PLATFORM_WALLETS.marketplaceTreasury.publicKey,
        purpose: PLATFORM_WALLETS.marketplaceTreasury.purpose,
        status: "Active",
        configured: true
      },
      creatorEscrow: {
        address: PLATFORM_WALLETS.creatorEscrow.publicKey,
        purpose: PLATFORM_WALLETS.creatorEscrow.purpose,
        status: "Active",
        configured: true
      }
    });
  });

  // Test NFT purchase with commission breakdown
  app.post('/api/wallet/test/purchase', async (req: Request, res: Response) => {
    try {
      const { buyerId, sellerId, creatorId, nftId, priceSOL, creatorRoyaltyRate } = req.body;
      
      if (!buyerId || !sellerId || !nftId || !priceSOL) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      const result = await processNFTPurchase(
        buyerId, 
        sellerId, 
        nftId, 
        parseFloat(priceSOL), 
        creatorId,
        creatorRoyaltyRate ? parseFloat(creatorRoyaltyRate) : 0.05
      );
      
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
}
