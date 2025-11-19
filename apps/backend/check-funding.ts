/**
 * Check platform wallet funding status and provide funding instructions
 * Run with: npx ts-node check-funding.ts
 */

// Load environment variables
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });
dotenv.config();

import { getPlatformKeypair } from './src/lib/platformKeypair';
import { getWalletBalance, connection } from './src/lib/solana';

async function checkFunding() {
  console.log('💰 Platform Wallet Funding Check\n');
  console.log('=' .repeat(60));

  try {
    const keypair = getPlatformKeypair();
    const walletAddress = keypair.publicKey.toBase58();
    const network = process.env.SOLANA_CLUSTER || 'mainnet-beta';
    const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';

    console.log(`\n📍 Wallet Address: ${walletAddress}`);
    console.log(`🌐 Network: ${network}`);
    console.log(`🔗 RPC: ${rpcUrl}\n`);

    // Check balance
    console.log('⏳ Checking balance...');
    const balance = await getWalletBalance(walletAddress);
    const balanceFormatted = balance.toFixed(4);
    const minimumRequired = 0.02;
    const recommended = 0.1;

    console.log(`\n💵 Current Balance: ${balanceFormatted} SOL`);
    console.log(`📊 Minimum Required: ${minimumRequired} SOL (for 1 mint)`);
    console.log(`💡 Recommended: ${recommended} SOL (for ~5 mints)\n`);

    if (balance >= minimumRequired) {
      console.log('✅ SUFFICIENT FUNDS - Ready to mint NFTs!\n');
      console.log(`You have ${balanceFormatted} SOL, which is enough for minting.`);
      return;
    }

    // Calculate needed amount
    const needed = Math.max(0, minimumRequired - balance);
    const recommendedNeeded = Math.max(0, recommended - balance);

    console.log('⚠️  INSUFFICIENT FUNDS - Wallet needs funding\n');
    console.log(`❌ Current: ${balanceFormatted} SOL`);
    console.log(`📉 Need: ${needed.toFixed(4)} SOL (minimum)`);
    console.log(`💡 Recommended: ${recommendedNeeded.toFixed(4)} SOL (for multiple mints)\n`);

    console.log('=' .repeat(60));
    console.log('📝 FUNDING INSTRUCTIONS\n');

    if (network === 'devnet') {
      console.log('🔵 DEVNET FUNDING (Free Test SOL):\n');
      console.log('Option 1: Solana Faucet (Easiest)');
      console.log(`   1. Visit: https://faucet.solana.com/`);
      console.log(`   2. Enter wallet: ${walletAddress}`);
      console.log(`   3. Select "Devnet"`);
      console.log(`   4. Request airdrop\n`);

      console.log('Option 2: Command Line');
      console.log(`   solana airdrop 2 ${walletAddress} --url devnet\n`);

      console.log('Option 3: Transfer from another devnet wallet');
      console.log(`   solana transfer ${walletAddress} 0.1 --from <your-devnet-wallet> --url devnet\n`);
    } else {
      console.log('🟢 MAINNET FUNDING (Real SOL Required):\n');
      console.log('⚠️  WARNING: This requires REAL SOL tokens!\n');

      console.log('Option 1: Transfer from Phantom/Solflare Wallet');
      console.log(`   1. Open your Phantom or Solflare wallet`);
      console.log(`   2. Click "Send"`);
      console.log(`   3. Paste address: ${walletAddress}`);
      console.log(`   4. Send at least ${recommended.toFixed(4)} SOL (${recommendedNeeded.toFixed(4)} SOL needed)`);
      console.log(`   5. Wait for confirmation (~30 seconds)\n`);

      console.log('Option 2: Transfer from Exchange');
      console.log(`   1. Log into your exchange (Coinbase, Binance, etc.)`);
      console.log(`   2. Withdraw SOL to: ${walletAddress}`);
      console.log(`   3. Send at least ${recommended.toFixed(4)} SOL\n`);

      console.log('Option 3: Command Line (if you have SOL CLI)');
      console.log(`   solana transfer ${walletAddress} ${recommended.toFixed(4)} --from <your-mainnet-wallet>\n`);

      console.log('💡 Cost Estimate:');
      console.log(`   - Minimum (${minimumRequired} SOL): ~$${(minimumRequired * 150).toFixed(2)} USD`);
      console.log(`   - Recommended (${recommended} SOL): ~$${(recommended * 150).toFixed(2)} USD`);
      console.log(`   (Based on ~$150/SOL, check current price)\n`);
    }

    console.log('=' .repeat(60));
    console.log('✅ After Funding:\n');
    console.log('1. Wait 30-60 seconds for transaction confirmation');
    console.log('2. Run this script again to verify:');
    console.log('   npx ts-node check-funding.ts');
    console.log('3. Once funded, test minting:');
    console.log('   npx ts-node test-mint.ts <your-wallet> "Test NFT"\n');

    // Check if RPC is working
    try {
      await connection.getLatestBlockhash('confirmed');
      console.log('✅ RPC connection is working - ready to receive funds\n');
    } catch (error) {
      console.log('⚠️  RPC connection issue - check SOLANA_RPC_URL\n');
    }

  } catch (error) {
    console.error('\n❌ Error checking funding status:', error);
    if (error instanceof Error) {
      console.error('Message:', error.message);
      if (error.message.includes('PLATFORM_KEYPAIR') || error.message.includes('PLATFORM_SECRET_KEY')) {
        console.error('\n💡 Solution: Set PLATFORM_SECRET_KEY_BASE58 environment variable');
      }
    }
  }
}

checkFunding().catch(console.error);

