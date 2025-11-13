const { Keypair } = require('@solana/web3.js');
const fs = require('fs');
const path = require('path');

// Generate a new keypair
const keypair = Keypair.generate();

// Get the secret key in base58 format
const secretKeyBase58 = Buffer.from(keypair.secretKey).toString('base64');
const publicKey = keypair.publicKey.toString();

// Create output
const output = {
  publicKey,
  secretKey: secretKeyBase58,
  keypair: {
    publicKey: publicKey,
    secretKey: [...keypair.secretKey]
  }
};

// Write to file
const outputPath = path.join(__dirname, 'platform-keypair.json');
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log('✅ New keypair generated successfully!');
console.log(`Public Key: ${publicKey}`);
console.log(`Keypair saved to: ${outputPath}`);
console.log('\n⚠️  WARNING: Keep this keypair secure! Do not commit it to version control.');

// Create .env file if it doesn't exist
const envPath = path.join(__dirname, 'apps', 'backend', '.env');
let envContent = '';

if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8');
}

// Update or add PLATFORM_SECRET_KEY_BASE58
if (envContent.includes('PLATFORM_SECRET_KEY_BASE58=')) {
  envContent = envContent.replace(
    /PLATFORM_SECRET_KEY_BASE58=.*/,
    `PLATFORM_SECRET_KEY_BASE58=${secretKeyBase58}`
  );
} else {
  envContent += `\nPLATFORM_SECRET_KEY_BASE58=${secretKeyBase58}\n`;
}

// Ensure SESSION_SECRET is set
if (!envContent.includes('SESSION_SECRET=')) {
  const sessionSecret = require('crypto').randomBytes(32).toString('hex');
  envContent += `SESSION_SECRET=${sessionSecret}\n`;
}

fs.writeFileSync(envPath, envContent.trim() + '\n');
console.log(`\n✅ Updated ${envPath} with the new keypair and session secret`);
