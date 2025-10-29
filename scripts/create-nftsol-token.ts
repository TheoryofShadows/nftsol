#!/usr/bin/env ts-node

import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { 
  createMint, 
  getOrCreateAssociatedTokenAccount, 
  mintTo,
  getAccount,
  createInitializeMintInstruction,
  TOKEN_PROGRAM_ID,
  MINT_SIZE,
  getMinimumBalanceForRentExemptMint
} from '@solana/spl-token';
import { 
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction 
} from '@solana/web3.js';
import bs58 from 'bs58';

// NFTSol Token Configuration
const TOKEN_CONFIG = {
  name: "NFTSol Token",
  symbol: "NFTSOL", 
  supply: 1_000_000, // 1 million tokens
  decimals: 6,
  description: "The utility token for NFTSol marketplace - the fastest NFT platform on Solana"
};

// Mainnet RPC
const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');

async function createNFTSolToken() {
  console.log('🚀 Creating $NFTSOL Token on Mainnet...');
  
  try {
    // Load platform wallet (you'll need to replace this with your actual mainnet wallet)
    const platformWallet = Keypair.fromSecretKey(
      bs58.decode(process.env.PLATFORM_SECRET_KEY_BASE58 || '')
    );
    
    console.log('📊 Platform Wallet:', platformWallet.publicKey.toBase58());
    
    // Check wallet balance
    const balance = await connection.getBalance(platformWallet.publicKey);
    console.log('💰 Wallet Balance:', balance / LAMPORTS_PER_SOL, 'SOL');
    
    if (balance < 0.1 * LAMPORTS_PER_SOL) {
      throw new Error('Insufficient SOL for token creation. Need at least 0.1 SOL');
    }
    
    // Create the mint
    console.log('🏗️ Creating mint...');
    const mint = await createMint(
      connection,
      platformWallet,
      platformWallet.publicKey, // mint authority
      null, // freeze authority (null = no freeze)
      TOKEN_CONFIG.decimals
    );
    
    console.log('✅ Mint Created:', mint.toBase58());
    
    // Create associated token account for the platform
    console.log('💳 Creating token account...');
    const tokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      platformWallet,
      mint,
      platformWallet.publicKey
    );
    
    console.log('✅ Token Account:', tokenAccount.address.toBase58());
    
    // Mint initial supply
    console.log('🪙 Minting initial supply...');
    const mintAmount = TOKEN_CONFIG.supply * Math.pow(10, TOKEN_CONFIG.decimals);
    
    const mintSignature = await mintTo(
      connection,
      platformWallet,
      mint,
      tokenAccount.address,
      platformWallet,
      mintAmount
    );
    
    console.log('✅ Mint Transaction:', mintSignature);
    
    // Verify token account
    const accountInfo = await getAccount(connection, tokenAccount.address);
    console.log('📊 Token Account Balance:', Number(accountInfo.amount) / Math.pow(10, TOKEN_CONFIG.decimals), 'NFTSOL');
    
    // Token metadata
    const tokenMetadata = {
      mint: mint.toBase58(),
      symbol: TOKEN_CONFIG.symbol,
      name: TOKEN_CONFIG.name,
      decimals: TOKEN_CONFIG.decimals,
      supply: TOKEN_CONFIG.supply,
      description: TOKEN_CONFIG.description,
      platformWallet: platformWallet.publicKey.toBase58(),
      tokenAccount: tokenAccount.address.toBase58(),
      createdAt: new Date().toISOString()
    };
    
    console.log('🎉 $NFTSOL Token Successfully Created!');
    console.log('📋 Token Details:');
    console.log(JSON.stringify(tokenMetadata, null, 2));
    
    // Save token info to file
    const fs = require('fs');
    fs.writeFileSync('nftsol-token.json', JSON.stringify(tokenMetadata, null, 2));
    
    console.log('💾 Token info saved to nftsol-token.json');
    
    return tokenMetadata;
    
  } catch (error) {
    console.error('❌ Error creating token:', error);
    throw error;
  }
}

// Utility functions for token operations
export async function getTokenBalance(walletAddress: string, tokenMint: string) {
  try {
    const connection = new Connection('https://api.mainnet-beta.solana.com');
    const wallet = new PublicKey(walletAddress);
    const mint = new PublicKey(tokenMint);
    
    const tokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet,
      mint,
      wallet
    );
    
    const accountInfo = await getAccount(connection, tokenAccount.address);
    return Number(accountInfo.amount) / Math.pow(10, TOKEN_CONFIG.decimals);
  } catch (error) {
    return 0;
  }
}

export async function transferNFTSOL(fromWallet: Keypair, toAddress: string, amount: number) {
  try {
    const connection = new Connection('https://api.mainnet-beta.solana.com');
    const toWallet = new PublicKey(toAddress);
    
    // Load token info
    const tokenInfo = JSON.parse(require('fs').readFileSync('nftsol-token.json', 'utf8'));
    const mint = new PublicKey(tokenInfo.mint);
    
    // Get token accounts
    const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      fromWallet,
      mint,
      fromWallet.publicKey
    );
    
    const toTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      fromWallet,
      mint,
      toWallet
    );
    
    // Transfer tokens
    const transferAmount = amount * Math.pow(10, TOKEN_CONFIG.decimals);
    
    const signature = await transfer(
      connection,
      fromWallet,
      fromTokenAccount.address,
      toTokenAccount.address,
      fromWallet,
      transferAmount
    );
    
    return signature;
  } catch (error) {
    console.error('Transfer error:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  createNFTSolToken()
    .then(() => {
      console.log('🎉 $NFTSOL Token creation completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Token creation failed:', error);
      process.exit(1);
    });
}

export { createNFTSolToken, TOKEN_CONFIG };
