import { getAppConfig, getHeliusConfig } from '../config/environment';

export interface EnvironmentStatus {
  isValid: boolean;
  missing: string[];
  warnings: string[];
  services: {
    database: boolean;
    helius: boolean;
    ipfs: boolean;
    clout: boolean;
  };
}

export function validateEnvironment(): EnvironmentStatus {
  const missing: string[] = [];
  const warnings: string[] = [];
  
  // Required environment variables
  const required = [
    'DATABASE_URL',
    'HELIUS_API_KEY'
  ];
  
  // Optional but recommended
  const recommended = [
    'PINATA_API_KEY',
    'PINATA_SECRET_KEY',
    'OPENAI_API_KEY'
  ];
  
  // Check required variables
  for (const envVar of required) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }
  
  // Check recommended variables
  for (const envVar of recommended) {
    if (!process.env[envVar]) {
      warnings.push(`${envVar} is not set - some features may be limited`);
    }
  }
  
  // Check service availability
  const services = {
    database: !!process.env.DATABASE_URL,
    helius: !!process.env.HELIUS_API_KEY,
    ipfs: !!(process.env.PINATA_API_KEY && process.env.PINATA_SECRET_KEY),
    clout: !!(process.env.CLOUT_MINT && process.env.CLOUT_TREASURY)
  };
  
  return {
    isValid: missing.length === 0,
    missing,
    warnings,
    services
  };
}

export function logEnvironmentStatus(): void {
  const status = validateEnvironment();
  const appConfig = getAppConfig();
  
  console.log('🔧 Environment Configuration Status:');
  console.log(`   Environment: ${appConfig.env}`);
  console.log(`   Port: ${appConfig.port}`);
  console.log(`   Log Level: ${appConfig.logLevel}`);
  console.log(`   Allowed Origins: ${appConfig.allowedOrigins.join(', ')}`);
  
  if (status.isValid) {
    console.log('✅ All required environment variables are set');
  } else {
    console.log('❌ Missing required environment variables:');
    status.missing.forEach(env => console.log(`   - ${env}`));
  }
  
  if (status.warnings.length > 0) {
    console.log('⚠️  Warnings:');
    status.warnings.forEach(warning => console.log(`   - ${warning}`));
  }
  
  console.log('🔌 Service Status:');
  console.log(`   Database: ${status.services.database ? '✅' : '❌'}`);
  console.log(`   Helius: ${status.services.helius ? '✅' : '❌'}`);
  console.log(`   IPFS: ${status.services.ipfs ? '✅' : '❌'}`);
  console.log(`   CLOUT: ${status.services.clout ? '✅' : '❌'}`);
}
