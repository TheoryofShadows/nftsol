const { execSync } = require('child_process');

console.log('🔒 NFTSol Security Vulnerability Fix Script');
console.log('==========================================\n');

function runCommand(command, description) {
  try {
    console.log(`📦 ${description}...`);
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} completed\n`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} failed: ${error.message}\n`);
    return false;
  }
}

// High Priority Fixes (7 high severity vulnerabilities)
console.log('🚨 FIXING HIGH SEVERITY VULNERABILITIES (7 total)');
console.log('================================================\n');

// Fix bigint-buffer vulnerability
runCommand('npm install @solana/spl-token@0.1.8 --force', 'Fix bigint-buffer vulnerability in @solana/spl-token');

// Fix parse-duration vulnerability
runCommand('npm install ipfs-http-client@39.0.2 --force', 'Fix parse-duration vulnerability in ipfs-http-client');

// Fix nanoid vulnerability
runCommand('npm install nanoid@5.0.9 --force', 'Fix nanoid vulnerability');

// Fix @irys/upload-solana vulnerability
runCommand('npm install @irys/upload-solana@0.0.4 --force', 'Fix @irys/upload-solana vulnerability');

console.log('🔧 FIXING MODERATE SEVERITY VULNERABILITIES (9 total)');
console.log('===================================================\n');

// Fix esbuild vulnerability
runCommand('npm install drizzle-kit@0.31.5 --force', 'Fix esbuild vulnerability in drizzle-kit');

// Fix validator vulnerability
runCommand('npm install validator@13.15.16', 'Fix validator URL validation bypass');

// Fix express-validator
runCommand('npm install express-validator@7.1.0', 'Update express-validator');

// Fix vite vulnerability
runCommand('npm install vite@6.1.7', 'Fix esbuild vulnerability in vite');

console.log('🔧 FIXING LOW SEVERITY VULNERABILITIES (17 total)');
console.log('================================================\n');

// Fix WalletConnect vulnerabilities
runCommand('npm install @solana/wallet-adapter-wallets@latest', 'Update wallet adapters');

// Fix fast-redact vulnerability
runCommand('npm install fast-redact@3.5.1', 'Fix fast-redact prototype pollution');

// Fix pino vulnerability
runCommand('npm install pino@9.11.1', 'Fix pino vulnerability');

console.log('🔍 RUNNING FINAL AUDIT CHECK');
console.log('===========================\n');

// Run final audit
runCommand('npm audit', 'Final security audit');

console.log('🎉 Security vulnerability fix process completed!');
console.log('📝 Please review any remaining warnings and test your application');
