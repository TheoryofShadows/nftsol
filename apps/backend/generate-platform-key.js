const { Keypair } = require('@solana/web3.js');
const bs58 = require('bs58');
const fs = require('fs');
const path = require('path');

console.log('🔑 Generating Platform Keypair...\n');

const keypair = Keypair.generate();
const publicKey = keypair.publicKey.toBase58();
const base58Secret = bs58.encode(keypair.secretKey);

const keypairPath = path.join(__dirname, 'platform-keypair.json');
fs.writeFileSync(keypairPath, JSON.stringify(Array.from(keypair.secretKey)));

console.log('✅ Platform Keypair Generated!');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Public Key:', publicKey);
console.log('Base58 Secret:', base58Secret);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('\n📝 Add this to your .env file:');
console.log('PLATFORM_SECRET_KEY_BASE58=' + base58Secret);
console.log('\n⚠️  Keep this key SECRET! Never commit it to git!');
console.log('   The platform-keypair.json file should be in .gitignore');