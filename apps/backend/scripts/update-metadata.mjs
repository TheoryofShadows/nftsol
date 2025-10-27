import {
  Connection, Keypair, PublicKey, clusterApiUrl,
  Transaction, sendAndConfirmTransaction
} from "@solana/web3.js";
import {
  PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID,
  createUpdateMetadataAccountV2Instruction
} from "@metaplex-foundation/mpl-token-metadata";
import fs from "node:fs";

const deriveMetadataPda = (mint) =>
  PublicKey.findProgramAddressSync(
    [Buffer.from("metadata"), TOKEN_METADATA_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    TOKEN_METADATA_PROGRAM_ID
  )[0];

(async () => {
  const [mintStr, name, symbol, uri, feeStr] = process.argv.slice(2);
  if (!mintStr || !name || !symbol || !uri || !feeStr) {
    console.error("Usage: node scripts/update-metadata.mjs <MINT> <NAME> <SYMBOL> <URI> <SELLER_FEE_BPS>");
    process.exit(1);
  }
  const mint = new PublicKey(mintStr);
  const sellerFeeBasisPoints = Number(feeStr);
  if (Number.isNaN(sellerFeeBasisPoints) || sellerFeeBasisPoints < 0 || sellerFeeBasisPoints > 10000) {
    throw new Error("SELLER_FEE_BPS must be 0..10000");
  }

  const kpPath = process.env.SOLANA_KEYPAIR || `${process.env.HOME}/.config/solana/devnet.json`;
  const secret = JSON.parse(fs.readFileSync(kpPath, "utf8"));
  const payer = Keypair.fromSecretKey(Uint8Array.from(secret));

  const rpc = process.env.SOLANA_RPC || clusterApiUrl("devnet");
  const conn = new Connection(rpc, "confirmed");

  const metadataPda = deriveMetadataPda(mint);
  const data = {
    name: process.argv[3],
    symbol: process.argv[4],
    uri: process.argv[5],
    sellerFeeBasisPoints,
    creators: null, collection: null, uses: null
  };

  const ix = createUpdateMetadataAccountV2Instruction(
    { metadata: metadataPda, updateAuthority: payer.publicKey },
    { updateMetadataAccountArgsV2: {
        data,
        updateAuthority: payer.publicKey,
        primarySaleHappened: null,
        isMutable: null
      }
    }
  );

  const tx = new Transaction().add(ix);
  const sig = await sendAndConfirmTransaction(conn, tx, [payer]);
  console.log("✅ Metadata updated");
  console.log("Tx:", sig);
  console.log("Mint:", mint.toBase58());
  console.log("Metadata PDA:", metadataPda.toBase58());
})().catch((e) => {
  if (e.logs) console.error("Logs:\n", e.logs);
  console.error("❌ Failed to update metadata:", e);
  process.exit(1);
});
