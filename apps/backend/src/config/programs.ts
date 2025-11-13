// Real Program IDs for NFTSol Smart Contracts (MAINNET)
export const PROGRAM_IDS = {
  CLOUT_STAKING: '26iJ37BE3icVtoo2QRkfjtYXFHMudG2sbTHAnhF2D6ab', // Mainnet CLOUT token
  MARKET_ESCROW: 'HTs1hErzM8MywaUojfUY7QA1T6gLQD977R3HsCnKj7m7',
  LOYALTY_REGISTRY: '2TujfT3Czd2ncawJ6ZLmfGeJ2t1Ugb9bqEvxSE2EKoo9',
  BUBBLEGUM: 'BGUMAp9Gq7iTEuizy4pqaxsTyUCBK68MDfK752saRPUY', // Mainnet Bubblegum program ID
  // REWARDS_VAULT is auto-calculated from REWARDS_OWNER + CLOUT_MINT (deterministic ATA)
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
export const BUBBLEGUM_PROGRAM_ID = getProgramId('BUBBLEGUM');
// REWARDS_VAULT_ID removed - use getOrCreateCloutVault() from utils/clout-vault.ts instead
