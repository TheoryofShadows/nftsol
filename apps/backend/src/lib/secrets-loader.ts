/**
 * 🔐 Secrets Loader
 * Reads secrets from Render's mounted `/etc/secrets/` directory
 * Falls back to environment variables if secrets don't exist
 * Handles both uppercase and lowercase filename variants
 */

import fs from 'fs';

/**
 * Load a secret from file or environment variable
 * Priority: 1) /etc/secrets/ file (tries both cases), 2) Environment variable
 */
export function loadSecret(secretName: string, envVarName: string = secretName): string | undefined {
  // Try both uppercase and lowercase variants
  const secretPaths = [
    `/etc/secrets/${secretName}`,                    // Try as-is first
    `/etc/secrets/${secretName.toUpperCase()}`,     // Try uppercase
    `/etc/secrets/${secretName.toLowerCase()}`,     // Try lowercase
  ];
  
  for (const secretPath of secretPaths) {
    try {
      if (fs.existsSync(secretPath)) {
        const secretValue = fs.readFileSync(secretPath, 'utf-8').trim();
        if (secretValue) {
          console.log(`[Secrets] ✅ Loaded ${envVarName} from ${secretPath}`);
          return secretValue;
        }
      }
    } catch (error) {
      // Continue to next path variant
    }
  }

  // Fall back to environment variable
  const envValue = process.env[envVarName];
  if (envValue) {
    console.log(`[Secrets] ✅ Loaded ${envVarName} from environment variable`);
    return envValue;
  }

  console.warn(`[Secrets] ⚠️ Could not find ${secretName} (env: ${envVarName})`);
  return undefined;
}

/**
 * Load all critical secrets
 */
export function loadAllSecrets(): {
  platformSecretKeyBase58?: string;
  jwtSecret?: string;
  heliusApiKey?: string;
  pinataJwt?: string;
  pinataSecretKey?: string;
  irysWalletPrivateKey?: string;
  bubblegumTreeAddress?: string;
  sessionSecret?: string;
  databaseUrl?: string;
} {
  return {
    platformSecretKeyBase58: loadSecret('PLATFORM_SECRET_KEY_BASE58', 'PLATFORM_SECRET_KEY_BASE58'),
    jwtSecret: loadSecret('JWT_SECRET', 'JWT_SECRET'),
    heliusApiKey: loadSecret('HELIUS_API_KEY', 'HELIUS_API_KEY'),
    pinataJwt: loadSecret('PINATA_JWT', 'PINATA_JWT'),
    pinataSecretKey: loadSecret('PINATA_SECRET_KEY', 'PINATA_SECRET_KEY'),
    irysWalletPrivateKey: loadSecret('IRYS_WALLET_PRIVATE_KEY', 'IRYS_WALLET_PRIVATE_KEY'),
    bubblegumTreeAddress: loadSecret('BUBBLEGUM_TREE_ADDRESS', 'BUBBLEGUM_TREE_ADDRESS'),
    sessionSecret: loadSecret('SESSION_SECRET', 'SESSION_SECRET'),
    databaseUrl: loadSecret('DATABASE_URL', 'DATABASE_URL'),
  };
}

/**
 * Initialize secrets into environment variables
 * This ensures they're available via process.env throughout the app
 */
export function initializeSecrets(): void {
  console.log('[Secrets] 🔐 Initializing secrets from environment variables and secret files...');
  
  const secrets = loadAllSecrets();
  let loadedCount = 0;
  
  // Set as environment variables for backward compatibility
  if (secrets.platformSecretKeyBase58) {
    process.env.PLATFORM_SECRET_KEY_BASE58 = secrets.platformSecretKeyBase58;
    loadedCount++;
  }
  if (secrets.jwtSecret) {
    process.env.JWT_SECRET = secrets.jwtSecret;
    loadedCount++;
  }
  if (secrets.heliusApiKey) {
    process.env.HELIUS_API_KEY = secrets.heliusApiKey;
    loadedCount++;
  }
  if (secrets.pinataJwt) {
    process.env.PINATA_JWT = secrets.pinataJwt;
    loadedCount++;
  }
  if (secrets.pinataSecretKey) {
    process.env.PINATA_SECRET_KEY = secrets.pinataSecretKey;
    loadedCount++;
  }
  if (secrets.irysWalletPrivateKey) {
    process.env.IRYS_WALLET_PRIVATE_KEY = secrets.irysWalletPrivateKey;
    loadedCount++;
  }
  if (secrets.bubblegumTreeAddress) {
    process.env.BUBBLEGUM_TREE_ADDRESS = secrets.bubblegumTreeAddress;
    loadedCount++;
  }
  if (secrets.sessionSecret) {
    process.env.SESSION_SECRET = secrets.sessionSecret;
    loadedCount++;
  }
  if (secrets.databaseUrl) {
    process.env.DATABASE_URL = secrets.databaseUrl;
    loadedCount++;
  }

  console.log(`[Secrets] ✅ Successfully initialized ${loadedCount} secrets`);
}

