/**
 * Mint readiness doctor — one command that tells you exactly what's needed to
 * mint, and what's already good. Read-only: it never spends SOL or mutates state.
 *
 *   npm run mint:doctor
 *
 * Exit code: 0 if mint-ready, 1 otherwise (so it can gate CI / deploy scripts).
 */
import 'dotenv/config';
import { Connection, PublicKey } from '@solana/web3.js';
import { ultraCheapMintService } from '../src/services/ultra-cheap-mint';
import { solanaConfig } from '../src/config';

type Check = { ok: boolean; label: string; detail: string; fix?: string; blocker: boolean };

async function main() {
  const checks: Check[] = [];

  // 1. Relayer wallet + balance (reuse the service's own logic + threshold)
  try {
    const r = await ultraCheapMintService.getRelayerStatus();
    checks.push({
      ok: r.funded,
      label: 'Relayer wallet funded',
      detail: `${r.address} — ${r.balanceSol.toFixed(4)} SOL (need ≥ ${r.minSol}) on ${r.cluster}`,
      fix: r.funded ? undefined : `Send ~0.25 SOL to ${r.address}`,
      blocker: true,
    });
  } catch (err) {
    checks.push({
      ok: false,
      label: 'Relayer wallet configured',
      detail: err instanceof Error ? err.message : String(err),
      fix: 'Set PLATFORM_SECRET_KEY_BASE58 (the relayer secret) in Render / .env',
      blocker: true,
    });
  }

  // 2. Bubblegum tree set + exists on-chain
  const treeAddress = process.env.BUBBLEGUM_TREE_ADDRESS?.trim();
  if (!treeAddress) {
    checks.push({
      ok: false,
      label: 'Bubblegum tree configured',
      detail: 'BUBBLEGUM_TREE_ADDRESS is not set',
      fix: 'Run `npm run setup:tree`, then set BUBBLEGUM_TREE_ADDRESS in Render',
      blocker: true,
    });
  } else {
    let exists = false;
    let detail = `${treeAddress}`;
    try {
      const connection = new Connection(solanaConfig.rpcUrl, solanaConfig.commitment);
      const info = await connection.getAccountInfo(new PublicKey(treeAddress));
      exists = info !== null;
      detail = exists ? `${treeAddress} (found on ${solanaConfig.cluster})` : `${treeAddress} — NOT found on ${solanaConfig.cluster}`;
    } catch (err) {
      detail = `${treeAddress} — ${err instanceof Error ? err.message : 'invalid address'}`;
    }
    checks.push({
      ok: exists,
      label: 'Bubblegum tree exists on-chain',
      detail,
      fix: exists ? undefined : 'Wrong cluster, or tree never created — run `npm run setup:tree`',
      blocker: true,
    });
  }

  // 3. AI verification key (not a mint blocker — heuristic still works)
  const hasAiKey = Boolean(process.env.XAI_API_KEY || process.env.GROK_API_KEY);
  checks.push({
    ok: hasAiKey,
    label: 'AI verification key',
    detail: hasAiKey ? 'XAI_API_KEY/GROK_API_KEY set — real AI scoring' : 'Not set — using honest heuristic scoring',
    fix: hasAiKey ? undefined : 'Optional: set XAI_API_KEY (from console.x.ai) for real AI scores',
    blocker: false,
  });

  // 4. RPC sanity (warning only)
  const onPublicRpc = /api\.mainnet-beta\.solana\.com/.test(solanaConfig.rpcUrl);
  checks.push({
    ok: !onPublicRpc,
    label: 'Production RPC',
    detail: onPublicRpc ? 'Using public api.mainnet-beta.solana.com (rate-limited)' : `Using ${solanaConfig.rpcUrl.replace(/api-key=[^&]+/i, 'api-key=***')}`,
    fix: onPublicRpc ? 'Use a paid RPC (Helius/QuickNode) via SOLANA_RPC_URL' : undefined,
    blocker: false,
  });

  // Report
  console.log('\n🩺 NFTSol mint readiness\n' + '─'.repeat(48));
  for (const c of checks) {
    const icon = c.ok ? '✅' : c.blocker ? '❌' : '⚠️ ';
    console.log(`${icon} ${c.label}`);
    console.log(`   ${c.detail}`);
    if (!c.ok && c.fix) console.log(`   → ${c.fix}`);
  }
  console.log('─'.repeat(48));

  const blockers = checks.filter((c) => c.blocker && !c.ok);
  if (blockers.length === 0) {
    console.log('🎉 Mint-ready. Gasless minting should work.\n');
    process.exit(0);
  }
  console.log(`🚫 Not mint-ready — ${blockers.length} blocker(s) above.\n`);
  process.exit(1);
}

main().catch((err) => {
  console.error('Doctor failed unexpectedly:', err instanceof Error ? err.message : err);
  process.exit(1);
});
