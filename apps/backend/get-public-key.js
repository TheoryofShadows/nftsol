const { Keypair } = require('@solana/web3.js');
const bs58 = require('bs58');
const fs = require('fs');

// Read .env
const envContent = fs.readFileSync('.env', 'utf-8');
const match = envContent.match(/PLATFORM_SECRET_KEY_BASE58=(.+)/);

if (!match) {
  console.error('❌ PLATFORM_SECRET_KEY_BASE58 not found in .env');
  process.exit(1);
}

const secretKey = match[1].trim();

// Derive public key
const keypair = Keypair.fromSecretKey(bs58.decode(secretKey));
const publicKey = keypair.publicKey.toBase58();

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Your Platform Public Key:');
console.log(publicKey);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
