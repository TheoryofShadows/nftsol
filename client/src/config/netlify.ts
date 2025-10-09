// Netlify-specific configuration
export const netlifyConfig = {
  // API Configuration
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'https://your-backend-domain.com',
  wsUrl: import.meta.env.VITE_WS_URL || 'wss://your-backend-domain.com',
  
  // Solana Configuration
  solanaNetwork: import.meta.env.VITE_SOLANA_NETWORK || 'mainnet-beta',
  solanaRpcUrl: import.meta.env.VITE_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
  solanaWsUrl: import.meta.env.VITE_SOLANA_WS_URL || 'wss://api.mainnet-beta.solana.com',
  
  // Program IDs
  rewardsVaultProgramId: import.meta.env.VITE_REWARDS_VAULT_PROGRAM_ID,
  stakingProgramId: import.meta.env.VITE_STAKING_PROGRAM_ID,
  escrowProgramId: import.meta.env.VITE_ESCROW_PROGRAM_ID,
  loyaltyProgramId: import.meta.env.VITE_LOYALTY_PROGRAM_ID,
  
  // CLOUT Token
  cloutTokenMint: import.meta.env.VITE_CLOUT_TOKEN_MINT,
  cloutTokenDecimals: parseInt(import.meta.env.VITE_CLOUT_TOKEN_DECIMALS || '9'),
  
  // External APIs
  heliusApiKey: import.meta.env.VITE_HELIUS_API_KEY,
  moralisApiKey: import.meta.env.VITE_MORALIS_API_KEY,
  magicEdenApiKey: import.meta.env.VITE_MAGIC_EDEN_API_KEY,
  quicknodeApiKey: import.meta.env.VITE_QUICKNODE_API_KEY,
  
  // Analytics
  sentryDsn: import.meta.env.VITE_SENTRY_DSN,
  googleAnalyticsId: import.meta.env.VITE_GOOGLE_ANALYTICS_ID,
  
  // Feature Flags
  enableAiFeatures: import.meta.env.VITE_ENABLE_AI_FEATURES === 'true',
  enableSocialTrading: import.meta.env.VITE_ENABLE_SOCIAL_TRADING === 'true',
  enableCloutStaking: import.meta.env.VITE_ENABLE_CLOUT_STAKING === 'true',
  enableAchievements: import.meta.env.VITE_ENABLE_ACHIEVEMENTS === 'true',
  
  // Development
  debugMode: import.meta.env.VITE_DEBUG_MODE === 'true',
  mockData: import.meta.env.VITE_MOCK_DATA === 'true',
  
  // Environment
  isProduction: import.meta.env.NODE_ENV === 'production',
  isNetlify: import.meta.env.NETLIFY === 'true',
};

// Validate required configuration
export const validateConfig = () => {
  const required = [
    'rewardsVaultProgramId',
    'stakingProgramId', 
    'escrowProgramId',
    'loyaltyProgramId',
    'cloutTokenMint'
  ];
  
  const missing = required.filter(key => !netlifyConfig[key as keyof typeof netlifyConfig]);
  
  if (missing.length > 0) {
    console.warn('Missing required configuration:', missing);
    return false;
  }
  
  return true;
};

export default netlifyConfig;
