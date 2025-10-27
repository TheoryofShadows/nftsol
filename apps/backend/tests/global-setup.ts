/**
 * Global Test Setup
 * Runs once before all tests
 */

export default async () => {
  console.log('🚀 Setting up test environment...');
  
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/nftsol_test';
  process.env.REDIS_URL = 'redis://localhost:6379';
  process.env.SESSION_SECRET = 'test-session-secret-32-characters-long';
  process.env.JWT_SECRET = 'test-jwt-secret-64-characters-long-for-testing-purposes-only';
  
  console.log('✅ Test environment setup completed');
};