#!/usr/bin/env node

/**
 * Environment Setup Script for NFTSol
 * 
 * This script sets up the proper environment configuration
 * for development, testing, and production environments.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('🔧 Setting up NFTSol environment configuration...\n');

// Generate secure secrets
function generateSecret(length = 64) {
  return crypto.randomBytes(length).toString('hex');
}

// Environment configurations
const environments = {
  development: {
    NODE_ENV: 'development',
    PORT: 3000,
    LOG_LEVEL: 'debug',
    SOLANA_CLUSTER: 'devnet',
    HELIUS_API_KEY: 'your-helius-api-key-here',
    HELIUS_RPC_URL: 'https://devnet.helius-rpc.com/?api-key=your-helius-api-key-here',
    HELIUS_REST_URL: 'https://api.helius.xyz/v0',
    HELIUS_TIMEOUT_MS: 15000,
    DEV_ALLOWED_ORIGINS: 'http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173',
    
    // Database
    DATABASE_URL: 'postgresql://user:password@localhost:5432/nftsol_dev',
    
    // Redis
    REDIS_URL: 'redis://localhost:6379',
    
    // Security
    SESSION_SECRET: generateSecret(32),
    JWT_SECRET: generateSecret(64),
    BCRYPT_ROUNDS: 10,
    
    // Solana Configuration
    BUBBLEGUM_PRIVATE_KEY: 'your-bubblegum-private-key-here',
    IRYS_WALLET_PRIVATE_KEY: 'your-irys-wallet-private-key-here',
    
    // WebSocket
    WS_ENABLED: 'true',
    
    // File Upload
    MAX_FILE_SIZE: '50MB',
    UPLOAD_DIR: './uploads',
    
    // Monitoring
    ENABLE_MONITORING: 'true',
    LOG_REQUESTS: 'true'
  },
  
  test: {
    NODE_ENV: 'test',
    PORT: 3001,
    LOG_LEVEL: 'error',
    SOLANA_CLUSTER: 'devnet',
    HELIUS_API_KEY: 'test-api-key',
    HELIUS_RPC_URL: 'https://api.devnet.solana.com',
    HELIUS_REST_URL: 'https://api.helius.xyz/v0',
    HELIUS_TIMEOUT_MS: 5000,
    DEV_ALLOWED_ORIGINS: 'http://localhost:3001',
    
    // Database
    DATABASE_URL: 'postgresql://user:password@localhost:5432/nftsol_test',
    
    // Redis
    REDIS_URL: 'redis://localhost:6379',
    
    // Security
    SESSION_SECRET: 'test-session-secret',
    JWT_SECRET: 'test-jwt-secret-32-characters-long',
    BCRYPT_ROUNDS: 4,
    
    // Solana Configuration
    BUBBLEGUM_PRIVATE_KEY: 'test-bubblegum-private-key',
    IRYS_WALLET_PRIVATE_KEY: 'test-irys-wallet-private-key',
    
    // WebSocket
    WS_ENABLED: 'false',
    
    // File Upload
    MAX_FILE_SIZE: '10MB',
    UPLOAD_DIR: './test-uploads',
    
    // Monitoring
    ENABLE_MONITORING: 'false',
    LOG_REQUESTS: 'false'
  },
  
  production: {
    NODE_ENV: 'production',
    PORT: 3000,
    LOG_LEVEL: 'info',
    SOLANA_CLUSTER: 'mainnet-beta',
    HELIUS_API_KEY: '${HELIUS_API_KEY}',
    HELIUS_RPC_URL: '${HELIUS_RPC_URL}',
    HELIUS_REST_URL: 'https://api.helius.xyz/v0',
    HELIUS_TIMEOUT_MS: 30000,
    ALLOWED_ORIGINS: 'https://nftsol.app,https://www.nftsol.app,https://nftsol.netlify.app',
    
    // Database
    DATABASE_URL: '${DATABASE_URL}',
    
    // Redis
    REDIS_URL: '${REDIS_URL}',
    
    // Security
    SESSION_SECRET: '${SESSION_SECRET}',
    JWT_SECRET: '${JWT_SECRET}',
    BCRYPT_ROUNDS: 12,
    
    // Solana Configuration
    BUBBLEGUM_PRIVATE_KEY: '${BUBBLEGUM_PRIVATE_KEY}',
    IRYS_WALLET_PRIVATE_KEY: '${IRYS_WALLET_PRIVATE_KEY}',
    
    // WebSocket
    WS_ENABLED: 'true',
    
    // File Upload
    MAX_FILE_SIZE: '50MB',
    UPLOAD_DIR: './uploads',
    
    // Monitoring
    ENABLE_MONITORING: 'true',
    LOG_REQUESTS: 'true',
    
    // Additional Production Settings
    SECURE_COOKIES: 'true',
    TRUST_PROXY: 'true',
    RATE_LIMITING_ENABLED: 'true',
    HELMET_ENABLED: 'true'
  }
};

// Create environment files
Object.entries(environments).forEach(([env, config]) => {
  const envDir = path.join(__dirname, '..', 'config', env);
  const envFile = path.join(envDir, 'backend.env');
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(envDir)) {
    fs.mkdirSync(envDir, { recursive: true });
  }
  
  // Create environment file
  const envContent = Object.entries(config)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  
  fs.writeFileSync(envFile, envContent);
  console.log(`✅ Created ${env} environment file: ${envFile}`);
});

// Create .env.example file
const exampleContent = Object.entries(environments.development)
  .map(([key, value]) => `${key}=${value}`)
  .join('\n');

fs.writeFileSync(path.join(__dirname, '..', 'config', 'backend.env.example'), exampleContent);
console.log('✅ Created backend.env.example file');

// Create frontend environment files
const frontendEnvs = {
  development: {
    VITE_API_BASE: 'http://localhost:3000',
    VITE_SOLANA_CLUSTER: 'devnet',
    VITE_WALLET_ADAPTER_NETWORK: 'devnet',
    VITE_HELIUS_API_KEY: 'your-helius-api-key-here',
    VITE_ENABLE_DEVTOOLS: 'true'
  },
  
  test: {
    VITE_API_BASE: 'http://localhost:3001',
    VITE_SOLANA_CLUSTER: 'devnet',
    VITE_WALLET_ADAPTER_NETWORK: 'devnet',
    VITE_HELIUS_API_KEY: 'test-api-key',
    VITE_ENABLE_DEVTOOLS: 'false'
  },
  
  production: {
    VITE_API_BASE: '${VITE_API_BASE}',
    VITE_SOLANA_CLUSTER: 'mainnet-beta',
    VITE_WALLET_ADAPTER_NETWORK: 'mainnet-beta',
    VITE_HELIUS_API_KEY: '${VITE_HELIUS_API_KEY}',
    VITE_ENABLE_DEVTOOLS: 'false'
  }
};

Object.entries(frontendEnvs).forEach(([env, config]) => {
  const envDir = path.join(__dirname, '..', 'config', env);
  const envFile = path.join(envDir, 'frontend.env');
  
  const envContent = Object.entries(config)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  
  fs.writeFileSync(envFile, envContent);
  console.log(`✅ Created ${env} frontend environment file: ${envFile}`);
});

// Create frontend.env.example
const frontendExampleContent = Object.entries(frontendEnvs.development)
  .map(([key, value]) => `${key}=${value}`)
  .join('\n');

fs.writeFileSync(path.join(__dirname, '..', 'config', 'frontend.env.example'), frontendExampleContent);
console.log('✅ Created frontend.env.example file');

// Create environment validation script
const validationScript = `
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
  
  console.log(\`🔍 Validating \${env} environment...\`);
  
  const missing = required.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(varName => {
      console.error(\`  - \${varName}\`);
    });
    console.error('\\nPlease set these variables in your environment or .env file');
    process.exit(1);
  }
  
  console.log('✅ All required environment variables are set');
}

if (require.main === module) {
  validateEnvironment();
}

module.exports = { validateEnvironment };
`;

fs.writeFileSync(path.join(__dirname, '..', 'scripts', 'validate-env.js'), validationScript);
console.log('✅ Created environment validation script');

console.log('\n🎉 Environment setup completed!');
console.log('\n📋 Next steps:');
console.log('1. Update the API keys in the environment files');
console.log('2. Set up your database and Redis instances');
console.log('3. Generate proper private keys for Solana operations');
console.log('4. Run: node scripts/validate-env.js to verify configuration');
console.log('5. Start development: npm run dev');
