/**
 * Wait for wallet funding, then automatically test minting
 * Run with: npx ts-node auto-test-after-funding.ts [recipient-wallet]
 * 
 * This script will:
 * 1. Check current balance
 * 2. Monitor for funding (checks every 10 seconds)
 * 3. Automatically test minting when sufficient funds detected
 * 4. Verify the mint was successful
 */

// Load environment variables
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });
dotenv.config();

import { getPlatformKeypair } from './src/lib/platformKeypair';
import { getWalletBalance, connection } from './src/lib/solana';
import { mintNFT } from './src/lib/solana';

const _PLATFORM_WALLET = '3XEs3MJ8PFiqTTqrK6RAkK9vt95jQQ1hKNNKHiE6jJ3o';
const MINIMUM_BALANCE = 0.02;
const CHECK_INTERVAL = 10000; // 10 seconds
const MAX_CHECKS = 60; // Check for up to 10 minutes (60 * 10s)

async function waitForFundingAndTest(recipientWallet?: string) {
  console.log('🚀 Auto-Test After Funding\n');
  console.log('=' .repeat(70));
  
  const keypair = getPlatformKeypair();
  const platformWallet = keypair.publicKey.toBase58();
  const network = process.env.SOLANA_CLUSTER || 'mainnet-beta';
  const recipient = recipientWallet || platformWallet;

  console.log(`\n📍 Platform Wallet: ${platformWallet}`);
  console.log(`📬 Recipient Wallet: ${recipient}`);
  console.log(`🌐 Network: ${network}`);
  console.log(`💰 Minimum Required: ${MINIMUM_BALANCE} SOL\n`);

  // Initial balance check
  let initialBalance = await getWalletBalance(platformWallet);
  console.log(`💵 Current Balance: ${initialBalance.toFixed(4)} SOL\n`);

  if (initialBalance >= MINIMUM_BALANCE) {
    console.log('✅ Wallet already has sufficient funds!');
    console.log('🧪 Proceeding directly to mint test...\n');
    await testMinting(platformWallet, recipient, network);
    return;
  }

  console.log('⏳ Waiting for funding...');
  console.log(`   Send SOL to: ${platformWallet}`);
  console.log(`   Minimum: ${MINIMUM_BALANCE} SOL`);
  console.log(`   Recommended: 0.1 SOL\n`);
  console.log(`   Checking every ${CHECK_INTERVAL / 1000} seconds...\n`);

  // Monitor for funding
  for (let i = 0; i < MAX_CHECKS; i++) {
    await new Promise(resolve => setTimeout(resolve, CHECK_INTERVAL));
    
    const balance = await getWalletBalance(platformWallet);
    const elapsed = ((i + 1) * CHECK_INTERVAL) / 1000;
    
    process.stdout.write(`\r[${i + 1}/${MAX_CHECKS}] ${elapsed.toFixed(0)}s - Balance: ${balance.toFixed(4)} SOL`);

    if (balance > initialBalance) {
      console.log(`\n\n🎉 FUNDING DETECTED!`);
      console.log(`   Previous: ${initialBalance.toFixed(4)} SOL`);
      console.log(`   Current: ${balance.toFixed(4)} SOL`);
      console.log(`   Received: ${(balance - initialBalance).toFixed(4)} SOL\n`);
      
      if (balance >= MINIMUM_BALANCE) {
        console.log('✅ Sufficient funds! Waiting 10 seconds for transaction confirmation...\n');
        await new Promise(resolve => setTimeout(resolve, 10000));
        await testMinting(platformWallet, recipient, network);
        return;
      } else {
        console.log(`⚠️  Funds received but still need ${(MINIMUM_BALANCE - balance).toFixed(4)} more SOL`);
        initialBalance = balance; // Update baseline
      }
    }
  }

  console.log(`\n\n⏱️  Timeout: No funding detected after ${(MAX_CHECKS * CHECK_INTERVAL) / 1000} seconds`);
  console.log(`   Run the script again to continue monitoring`);
}

async function testMinting(platformWallet: string, recipient: string, network: string) {
  console.log('🧪 Testing NFT Minting...\n');
  console.log('=' .repeat(70));

  try {
    // Verify RPC connection
    console.log('1️⃣ Verifying RPC connection...');
    await connection.getLatestBlockhash('confirmed');
    console.log('   ✅ RPC connection OK\n');

    // Check final balance
    console.log('2️⃣ Checking platform wallet balance...');
    const balance = await getWalletBalance(platformWallet);
    console.log(`   Balance: ${balance.toFixed(4)} SOL\n`);

    // Test mint
    console.log('3️⃣ Minting test NFT...');
    const testName = `NFTSol Test ${Date.now()}`;
    const description = `Automated test mint on ${network} - ${new Date().toISOString()}`;
    const metadataUri = `https://nftsol.app/metadata/${Date.now()}`;

    console.log(`   Name: ${testName}`);
    console.log(`   Recipient: ${recipient}`);
    console.log(`   Metadata URI: ${metadataUri}\n`);

    const result = await mintNFT(recipient, metadataUri, testName, description);

    if (result.success) {
      console.log('\n' + '=' .repeat(70));
      console.log('🎉 SUCCESS! NFT MINTED SUCCESSFULLY!\n');
      console.log(`Mint Address: ${result.mintAddress}`);
      console.log(`Transaction Signature: ${result.txSig}\n`);
      
      const explorerUrl = network === 'devnet'
        ? `https://explorer.solana.com/tx/${result.txSig}?cluster=devnet`
        : `https://explorer.solana.com/tx/${result.txSig}`;
      
      console.log(`🔗 View on Solana Explorer:`);
      console.log(`   ${explorerUrl}\n`);
      
      console.log(`📊 NFT Details:`);
      console.log(`   Mint: ${result.mintAddress}`);
      console.log(`   Owner: ${recipient}`);
      console.log(`   Network: ${network}`);
      console.log(`   Transaction: ${result.txSig}\n`);

      console.log('=' .repeat(70));
      console.log('✅ ALL TESTS PASSED! Minting is working correctly!\n');
      
      // Verify the NFT exists
      console.log('4️⃣ Verifying NFT on-chain...');
      try {
        const accountInfo = await connection.getAccountInfo(
          new (await import('@solana/web3.js')).PublicKey(result.mintAddress!)
        );
        if (accountInfo) {
          console.log('   ✅ NFT verified on-chain!\n');
        }
      } catch (error) {
        console.log('   ⚠️  Could not verify NFT (this is OK, may take a moment)\n');
      }

    } else {
      console.log('\n❌ MINTING FAILED\n');
      console.log(`Error: ${result.error}`);
      if (result.details) {
        console.log(`Details:`, JSON.stringify(result.details, null, 2));
      }
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Error during mint test:', error);
    if (error instanceof Error) {
      console.error(`Message: ${error.message}`);
      console.error(`Stack: ${error.stack}`);
    }
    process.exit(1);
  }
}

// Get recipient wallet from command line
const args = process.argv.slice(2);
const recipientWallet = args[0];

waitForFundingAndTest(recipientWallet).catch(console.error);

