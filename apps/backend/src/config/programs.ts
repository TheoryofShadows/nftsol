// Real Program IDs for NFTSol Smart Contracts (MAINNET)
export const PROGRAM_IDS = {
  CLOUT_STAKING: '62hWQAgAV4jugHSuZsMqzxZNVXaVLrbRpz3Sw58Z64Mw', // Mainnet CLOUT token
  MARKET_ESCROW: 'HTs1hErzM8MywaUojfUY7QA1T6gLQD977R3HsCnKj7m7',
  LOYALTY_REGISTRY: '2TujfT3Czd2ncawJ6ZLmfGeJ2t1Ugb9bqEvxSE2EKoo9',
  REWARDS_VAULT: '2KkNwFZbznAtYX1xjVS6e5BBqQnfaBuTjn42G4zJXAps',
} as const;

// Environment-based configuration
export const getProgramId = (program: keyof typeof PROGRAM_IDS): string => {
  const envKey = `${program}_PROGRAM_ID` as const;
  return process.env[envKey] || PROGRAM_IDS[program];
};

// Export individual program IDs
export const CLOUT_PROGRAM_ID = getProgramId('CLOUT_STAKING');
export const MARKET_PROGRAM_ID = getProgramId('MARKET_ESCROW');
export const LOYALTY_PROGRAM_ID = getProgramId('LOYALTY_REGISTRY');
export const REWARDS_VAULT_ID = getProgramId('REWARDS_VAULT');
