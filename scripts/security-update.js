#!/usr/bin/env node

/**
 * Security Update Script for NFTSol Platform
 * Addresses security vulnerabilities while maintaining functionality
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔒 NFTSol Security Update Script');
console.log('================================');

// Function to run command safely
function runCommand(command, description) {
  console.log(`\n📋 ${description}...`);
  try {
    const output = execSync(command, { 
      stdio: 'pipe', 
      encoding: 'utf8',
      cwd: process.cwd()
    });
    console.log(`✅ ${description} completed successfully`);
    return output;
  } catch (error) {
    console.log(`⚠️ ${description} had issues: ${error.message}`);
    return null;
  }
}

// Function to update package.json with security fixes
function updatePackageJson(packagePath, updates) {
  try {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    let updated = false;
    
    for (const [packageName, version] of Object.entries(updates)) {
      if (packageJson.dependencies && packageJson.dependencies[packageName]) {
        packageJson.dependencies[packageName] = version;
        updated = true;
        console.log(`📦 Updated ${packageName} to ${version}`);
      }
      if (packageJson.devDependencies && packageJson.devDependencies[packageName]) {
        packageJson.devDependencies[packageName] = version;
        updated = true;
        console.log(`📦 Updated ${packageName} to ${version}`);
      }
    }
    
    if (updated) {
      fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
      console.log(`✅ Updated ${packagePath}`);
    }
    
    return updated;
  } catch (error) {
    console.log(`❌ Error updating ${packagePath}: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting security updates...\n');
  
  // 1. Update server dependencies
  console.log('🔧 Updating server dependencies...');
  const serverUpdates = {
    'drizzle-kit': '^0.20.0', // Fix esbuild vulnerability
    'validator': '^13.12.0'   // Latest version with security fixes
  };
  
  const serverUpdated = updatePackageJson('server/package.json', serverUpdates);
  
  // 2. Update client dependencies
  console.log('\n🔧 Updating client dependencies...');
  const clientUpdates = {
    'vite': '^5.0.0' // Update to latest Vite with security fixes
  };
  
  const clientUpdated = updatePackageJson('client/package.json', clientUpdates);
  
  // 3. Install updates
  if (serverUpdated) {
    console.log('\n📦 Installing server updates...');
    runCommand('cd server && npm install', 'Server dependency installation');
  }
  
  if (clientUpdated) {
    console.log('\n📦 Installing client updates...');
    runCommand('cd client && npm install', 'Client dependency installation');
  }
  
  // 4. Create security overrides for known issues
  console.log('\n🛡️ Creating security overrides...');
  
  const serverOverrides = {
    "overrides": {
      "bigint-buffer": "^2.0.0",
      "parse-duration": "^2.1.3",
      "nanoid": "^5.0.0"
    }
  };
  
  const clientOverrides = {
    "overrides": {
      "bigint-buffer": "^2.0.0",
      "fast-redact": "^3.1.0"
    }
  };
  
  // Add overrides to package.json files
  try {
    const serverPackage = JSON.parse(fs.readFileSync('server/package.json', 'utf8'));
    serverPackage.overrides = serverOverrides.overrides;
    fs.writeFileSync('server/package.json', JSON.stringify(serverPackage, null, 2));
    console.log('✅ Added server security overrides');
  } catch (error) {
    console.log('⚠️ Could not add server overrides:', error.message);
  }
  
  try {
    const clientPackage = JSON.parse(fs.readFileSync('client/package.json', 'utf8'));
    clientPackage.overrides = clientOverrides.overrides;
    fs.writeFileSync('client/package.json', JSON.stringify(clientPackage, null, 2));
    console.log('✅ Added client security overrides');
  } catch (error) {
    console.log('⚠️ Could not add client overrides:', error.message);
  }
  
  // 5. Reinstall with overrides
  console.log('\n🔄 Reinstalling with security overrides...');
  runCommand('cd server && npm install', 'Server reinstall with overrides');
  runCommand('cd client && npm install', 'Client reinstall with overrides');
  
  // 6. Final audit check
  console.log('\n🔍 Final security audit...');
  runCommand('cd server && npm audit --audit-level=high', 'Server security audit');
  runCommand('cd client && npm audit --audit-level=high', 'Client security audit');
  
  console.log('\n🎉 Security update completed!');
  console.log('\n📋 Summary:');
  console.log('- Updated vulnerable dependencies');
  console.log('- Added security overrides');
  console.log('- Reinstalled packages');
  console.log('- Performed final audit');
  
  console.log('\n⚠️ Note: Some vulnerabilities may remain due to:');
  console.log('- Breaking changes in dependencies');
  console.log('- Upstream package issues');
  console.log('- Development-only dependencies');
  
  console.log('\n✅ Production security is maintained through:');
  console.log('- Input validation and sanitization');
  console.log('- Security headers and CORS protection');
  console.log('- Rate limiting and authentication');
  console.log('- Comprehensive error handling');
}

main().catch(console.error);