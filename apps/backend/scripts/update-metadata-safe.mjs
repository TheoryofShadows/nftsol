import {
  Connection, Keypair, PublicKey, clusterApiUrl,
  Transaction, sendAndConfirmTransaction
} from "@solana/web3.js";
import {
  PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID,
  createUpdateMetadataAccountV2Instruction,
  Metadata
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
    console.error("Usage: node scripts/update-metadata-safe.mjs <MINT> <NAME<=32> <SYMBOL<=10> <URI<=200> <SELLER_FEE_BPS:0..10000>");
    process.exit(1);
  }

  if (name.length > 32) throw new Error("name must be <= 32 chars");
  if (symbol.length > 10) throw new Error("symbol must be <= 10 chars");
  if (uri.length > 200) throw new Error("uri must be <= 200 chars");

  const mint = new PublicKey(mintStr);
  const sellerFeeBasisPoints = Number(feeStr);
  if (Number.isNaN(sellerFeeBasisPoints) || sellerFeeBasisPoints < 0 || sellerFeeBasisPoints > 10000) {
    throw new Error("SELLER_FEE_BPS must be 0..10000");
  }

  // Load payer/update authority
  const kpPath = process.env.SOLANA_KEYPAIR || `${process.env.HOME}/.config/solana/devnet.json`;
  const secret = JSON.parse(fs.readFileSync(kpPath, "utf8"));
  const payer = Keypair.fromSecretKey(Uint8Array.from(secret));

  const rpc = process.env.SOLANA_RPC || clusterApiUrl("devnet");
  const conn = new Connection(rpc, "confirmed");

  // Load existing metadata so we can preserve creators/collection/uses
  const metadataPda = deriveMetadataPda(mint);
  const acct = await conn.getAccountInfo(metadataPda);
  if (!acct) throw new Error("No metadata account found for this mint. Use CREATE first.");

  const current = Metadata.deserialize(acct.data)[0];
  const keepCreators    = current.data.creators ?? null;
  const keepCollection  = current.collection ?? null;
  const keepUses        = current.uses ?? null;

  const data = {
    name,
    symbol,
    uri,
    sellerFeeBasisPoints,
    creators: keepCreators,        // <— preserve verified creators
    collection: keepCollection,    // <— preserve
    uses: keepUses,                // <— preserve
  };

  const ix = createUpdateMetadataAccountV2Instruction(
    { metadata: metadataPda, updateAuthority: payer.publicKey },
    {
      updateMetadataAccountArgsV2: {
        data,
        updateAuthority: payer.publicKey, // keep yourself as update authority
        primarySaleHappened: null,
        isMutable: null,                  // leave as-is (if false, updates will fail)
      },
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
