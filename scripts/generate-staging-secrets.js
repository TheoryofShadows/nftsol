#!/usr/bin/env node

/**
 * Generate staging environment secrets
 * Run with: node scripts/generate-staging-secrets.js
 */

const crypto = require('crypto');

console.log('🔐 NFTSol Staging Secrets Generator');
console.log('=====================================\n');

// Generate SESSION_SECRET (32 characters)
const sessionSecret = crypto.randomBytes(32).toString('hex');
console.log('SESSION_SECRET=' + sessionSecret);

// Generate JWT_SECRET (64 characters)
const jwtSecret = crypto.randomBytes(64).toString('hex');
console.log('JWT_SECRET=' + jwtSecret);

// Generate WEBHOOK_SECRET (32 characters)
const webhookSecret = crypto.randomBytes(32).toString('hex');
console.log('WEBHOOK_SECRET=' + webhookSecret);

console.log('\n📋 Copy these values to your Render environment variables:');
console.log('1. Go to your Render service dashboard');
console.log('2. Click on "Environment" tab');
console.log('3. Add each variable with its corresponding value');
console.log('\n⚠️  Keep these secrets secure and never commit them to git!');

console.log('\n🔗 Required API Keys (you need to obtain these separately):');
console.log('- HELIUS_API_KEY: Get from https://helius.xyz');
console.log('- BUBBLEGUM_PRIVATE_KEY: Your Solana wallet private key');
console.log('- IRYS_WALLET_PRIVATE_KEY: Your Irys wallet private key');
console.log('- DATABASE_URL: From your Render PostgreSQL service');
console.log('- REDIS_URL: From your Render Redis service');
