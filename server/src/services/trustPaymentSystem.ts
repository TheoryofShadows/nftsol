import { Connection, PublicKey, Transaction, Keypair } from '@solana/web3.js';
import { 
  getAssociatedTokenAddress,
  createTransferInstruction,
  TOKEN_PROGRAM_ID
} from '@solana/spl-token';
import { getHeliusConfig } from '../config/environment';
import { HonorSystem, HonorScore } from './honorSystem';
import { CloutTokenService } from './cloutToken';

export interface TrustPayment {
  buyerWallet: string;
  sellerWallet: string;
  nftMint: string;
  price: number;
  platformFee: number;
  creatorRoyalty: number;
  cloutReward: number;
  trustLevel: 'high' | 'medium' | 'low';
  paymentMethod: 'instant' | 'escrow' | 'clout';
}

export interface PaymentResult {
  success: boolean;
  transactionSignature?: string;
  cloutDistributed?: number;
  trustScore?: number;
  error?: string;
}

export class TrustPaymentSystem {
  private connection: Connection;
  private heliusConfig: any;
  private honorSystem: HonorSystem;
  private cloutService: CloutTokenService;
  
  private platformWallets = {
    feeCollector: '5Gu3RnFApFEDmMJj5czHTFPRf6A5xNypSRPrqewmPLHW',
    treasury: 'J9msWkhEUPMLBXzkycwZjuU6B5vjfvNguASHLxJKAAfh',
    developer: '7pRUDnHS1y3b7EycVm7xtV2MgBArKFcAnFpdZCMPvLio'
  };

  constructor() {
    this.heliusConfig = getHeliusConfig();
    this.connection = new Connection(this.heliusConfig.rpcUrl, 'confirmed');
    this.honorSystem = new HonorSystem();
    this.cloutService = new CloutTokenService();
  }

