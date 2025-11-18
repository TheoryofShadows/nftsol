export interface SolanaConfig {
  rpcUrl: string;
  wsUrl?: string;
  commitment: 'confirmed' | 'processed' | 'finalized';
  cluster?: string;
}

export interface ProgramConfig {
  programId: string;
  metadataProgramId: string;
  tokenMetadataProgramId: string;
  cloutProgramId: string;
  marketProgramId: string;
  loyaltyProgramId: string;
}

export interface AppConfig {
  nodeEnv: 'development' | 'production' | 'test';
  port: number;
  fileUpload: {
    allowedTypes: string[];
    maxSize: number;
  };
  solana: SolanaConfig;
  program: ProgramConfig;
}

export const solanaConfig: SolanaConfig = {
  rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
  commitment: 'confirmed'
};

export const programConfig: ProgramConfig = {
  programId: process.env.PROGRAM_ID || 'test-program-id',
  metadataProgramId: process.env.METADATA_PROGRAM_ID || 'test-metadata-program-id',
  tokenMetadataProgramId: process.env.TOKEN_METADATA_PROGRAM_ID || 'test-token-metadata-program-id',
  cloutProgramId: process.env.CLOUT_PROGRAM_ID || 'test-clout-program-id',
  marketProgramId: process.env.MARKET_PROGRAM_ID || 'test-market-program-id',
  loyaltyProgramId: process.env.LOYALTY_PROGRAM_ID || 'test-loyalty-program-id'
};

export const appConfig: AppConfig = {
  nodeEnv: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  fileUpload: {
    allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
    maxSize: 5 * 1024 * 1024 // 5MB
  },
  solana: solanaConfig,
  program: programConfig
};

// Export all config for backward compatibility
export default {
  appConfig,
  solanaConfig,
  programConfig
};
