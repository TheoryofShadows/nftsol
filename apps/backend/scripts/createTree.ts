/**
 * Create the Bubblegum Merkle tree used for compressed-NFT minting and print the
 * exact value to set as BUBBLEGUM_TREE_ADDRESS (in Render for prod, or .env for
 * local dev). Run once — the tree is reused for up to 16,384 mints.
 *
 *   npm run setup:tree            # uses the platform/relayer key from env
 *
 * Payer resolution (first match wins):
 *   1. PLATFORM_SECRET_KEY_BASE58 / PLATFORM_KEYPAIR  (same relayer the backend uses)
 *   2. SOLANA_KEYPAIR_PATH (or ~/.config/solana/id.json) — a Solana CLI keypair file
 */
import 'dotenv/config';
import { BubblegumService } from '../src/services/bubblegumService-production';
import { getPlatformKeypair } from '../src/lib/platformKeypair';
import { Keypair } from '@solana/web3.js';
import fs from 'fs';
import path from 'path';

const TREE_ENV_VAR = 'BUBBLEGUM_TREE_ADDRESS';

function loadPayer(): Keypair {
  // 1. Prefer the platform/relayer key from env — same wallet that pays for mints,
  //    so the tree is owned by the relayer and no separate funding is needed.
  if (process.env.PLATFORM_SECRET_KEY_BASE58 || process.env.PLATFORM_KEYPAIR) {
    console.log('🔑 Using platform/relayer key from environment');
    return getPlatformKeypair();
  }

  // 2. Fall back to a local Solana CLI keypair file.
  const keypairPath =
    process.env.SOLANA_KEYPAIR_PATH || path.join(process.env.HOME || '', '.config/solana/id.json');
  if (!fs.existsSync(keypairPath)) {
    console.error('❌ No payer key found.');
    console.error(
      '   Set PLATFORM_SECRET_KEY_BASE58 (recommended — the relayer wallet), or\n' +
        `   set SOLANA_KEYPAIR_PATH to a CLI keypair, or run: solana-keygen new`,
    );
    process.exit(1);
  }
  console.log(`🔑 Using CLI keypair file: ${keypairPath}`);
  const secretKey = Uint8Array.from(JSON.parse(fs.readFileSync(keypairPath, 'utf-8')));
  return Keypair.fromSecretKey(secretKey);
}

function upsertEnvVar(envPath: string, key: string, value: string): boolean {
  if (!fs.existsSync(envPath)) return false;
  let env = fs.readFileSync(envPath, 'utf-8');
  const line = `${key}=${value}`;
  const re = new RegExp(`^${key}=.*$`, 'm');
  env = re.test(env) ? env.replace(re, line) : `${env.replace(/\n?$/, '\n')}${line}\n`;
  fs.writeFileSync(envPath, env);
  return true;
}

(async () => {
  console.log('🌳 Creating Bubblegum Merkle tree for compressed NFTs...\n');

  const payer = loadPayer();
  console.log(`👛 Payer (relayer): ${payer.publicKey.toBase58()}`);
  console.log(`🌐 RPC: ${process.env.SOLANA_RPC_URL || '(default)'}`);
  console.log(`🛰️  Cluster: ${process.env.SOLANA_CLUSTER || 'mainnet-beta'}\n`);

  console.log('⏳ Creating tree (~30s, costs ~0.15 SOL from the relayer)...\n');

  const svc = new BubblegumService();
  const { success, treeAddress, signature, error } = await svc.createTree(payer);

  if (!success || !treeAddress) {
    console.error(`❌ Tree creation failed: ${error ?? 'unknown error'}`);
    process.exit(1);
  }

  console.log('✅ Tree created successfully!\n');
  console.log(`🌳 Tree Address: ${treeAddress}`);
  console.log(`📝 Signature:    ${signature}\n`);

  // Persist to local .env (correct canonical var name) and a deployment record.
  const envPath = path.join(__dirname, '../.env');
  if (upsertEnvVar(envPath, TREE_ENV_VAR, treeAddress)) {
    console.log(`✅ Wrote ${TREE_ENV_VAR} to apps/backend/.env\n`);
  }

  fs.writeFileSync(
    path.join(__dirname, '../tree-deployment.json'),
    JSON.stringify(
      {
        treeAddress,
        signature,
        createdAt: new Date().toISOString(),
        payer: payer.publicKey.toBase58(),
        cluster: process.env.SOLANA_CLUSTER || 'mainnet-beta',
      },
      null,
      2,
    ),
  );
  console.log('📄 Saved deployment record to apps/backend/tree-deployment.json\n');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👉 NEXT: set this in Render → nftsol-backend → Environment:');
  console.log(`     ${TREE_ENV_VAR} = ${treeAddress}`);
  console.log('   (then Save Changes — Render redeploys automatically)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('🎉 Done. Mints will now reuse this tree instead of creating new ones.');
})().catch((err) => {
  console.error('❌ Unexpected error:', err instanceof Error ? err.message : err);
  process.exit(1);
});
