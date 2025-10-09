#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const anchorProjectDir = resolve(__dirname, '..', 'anchor', 'solana_rewards');
const wslProjectDir = process.env.ANCHOR_WSL_PROJECT_PATH ?? '/mnt/c/Users/KHK89/NFTSol/anchor/solana_rewards';

const quoteForBash = (input) => `'${input.replace(/'/g, "'\\''")}'`;

function run(command, args = [], options = {}) {
  const spawned = spawnSync(command, args, {
    stdio: 'inherit',
    ...options,
  });
  return spawned;
}

function tryRunWSL() {
  const wslArgs = ['-e', 'bash', '-lc', `cd ${quoteForBash(wslProjectDir)} && anchor build`];
  try {
    const result = run('wsl', wslArgs);
    if (result.error && result.error.code === 'ENOENT') {
      return 'missing';
    }
    if (result.status !== 0) {
      process.exit(result.status ?? 1);
    }
    return 'success';
  } catch (error) {
    if (error.code === 'ENOENT') {
      return 'missing';
    }
    throw error;
  }
}

function tryRunLocalAnchor() {
  const result = run('anchor', ['build'], { cwd: anchorProjectDir });
  if (result.error && result.error.code === 'ENOENT') {
    console.warn('Anchor CLI not found. Skipping Anchor build.');
    return;
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const wslResult = tryRunWSL();
if (wslResult === 'missing') {
  console.warn('WSL not available. Attempting to run Anchor build locally.');
  tryRunLocalAnchor();
}
