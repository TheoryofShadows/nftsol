
#!/usr/bin/env node

/**
 * Environment Validation Script
 * Validates that all required environment variables are set
 */

const fs = require('fs');
const path = require('path');

const requiredVars = {
  development: [
    'SOLANA_CLUSTER',
    'HELIUS_API_KEY',
    'DATABASE_URL',
    'SESSION_SECRET',
    'JWT_SECRET'
  ],
  test: [
    'SOLANA_CLUSTER',
    'DATABASE_URL',
    'SESSION_SECRET',
    'JWT_SECRET'
  ],
  production: [
    'SOLANA_CLUSTER',
    'HELIUS_API_KEY',
    'DATABASE_URL',
    'REDIS_URL',
    'SESSION_SECRET',
    'JWT_SECRET',
    'BUBBLEGUM_PRIVATE_KEY',
    'IRYS_WALLET_PRIVATE_KEY'
  ]
};

function validateEnvironment() {
  const env = process.env.NODE_ENV || 'development';
  const required = requiredVars[env] || [];
  
  console.log(`🔍 Validating ${env} environment...`);
  
  const missing = required.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(varName => {
      console.error(`  - ${varName}`);
    });
    console.error('\nPlease set these variables in your environment or .env file');
    process.exit(1);
  }
  
  console.log('✅ All required environment variables are set');
}

if (require.main === module) {
  validateEnvironment();
}

module.exports = { validateEnvironment };
