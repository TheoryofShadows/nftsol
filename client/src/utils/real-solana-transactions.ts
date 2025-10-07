import { 
  Connection, 
  Transaction, 
  SystemProgram, 
  PublicKey,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL 
} from "@solana/web3.js";
import { solscanAPI, verifyNFTPurchase, getTransactionLink } from "./solscan-api";

const RPC_URL = import.meta.env.VITE_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
const connection = new Connection(RPC_URL, 'confirmed');

// Platform wallet addresses
const PLATFORM_WALLETS = {
  developer: '3WCkmqcoJZnVbscWSD3xr9tyG1kqnc3MsVPusriKKKad',
  cloutTreasury: 'FsoPx1WmXA6FDxYTSULRDko3tKbNG7KxdRTq2icQJGjM',
  marketplaceTreasury: 'MarketplaceTreasury123456789',
  creatorEscrow: 'CreatorEscrow123456789'
};

export interface NFTPurchaseParams {
  buyerPublicKey: string;
  sellerPublicKey: string;
  nftPrice: number; // in SOL
  creatorPublicKey?: string;
  nftMintAddress?: string;
}

export interface TransactionResult {
  success: boolean;
  signature?: string;
  error?: string;
  explorerUrl?: string;
  verified?: boolean;
  breakdown: {
    sellerAmount: number;
    platformFee: number;
    creatorRoyalty: number;
    totalPaid: number;
  };
}

export async function processNFTPurchase(params: NFTPurchaseParams): Promise<TransactionResult> {
  try {
    const { buyerPublicKey, sellerPublicKey, nftPrice, creatorPublicKey, nftMintAddress } = params;
    
    // Calculate fee breakdown (optimized for sellers)
    const platformFeeRate = 0.02; // 2% platform commission
    const creatorRoyaltyRate = 0.025; // 2.5% creator royalty
    
    const platformFee = nftPrice * platformFeeRate;
    const creatorRoyalty = creatorPublicKey ? nftPrice * creatorRoyaltyRate : 0;
    const sellerAmount = nftPrice * 0.955; // Exactly 95.5% to seller
    
    const breakdown = {
      sellerAmount,
      platformFee,
      creatorRoyalty,
      totalPaid: nftPrice
    };

    // Validate wallet connection
    if (!window.solana?.isConnected) {
      throw new Error('Wallet not connected');
    }

    // Check buyer balance
    const buyerBalance = await getWalletBalance(buyerPublicKey);
    if (buyerBalance < nftPrice + 0.001) { // Include transaction fee buffer
      throw new Error(`Insufficient balance. Required: ${nftPrice + 0.001} SOL, Available: ${buyerBalance} SOL`);
    }

    // Create transaction with proper error handling
    const transaction = new Transaction();
    
    try {
      // Transfer to seller (95.5%)
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: new PublicKey(buyerPublicKey),
          toPubkey: new PublicKey(sellerPublicKey),
          lamports: Math.floor(sellerAmount * LAMPORTS_PER_SOL),
        })
      );
      
      // Transfer platform commission (2%)
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: new PublicKey(buyerPublicKey),
          toPubkey: new PublicKey(PLATFORM_WALLETS.developer),
          lamports: Math.floor(platformFee * LAMPORTS_PER_SOL),
        })
      );
      
      // Transfer creator royalty (2.5%) if applicable
      if (creatorPublicKey && creatorRoyalty > 0) {
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: new PublicKey(buyerPublicKey),
            toPubkey: new PublicKey(creatorPublicKey),
            lamports: Math.floor(creatorRoyalty * LAMPORTS_PER_SOL),
          })
        );
      }
    } catch (error) {
      throw new Error('Failed to build transaction: ' + (error as Error).message);
    }

    // Set recent blockhash with retry logic
    let retryCount = 0;
    let blockhash;
    while (retryCount < 3) {
      try {
        const latestBlockhash = await connection.getLatestBlockhash('confirmed');
        blockhash = latestBlockhash.blockhash;
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = new PublicKey(buyerPublicKey);
        break;
      } catch (error) {
        retryCount++;
        if (retryCount >= 3) {
          throw new Error('Failed to get blockhash after 3 attempts');
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Sign transaction with timeout
    const signedTransaction = await Promise.race([
      window.solana.signTransaction(transaction),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Transaction signing timeout')), 30000)
      )
    ]) as any;

    // Send transaction with confirmation
    console.log('Sending transaction...');
    const signature = await connection.sendRawTransaction(
      signedTransaction.serialize(),
      {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      }
    );
    
    console.log('Transaction sent, waiting for confirmation...');
    
    // Wait for confirmation with timeout
    const confirmationStrategy = {
      signature,
      blockhash: blockhash!,
      lastValidBlockHeight: (await connection.getLatestBlockhash()).lastValidBlockHeight,
    };
    
    const confirmation = await connection.confirmTransaction(confirmationStrategy, 'confirmed');
    
    if (confirmation.value.err) {
      throw new Error('Transaction failed: ' + JSON.stringify(confirmation.value.err));
    }
    
    // Get Solscan explorer URL
    const explorerUrl = `https://solscan.io/tx/${signature}`;
    
    // Award CLOUT tokens (non-blocking)
    awardCloutTokens(buyerPublicKey, sellerPublicKey, nftPrice, nftMintAddress).catch(console.error);

    // Update NFT ownership in database
    try {
      await fetch('/api/nfts/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mintAddress: nftMintAddress,
          newOwner: buyerPublicKey,
          transactionSignature: signature,
          price: nftPrice
        })
      });
    } catch (error) {
      console.error('Failed to update NFT ownership:', error);
      // Don't fail the transaction for this
    }

    console.log(`✅ Purchase successful! Transaction: ${signature}`);
    console.log(`🔗 Explorer: ${explorerUrl}`);
    console.log(`💰 Breakdown:`, breakdown);

    return {
      success: true,
      signature,
      explorerUrl,
      verified: true,
      breakdown
    };

  } catch (error) {
    console.error('NFT purchase failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      breakdown: {
        sellerAmount: 0,
        platformFee: 0,
        creatorRoyalty: 0,
        totalPaid: 0
      }
    };
  }
}

