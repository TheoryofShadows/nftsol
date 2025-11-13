const fs = require('fs');
const path = require('path');
const express = require('express');

// Path to your app.ts file
const appTsPath = path.join(__dirname, 'apps', 'backend', 'src', 'app.ts');

// Check if the file exists
if (!fs.existsSync(appTsPath)) {
  console.error('app.ts not found at:', appTsPath);
  process.exit(1);
}

// Read the current content
let content = fs.readFileSync(appTsPath, 'utf8');

// Check if the debug endpoint already exists
if (content.includes('// Debug endpoint to get admin wallet')) {
  console.log('Debug endpoint already exists in app.ts');
  process.exit(0);
}

// Add the debug endpoint before the 404 handler
const debugEndpoint = `
// Debug endpoint to get admin wallet
app.get('/api/debug/admin-wallet', (req, res) => {
  const adminWallets = (process.env.ADMIN_WALLETS || process.env.PLATFORM_PUBLIC_KEY || '')
    .split(',')
    .map(w => w.trim())
    .filter(Boolean);
  
  res.json({
    adminWallets,
    platformPublicKey: process.env.PLATFORM_PUBLIC_KEY,
    platformSecretKeyBase58: process.env.PLATFORM_SECRET_KEY_BASE58 ? '***' : undefined,
    env: process.env.NODE_ENV
  });
});
`;

// Find the 404 handler and insert the debug endpoint before it
const updatedContent = content.replace(
  /(\/\*\*\n \* 404 handler\n \*\/)/,
  `${debugEndpoint}
$1`
);

// Write the updated content back to the file
fs.writeFileSync(appTsPath, updatedContent, 'utf8');
console.log('Debug endpoint added to app.ts. Please restart your server.');
