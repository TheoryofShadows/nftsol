#!/usr/bin/env node
/**
 * Script to redact old CLOUT token addresses from the codebase
 * Replaces with placeholders that need to be configured
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Old addresses to redact
const OLD_MINT = '<YOUR_CLOUT_MINT_ADDRESS>';
const OLD_VAULT = '<YOUR_REWARDS_VAULT_ADDRESS>';
const OLD_OWNER = '<YOUR_OWNER_ADDRESS>';

// Placeholders
const PLACEHOLDER_MINT = '<YOUR_CLOUT_MINT_ADDRESS>';
const PLACEHOLDER_VAULT = '<YOUR_REWARDS_VAULT_ADDRESS>';
const PLACEHOLDER_OWNER = '<YOUR_OWNER_ADDRESS>';

console.log('=== Redacting Old Token Addresses ===');
console.log('');
console.log('This will replace all instances of the old token addresses with placeholders.');
console.log('');
console.log('Old Mint:', OLD_MINT, '→', PLACEHOLDER_MINT);
console.log('Old Vault:', OLD_VAULT, '→', PLACEHOLDER_VAULT);
console.log('Old Owner:', OLD_OWNER, '→', PLACEHOLDER_OWNER);
console.log('');

// Find all files containing the old addresses using grep
console.log('Scanning codebase for old addresses...');
console.log('');

let filesWithOldAddresses = new Set();

try {
  // Find files with old mint address
  const mintFiles = execSync(`grep -r -l "${OLD_MINT}" --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist --exclude-dir=build --exclude="*.log" . || true`, {
    encoding: 'utf8',
    cwd: process.cwd()
  }).trim().split('\n').filter(Boolean);
  
  // Find files with old vault address
  const vaultFiles = execSync(`grep -r -l "${OLD_VAULT}" --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist --exclude-dir=build --exclude="*.log" . || true`, {
    encoding: 'utf8',
    cwd: process.cwd()
  }).trim().split('\n').filter(Boolean);
  
  // Find files with old owner address
  const ownerFiles = execSync(`grep -r -l "${OLD_OWNER}" --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist --exclude-dir=build --exclude="*.log" . || true`, {
    encoding: 'utf8',
    cwd: process.cwd()
  }).trim().split('\n').filter(Boolean);
  
  mintFiles.forEach(f => filesWithOldAddresses.add(f.replace('./', '')));
  vaultFiles.forEach(f => filesWithOldAddresses.add(f.replace('./', '')));
  ownerFiles.forEach(f => filesWithOldAddresses.add(f.replace('./', '')));
} catch (error) {
  console.error('Error scanning files:', error.message);
  process.exit(1);
}

const filesToUpdate = Array.from(filesWithOldAddresses);
console.log(`Found ${filesToUpdate.length} files to update:`);
filesToUpdate.forEach(f => console.log(`  - ${f}`));
console.log('');

let filesUpdated = 0;
let errors = [];

filesToUpdate.forEach(relativePath => {
  const filePath = path.join(process.cwd(), relativePath);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${relativePath}`);
    return;
  }
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Replace old mint address
    if (content.includes(OLD_MINT)) {
      content = content.replace(new RegExp(OLD_MINT, 'g'), PLACEHOLDER_MINT);
      modified = true;
    }
    
    // Replace old vault address
    if (content.includes(OLD_VAULT)) {
      content = content.replace(new RegExp(OLD_VAULT, 'g'), PLACEHOLDER_VAULT);
      modified = true;
    }
    
    // Replace old owner address
    if (content.includes(OLD_OWNER)) {
      content = content.replace(new RegExp(OLD_OWNER, 'g'), PLACEHOLDER_OWNER);
      modified = true;
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Redacted: ${relativePath}`);
      filesUpdated++;
    }
  } catch (error) {
    console.error(`❌ Error updating ${relativePath}:`, error.message);
    errors.push({ file: relativePath, error: error.message });
  }
});

console.log('');
console.log('=== Redaction Summary ===');
console.log(`Files updated: ${filesUpdated}`);
console.log(`Errors: ${errors.length}`);
console.log('');

if (errors.length > 0) {
  console.log('Errors encountered:');
  errors.forEach(({ file, error }) => {
    console.log(`  - ${file}: ${error}`);
  });
  console.log('');
}

console.log('✅ Token address redaction complete!');
console.log('');
console.log('📝 NEXT STEPS:');
console.log('');
console.log('1. CREATE NEW TOKEN:');
console.log('   Run: bash scripts/create-new-clout-token.sh');
console.log('   This will generate a new SPL token on Solana');
console.log('');
console.log('2. UPDATE CODEBASE:');
console.log('   Run: node scripts/update-token-addresses.js <NEW_MINT> <NEW_VAULT> [OWNER]');
console.log('   This will replace placeholders with your actual addresses');
console.log('');
console.log('3. REVIEW CHANGES:');
console.log('   Run: git diff');
console.log('   Review all changes before committing');
console.log('');
console.log('4. UPDATE ENVIRONMENT VARIABLES:');
console.log('   Update all deployment platforms (Render, Netlify) with new addresses');
console.log('');
console.log('5. COMMIT CHANGES:');
console.log('   git add .');
console.log('   git commit -m "chore: redact old token and prepare for new token"');
console.log('');
