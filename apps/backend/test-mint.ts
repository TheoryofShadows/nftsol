/**
 * Test NFT minting functionality
 * Run with: npx ts-node test-mint.ts <wallet-address> <nft-name>
 */

// Load environment variables
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });
dotenv.config();

import { mintNFT } from './src/lib/solana';
import { getPlatformKeypair } from './src/lib/platformKeypair';

async function testMint() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Usage: npx ts-node test-mint.ts <wallet-address> <nft-name>');
    console.log('Example: npx ts-node test-mint.ts 3XEs3MJ8PFiqTTqrK6RAkK9vt95jQQ1hKNNKHiE6jJ3o "Test NFT"');
    process.exit(1);
  }

  const [toAddress, name] = args;
  const description = args[2] || `Test NFT minted on ${new Date().toISOString()}`;
  const metadataUri = `https://nftsol.app/metadata/${Date.now()}`;

  console.log('🧪 Testing NFT Minting...\n');
  console.log(`To Address: ${toAddress}`);
  console.log(`Name: ${name}`);
  console.log(`Description: ${description}`);
  console.log(`Metadata URI: ${metadataUri}\n`);

  const keypair = getPlatformKeypair();
  console.log(`Platform Wallet: ${keypair.publicKey.toBase58()}`);
  console.log(`Network: ${process.env.SOLANA_CLUSTER || 'mainnet-beta'}`);
  console.log(`RPC: ${process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'}\n`);

  try {
    console.log('⏳ Minting NFT...');
    const result = await mintNFT(toAddress, metadataUri, name, description);

    if (result.success) {
      console.log('\n✅ SUCCESS! NFT Minted!\n');
      console.log(`Mint Address: ${result.mintAddress}`);
      console.log(`Transaction Signature: ${result.txSig}`);
      console.log(`\n🔗 View on Solana Explorer:`);
      const explorerUrl = process.env.SOLANA_CLUSTER === 'devnet' 
        ? `https://explorer.solana.com/tx/${result.txSig}?cluster=devnet`
        : `https://explorer.solana.com/tx/${result.txSig}`;
      console.log(explorerUrl);
    } else {
      console.log('\n❌ FAILED to mint NFT\n');
      console.log(`Error: ${result.error}`);
      if (result.details) {
        console.log(`Details:`, JSON.stringify(result.details, null, 2));
      }
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Error during mint:', error);
    if (error instanceof Error) {
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

testMint().catch(console.error);

