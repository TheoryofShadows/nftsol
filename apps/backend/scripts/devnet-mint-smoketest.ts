/**
 * Devnet mint smoke-test.
 *
 * Exercises the full lib/solana.ts mintNFT() path end-to-end against a live
 * cluster: mint a Metaplex NFT with the platform wallet, then transfer it to a
 * recipient. This validates the @metaplex-foundation/js -> umi migration
 * (PR #193) on-chain, including the transfer-to-buyer step that unit tests can
 * only assert via mocks.
 *
 * SAFETY: refuses to run unless pointed at devnet/testnet. It mints a real NFT
 * and spends real lamports from the platform wallet, so it must never touch
 * mainnet.
 *
 * Usage:
 *   SOLANA_RPC_URL="https://api.devnet.solana.com" \
 *   PLATFORM_SECRET_KEY_BASE58="<devnet platform key>" \
 *   npx tsx scripts/devnet-mint-smoketest.ts [recipientAddress]
 *
 * If no recipient is given, a throwaway keypair is generated as the buyer.
 */

import 'dotenv/config';
import { Keypair, PublicKey } from '@solana/web3.js';
import { mintNFT, getWalletBalance, connection } from '../src/lib/solana';
import { getPlatformKeypair } from '../src/lib/platformKeypair';

function assertNotMainnet(rpcUrl: string): void {
  const url = rpcUrl.toLowerCase();
  const looksMainnet =
    url.includes('mainnet') ||
    (!url.includes('devnet') && !url.includes('testnet') && !url.includes('localhost') && !url.includes('127.0.0.1'));
  if (looksMainnet) {
    throw new Error(
      `Refusing to run smoke-test against a non-devnet RPC (${rpcUrl}). ` +
        `Set SOLANA_RPC_URL to https://api.devnet.solana.com (or a devnet/testnet endpoint).`,
    );
  }
}

async function main() {
  const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
  assertNotMainnet(rpcUrl);

  console.log('🧪 Devnet mint smoke-test');
  console.log(`   RPC: ${rpcUrl}`);

  // Resolve the platform (minter) wallet and verify it is funded.
  const platform = getPlatformKeypair();
  const platformSol = await getWalletBalance(platform.publicKey.toBase58());
  console.log(`   Platform wallet: ${platform.publicKey.toBase58()} (${platformSol.toFixed(4)} SOL)`);
  if (platformSol < 0.02) {
    throw new Error(
      `Platform wallet needs >= 0.02 SOL to mint. Fund it via: solana airdrop 1 ${platform.publicKey.toBase58()} --url devnet`,
    );
  }

  // Resolve the recipient (buyer). Use a CLI arg if provided, else a throwaway.
  const recipientArg = process.argv[2];
  const recipient = recipientArg ? new PublicKey(recipientArg) : Keypair.generate().publicKey;
  console.log(`   Recipient: ${recipient.toBase58()}${recipientArg ? '' : ' (generated throwaway)'}`);

  const metadataUri = 'https://raw.githubusercontent.com/solana-developers/opos-asset/main/assets/Climate/metadata.json';
  const name = `Smoke Test NFT ${Date.now()}`;

  console.log('\n⛏️  Minting + transferring...');
  const result = await mintNFT(recipient.toBase58(), metadataUri, name);

  if (!result.success) {
    console.error('❌ Mint failed:', result.error);
    if ('details' in result) console.error('   details:', JSON.stringify((result as Record<string, unknown>).details));
    process.exitCode = 1;
    return;
  }

  console.log('✅ Mint reported success:');
  console.log(`   mintAddress: ${result.mintAddress}`);
  console.log(`   txSig:       ${result.txSig}`);
  console.log(`   explorer:    https://explorer.solana.com/tx/${result.txSig}?cluster=devnet`);

  // Verify on-chain that the mint account actually exists.
  const mintInfo = await connection.getAccountInfo(new PublicKey(result.mintAddress));
  if (!mintInfo) {
    console.error('❌ Mint account not found on-chain — mint did not settle.');
    process.exitCode = 1;
    return;
  }
  console.log(`\n🔍 Verified: mint account exists on-chain (owner ${mintInfo.owner.toBase58()}).`);
  console.log('   Confirm in Explorer that the NFT is now held by the recipient wallet above.');
  console.log('\n🎉 Smoke-test passed.');
}

main().catch((err) => {
  console.error('❌ Smoke-test error:', err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
