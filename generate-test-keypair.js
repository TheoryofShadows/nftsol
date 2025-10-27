/**
 * Generate a test keypair for Bubblegum testing
 */

const { Keypair } = require('@solana/web3.js');
const bs58 = require('bs58');

// Generate a new keypair
const keypair = Keypair.generate();

console.log('🔑 Generated test keypair for Bubblegum:');
console.log('=========================================');
console.log(`Public Key: ${keypair.publicKey.toString()}`);
console.log(`Private Key (base58): ${bs58.encode(keypair.secretKey)}`);
console.log('');
console.log('Add this to your backend.env file:');
console.log(`BUBBLEGUM_PRIVATE_KEY=${bs58.encode(keypair.secretKey)}`);
console.log('');
console.log('⚠️  This is a test keypair - fund it with devnet SOL for testing:');
console.log(`   Wallet: ${keypair.publicKey.toString()}`);
console.log('   Get devnet SOL from: https://faucet.solana.com/');
