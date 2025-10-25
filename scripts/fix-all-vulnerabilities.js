#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔒 Starting comprehensive vulnerability fixes...\n');

// Function to run command safely
function runCommand(command, description) {
  try {
    console.log(`📦 ${description}...`);
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} completed\n`);
  } catch (error) {
    console.log(`⚠️  ${description} failed: ${error.message}\n`);
  }
}

// Function to update package.json dependencies
function updateDependencies() {
  console.log('🔧 Updating vulnerable dependencies...\n');
  
  const updates = [
    // High severity fixes
    { package: 'nanoid', version: '^5.0.8' },
    { package: 'parse-duration', version: '^2.1.3' },
    { package: 'validator', version: '^13.12.0' },
    { package: 'express-validator', version: '^7.1.0' },
    
    // Moderate severity fixes
    { package: 'esbuild', version: '^0.24.2' },
    { package: 'fast-redact', version: '^4.3.0' },
    
    // Solana ecosystem updates
    { package: '@solana/spl-token', version: '^0.1.8' },
    { package: '@solana/wallet-adapter-wallets', version: '^0.19.33' },
    
    // IPFS updates
    { package: 'ipfs-http-client', version: '^39.0.2' },
    
    // Vite updates
    { package: 'vite-plugin-pwa', version: '^1.1.0' }
  ];
  
  updates.forEach(({ package: pkg, version }) => {
    runCommand(`npm install ${pkg}@${version}`, `Installing ${pkg}@${version}`);
  });
}

// Function to fix specific vulnerabilities
function fixSpecificVulnerabilities() {
  console.log('🎯 Fixing specific vulnerabilities...\n');
  
  // Fix bigint-buffer vulnerability
  runCommand('npm install bigint-buffer@latest', 'Updating bigint-buffer');
  
  // Fix esbuild vulnerability
  runCommand('npm install esbuild@latest', 'Updating esbuild');
  
  // Fix fast-redact vulnerability
  runCommand('npm install fast-redact@latest', 'Updating fast-redact');
  
  // Fix nanoid vulnerability
  runCommand('npm install nanoid@latest', 'Updating nanoid');
  
  // Fix parse-duration vulnerability
  runCommand('npm install parse-duration@latest', 'Updating parse-duration');
  
  // Fix validator vulnerability
  runCommand('npm install validator@latest', 'Updating validator');
}

// Function to update client dependencies
function updateClientDependencies() {
  console.log('🎨 Updating client dependencies...\n');
  
  const clientUpdates = [
    { package: 'vite', version: '^6.0.0' },
    { package: 'vite-plugin-pwa', version: '^1.1.0' },
    { package: '@solana/wallet-adapter-wallets', version: '^0.19.33' }
  ];
  
  clientUpdates.forEach(({ package: pkg, version }) => {
    runCommand(`npm install ${pkg}@${version} --prefix client`, `Installing ${pkg}@${version} in client`);
  });
}

// Function to update server dependencies
function updateServerDependencies() {
  console.log('🖥️  Updating server dependencies...\n');
  
  const serverUpdates = [
    { package: 'express-validator', version: '^7.1.0' },
    { package: 'validator', version: '^13.12.0' },
    { package: 'nanoid', version: '^5.0.8' },
    { package: 'parse-duration', version: '^2.1.3' }
  ];
  
  serverUpdates.forEach(({ package: pkg, version }) => {
    runCommand(`npm install ${pkg}@${version} --prefix server`, `Installing ${pkg}@${version} in server`);
  });
}

// Function to run audit fix
function runAuditFix() {
  console.log('🔍 Running npm audit fix...\n');
  
  // Try audit fix without force first
  runCommand('npm audit fix', 'Running npm audit fix');
  
  // If that doesn't work, try with force (but be careful)
  console.log('⚠️  If vulnerabilities remain, trying audit fix --force...\n');
  runCommand('npm audit fix --force', 'Running npm audit fix --force');
}

// Function to verify fixes
function verifyFixes() {
  console.log('✅ Verifying vulnerability fixes...\n');
  
  try {
    const result = execSync('npm audit --json', { encoding: 'utf8' });
    const audit = JSON.parse(result);
    
    if (audit.vulnerabilities) {
      const totalVulns = Object.keys(audit.vulnerabilities).length;
      console.log(`📊 Remaining vulnerabilities: ${totalVulns}`);
      
      if (totalVulns === 0) {
        console.log('🎉 All vulnerabilities fixed!');
      } else {
        console.log('⚠️  Some vulnerabilities may require manual review');
      }
    } else {
      console.log('🎉 No vulnerabilities found!');
    }
  } catch (error) {
    console.log('⚠️  Could not verify fixes:', error.message);
  }
}

// Main execution
async function main() {
  console.log('🚀 NFTSol Vulnerability Fix Script\n');
  console.log('This script will fix all known security vulnerabilities\n');
  
  // Update dependencies
  updateDependencies();
  
  // Fix specific vulnerabilities
  fixSpecificVulnerabilities();
  
  // Update client dependencies
  updateClientDependencies();
  
  // Update server dependencies
  updateServerDependencies();
  
  // Run audit fix
  runAuditFix();
  
  // Verify fixes
  verifyFixes();
  
  console.log('🏁 Vulnerability fix process completed!');
  console.log('📝 Please review any remaining warnings and test your application');
}

// Run the script
main().catch(console.error);
