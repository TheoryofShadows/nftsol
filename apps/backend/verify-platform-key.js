const { Keypair } = require('@solana/web3.js');
const bs58 = require('bs58');

// Your secret key from .env
const secretKeyBase58 = '345FDNvMFEoVjhs2mTYPrBJDLGNPJWD8p4EkA9kjpasTMxqwXwERZ7fHofRjkwWjes7ccKbzPGh8JnQ9wnyzSobn';
const expectedPublicKey = 'D5s9G8JBTBDENiozN5ZhgozQoZbb9iuzbtM5yZ6EEVmr';

console.log('🔍 Verifying Platform Keypair...\n');

try {
  // Decode base58 secret key (same way your backend does it)
  const secretBytes = bs58.decode(secretKeyBase58);
  
  // Create keypair from secret key
  const keypair = Keypair.fromSecretKey(Uint8Array.from(secretBytes));
  
  // Get the public key
  const actualPublicKey = keypair.publicKey.toBase58();
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Expected Public Key:', expectedPublicKey);
  console.log('Actual Public Key:  ', actualPublicKey);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  if (actualPublicKey === expectedPublicKey) {
    console.log('\n✅ VERIFIED! Public key matches secret key!');
    console.log('   Your platform keypair is correctly configured.');
  } else {
    console.log('\n❌ MISMATCH! Public key does not match secret key!');
    console.log('   The secret key in your .env may be incorrect.');
    console.log('   Please regenerate the keypair.');
  }
  
  // Also verify the secret key length
  console.log('\nAdditional Verification:');
  console.log('Secret key length:', secretKeyBase58.length, 'characters');
  console.log('Secret key bytes:', secretBytes.length, 'bytes');
  console.log('   (Expected: 64 bytes for Solana keypair)');
  
  if (secretBytes.length === 64) {
    console.log('✅ Secret key format is correct (64 bytes)');
  } else {
    console.log('⚠️  Secret key format may be incorrect');
  }
  
} catch (error) {
  console.error('\n❌ Error verifying keypair:', error.message);
  console.error('   Make sure the secret key is valid base58 format.');
}
