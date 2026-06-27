#!/usr/bin/env node
/**
 * Secret scanner — blocks real secret material from being committed.
 *
 * Scans git-tracked files by default, or only staged files with `--staged`
 * (use this in a pre-commit hook). Tuned to catch genuine secrets while NOT
 * tripping on the many *public* Solana addresses (mint/program/owner pubkeys,
 * which are <=44 base58 chars) that legitimately appear in docs and config.
 *
 *   node scripts/scan-secrets.js            # scan all tracked files
 *   node scripts/scan-secrets.js --staged   # scan staged files (pre-commit)
 */
const fs = require('fs');
const { execSync } = require('child_process');

const staged = process.argv.includes('--staged');

// Files we never flag: example envs, this scanner, lockfiles, generated output.
const ALLOW_PATH = [
  /(^|\/)\.env\.example$/,
  /(^|\/)scripts\/scan-secrets\.js$/,
  /(^|\/)package-lock\.json$/,
  /(^|\/)Cargo\.lock$/,
  /(^|\/)(coverage|dist|build|node_modules)\//,
];

// Known placeholder passwords used in docs/examples — not real secrets.
const PLACEHOLDER_PW = /^(password|postgres|user|pass|changeme|example|test|newpassword|your_password|your[-_].*)$/i;

const checks = [
  {
    name: 'Solana secret key (64-byte JSON array)',
    // 64 comma-separated 0-255 ints — the ed25519 secret key shape.
    regex: /\[(?:\s*\d{1,3}\s*,){63}\s*\d{1,3}\s*\]/,
  },
  {
    name: 'Base58 secret key (>=80 chars)',
    // Real secret keys are ~87-88 base58 chars; public keys are <=44, so this
    // never matches a public address.
    regex: /[1-9A-HJ-NP-Za-km-z]{80,}/,
  },
  {
    name: 'JWT (signed, with payload)',
    regex: /eyJ[A-Za-z0-9_-]{8,}\.eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/,
  },
  {
    name: 'xAI / OpenAI-style API key',
    regex: /\b(?:xai|sk)-[A-Za-z0-9]{20,}\b/,
  },
  {
    name: 'AWS access key id',
    regex: /\bAKIA[0-9A-Z]{16}\b/,
  },
  {
    name: 'Private key block',
    regex: /-----BEGIN (?:RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----/,
  },
];

function checkPostgres(content, file, hits) {
  const re = /postgres(?:ql)?:\/\/([^:\s/@]+):([^@\s/]+)@([^\s/:]+)/gi;
  let m;
  while ((m = re.exec(content)) !== null) {
    const [, , pw, host] = m;
    if (PLACEHOLDER_PW.test(pw)) continue;
    if (/^(localhost|127\.0\.0\.1)$/i.test(host)) continue;
    hits.push({ file, name: 'Postgres URL with real password' });
    return;
  }
}

function listFiles() {
  const cmd = staged
    ? 'git diff --cached --name-only --diff-filter=ACM'
    : 'git ls-files';
  return execSync(cmd, { encoding: 'utf8' })
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
}

const NUL = String.fromCharCode(0);
const hits = [];
for (const file of listFiles()) {
  if (ALLOW_PATH.some((re) => re.test(file))) continue;
  let content;
  try {
    content = fs.readFileSync(file, 'utf8');
  } catch {
    continue; // deleted / unreadable
  }
  if (content.indexOf(NUL) !== -1) continue; // binary
  for (const c of checks) {
    if (c.regex.test(content)) hits.push({ file, name: c.name });
  }
  checkPostgres(content, file, hits);
}

if (hits.length) {
  console.error('Secret scan FAILED - potential secrets found:');
  for (const h of hits) console.error(`  - ${h.name}: ${h.file}`);
  console.error('\nIf this is a false positive, refine the pattern or add the path to ALLOW_PATH.');
  console.error('If it is a real secret: remove it, rotate the credential, and never commit it.');
  process.exit(1);
}
console.log(`Secret scan passed (${staged ? 'staged' : 'tracked'} files).`);
