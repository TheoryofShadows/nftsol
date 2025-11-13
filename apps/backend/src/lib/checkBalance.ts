import { connection } from "./solana";
import { getPlatformKeypair } from "./platformKeypair";

const DEFAULT_MIN_SOL = 0.02;

export async function ensurePlatformBalance(minSol: number = DEFAULT_MIN_SOL) {
  const keypair = getPlatformKeypair();
  const balanceLamports = await connection.getBalance(keypair.publicKey);
  const balanceSol = balanceLamports / 1e9;

  if (balanceSol < minSol) {
    throw new Error(
      `Platform wallet ${keypair.publicKey.toBase58()} has ${balanceSol.toFixed(
        4
      )} SOL (need >= ${minSol})`
    );
  }

  return balanceSol;
}

