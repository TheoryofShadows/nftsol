/**
 * Monitor platform wallet balance and automatically test minting when funded
 * Run with: npx ts-node monitor-and-test.ts [test-wallet-address]
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

async function monitorAndTest(testWalletAddress?: string) {
  console.log('🔍 Monitoring Platform Wallet & Testing Minting\n');
  console.log('=' .repeat(60));

  const keypair = getPlatformKeypair();
  const platformWallet = keypair.publicKey.toBase58();
  const network = process.env.SOLANA_CLUSTER || 'mainnet-beta';
  const minimumRequired = 0.02;

  // Use provided wallet or platform wallet as recipient
  const recipientWallet = testWalletAddress || platformWallet;

  console.log(`Platform Wallet: ${platformWallet}`);
  console.log(`Recipient Wallet: ${recipientWallet}`);
  console.log(`Network: ${network}\n`);

  let checkCount = 0;
  const maxChecks = 20; // Check up to 20 times
  const checkInterval = 10000; // Check every 10 seconds

  while (checkCount < maxChecks) {
    checkCount++;
    console.log(`\n[Check ${checkCount}/${maxChecks}] ${new Date().toLocaleTimeString()}`);

    try {
      // Check balance
      const balance = await getWalletBalance(platformWallet);
      console.log(`   Balance: ${balance.toFixed(4)} SOL`);

      if (balance >= minimumRequired) {
        console.log(`\n✅ SUFFICIENT FUNDS DETECTED!`);
        console.log(`   Balance: ${balance.toFixed(4)} SOL`);
        console.log(`   Minimum required: ${minimumRequired} SOL\n`);

        // Test RPC connection
        console.log('⏳ Verifying RPC connection...');
        try {
          await connection.getLatestBlockhash('confirmed');
          console.log('✅ RPC connection OK\n');
        } catch (error) {
          console.log('❌ RPC connection failed - aborting test');
          return;
        }

        // Test minting
        console.log('🧪 Testing NFT minting...');
        const testName = `Auto-Test NFT ${Date.now()}`;
        const metadataUri = `https://nftsol.app/metadata/${Date.now()}`;

        const result = await mintNFT(recipientWallet, metadataUri, testName, 'Automated test mint');

        if (result.success) {
          console.log('\n🎉 SUCCESS! NFT Minted Successfully!\n');
          console.log(`Mint Address: ${result.mintAddress}`);
          console.log(`Transaction: ${result.txSig}`);
          console.log(`\n🔗 View on Explorer:`);
          const explorerUrl = network === 'devnet'
            ? `https://explorer.solana.com/tx/${result.txSig}?cluster=devnet`
            : `https://explorer.solana.com/tx/${result.txSig}`;
          console.log(explorerUrl);
          console.log('\n✅ Minting is working correctly!');
          return;
        } else {
          console.log('\n❌ Minting failed:');
          console.log(`Error: ${result.error}`);
          if (result.details) {
            console.log(`Details:`, JSON.stringify(result.details, null, 2));
          }
          return;
        }
      } else {
        const needed = minimumRequired - balance;
        console.log(`   ⏳ Waiting for funding... (need ${needed.toFixed(4)} more SOL)`);
        
        if (checkCount === 1) {
          console.log(`\n💡 To fund: Send SOL to ${platformWallet}`);
          console.log(`   Minimum: ${minimumRequired} SOL`);
          console.log(`   Recommended: 0.1 SOL\n`);
        }
      }
    } catch (error) {
      console.error(`\n❌ Error during check:`, error);
      if (error instanceof Error) {
        console.error(`Message: ${error.message}`);
      }
    }

    // Wait before next check (except on last iteration)
    if (checkCount < maxChecks) {
      console.log(`   ⏳ Waiting ${checkInterval / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, checkInterval));
    }
  }

  console.log(`\n⏱️  Monitoring stopped after ${maxChecks} checks`);
  console.log(`   Run again to continue monitoring`);
}

// Get test wallet from command line args
const args = process.argv.slice(2);
const testWallet = args[0];

monitorAndTest(testWallet).catch(console.error);

