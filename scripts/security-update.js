#!/usr/bin/env node

/**
 * Security Update Script for NFTSol
 * 
 * This script addresses security vulnerabilities by updating packages
 * and implementing security best practices.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔒 Starting Security Update for NFTSol...\n');

// Security fixes for vulnerable packages
const securityFixes = {
  // Fix esbuild vulnerability  
  'esbuild': '^0.25.12',
  
  // Fix nanoid vulnerability
  'nanoid': '^5.0.9',
  
  // Fix parse-duration vulnerability
  'parse-duration': '^2.1.4',
  
  // Update other security-related packages
  'express': '^4.21.2',
  'helmet': '^8.0.0',
  'bcryptjs': '^3.0.2',
  'jsonwebtoken': '^9.0.2',
  'validator': '^13.15.15'
};

// Update root package.json
console.log('📦 Updating root package.json...');
const rootPackagePath = path.join(__dirname, '..', 'package.json');
const rootPackage = JSON.parse(fs.readFileSync(rootPackagePath, 'utf8'));

Object.entries(securityFixes).forEach(([pkg, version]) => {
  if (rootPackage.dependencies && rootPackage.dependencies[pkg]) {
    rootPackage.dependencies[pkg] = version;
    console.log(`  ✅ Updated ${pkg} to ${version}`);
  }
});

fs.writeFileSync(rootPackagePath, JSON.stringify(rootPackage, null, 2));

// Update backend package.json
console.log('\n📦 Updating backend package.json...');
const backendPackagePath = path.join(__dirname, '..', 'apps', 'backend', 'package.json');
const backendPackage = JSON.parse(fs.readFileSync(backendPackagePath, 'utf8'));

Object.entries(securityFixes).forEach(([pkg, version]) => {
  if (backendPackage.dependencies && backendPackage.dependencies[pkg]) {
    backendPackage.dependencies[pkg] = version;
    console.log(`  ✅ Updated ${pkg} to ${version}`);
  }
});

// Additional backend security updates
const backendSecurityUpdates = {
  '@solana/web3.js': '^1.98.4',
  '@solana/spl-token': '^0.4.14',
  'drizzle-orm': '^0.44.6',
  'redis': '^5.9.0',
  'postgres': '^3.4.7',
  'socket.io': '^4.7.0'
};

Object.entries(backendSecurityUpdates).forEach(([pkg, version]) => {
  if (backendPackage.dependencies && backendPackage.dependencies[pkg]) {
    backendPackage.dependencies[pkg] = version;
    console.log(`  ✅ Updated ${pkg} to ${version}`);
  }
});

fs.writeFileSync(backendPackagePath, JSON.stringify(backendPackage, null, 2));

// Update frontend package.json
console.log('\n📦 Updating frontend package.json...');
const frontendPackagePath = path.join(__dirname, '..', 'apps', 'frontend', 'package.json');
if (fs.existsSync(frontendPackagePath)) {
  const frontendPackage = JSON.parse(fs.readFileSync(frontendPackagePath, 'utf8'));
  
  Object.entries(securityFixes).forEach(([pkg, version]) => {
    if (frontendPackage.dependencies && frontendPackage.dependencies[pkg]) {
      frontendPackage.dependencies[pkg] = version;
      console.log(`  ✅ Updated ${pkg} to ${version}`);
    }
  });
  
  fs.writeFileSync(frontendPackagePath, JSON.stringify(frontendPackage, null, 2));
}

console.log('\n🔧 Installing updated packages...');
try {
  execSync('npm install', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  console.log('✅ Root packages installed successfully');
  
  execSync('npm install', { stdio: 'inherit', cwd: path.join(__dirname, '..', 'apps', 'backend') });
  console.log('✅ Backend packages installed successfully');
  
  if (fs.existsSync(path.join(__dirname, '..', 'apps', 'frontend'))) {
    execSync('npm install', { stdio: 'inherit', cwd: path.join(__dirname, '..', 'apps', 'frontend') });
    console.log('✅ Frontend packages installed successfully');
  }
} catch (error) {
  console.error('❌ Error installing packages:', error.message);
  process.exit(1);
}

console.log('\n🔍 Running security audit...');
try {
  execSync('npm audit', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
} catch (error) {
  console.log('⚠️  Some vulnerabilities may still exist. Manual review required.');
}

console.log('\n✅ Security update completed!');
console.log('\n📋 Next steps:');
console.log('1. Review remaining vulnerabilities manually');
console.log('2. Update environment variables for production');
console.log('3. Run tests to ensure compatibility');
console.log('4. Deploy to production with updated packages');
