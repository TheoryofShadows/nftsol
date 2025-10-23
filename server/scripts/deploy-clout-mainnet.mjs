#!/usr/bin/env node

/**
 * 🪙 CLOUT Token Mainnet Deployment Script
 * Deploy the real CLOUT utility token to Solana mainnet
 */

import { 
  Connection, 
  Keypair, 
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL
} from '@solana/web3.js';
import {
  createMint,
  createAccount,
  mintTo,
  getOrCreateAssociatedTokenAccount,
  setAuthority,
  AuthorityType,
  createInitializeMintInstruction,
  TOKEN_PROGRAM_ID,
  MINT_SIZE,
  getMinimumBalanceForRentExemptMint,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  createMintToInstruction,
  createSetAuthorityInstruction
} from '@solana/spl-token';
import { createHash } from 'crypto';
import fs from 'fs';
import path from 'path';

// Configuration
const RPC_URL = process.env.HELIUS_RPC_URL || 'https://api.mainnet-beta.solana.com';
const connection = new Connection(RPC_URL, 'confirmed');

// Platform wallet addresses
const PLATFORM_WALLETS = {
  treasury: 'J9msWkhEUPMLBXzkycwZjuU6B5vjfvNguASHLxJKAAfh',
  feeCollector: '5Gu3RnFApFEDmMJj5czHTFPRf6A5xNypSRPrqewmPLHW',
  developer: '7pRUDnHS1y3b7EycVm7xtV2MgBArKFcAnFpdZCMPvLio'
};

// CLOUT Token Configuration
const CLOUT_CONFIG = {
  name: 'CLOUT Token',
  symbol: 'CLOUT',
  decimals: 9,
  totalSupply: 1000000000, // 1 billion CLOUT
  description: 'The revolutionary utility token powering the NFTSol ecosystem',
  image: 'https://nftsol.app/clout-token.png',
  website: 'https://nftsol.app',
  twitter: 'https://twitter.com/nftsol',
  discord: 'https://discord.gg/nftsol'
};

// Distribution percentages
const DISTRIBUTION = {
  treasury: 50,      // 50% - Platform operations
  userRewards: 30,   // 30% - Distributed to users over time
  developer: 10,     // 10% - Developer allocation
  community: 10      // 10% - Community features
};

async function generateKeypair() {
  const keypair = Keypair.generate();
  console.log(`🔑 Generated new keypair: ${keypair.publicKey.toString()}`);
  return keypair;
}

async function createTokenMint() {
  console.log('🪙 Creating CLOUT token mint...');
  
  const payer = await generateKeypair();
  const mint = await generateKeypair();
  
  // Get rent exemption amount
  const rentExemption = await getMinimumBalanceForRentExemptMint(connection);
  
  // Create mint account
  const createMintAccountIx = SystemProgram.createAccount({
    fromPubkey: payer.publicKey,
    newAccountPubkey: mint.publicKey,
    space: MINT_SIZE,
    lamports: rentExemption,
    programId: TOKEN_PROGRAM_ID,
  });
  
  // Initialize mint
  const initMintIx = createInitializeMintInstruction(
    mint.publicKey,
    CLOUT_CONFIG.decimals,
    payer.publicKey,
    payer.publicKey // Freeze authority
  );
  
  const transaction = new Transaction()
    .add(createMintAccountIx)
    .add(initMintIx);
  
  try {
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [payer, mint],
      { commitment: 'confirmed' }
    );
    
    console.log(`✅ CLOUT token mint created: ${mint.publicKey.toString()}`);
    console.log(`📝 Transaction: ${signature}`);
    
    return {
      mint: mint.publicKey.toString(),
      payer: payer.publicKey.toString(),
      signature
    };
  } catch (error) {
    console.error('❌ Failed to create token mint:', error);
    throw error;
  }
}

async function createTokenAccounts(mintAddress) {
  console.log('🏦 Creating token accounts for platform wallets...');
  
  const mint = new PublicKey(mintAddress);
  const accounts = {};
  
  for (const [name, walletAddress] of Object.entries(PLATFORM_WALLETS)) {
    try {
      const wallet = new PublicKey(walletAddress);
      const tokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        wallet, // Payer (will be the wallet owner)
        mint,
        wallet // Owner
      );
      
      accounts[name] = {
        wallet: walletAddress,
        tokenAccount: tokenAccount.address.toString()
      };
      
      console.log(`✅ Created token account for ${name}: ${tokenAccount.address.toString()}`);
    } catch (error) {
      console.error(`❌ Failed to create token account for ${name}:`, error);
    }
  }
  
  return accounts;
}

