#!/usr/bin/env node

/**
 * Secure Platform Key Generation Script
 * 
 * This script generates new Solana keypairs for the platform.
 * IMPORTANT: Keep these keys secure and never commit them to version control.
 */

const { Keypair } = require('@solana/web3.js');
const bs58 = require('bs58');
const fs = require('fs');
const path = require('path');

console.log('🔐 NFTSol Platform Key Generation');
console.log('=====================================\n');

// Generate new platform keypair
console.log('Generating new platform keypair...');
const platformKeypair = Keypair.generate();

// Convert to different formats
const publicKey = platformKeypair.publicKey.toBase58();
const secretKeyArray = Array.from(platformKeypair.secretKey);
const secretKeyBase58 = bs58.encode(platformKeypair.secretKey);

console.log('✅ Keypair generated successfully!\n');

// Display the keys
console.log('📋 PLATFORM KEYS:');
console.log('================');
console.log(`Public Key:  ${publicKey}`);
console.log(`Secret Key (Base58): ${secretKeyBase58}`);
console.log(`Secret Key (JSON):   [${secretKeyArray.join(',')}]`);

// Create environment file template
const envTemplate = `# NFTSol Platform Configuration
# Generated on: ${new Date().toISOString()}

# Platform Wallet Keys
PLATFORM_PUBLIC_KEY=${publicKey}
PLATFORM_SECRET_KEY_BASE58=${secretKeyBase58}
PLATFORM_SECRET_KEY_JSON=[${secretKeyArray.join(',')}]

# JWT Secret (generate a strong random string)
JWT_SECRET=${generateRandomString(64)}

# Database Configuration
DATABASE_URL=postgresql://user:password@host:port/database

# Solana Configuration
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_RPC_DEVNET=https://api.devnet.solana.com
SOLANA_CLUSTER=devnet

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,https://yourdomain.com

# Withdrawal Limits (in lamports)
MAX_SINGLE_WITHDRAWAL_LAMPORTS=10000000000
MAX_DAILY_PER_USER_LAMPORTS=50000000000
WITHDRAWAL_AUTO_APPROVE_LAMPORTS=100000000
WITHDRAWAL_DAILY_LIMIT_LAMPORTS=5000000000

# Rate Limiting
WITHDRAWAL_RATE_LIMIT_WINDOW_MS=900000
WITHDRAWAL_RATE_LIMIT_MAX=5

# Program IDs (update with your deployed programs)
CLOUT_PROGRAM_ID=CE9VN3Bkh4Mn77GSTdfhf7KNpUKeqpmMX7s8463EFvJE
MARKET_PROGRAM_ID=HTs1hErzM8MywaUojfUY7QA1T6gLQD977R3HsCnKj7m7
LOYALTY_PROGRAM_ID=2TujfT3Czd2ncawJ6ZLmfGeJ2t1Ugb9bqEvxSE2EKoo9
REWARDS_VAULT=EkwwFmeS32L7Lei1vMwF66LCN2RuM7kfNZZ6HCmyvwuN

# Environment
NODE_ENV=development
PORT=3000
`;

// Save to .env file
const envPath = path.join(__dirname, '..', '.env');
fs.writeFileSync(envPath, envTemplate);

console.log('\n📁 Environment file created: .env');
console.log('⚠️  IMPORTANT: Add .env to .gitignore if not already present!');

// Create production environment template
const prodEnvTemplate = `# NFTSol Production Configuration
# Generated on: ${new Date().toISOString()}

# Platform Wallet Keys (KEEP SECURE!)
PLATFORM_PUBLIC_KEY=${publicKey}
PLATFORM_SECRET_KEY_BASE58=${secretKeyBase58}

# JWT Secret (KEEP SECURE!)
JWT_SECRET=${generateRandomString(64)}

# Database Configuration (UPDATE WITH REAL VALUES)
DATABASE_URL=postgresql://user:password@host:port/database

# Solana Configuration
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_RPC_DEVNET=https://api.devnet.solana.com
SOLANA_CLUSTER=mainnet-beta

# CORS Configuration (UPDATE WITH YOUR DOMAINS)
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Withdrawal Limits (in lamports)
MAX_SINGLE_WITHDRAWAL_LAMPORTS=10000000000
MAX_DAILY_PER_USER_LAMPORTS=50000000000
WITHDRAWAL_AUTO_APPROVE_LAMPORTS=100000000
WITHDRAWAL_DAILY_LIMIT_LAMPORTS=5000000000

# Rate Limiting
WITHDRAWAL_RATE_LIMIT_WINDOW_MS=900000
WITHDRAWAL_RATE_LIMIT_MAX=5

# Program IDs (UPDATE WITH YOUR DEPLOYED PROGRAMS)
CLOUT_PROGRAM_ID=YOUR_CLOUT_PROGRAM_ID
MARKET_PROGRAM_ID=YOUR_MARKET_PROGRAM_ID
LOYALTY_PROGRAM_ID=YOUR_LOYALTY_PROGRAM_ID
REWARDS_VAULT=YOUR_REWARDS_VAULT

# Environment
NODE_ENV=production
PORT=3000
`;

// Save production template
const prodEnvPath = path.join(__dirname, '..', '.env.production');
fs.writeFileSync(prodEnvPath, prodEnvTemplate);

console.log('📁 Production environment template created: .env.production');

// Create secure key backup file (encrypted)
const keyBackup = {
  generated: new Date().toISOString(),
  platform: {
    publicKey,
    secretKeyBase58,
    secretKeyArray
  },
  instructions: [
    "Store this file securely offline",
    "Never commit to version control",
    "Use for emergency key recovery only",
    "Consider encrypting this file with GPG"
  ]
};

const backupPath = path.join(__dirname, '..', 'platform-keys-backup.json');
fs.writeFileSync(backupPath, JSON.stringify(keyBackup, null, 2));

console.log('📁 Secure key backup created: platform-keys-backup.json');
console.log('⚠️  IMPORTANT: Store this backup securely offline!');

console.log('\n🚀 NEXT STEPS:');
console.log('==============');
console.log('1. Fund the platform wallet with SOL:');
console.log(`   solana transfer ${publicKey} 1.0 --from <your-wallet> --url devnet`);
console.log('');
console.log('2. Update your deployment configuration with the new keys');
console.log('');
console.log('3. Test the platform with the new keys');
console.log('');
console.log('4. Deploy to production with secure environment variables');
console.log('');
console.log('5. Delete the backup file after confirming everything works');
console.log('');
console.log('⚠️  SECURITY REMINDERS:');
console.log('======================');
console.log('• Never commit private keys to version control');
console.log('• Use environment variables for all secrets');
console.log('• Store backup keys securely offline');
console.log('• Rotate keys regularly');
console.log('• Monitor for unauthorized access');

function generateRandomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
