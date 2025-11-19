/**
 * Full test on devnet - no waiting, just test!
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Force devnet
process.env.SOLANA_CLUSTER = 'devnet';
process.env.SOLANA_RPC_URL = 'https://api.devnet.solana.com';

dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });
dotenv.config();

// Override to devnet
process.env.SOLANA_CLUSTER = 'devnet';
process.env.SOLANA_RPC_URL = 'https://api.devnet.solana.com';

import { getPlatformKeypair } from './src/lib/platformKeypair';
import { getWalletBalance, connection, mintNFT } from './src/lib/solana';

async function runFullTest() {
  console.log('🧪 FULL NFT MINTING TEST - DEVNET\n');
  console.log('='.repeat(60));

  try {
    const keypair = getPlatformKeypair();
    const wallet = keypair.publicKey.toBase58();
    
    console.log(`\n1️⃣ Platform Wallet: ${wallet}`);
    console.log(`2️⃣ Network: DEVNET`);
    console.log(`3️⃣ RPC: https://api.devnet.solana.com\n`);

    // Check balance
    console.log('⏳ Checking balance...');
    const balance = await getWalletBalance(wallet);
    console.log(`   Balance: ${balance.toFixed(4)} SOL\n`);

    if (balance < 0.02) {
      console.log('❌ Insufficient balance on devnet');
      return;
    }

    // Test RPC
    console.log('⏳ Testing RPC connection...');
    await connection.getLatestBlockhash('confirmed');
    console.log('   ✅ RPC OK\n');

    // MINT!
    console.log('⏳ Minting test NFT...');
    const testName = `NFTSol Test ${Date.now()}`;
    const result = await mintNFT(wallet, `https://nftsol.app/test/${Date.now()}`, testName, 'Full system test');

    if (result.success) {
      console.log('\n✅ SUCCESS!\n');
      console.log(`Mint: ${result.mintAddress}`);
      console.log(`Tx: ${result.txSig}`);
      console.log(`\n🔗 https://explorer.solana.com/tx/${result.txSig}?cluster=devnet\n`);
      console.log('✅ EVERYTHING WORKS!\n');
    } else {
      console.log(`\n❌ Failed: ${result.error}\n`);
    }

  } catch (error) {
    console.error('\n❌ Error:', error);
  }
}

runFullTest().catch(console.error);

