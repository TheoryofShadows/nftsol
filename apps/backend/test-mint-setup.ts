/**
 * Test script to check NFT minting setup
 * Run with: npx ts-node test-mint-setup.ts
 */

// Load environment variables
import * as dotenv from 'dotenv';
import * as path from 'path';

// Try loading .env from multiple locations
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });
dotenv.config(); // Also try default location

import { getPlatformKeypair } from './src/lib/platformKeypair';
import { getWalletBalance, connection } from './src/lib/solana';
import { ensurePlatformBalance } from './src/lib/checkBalance';

async function testMintSetup() {
  console.log('🔍 Testing NFT Minting Setup...\n');

  try {
    // 1. Check platform keypair
    console.log('1️⃣ Checking platform keypair...');
    const keypair = getPlatformKeypair();
    console.log(`   ✅ Platform wallet: ${keypair.publicKey.toBase58()}\n`);

    // 2. Check platform wallet balance
    console.log('2️⃣ Checking platform wallet balance...');
    const balance = await getWalletBalance(keypair.publicKey.toBase58());
    console.log(`   Balance: ${balance.toFixed(4)} SOL`);
    
    if (balance < 0.02) {
      console.log(`   ⚠️  WARNING: Balance is below minimum (0.02 SOL)`);
      console.log(`   💡 You need to fund this wallet before minting NFTs`);
      console.log(`   📍 Wallet address: ${keypair.publicKey.toBase58()}\n`);
    } else {
      console.log(`   ✅ Balance is sufficient for minting\n`);
    }

    // 3. Check RPC connection
    console.log('3️⃣ Checking RPC connection...');
    const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
    console.log(`   RPC URL: ${rpcUrl}`);
    
    try {
      const blockhash = await connection.getLatestBlockhash('confirmed');
      console.log(`   ✅ RPC connection working`);
      console.log(`   Latest blockhash: ${blockhash.blockhash.slice(0, 16)}...\n`);
    } catch (error) {
      console.log(`   ❌ RPC connection failed: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
      return;
    }

    // 4. Test balance check function
    console.log('4️⃣ Testing balance check function...');
    try {
      const checkedBalance = await ensurePlatformBalance(0.02);
      console.log(`   ✅ Balance check passed: ${checkedBalance.toFixed(4)} SOL\n`);
    } catch (error) {
      console.log(`   ❌ Balance check failed: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
      return;
    }

    // 5. Summary
    console.log('📊 Summary:');
    console.log(`   Platform Wallet: ${keypair.publicKey.toBase58()}`);
    console.log(`   Balance: ${balance.toFixed(4)} SOL`);
    console.log(`   Network: ${process.env.SOLANA_CLUSTER || 'mainnet-beta'}`);
    console.log(`   RPC: ${rpcUrl}`);
    console.log(`   Can Mint: ${balance >= 0.02 ? '✅ YES' : '❌ NO (need more SOL)'}\n`);

    if (balance >= 0.02) {
      console.log('🎉 Setup looks good! You should be able to mint NFTs.');
    } else {
      console.log('⚠️  Setup incomplete. Fund the platform wallet to enable minting.');
    }

  } catch (error) {
    console.error('\n❌ Error during setup check:', error);
    if (error instanceof Error) {
      console.error('   Message:', error.message);
      if (error.message.includes('PLATFORM_KEYPAIR') || error.message.includes('PLATFORM_SECRET_KEY')) {
        console.error('\n💡 Solution: Set PLATFORM_SECRET_KEY_BASE58 or PLATFORM_KEYPAIR environment variable');
      }
    }
  }
}

// Run the test
testMintSetup().catch(console.error);

