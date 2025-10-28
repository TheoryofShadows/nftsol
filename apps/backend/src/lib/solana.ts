// src/lib/solana.ts
import { Connection, Keypair, Transaction, SystemProgram, Commitment } from '@solana/web3.js';
import bs58 from 'bs58';

const RPC = process.env.SOLANA_RPC_URL ?? 'https://api.devnet.solana.com';
export const SOLANA_COMMITMENT: Commitment = 'finalized';
export const connection = new Connection(RPC, SOLANA_COMMITMENT);

export function loadPlatformKeypair(): Keypair {
  const base58 = process.env.PLATFORM_SECRET_KEY_BASE58;
  const json = process.env.PLATFORM_SECRET_KEY_JSON;
  if (base58) {
    const secret = bs58.decode(base58);
    return Keypair.fromSecretKey(Uint8Array.from(secret));
  }
  if (json) {
    const arr = JSON.parse(json);
    return Keypair.fromSecretKey(Uint8Array.from(arr));
  }
  throw new Error('Missing PLATFORM secret key env (PLATFORM_SECRET_KEY_BASE58 or PLATFORM_SECRET_KEY_JSON)');
}

export async function sendSolFromPlatform(toPubkeyStr: string, lamports: bigint) {
  const kp = loadPlatformKeypair();
  const { PublicKey } = await import('@solana/web3.js');
  const toPubkey = new PublicKey(toPubkeyStr);
  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: kp.publicKey,
      toPubkey: toPubkey,
      lamports: Number(lamports),
    })
  );

  const { blockhash } = await connection.getLatestBlockhash(SOLANA_COMMITMENT);
  tx.recentBlockhash = blockhash;
  tx.feePayer = kp.publicKey;
  tx.sign(kp);
  const raw = tx.serialize();
  const sig = await connection.sendRawTransaction(raw, { skipPreflight: false });
  await connection.confirmTransaction(sig, SOLANA_COMMITMENT);
  return sig;
}
