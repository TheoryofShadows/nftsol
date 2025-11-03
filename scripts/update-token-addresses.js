#!/usr/bin/env node
/**
 * Script to update all CLOUT token addresses in the codebase
 * Usage: node scripts/update-token-addresses.js <NEW_MINT_ADDRESS> <NEW_REWARDS_VAULT>
 */

const fs = require('fs');
const path = require('path');

// Old addresses to replace
const OLD_MINT = '<YOUR_CLOUT_MINT_ADDRESS>';
const OLD_VAULT = '<YOUR_REWARDS_VAULT_ADDRESS>';
const OLD_OWNER = '<YOUR_OWNER_ADDRESS>';

// Get new addresses from command line
const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('❌ Error: Missing required arguments');
  console.error('Usage: node scripts/update-token-addresses.js <NEW_MINT_ADDRESS> <NEW_REWARDS_VAULT> [NEW_OWNER]');
  console.error('');
  console.error('Example:');
  console.error('  node scripts/update-token-addresses.js ABC123... XYZ789... [OWNER123...]');
  process.exit(1);
}

const NEW_MINT = args[0];
const NEW_VAULT = args[1];
const NEW_OWNER = args[2] || '<YOUR_OWNER_ADDRESS>'; // Optional

console.log('=== Updating Token Addresses ===');
console.log('');
console.log('Old Mint:', OLD_MINT);
console.log('New Mint:', NEW_MINT);
console.log('');
console.log('Old Vault:', OLD_VAULT);
console.log('New Vault:', NEW_VAULT);
console.log('');
console.log('Old Owner:', OLD_OWNER);
console.log('New Owner:', NEW_OWNER);
console.log('');

// Files to update (relative to workspace root)
const filesToUpdate = [
  // Config files
  'render.yaml',
  'RENDER-ENV-VARS-COMPLETE.txt',
  'NETLIFY_ENV_VARS.txt',
  'NETLIFY-ENV-VARS.txt',
  
  // Documentation
  'README.md',
  'WHITEPAPER.md',
  'TECHNICAL-DOCS.md',
  'DEVELOPER_DOCUMENTATION.md',
  'DEPLOYMENT.md',
  'ENV_VAR_STATUS.md',
  'ENV_VARS_UPDATED.md',
  
  // Scripts
  'setup-clout-config.ps1',
  'setup-clout-wsl.sh',
  'set-clout-env.ps1',
  'complete-clout-setup.sh',
  'start-backend-correct.ps1',
  
  // Source files
  'apps/backend/src/config/index.ts',
  'apps/backend/src/config/programs.ts',
  'server/wallet-system.ts',
  'client/src/components/CloutInfo.tsx',
  'client/src/components/ContractInfo.tsx',
];

let filesUpdated = 0;
let filesNotFound = 0;
let errors = [];

filesToUpdate.forEach(relativePath => {
  const filePath = path.join(process.cwd(), relativePath);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${relativePath}`);
    filesNotFound++;
    return;
  }
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Replace old mint address
    if (content.includes(OLD_MINT)) {
      content = content.replace(new RegExp(OLD_MINT, 'g'), NEW_MINT);
      modified = true;
    }
    
    // Replace old vault address
    if (content.includes(OLD_VAULT)) {
      content = content.replace(new RegExp(OLD_VAULT, 'g'), NEW_VAULT);
      modified = true;
    }
    
    // Replace old owner address (only if new owner provided)
    if (NEW_OWNER !== '<YOUR_OWNER_ADDRESS>' && content.includes(OLD_OWNER)) {
      content = content.replace(new RegExp(OLD_OWNER, 'g'), NEW_OWNER);
      modified = true;
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated: ${relativePath}`);
      filesUpdated++;
    } else {
      console.log(`⏭️  Skipped (no changes): ${relativePath}`);
    }
  } catch (error) {
    console.error(`❌ Error updating ${relativePath}:`, error.message);
    errors.push({ file: relativePath, error: error.message });
  }
});

console.log('');
console.log('=== Update Summary ===');
console.log(`Files updated: ${filesUpdated}`);
console.log(`Files not found: ${filesNotFound}`);
console.log(`Errors: ${errors.length}`);
console.log('');

if (errors.length > 0) {
  console.log('Errors encountered:');
  errors.forEach(({ file, error }) => {
    console.log(`  - ${file}: ${error}`);
  });
  console.log('');
}

console.log('✅ Token address update complete!');
console.log('');
console.log('⚠️  IMPORTANT NEXT STEPS:');
console.log('1. Review changes with: git diff');
console.log('2. Update environment variables on deployment platforms (Render, Netlify)');
console.log('3. Test locally before deploying');
console.log('4. Update any secret management systems');
console.log('5. Commit changes: git commit -am "chore: update CLOUT token addresses"');
console.log('');
