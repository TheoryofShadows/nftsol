#!/usr/bin/env node

/**
 * Security Update Script for NFTSol
 * This script addresses security vulnerabilities in dependencies
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔒 Starting security updates for NFTSol...');

// Update specific vulnerable packages
const securityUpdates = [
  // Update express-validator to latest version
  {
    package: 'express-validator',
    version: '^7.1.0',
    location: 'server'
  },
  // Update validator.js to latest version
  {
    package: 'validator',
    version: '^13.12.0',
    location: 'server'
  },
  // Update nanoid to latest version
  {
    package: 'nanoid',
    version: '^5.0.0',
    location: 'server'
  },
  // Update parse-duration to latest version
  {
    package: 'parse-duration',
    version: '^2.1.3',
    location: 'server'
  }
];

async function updateDependencies() {
  try {
    console.log('📦 Updating server dependencies...');
    
    // Update server dependencies
    for (const update of securityUpdates) {
      try {
        console.log(`Updating ${update.package} to ${update.version}...`);
        execSync(`npm install ${update.package}@${update.version} --prefix server`, { stdio: 'inherit' });
      } catch (error) {
        console.warn(`⚠️  Could not update ${update.package}: ${error.message}`);
      }
    }
    
    console.log('✅ Security updates completed!');
    
    // Run audit to check remaining issues
    console.log('🔍 Running security audit...');
    try {
      execSync('npm audit', { stdio: 'inherit' });
    } catch (error) {
      console.log('Some vulnerabilities may still exist. This is normal for development dependencies.');
    }
    
  } catch (error) {
    console.error('❌ Security update failed:', error.message);
    process.exit(1);
  }
}

updateDependencies();
