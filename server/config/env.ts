import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Environment schema with validation
const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3001').transform(Number),
  
  // Database
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid PostgreSQL URL'),
  
  // Authentication
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  ADMIN_ALLOWED_IPS: z.string().optional().default('127.0.0.1,::1'),
  
  // Solana
  SOLANA_NETWORK: z.enum(['devnet', 'mainnet-beta', 'testnet']).default('devnet'),
  VITE_RPC_URL: z.string().url().optional(),
  CLOUT_TOKEN_MINT_ADDRESS: z.string().optional(),
  MARKETPLACE_TREASURY_WALLET: z.string().optional(),
  
  // External APIs
  HELIUS_API_KEY: z.string().optional(),
  MAGIC_EDEN_API_KEY: z.string().optional(),
  OPENSEA_API_KEY: z.string().optional(),
  BIRDEYE_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  QUICKNODE_API_KEY: z.string().optional(),
  SIMPLEHASH_API_KEY: z.string().optional(),
  MORALIS_API_KEY: z.string().optional(),
  
  // Monitoring
  SENTRY_DSN: z.string().url().optional(),
  
  // Frontend
  VITE_BACKEND_URL: z.string().url().default('http://localhost:3001'),
});

// Parse and validate environment variables
let env: z.infer<typeof envSchema>;

try {
  env = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('❌ Environment validation failed:');
    error.errors.forEach((err) => {
      console.error(`  - ${err.path.join('.')}: ${err.message}`);
    });
    
    console.error('\n📋 Please check your .env file and ensure all required variables are set.');
    console.error('See .env.example for reference.\n');
    
    process.exit(1);
  }
  throw error;
}

// Export validated environment configuration
export const config = {
  // Server
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
  port: env.PORT,
  
  // Database
  database: {
    url: env.DATABASE_URL,
  },
  
  // Authentication
  auth: {
    jwtSecret: env.JWT_SECRET,
    adminAllowedIPs: env.ADMIN_ALLOWED_IPS.split(',').map(ip => ip.trim()),
  },
  
  // Solana
  solana: {
    network: env.SOLANA_NETWORK,
    rpcUrl: env.VITE_RPC_URL || `https://api.${env.SOLANA_NETWORK}.solana.com`,
    cloutTokenMint: env.CLOUT_TOKEN_MINT_ADDRESS,
    treasuryWallet: env.MARKETPLACE_TREASURY_WALLET,
  },
  
  // External APIs
  apis: {
    helius: env.HELIUS_API_KEY,
    magicEden: env.MAGIC_EDEN_API_KEY,
    openSea: env.OPENSEA_API_KEY,
    birdeye: env.BIRDEYE_API_KEY,
    openai: env.OPENAI_API_KEY,
    quicknode: env.QUICKNODE_API_KEY,
    simplehash: env.SIMPLEHASH_API_KEY,
    moralis: env.MORALIS_API_KEY,
  },
  
  // Monitoring
  monitoring: {
    sentryDsn: env.SENTRY_DSN,
    isSentryEnabled: !!env.SENTRY_DSN,
  },
  
  // Frontend
  frontend: {
    backendUrl: env.VITE_BACKEND_URL,
  },
};

// Log configuration status (but not sensitive values)
if (env.NODE_ENV === 'development') {
  console.log('✅ Environment configuration loaded successfully');
  console.log('🔧 Configuration status:');
  console.log(`  - Environment: ${env.NODE_ENV}`);
  console.log(`  - Solana Network: ${env.SOLANA_NETWORK}`);
  console.log(`  - Database: ${env.DATABASE_URL ? '✓ Configured' : '✗ Missing'}`);
  console.log(`  - JWT Secret: ${env.JWT_SECRET ? '✓ Configured' : '✗ Missing'}`);
  console.log(`  - Helius API: ${env.HELIUS_API_KEY ? '✓ Configured' : '⚠ Optional'}`);
  console.log(`  - OpenAI API: ${env.OPENAI_API_KEY ? '✓ Configured' : '⚠ Optional'}`);
  console.log(`  - Sentry: ${env.SENTRY_DSN ? '✓ Enabled' : '⚠ Disabled'}`);
}

export default config;
