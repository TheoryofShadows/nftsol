/**
 * Quick one-time balance check
 * Run with: npx ts-node quick-check.ts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });
dotenv.config();

import { getPlatformKeypair } from './src/lib/platformKeypair';
import { getWalletBalance } from './src/lib/solana';

async function quickCheck() {
  const keypair = getPlatformKeypair();
  const wallet = keypair.publicKey.toBase58();
  const balance = await getWalletBalance(wallet);
  const minimum = 0.02;
  
  console.log(`\n💰 Quick Balance Check\n`);
  console.log(`Wallet: ${wallet}`);
  console.log(`Balance: ${balance.toFixed(4)} SOL`);
  console.log(`Required: ${minimum} SOL`);
  console.log(`Status: ${balance >= minimum ? '✅ READY' : '⏳ NEEDS FUNDING'}\n`);
  
  if (balance >= minimum) {
    console.log('✅ Ready to mint! Run: npx ts-node test-mint.ts <wallet> "NFT Name"\n');
  } else {
    console.log(`💡 Send ${(minimum - balance).toFixed(4)} more SOL to fund the wallet\n`);
  }
}

quickCheck().catch(console.error);