export async function getWalletBalance(publicKey: string): Promise<number> {
  try {
    // Try Solscan API first for enhanced data
    const solscanBalance = await solscanAPI.getWalletBalance(publicKey);
    if (solscanBalance > 0) {
      return solscanBalance;
    }
    
    // Fallback to direct RPC call
    const balance = await connection.getBalance(new PublicKey(publicKey));
    return balance / LAMPORTS_PER_SOL;
  } catch (error) {
    console.error('Failed to fetch wallet balance:', error);
    return 0;
  }
}

export async function validateTransaction(signature: string): Promise<boolean> {
  try {
    const transaction = await connection.getTransaction(signature);
    return transaction !== null;
  } catch (error) {
    console.error('Transaction validation failed:', error);
    return false;
  }
}

async function awardCloutTokens(
  buyerPublicKey: string, 
  sellerPublicKey: string, 
  nftPrice: number, 
  nftMintAddress?: string
) {
  try {
    // Calculate CLOUT rewards based on transaction value
    const buyerReward = Math.floor(nftPrice * 100); // 100 CLOUT per SOL spent
    const sellerReward = Math.floor(nftPrice * 50); // 50 CLOUT per SOL earned
    
    console.log(`💰 Awarding CLOUT: Buyer ${buyerReward}, Seller ${sellerReward}`);
    
    // Award to buyer
    const buyerResponse = await fetch('/api/clout/award', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: buyerPublicKey,
        amount: buyerReward,
        reason: `NFT Purchase - ${nftMintAddress || 'Unknown NFT'}`,
        transactionType: 'purchase'
      })
    });
    
    if (!buyerResponse.ok) {
      console.error('Buyer CLOUT award failed:', await buyerResponse.text());
    } else {
      console.log(`✅ Buyer awarded ${buyerReward} CLOUT`);
    }
    
    // Award to seller
    const sellerResponse = await fetch('/api/clout/award', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: sellerPublicKey,
        amount: sellerReward,
        reason: `NFT Sale - ${nftMintAddress || 'Unknown NFT'}`,
        transactionType: 'sale'
      })
    });
    
    if (!sellerResponse.ok) {
      console.error('Seller CLOUT award failed:', await sellerResponse.text());
    } else {
      console.log(`✅ Seller awarded ${sellerReward} CLOUT`);
    }
    
    return { buyerReward, sellerReward };
  } catch (error) {
    console.error('CLOUT award failed:', error);
    return { buyerReward: 0, sellerReward: 0 };
  }
}

export async function estimateTransactionFee(transaction: Transaction): Promise<number> {
  try {
    const feeCalculator = await connection.getFeeForMessage(transaction.compileMessage());
    return (feeCalculator?.value || 5000) / LAMPORTS_PER_SOL;
  } catch (error) {
    console.error('Fee estimation failed:', error);
    return 0.000005; // Default estimate
  }
}
