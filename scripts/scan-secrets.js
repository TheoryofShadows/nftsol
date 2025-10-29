#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const ignoreDirs = new Set(['node_modules', '.git', 'dist', 'build', 'client/dist', 'apps/backend/dist']);
const patterns = [
  { name: 'JWT token', regex: /eyJhbGciOiJ[a-zA-Z0-9_-]{5,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/ },
  { name: 'Postgres URL with password', regex: /postgresql:\/\/[A-Za-z0-9_.-]+:[^@\s]+@[^\s]+\/[A-Za-z0-9_-]+/ },
  { name: 'Base58 private key', regex: /[1-9A-HJ-NP-Za-km-z]{44,}/ },
  { name: 'Pinata key', regex: /(pinata[_-]?(api[_-]?key|secret[_-]?key))\s*=\s*['"][A-Za-z0-9]{20,}['"]/i },
  { name: 'Helius API key', regex: /helius.*api-key=[A-Za-z0-9-]{20,}/i }
];

let hits = [];

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  for (const p of patterns) {
    if (p.regex.test(content)) {
      hits.push({ file: filePath, name: p.name });
    }
  }
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignoreDirs.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else scanFile(full);
  }
}

walk(root);

if (hits.length) {
  console.error('Secret scan failed. Potential secrets found:');
  for (const h of hits) console.error(`- ${h.name}: ${h.file}`);
  process.exit(1);
} else {
  console.log('Secret scan passed.');
}
