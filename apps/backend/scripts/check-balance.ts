import 'dotenv/config';
import { ensurePlatformBalance } from '../src/lib/checkBalance';
import { getPlatformKeypair } from '../src/lib/platformKeypair';

async function main() {
  try {
    const sol = await ensurePlatformBalance();
    const keypair = getPlatformKeypair();
    console.log(
      `✅ Platform wallet ${keypair.publicKey.toBase58()} funded with ${sol.toFixed(4)} SOL`
    );
  } catch (error) {
    console.error('❌ Platform wallet funding check failed');
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}

main();