  // Process NFT purchase with trust-based payment
  async processNFTPurchase(
    buyerWallet: string,
    sellerWallet: string,
    nftMint: string,
    price: number
  ): Promise<PaymentResult> {
    try {
      // 1. Calculate trust levels for both parties
      const [buyerHonor, sellerHonor] = await Promise.all([
        this.honorSystem.calculateHonorScore(buyerWallet),
        this.honorSystem.calculateHonorScore(sellerWallet)
      ]);

      // 2. Determine payment method based on trust
      const paymentMethod = this.determinePaymentMethod(buyerHonor, sellerHonor);
      
      // 3. Calculate fees and rewards
      const fees = this.calculateFees(price, buyerHonor, sellerHonor);
      
      // 4. Process payment based on trust level
      let result: PaymentResult;
      
      switch (paymentMethod) {
        case 'instant':
          result = await this.processInstantPayment(buyerWallet, sellerWallet, nftMint, price, fees);
          break;
        case 'escrow':
          result = await this.processEscrowPayment(buyerWallet, sellerWallet, nftMint, price, fees);
          break;
        case 'clout':
          result = await this.processCloutPayment(buyerWallet, sellerWallet, nftMint, price, fees);
          break;
        default:
          throw new Error('Invalid payment method');
      }

      // 5. Distribute CLOUT rewards based on honor system
      if (result.success) {
        await this.distributeCloutRewards(buyerWallet, sellerWallet, price, buyerHonor, sellerHonor);
      }

      return result;

    } catch (error: any) {
      console.error('Failed to process NFT purchase:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Determine payment method based on trust levels
  private determinePaymentMethod(
    buyerHonor: HonorScore, 
    sellerHonor: HonorScore
  ): 'instant' | 'escrow' | 'clout' {
    const buyerTrust = buyerHonor.total;
    const sellerTrust = sellerHonor.total;
    const avgTrust = (buyerTrust + sellerTrust) / 2;

    if (avgTrust >= 80) {
      return 'instant'; // High trust = instant payment
    } else if (avgTrust >= 50) {
      return 'escrow'; // Medium trust = escrow
    } else {
      return 'clout'; // Low trust = CLOUT-based payment
    }
  }

  // Calculate fees based on trust levels
  private calculateFees(
    price: number, 
    buyerHonor: HonorScore, 
    sellerHonor: HonorScore
  ) {
    const basePlatformFee = price * 0.025; // 2.5% base fee
    const baseCreatorRoyalty = price * 0.025; // 2.5% creator royalty
    
    // Trust-based fee reductions
    const buyerFeeReduction = buyerHonor.benefits.feeReduction / 100;
    const sellerFeeReduction = sellerHonor.benefits.feeReduction / 100;
    
    const platformFee = basePlatformFee * (1 - Math.max(buyerFeeReduction, sellerFeeReduction));
    const creatorRoyalty = baseCreatorRoyalty * (1 - sellerFeeReduction);
    
    // CLOUT rewards based on honor
    const cloutReward = price * 0.1 * (buyerHonor.benefits.cloutMultiplier + sellerHonor.benefits.cloutMultiplier) / 2;

    return {
      platformFee,
      creatorRoyalty,
      cloutReward,
      netToSeller: price - platformFee - creatorRoyalty
    };
  }

  // Process instant payment for high-trust users
  private async processInstantPayment(
    buyerWallet: string,
    sellerWallet: string,
    nftMint: string,
    price: number,
    fees: any
  ): Promise<PaymentResult> {
    try {
      // For high-trust users, process payment immediately
      // In production, this would create actual Solana transactions
      
      console.log(`💸 Instant payment: ${price} SOL from ${buyerWallet} to ${sellerWallet}`);
      console.log(`💰 Platform fee: ${fees.platformFee} SOL`);
      console.log(`🎨 Creator royalty: ${fees.creatorRoyalty} SOL`);
      console.log(`🎁 CLOUT reward: ${fees.cloutReward} tokens`);

      // Simulate transaction signature
      const signature = `instant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      return {
        success: true,
        transactionSignature: signature,
        cloutDistributed: fees.cloutReward,
        trustScore: 90 // High trust for instant payments
      };

    } catch (error: any) {
      return {
        success: false,
        error: `Instant payment failed: ${error.message}`
      };
    }
  }

  // Process escrow payment for medium-trust users
  private async processEscrowPayment(
    buyerWallet: string,
    sellerWallet: string,
    nftMint: string,
    price: number,
    fees: any
  ): Promise<PaymentResult> {
    try {
      // For medium-trust users, use escrow system
      // Platform holds funds until NFT transfer is confirmed
      
      console.log(`🔒 Escrow payment: ${price} SOL held in escrow`);
      console.log(`⏳ Waiting for NFT transfer confirmation...`);

      // Simulate escrow process
      const signature = `escrow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      return {
        success: true,
        transactionSignature: signature,
        cloutDistributed: fees.cloutReward,
        trustScore: 60 // Medium trust for escrow
      };

    } catch (error: any) {
      return {
        success: false,
        error: `Escrow payment failed: ${error.message}`
      };
    }
  }

  // Process CLOUT-based payment for low-trust users
  private async processCloutPayment(
    buyerWallet: string,
    sellerWallet: string,
    nftMint: string,
    price: number,
    fees: any
  ): Promise<PaymentResult> {
    try {
      // For low-trust users, use CLOUT tokens as payment
      // This reduces risk while still enabling transactions
      
      console.log(`🪙 CLOUT payment: ${fees.cloutReward} CLOUT tokens`);
      console.log(`💡 Reduced risk for low-trust users`);

      const signature = `clout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      return {
        success: true,
        transactionSignature: signature,
        cloutDistributed: fees.cloutReward,
        trustScore: 30 // Low trust for CLOUT payments
      };

    } catch (error: any) {
      return {
        success: false,
        error: `CLOUT payment failed: ${error.message}`
      };
    }
  }

  // Distribute CLOUT rewards based on honor system
  private async distributeCloutRewards(
    buyerWallet: string,
    sellerWallet: string,
    price: number,
    buyerHonor: HonorScore,
    sellerHonor: HonorScore
  ) {
    try {
      // Calculate CLOUT rewards for both parties
      const buyerClout = price * 0.05 * buyerHonor.benefits.cloutMultiplier;
      const sellerClout = price * 0.05 * sellerHonor.benefits.cloutMultiplier;

      // Distribute CLOUT rewards
      await Promise.all([
        this.cloutService.distributeCloutRewards(buyerWallet, buyerClout, buyerHonor.benefits.cloutMultiplier),
        this.cloutService.distributeCloutRewards(sellerWallet, sellerClout, sellerHonor.benefits.cloutMultiplier)
      ]);

      console.log(`🎁 Distributed ${buyerClout} CLOUT to buyer, ${sellerClout} CLOUT to seller`);

    } catch (error: any) {
      console.error('Failed to distribute CLOUT rewards:', error);
    }
  }

  // Get trust level for a wallet
  async getTrustLevel(walletAddress: string): Promise<{
    level: 'high' | 'medium' | 'low';
    score: number;
    benefits: any;
    recommendations: string[];
  }> {
    try {
      const honorScore = await this.honorSystem.calculateHonorScore(walletAddress);
      
      let level: 'high' | 'medium' | 'low';
      if (honorScore.total >= 80) level = 'high';
      else if (honorScore.total >= 50) level = 'medium';
      else level = 'low';

      const recommendations = this.getTrustRecommendations(honorScore);

      return {
        level,
        score: honorScore.total,
        benefits: honorScore.benefits,
        recommendations
      };

    } catch (error: any) {
      console.error('Failed to get trust level:', error);
      return {
        level: 'low',
        score: 0,
        benefits: {},
        recommendations: ['Start using the platform to build trust']
      };
    }
  }

  // Get recommendations to improve trust level
  private getTrustRecommendations(honorScore: HonorScore): string[] {
    const recommendations: string[] = [];

    if (honorScore.factors.platformUsage < 30) {
      recommendations.push('Create and list more NFTs on the platform');
    }

    if (honorScore.factors.communityEngagement < 30) {
      recommendations.push('Engage more with the community');
    }

    if (honorScore.factors.transactionReliability < 80) {
      recommendations.push('Complete more successful transactions');
    }

    if (honorScore.factors.creationQuality < 30) {
      recommendations.push('Focus on creating higher quality NFTs');
    }

    if (honorScore.factors.stakingParticipation < 20) {
      recommendations.push('Consider staking CLOUT tokens for additional benefits');
    }

    return recommendations;
  }

  // Calculate payment fees for a transaction
  async calculatePaymentFees(
    buyerWallet: string,
    sellerWallet: string,
    price: number
  ): Promise<{
    platformFee: number;
    creatorRoyalty: number;
    cloutReward: number;
    netToSeller: number;
    trustLevel: string;
  }> {
    try {
      const [buyerHonor, sellerHonor] = await Promise.all([
        this.honorSystem.calculateHonorScore(buyerWallet),
        this.honorSystem.calculateHonorScore(sellerWallet)
      ]);

      const fees = this.calculateFees(price, buyerHonor, sellerHonor);
      const trustLevel = this.determinePaymentMethod(buyerHonor, sellerHonor);

      return {
        ...fees,
        trustLevel
      };

    } catch (error: any) {
      console.error('Failed to calculate payment fees:', error);
      return {
        platformFee: price * 0.025,
        creatorRoyalty: price * 0.025,
        cloutReward: price * 0.1,
        netToSeller: price * 0.95,
        trustLevel: 'escrow'
      };
    }
  }
}
