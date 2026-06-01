#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Runtime assets that aren't TypeScript but need to land in dist/ so the
// compiled server can read them (e.g. swagger.ts does `require(...docs/openapi.yaml)`).
const assets = ['public', 'docs'];

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;

  const stat = fs.statSync(src);

  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    const parent = path.dirname(dest);
    if (!fs.existsSync(parent)) {
      fs.mkdirSync(parent, { recursive: true });
    }
    fs.copyFileSync(src, dest);
  }
}

for (const asset of assets) {
  const srcDir = path.resolve(__dirname, '..', 'src', asset);
  const destDir = path.resolve(__dirname, '..', 'dist', asset);
  copyRecursive(srcDir, destDir);
}

// Also copy migrations from root of backend
const migSrc = path.resolve(__dirname, '..', 'migrations');
const migDest = path.resolve(__dirname, '..', 'dist', 'migrations');
copyRecursive(migSrc, migDest);