async function distributeInitialSupply(mintAddress, accounts) {
  console.log('💰 Distributing initial CLOUT supply...');
  
  const mint = new PublicKey(mintAddress);
  const totalSupply = CLOUT_CONFIG.totalSupply * Math.pow(10, CLOUT_CONFIG.decimals);
  
  // Calculate distribution amounts
  const treasuryAmount = Math.floor(totalSupply * DISTRIBUTION.treasury / 100);
  const developerAmount = Math.floor(totalSupply * DISTRIBUTION.developer / 100);
  const userRewardsAmount = Math.floor(totalSupply * DISTRIBUTION.userRewards / 100);
  const communityAmount = Math.floor(totalSupply * DISTRIBUTION.community / 100);
  
  console.log(`📊 Distribution amounts:`);
  console.log(`   Treasury: ${treasuryAmount / Math.pow(10, CLOUT_CONFIG.decimals)} CLOUT`);
  console.log(`   Developer: ${developerAmount / Math.pow(10, CLOUT_CONFIG.decimals)} CLOUT`);
  console.log(`   User Rewards: ${userRewardsAmount / Math.pow(10, CLOUT_CONFIG.decimals)} CLOUT`);
  console.log(`   Community: ${communityAmount / Math.pow(10, CLOUT_CONFIG.decimals)} CLOUT`);
  
  // Note: In a real deployment, you would need the mint authority private key
  // to mint tokens. This is a demonstration of the structure.
  
  return {
    treasury: treasuryAmount,
    developer: developerAmount,
    userRewards: userRewardsAmount,
    community: communityAmount
  };
}

async function createMetadata(mintAddress) {
  console.log('📝 Creating CLOUT token metadata...');
  
  const metadata = {
    name: CLOUT_CONFIG.name,
    symbol: CLOUT_CONFIG.symbol,
    description: CLOUT_CONFIG.description,
    image: CLOUT_CONFIG.image,
    external_url: CLOUT_CONFIG.website,
    attributes: [
      {
        trait_type: 'Token Type',
        value: 'Utility Token'
      },
      {
        trait_type: 'Platform',
        value: 'NFTSol'
      },
      {
        trait_type: 'Utility',
        value: 'Fee Reduction, Governance, Staking'
      }
    ],
    properties: {
      files: [
        {
          uri: CLOUT_CONFIG.image,
          type: 'image/png'
        }
      ],
      category: 'image',
      creators: [
        {
          address: PLATFORM_WALLETS.developer,
          share: 100
        }
      ]
    }
  };
  
  return metadata;
}

async function saveDeploymentInfo(mintAddress, accounts, distribution, metadata) {
  console.log('💾 Saving deployment information...');
  
  const deploymentInfo = {
    mint: mintAddress,
    metadata: metadata,
    accounts: accounts,
    distribution: distribution,
    config: CLOUT_CONFIG,
    deployedAt: new Date().toISOString(),
    network: 'mainnet-beta',
    rpcUrl: RPC_URL,
    platformWallets: PLATFORM_WALLETS
  };
  
  const filePath = path.join(process.cwd(), 'clout-mainnet-deployment.json');
  fs.writeFileSync(filePath, JSON.stringify(deploymentInfo, null, 2));
  
  console.log(`✅ Deployment info saved to: ${filePath}`);
  return deploymentInfo;
}

async function main() {
  try {
    console.log('🚀 Starting CLOUT Token Mainnet Deployment...');
    console.log(`🌐 RPC URL: ${RPC_URL}`);
    console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
    
    // Step 1: Create token mint
    const mintResult = await createTokenMint();
    
    // Step 2: Create token accounts
    const accounts = await createTokenAccounts(mintResult.mint);
    
    // Step 3: Distribute initial supply
    const distribution = await distributeInitialSupply(mintResult.mint, accounts);
    
    // Step 4: Create metadata
    const metadata = await createMetadata(mintResult.mint);
    
    // Step 5: Save deployment info
    const deploymentInfo = await saveDeploymentInfo(
      mintResult.mint,
      accounts,
      distribution,
      metadata
    );
    
    console.log('\n🎉 CLOUT Token Deployment Complete!');
    console.log('='.repeat(50));
    console.log(`🪙 Token Mint: ${mintResult.mint}`);
    console.log(`🏦 Treasury Account: ${accounts.treasury?.tokenAccount}`);
    console.log(`💰 Developer Account: ${accounts.developer?.tokenAccount}`);
    console.log(`📊 Total Supply: ${CLOUT_CONFIG.totalSupply.toLocaleString()} CLOUT`);
    console.log(`🌐 Network: mainnet-beta`);
    console.log('='.repeat(50));
    
    console.log('\n📋 Next Steps:');
    console.log('1. Update environment variables with new mint address');
    console.log('2. Deploy updated backend to Render');
    console.log('3. Test CLOUT token functionality');
    console.log('4. Implement staking and governance features');
    
  } catch (error) {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  }
}

// Run deployment
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main as deployCloutToken };
