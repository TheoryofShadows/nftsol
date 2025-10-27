#!/usr/bin/env node

/**
 * Test Database Setup
 * Creates a test database and runs migrations
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🗄️ Setting up test database...');

try {
  // Set test environment
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/nftsol_test';
  
  // Create test database (if it doesn't exist)
  try {
    execSync('createdb nftsol_test', { stdio: 'inherit' });
    console.log('✅ Test database created');
  } catch (error) {
    console.log('ℹ️ Test database may already exist');
  }
  
  // Run migrations
  execSync('npm run db:migrate', { stdio: 'inherit', cwd: path.join(__dirname, '..', 'apps', 'backend') });
  console.log('✅ Test database migrations completed');
  
} catch (error) {
  console.error('❌ Test database setup failed:', error.message);
  process.exit(1);
}

console.log('✅ Test database setup completed');
